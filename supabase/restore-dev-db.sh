#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env.local"
BACKUP_ARCHIVE=""
ASSUME_YES="false"

usage() {
  cat <<'EOF'
Usage:
  pnpm restore:dev -- <backup.tar.gz> [--yes]
  pnpm restore:dev -- --latest [--yes]

Options:
  --env-file <path>  Env file containing SUPABASE_DIRECT_CONNECTION_URL. Default: .env.local
  --latest           Restore the latest supabase/backups/*.tar.gz archive.
  --yes, -y          Skip the confirmation prompt.
  --help, -h         Show this help.

Required env vars:
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_DIRECT_CONNECTION_URL

Safety:
  The script only runs if SUPABASE_DIRECT_CONNECTION_URL points to the same
  project ref as NEXT_PUBLIC_SUPABASE_URL and does not match .env.production.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --)
      shift
      ;;
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --latest)
      BACKUP_ARCHIVE="__latest__"
      shift
      ;;
    --yes|-y)
      ASSUME_YES="true"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    --*)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
    *)
      if [[ -n "$BACKUP_ARCHIVE" && "$BACKUP_ARCHIVE" != "__latest__" ]]; then
        echo "Only one backup archive can be provided." >&2
        exit 1
      fi
      BACKUP_ARCHIVE="$1"
      shift
      ;;
  esac
done

if [[ -z "$BACKUP_ARCHIVE" ]]; then
  BACKUP_ARCHIVE="__latest__"
fi

if [[ "$BACKUP_ARCHIVE" == "__latest__" ]]; then
  shopt -s nullglob
  backups=(supabase/backups/*.tar.gz)
  shopt -u nullglob

  if [[ ${#backups[@]} -eq 0 ]]; then
    echo "No backup archives found in supabase/backups/." >&2
    exit 1
  fi

  IFS=$'\n' BACKUP_ARCHIVE="$(printf '%s\n' "${backups[@]}" | sort | tail -n 1)"
  unset IFS
fi

if [[ ! -f "$BACKUP_ARCHIVE" ]]; then
  echo "Backup archive not found: $BACKUP_ARCHIVE" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 1
fi

for command_name in node psql tar; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command not found: $command_name" >&2
    exit 1
  fi
done

TARGET_REF="$(node - "$ENV_FILE" <<'NODE'
const fs = require('fs');
const envFile = process.argv[2];

function readEnv(path) {
  const out = {};
  const text = fs.readFileSync(path, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = readEnv(envFile);
if (!env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error(`NEXT_PUBLIC_SUPABASE_URL is missing from ${envFile}`);
}
if (!env.SUPABASE_DIRECT_CONNECTION_URL) {
  throw new Error(`SUPABASE_DIRECT_CONNECTION_URL is missing from ${envFile}`);
}

const targetRef = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
const direct = env.SUPABASE_DIRECT_CONNECTION_URL;
const match = direct.match(/^postgres(?:ql)?:\/\/([^:]+):([\s\S]*)@([^/:?]+)(?::(\d+))?\/([^?]+)(?:\?(.*))?$/);
if (!match) {
  throw new Error('SUPABASE_DIRECT_CONNECTION_URL is not a valid Postgres URL for this script.');
}

const user = match[1];
if (!user.includes(targetRef)) {
  throw new Error(`Safety check failed: database user does not include dev project ref ${targetRef}.`);
}

if (fs.existsSync('.env.production')) {
  const prod = readEnv('.env.production');
  if (prod.NEXT_PUBLIC_SUPABASE_URL) {
    const prodRef = new URL(prod.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
    if (prodRef && user.includes(prodRef)) {
      throw new Error(`Safety check failed: direct connection appears to target production ref ${prodRef}.`);
    }
  }
}

process.stdout.write(targetRef);
NODE
)"

echo "Backup archive: $BACKUP_ARCHIVE"
echo "Env file:       $ENV_FILE"
echo "Target ref:     $TARGET_REF"
echo
echo "This will DELETE and recreate the public schema, then replace copied auth/storage rows in the target database."

if [[ "$ASSUME_YES" != "true" ]]; then
  read -r -p "Type the target ref ($TARGET_REF) to continue: " CONFIRMATION
  if [[ "$CONFIRMATION" != "$TARGET_REF" ]]; then
    echo "Confirmation did not match. Aborting."
    exit 1
  fi
fi

TMP_PARENT="${TMPDIR:-/tmp/opencode}"
mkdir -p "$TMP_PARENT"
RESTORE_ROOT="$(mktemp -d "$TMP_PARENT/restore-dev-db.XXXXXX")"
trap 'rm -rf "$RESTORE_ROOT"' EXIT

tar -xzf "$BACKUP_ARCHIVE" -C "$RESTORE_ROOT"

shopt -s nullglob
restore_dirs=("$RESTORE_ROOT"/*)
shopt -u nullglob

if [[ ${#restore_dirs[@]} -ne 1 || ! -d "${restore_dirs[0]}" ]]; then
  echo "Expected backup archive to contain exactly one top-level directory." >&2
  exit 1
fi

RESTORE_DIR="${restore_dirs[0]}"
SCHEMA_FILE="$RESTORE_DIR/schema.sql"
DATA_FILE="$RESTORE_DIR/data.sql"
ROLES_FILE="$RESTORE_DIR/roles.sql"

for required_file in "$SCHEMA_FILE" "$DATA_FILE"; do
  if [[ ! -f "$required_file" ]]; then
    echo "Missing required restore file: $required_file" >&2
    exit 1
  fi
done

node - "$ENV_FILE" "$RESTORE_DIR" <<'NODE'
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const envFile = process.argv[2];
const restoreDir = process.argv[3];
const schemaFile = path.join(restoreDir, 'schema.sql');
const dataFile = path.join(restoreDir, 'data.sql');
const rolesFile = path.join(restoreDir, 'roles.sql');

function readEnv(file) {
  const out = {};
  const text = fs.readFileSync(file, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function getPgEnv() {
  const env = readEnv(envFile);
  const targetRef = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
  const direct = env.SUPABASE_DIRECT_CONNECTION_URL;
  const match = direct.match(/^postgres(?:ql)?:\/\/([^:]+):([\s\S]*)@([^/:?]+)(?::(\d+))?\/([^?]+)(?:\?(.*))?$/);
  if (!match) throw new Error('Could not parse SUPABASE_DIRECT_CONNECTION_URL');
  const [, user, password, host, port = '5432', database, query = ''] = match;
  if (!user.includes(targetRef)) {
    throw new Error(`Safety check failed: database user does not include ${targetRef}`);
  }
  const params = new URLSearchParams(query);
  return {
    ...process.env,
    PGHOST: host,
    PGPORT: port,
    PGUSER: user,
    PGPASSWORD: password,
    PGDATABASE: database,
    PGSSLMODE: params.get('sslmode') || 'require',
  };
}

function runPsql(label, args, input) {
  console.log(label);
  const result = spawnSync('psql', ['-q', '-v', 'ON_ERROR_STOP=1', ...args], {
    env: getPgEnv(),
    input,
    encoding: 'utf8',
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function quoteTable(table) {
  const [schema, name] = table.split('.');
  return `"${schema.replace(/"/g, '""')}"."${name.replace(/"/g, '""')}"`;
}

function getCopyTables() {
  const tables = [];
  const text = fs.readFileSync(dataFile, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^COPY "([^"]+)"\."([^"]+)" \(/);
    if (match) tables.push(`${match[1]}.${match[2]}`);
  }
  return tables;
}

function getExpectedCounts() {
  const counts = new Map();
  const text = fs.readFileSync(dataFile, 'utf8');
  let table = null;
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^COPY "([^"]+)"\."([^"]+)" \(/);
    if (match) {
      table = `${match[1]}.${match[2]}`;
      counts.set(table, 0);
      continue;
    }
    if (table && line === '\\.') {
      table = null;
      continue;
    }
    if (table) counts.set(table, counts.get(table) + 1);
  }
  return counts;
}

const nonPublicTables = getCopyTables().filter((table) => !table.startsWith('public.'));
const truncateSql = nonPublicTables.length > 0
  ? `TRUNCATE TABLE\n  ${nonPublicTables.map(quoteTable).join(',\n  ')}\nCASCADE;`
  : '';

const cleanupSql = `
SET statement_timeout = 0;
SET lock_timeout = 0;
SET session_replication_role = replica;
${truncateSql}
SET session_replication_role = DEFAULT;
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;
`;

runPsql('1/5 Clearing target database...', [], cleanupSql);
runPsql('2/5 Restoring schema...', ['-f', schemaFile]);
runPsql('3/5 Restoring data...', ['-f', dataFile]);

if (fs.existsSync(rolesFile)) {
  const filteredRoles = fs
    .readFileSync(rolesFile, 'utf8')
    .split(/\r?\n/)
    .filter((line) => !line.includes('ALTER ROLE "supabase_admin"'))
    .join('\n');
  runPsql('4/5 Applying role settings...', [], filteredRoles);
} else {
  console.log('4/5 No roles.sql found; skipping role settings.');
}

console.log('5/5 Verifying row counts...');
const expected = getExpectedCounts();
const tablesToVerify = [...expected.entries()].filter(([, count]) => count > 0);
const verifySql = tablesToVerify
  .map(([table]) => `select '${table}' as table_name, count(*)::bigint as row_count from ${quoteTable(table)}`)
  .join('\nunion all\n') + '\norder by table_name;';

const verify = spawnSync('psql', ['-q', '-v', 'ON_ERROR_STOP=1', '-At', '-F', '\t', '-c', verifySql], {
  env: getPgEnv(),
  encoding: 'utf8',
});
if (verify.stderr) process.stderr.write(verify.stderr);
if (verify.status !== 0) process.exit(verify.status ?? 1);

const actual = new Map();
for (const line of verify.stdout.trim().split(/\r?\n/).filter(Boolean)) {
  const [table, count] = line.split('\t');
  actual.set(table, Number(count));
}

const mismatches = [];
for (const [table, expectedCount] of tablesToVerify) {
  const actualCount = actual.get(table);
  if (actualCount !== expectedCount) {
    mismatches.push(`${table}: expected ${expectedCount}, got ${actualCount ?? 'missing'}`);
  }
}

if (mismatches.length > 0) {
  console.error('Restore verification failed:');
  for (const mismatch of mismatches) console.error(`- ${mismatch}`);
  process.exit(1);
}

console.log('Restore verification passed.');
for (const [table, count] of tablesToVerify) {
  console.log(`${table}: ${count}`);
}
NODE

echo
echo "Dev database restore completed successfully."
