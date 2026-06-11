#!/usr/bin/env bash
set -euo pipefail

BACKUP_ROOT="supabase/backups"
TIMESTAMP="$(date +"%Y-%m-%d_%H-%M-%S")"
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

echo "Creando backup de Supabase en: $BACKUP_DIR"

pnpm exec supabase db dump --linked \
  -f "$BACKUP_DIR/roles.sql" \
  --role-only

pnpm exec supabase db dump --linked \
  -f "$BACKUP_DIR/schema.sql"

pnpm exec supabase db dump --linked \
  -f "$BACKUP_DIR/data.sql" \
  --use-copy \
  --data-only \
  -x "storage.buckets_vectors" \
  -x "storage.vector_indexes"

tar -czf "$BACKUP_DIR.tar.gz" -C "$BACKUP_ROOT" "$TIMESTAMP"

rm -rf "$BACKUP_DIR"

echo "Backup creado correctamente:"
echo "$BACKUP_DIR.tar.gz"
