import pool from "@/lib/db";

export type SalesforceOAuthToken = {
  access_token: string;
  instance_url: string;
  token_type: string;
  issued_at: string;
  signature?: string;
  id?: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function buildTokenRequestBody() {
  const params = new URLSearchParams();
  params.append("client_id", getRequiredEnv("SALESFORCE_CLIENT_ID"));
  params.append(
    "client_secret",
    getRequiredEnv("SALESFORCE_CLIENT_SECRET")
  );
  params.append("username", getRequiredEnv("SALESFORCE_USERNAME"));
  params.append("password", getRequiredEnv("SALESFORCE_PASSWORD"));
  return params;
}

function getIssuedAndExpiresAt(issuedAtMs?: string) {
  const issuedAt = issuedAtMs ? new Date(Number(issuedAtMs)) : new Date();
  // Salesforce access_token biasanya valid ~12 jam; simpan buffer agar refresh lebih aman.
  const expiresAt = new Date(issuedAt.getTime() + 11 * 60 * 60 * 1000);
  return { issuedAt, expiresAt };
}

export async function requestSalesforceAccessToken(): Promise<SalesforceOAuthToken> {
  const salesforceDomain =
    process.env.SALESFORCE_AUTH_DOMAIN || "https://login.salesforce.com";
  const tokenUrl = `${salesforceDomain}/services/oauth2/token?grant_type=password`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: buildTokenRequestBody().toString(),
    cache: "no-store",
  });

  const raw = await response.text();
  const data = JSON.parse(raw);

  if (!response.ok) {
    const message =
      data?.error_description || data?.error || "Failed to fetch Salesforce token";
    throw new Error(`Salesforce token request failed: ${message}`);
  }

  return data as SalesforceOAuthToken;
}

export async function saveSalesforceAccessToken(
  token: SalesforceOAuthToken
): Promise<void> {
  const { issuedAt, expiresAt } = getIssuedAndExpiresAt(token.issued_at);

  await pool.query(
    `
      INSERT INTO salesforce_oauth_tokens
        (provider, access_token, instance_url, token_type, issued_at, expires_at)
      VALUES
        ($1, $2, $3, $4, $5, $6)
    `,
    [
      "salesforce",
      token.access_token,
      token.instance_url,
      token.token_type || "Bearer",
      issuedAt,
      expiresAt,
    ]
  );

  // Housekeeping: keep recent history only.
  await pool.query(
    `
      DELETE FROM salesforce_oauth_tokens
      WHERE id NOT IN (
        SELECT id
        FROM salesforce_oauth_tokens
        WHERE provider = $1
        ORDER BY issued_at DESC
        LIMIT 20
      )
    `,
    ["salesforce"]
  );
}

export async function refreshAndStoreSalesforceToken() {
  const token = await requestSalesforceAccessToken();
  await saveSalesforceAccessToken(token);

  return {
    instanceUrl: token.instance_url,
    tokenType: token.token_type,
    issuedAt: token.issued_at,
  };
}

export async function getLatestValidSalesforceToken(): Promise<string | null> {
  const { rows } = await pool.query(
    `
      SELECT access_token
      FROM salesforce_oauth_tokens
      WHERE provider = $1
        AND expires_at > NOW()
      ORDER BY issued_at DESC
      LIMIT 1
    `,
    ["salesforce"]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0].access_token as string;
}
