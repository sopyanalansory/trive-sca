import "dotenv/config";
import pool from "@/lib/db";
import { syncCampaignsFromSalesforce } from "@/lib/salesforce-campaigns-sync";

async function main() {
  console.log("Syncing campaigns from Salesforce (Trive_Invest_API_Get_Campaigns)...");
  const result = await syncCampaignsFromSalesforce();
  console.log(
    `Done. Fetched ${result.fetched} from API, upserted ${result.upserted}, skipped ${result.skipped} (missing Id).`
  );
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });
