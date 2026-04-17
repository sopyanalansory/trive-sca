import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function loadLocalEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

type TestResult = {
  name: string;
  ok: boolean;
  status?: number;
  statusText?: string;
  detail?: string;
  bodyPreview?: string;
  errorCause?: string;
};

function toBase64HmacSha1(secret: string, input: string): string {
  return crypto.createHmac("sha1", secret).update(input).digest("base64");
}

async function runRequest(
  name: string,
  url: string,
  headers?: Record<string, string>
): Promise<TestResult> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const bodyText = await res.text().catch(() => "");
    const bodyPreview = bodyText ? bodyText.slice(0, 800) : undefined;
    return {
      name,
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      bodyPreview,
    };
  } catch (error) {
    const cause =
      error &&
      typeof error === "object" &&
      "cause" in error &&
      (error as { cause?: unknown }).cause
        ? String((error as { cause?: unknown }).cause)
        : undefined;
    return {
      name,
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
      errorCause: cause,
    };
  }
}

async function main() {
  loadLocalEnvFile();

  const endpoint = String(process.env.OSS_ENDPOINT ?? "").trim();
  const accessKeyId = String(process.env.OSS_ACCESS_KEY_ID ?? "").trim();
  const accessKeySecret = String(process.env.OSS_ACCESS_KEY_SECRET ?? "").trim();

  if (!endpoint) {
    console.error("Missing OSS_ENDPOINT.");
    console.error(
      "Example: OSS_ENDPOINT=cdn2-xxxx.oss-ap-southeast-5.oss-accesspoint.aliyuncs.com"
    );
    process.exit(1);
  }

  const baseUrl = endpoint.startsWith("http")
    ? endpoint.replace(/\/+$/, "")
    : `https://${endpoint.replace(/\/+$/, "")}`;

  const results: TestResult[] = [];

  // 1) Public/anonymous test (connectivity + public access behavior)
  results.push(await runRequest("anonymous_get", `${baseUrl}/`));

  // 2) Signed OSS test (when key pair provided)
  if (accessKeyId && accessKeySecret) {
    const date = new Date().toUTCString();
    const canonicalResource = "/";
    const stringToSign = `GET\n\n\n${date}\n${canonicalResource}`;
    const signature = toBase64HmacSha1(accessKeySecret, stringToSign);
    const authorization = `OSS ${accessKeyId}:${signature}`;

    results.push(
      await runRequest("signed_get_root", `${baseUrl}/`, {
        Date: date,
        Authorization: authorization,
      })
    );
  } else {
    results.push({
      name: "signed_get_root",
      ok: false,
      detail:
        "Skipped (missing OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET env vars).",
    });
  }

  for (const r of results) {
    if (r.status !== undefined) {
      console.log(
        JSON.stringify({
          test: r.name,
          ok: r.ok,
          status: r.status,
          statusText: r.statusText,
          bodyPreview: r.bodyPreview,
        })
      );
    } else {
      console.log(
        JSON.stringify({
          test: r.name,
          ok: r.ok,
          detail: r.detail,
          errorCause: r.errorCause,
        })
      );
    }
  }

  const hasFailure = results.some((r) => !r.ok);
  if (hasFailure) process.exit(2);
}

void main();

