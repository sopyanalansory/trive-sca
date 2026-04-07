import "dotenv/config";
import { refreshAndStoreSalesforceToken } from "@/lib/salesforce-oauth";

async function main() {
  try {
    const result = await refreshAndStoreSalesforceToken();
    console.log("Salesforce token refreshed:", result);
    process.exit(0);
  } catch (error) {
    console.error("Failed to refresh Salesforce token:", error);
    process.exit(1);
  }
}

void main();
