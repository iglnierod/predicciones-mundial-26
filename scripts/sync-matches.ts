import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { syncMatchesFromApi } from "@/lib/sync-matches";

async function main() {
  const result = await syncMatchesFromApi();
  console.log(`Synced matches: ${result.insertedOrUpdated}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
