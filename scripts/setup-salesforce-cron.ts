import { execSync } from "node:child_process";

function sh(command: string): string {
  return execSync(command, { encoding: "utf8" }).trim();
}

function getSafeCurrentCrontab(): string {
  try {
    return sh("crontab -l");
  } catch {
    return "";
  }
}

function main() {
  const projectPath = process.env.CRON_PROJECT_PATH || process.cwd();
  const schedule = process.env.CRON_SCHEDULE || "0 */12 * * *";
  const logPath =
    process.env.CRON_LOG_PATH ||
    `${process.env.HOME || "/tmp"}/trive-salesforce-token.log`;

  const npmPath = process.env.CRON_NPM_PATH || sh("which npm");
  const refreshCommand = `${npmPath} run refresh-salesforce-token`;
  const cronLine = `${schedule} cd ${projectPath} && ${refreshCommand} >> ${logPath} 2>&1`;

  const currentCrontab = getSafeCurrentCrontab();
  const lines = currentCrontab
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const filteredLines = lines.filter(
    (line) => !line.includes("refresh-salesforce-token")
  );

  const nextLines = [...filteredLines, cronLine];
  const payload = `${nextLines.join("\n")}\n`;

  execSync("crontab -", { input: payload, stdio: ["pipe", "inherit", "inherit"] });

  console.log("Salesforce cron installed/updated successfully.");
  console.log(`Schedule : ${schedule}`);
  console.log(`Project  : ${projectPath}`);
  console.log(`NPM path : ${npmPath}`);
  console.log(`Log file : ${logPath}`);
  console.log("Current crontab:");
  console.log(sh("crontab -l"));
}

main();
