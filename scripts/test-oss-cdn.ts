import fs from "node:fs";
import path from "node:path";
import OSS from "ali-oss";

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
  code?: string;
  detail?: string;
  bodyPreview?: string;
  requestId?: string;
};

function normalizeObjectKey(input: string): string {
  return input.replace(/^\/+/, "").trim();
}

function toRequestPath(objectKey: string): string {
  if (!objectKey) return "/";
  const encoded = objectKey
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `/${encoded}`;
}

async function runAnonymousRequest(url: string): Promise<TestResult> {
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });
    const bodyText = await res.text().catch(() => "");
    const bodyPreview = bodyText ? bodyText.slice(0, 800) : undefined;
    return {
      name: "anonymous_get",
      ok: res.ok,
      status: res.status,
      bodyPreview,
    };
  } catch (error) {
    return {
      name: "anonymous_get",
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runSdkGetObject(
  client: OSS,
  objectKey: string
): Promise<TestResult> {
  try {
    const result = await client.get(objectKey);
    const headers = result.res.headers as Record<string, string | undefined>;
    let body = "";
    if (typeof result.content === "string") {
      body = result.content;
    } else if (Buffer.isBuffer(result.content)) {
      body = result.content.toString("utf8");
    }
    return {
      name: "sdk_get_object",
      ok: true,
      status: result.res.status,
      requestId: headers["x-oss-request-id"],
      bodyPreview: body ? body.slice(0, 800) : undefined,
    };
  } catch (error) {
    const err = error as {
      code?: string;
      status?: number;
      requestId?: string;
      message?: string;
    };
    return {
      name: "sdk_get_object",
      ok: false,
      status: err.status,
      code: err.code,
      requestId: err.requestId,
      detail: err.message ?? String(error),
    };
  }
}

async function runSdkUploadText(
  client: OSS,
  objectKey: string,
  textContent: string
): Promise<TestResult> {
  try {
    const result = await client.put(objectKey, Buffer.from(textContent, "utf8"), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
    const headers = result.res.headers as Record<string, string | undefined>;
    return {
      name: "sdk_upload_text",
      ok: true,
      status: result.res.status,
      requestId: headers["x-oss-request-id"],
      detail: `Uploaded: ${objectKey}`,
      bodyPreview: textContent.slice(0, 800),
    };
  } catch (error) {
    const err = error as {
      code?: string;
      status?: number;
      requestId?: string;
      message?: string;
    };
    return {
      name: "sdk_upload_text",
      ok: false,
      status: err.status,
      code: err.code,
      requestId: err.requestId,
      detail: err.message ?? String(error),
    };
  }
}

async function main() {
  loadLocalEnvFile();

  const endpoint = String(process.env.OSS_ENDPOINT ?? "").trim();
  const region = String(process.env.OSS_REGION ?? "").trim();
  const bucket = normalizeObjectKey(String(process.env.OSS_BUCKET ?? "").trim());
  const accessKeyId = String(process.env.OSS_ACCESS_KEY_ID ?? "").trim();
  const accessKeySecret = String(process.env.OSS_ACCESS_KEY_SECRET ?? "").trim();
  const testObjectKey = normalizeObjectKey(
    String(process.env.OSS_TEST_OBJECT_KEY ?? "").trim()
  );
  const uploadObjectKey = normalizeObjectKey(
    String(process.env.OSS_UPLOAD_OBJECT_KEY ?? "").trim()
  );

  if (!region || !bucket || !testObjectKey) {
    console.error(
      "Missing required env vars: OSS_REGION, OSS_BUCKET, OSS_TEST_OBJECT_KEY."
    );
    console.error(
      "Example: OSS_REGION=oss-ap-southeast-5, OSS_BUCKET=triveinvest-bucket"
    );
    process.exit(1);
  }

  let baseUrl = `https://${bucket}.${region}.aliyuncs.com`;
  if (endpoint) {
    baseUrl = endpoint.startsWith("http")
      ? endpoint.replace(/\/+$/, "")
      : `https://${endpoint.replace(/\/+$/, "")}`;
  }
  const requestPath = toRequestPath(testObjectKey);
  const targetUrl = `${baseUrl}${requestPath}`;

  const results: TestResult[] = [];

  // 1) Public/anonymous test (connectivity + public access behavior)
  results.push(await runAnonymousRequest(targetUrl));

  // 2) Signed SDK test
  if (!accessKeyId || !accessKeySecret) {
    results.push({
      name: "sdk_get_object",
      ok: false,
      detail: "Skipped (missing OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET).",
    });
  } else {
    const endpointHost = new URL(baseUrl).hostname;
    const client = endpoint
      ? new OSS({
          region,
          accessKeyId,
          accessKeySecret,
          bucket,
          endpoint: endpointHost,
          cname: true,
          timeout: "20s",
        })
      : new OSS({
          region,
          accessKeyId,
          accessKeySecret,
          bucket,
          timeout: "20s",
        });
    results.push(await runSdkGetObject(client, testObjectKey));

    const uploadTargetKey =
      uploadObjectKey || `test-upload/oss-cdn-${Date.now()}.txt`;
    const uploadContent = [
      "OSS upload test from scripts/test-oss-cdn.ts",
      `Timestamp: ${new Date().toISOString()}`,
      `Bucket: ${bucket}`,
      `Region: ${region}`,
    ].join("\n");
    results.push(await runSdkUploadText(client, uploadTargetKey, uploadContent));
  }

  for (const r of results) {
    console.log(
      JSON.stringify({
        test: r.name,
        ok: r.ok,
        status: r.status,
        code: r.code,
        requestId: r.requestId,
        detail: r.detail,
        bodyPreview: r.bodyPreview,
      })
    );
  }

  const hasFailure = results.some((r) => !r.ok);
  if (hasFailure) process.exit(2);
}

void main();

