import { createHash, randomBytes } from "node:crypto";
import https from "node:https";

type MetaResponse = {
  status: number;
  data: unknown;
};

type MetaRetcodePayload = {
  retcode: string;
  answer?: unknown;
};

type MetaConfig = {
  host: string;
  port: number;
  hostnameHeader: string;
  managerLogin: string;
  managerPassword: string;
  version: string;
};

type MetaPasswordType = "main" | "investor" | "api";

export class MetaManagerError extends Error {
  statusCode: number;
  detail?: unknown;

  constructor(message: string, statusCode = 500, detail?: unknown) {
    super(message);
    this.name = "MetaManagerError";
    this.statusCode = statusCode;
    this.detail = detail;
  }
}

function md5(data: Buffer): Buffer {
  return createHash("md5").update(data).digest();
}

function calculateSrvRandAnswer(password: string, srvRand: string): string {
  const passwordUtf16le = Buffer.from(password, "utf16le");
  const passwordMd5 = md5(passwordUtf16le);
  const webApiBytes = Buffer.from("WebAPI", "utf8");
  const passwordHash = md5(Buffer.concat([passwordMd5, webApiBytes]));
  const srvRandBytes = Buffer.from(srvRand, "hex");
  return md5(Buffer.concat([passwordHash, srvRandBytes])).toString("hex");
}

function isRetcodeOk(payload: unknown): payload is { retcode: string } {
  if (!payload || typeof payload !== "object") return false;
  const value = (payload as { retcode?: unknown }).retcode;
  return typeof value === "string" && value.startsWith("0");
}

function isMetaRetcodePayload(payload: unknown): payload is MetaRetcodePayload {
  if (!payload || typeof payload !== "object") return false;
  return typeof (payload as { retcode?: unknown }).retcode === "string";
}

async function metaRequest(options: {
  agent: https.Agent;
  host: string;
  port: number;
  hostnameHeader: string;
  path: string;
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
}): Promise<MetaResponse> {
  const { agent, host, port, hostnameHeader, path, method = "GET", body } =
    options;
  const bodyStr = body ? JSON.stringify(body) : null;
  const headers: Record<string, string | number> = {
    Host: hostnameHeader,
    "User-Agent": "MetaTrader 5 Web API/5.2005 (NodeJS)",
    Accept: "*/*",
    Connection: "keep-alive",
    "Content-Type": "application/json",
  };
  if (bodyStr) {
    headers["Content-Length"] = Buffer.byteLength(bodyStr);
  }

  return await new Promise<MetaResponse>((resolve, reject) => {
    const req = https.request(
      {
        hostname: host,
        port,
        path,
        method,
        headers,
        agent,
        timeout: 30_000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let parsed: unknown = text;
          try {
            parsed = text ? (JSON.parse(text) as unknown) : {};
          } catch {
            parsed = text;
          }
          resolve({
            status: res.statusCode ?? 500,
            data: parsed,
          });
        });
      }
    );

    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("Meta request timeout")));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function getConfigFromEnv(): MetaConfig {
  const host = String(process.env.METAMANAGER_HOST ?? "").trim();
  const port = Number(process.env.METAMANAGER_PORT ?? "443");
  const hostnameHeader =
    String(process.env.METAMANAGER_HOSTNAME ?? "").trim() || host;
  const managerLogin = String(process.env.MANAGER_LOGIN ?? "").trim();
  const managerPassword = String(process.env.MANAGER_PASSWORD ?? "").trim();
  const version = String(process.env.METAMANAGER_VERSION ?? "").trim() || "5120";

  if (
    !host ||
    !hostnameHeader ||
    !managerLogin ||
    !managerPassword ||
    !Number.isFinite(port) ||
    port <= 0
  ) {
    throw new MetaManagerError(
      "MetaManager credentials/configuration is missing",
      500
    );
  }

  return {
    host,
    port,
    hostnameHeader,
    managerLogin,
    managerPassword,
    version,
  };
}

async function authenticateWithMeta(options: {
  config: MetaConfig;
  agent: https.Agent;
  force?: boolean;
  context: string;
}): Promise<void> {
  const { config, agent, context } = options;
  const startPath = `/api/auth/start?version=${encodeURIComponent(config.version)}&agent=TriveSCA&login=${encodeURIComponent(config.managerLogin)}&type=manager`;
  const startRes = await metaRequest({
    agent,
    host: config.host,
    port: config.port,
    hostnameHeader: config.hostnameHeader,
    path: startPath,
  });
  const startPayload = startRes.data as { srv_rand?: unknown };
  if (
    startRes.status >= 400 ||
    !isRetcodeOk(startPayload) ||
    typeof startPayload?.srv_rand !== "string" ||
    !startPayload.srv_rand
  ) {
    throw new MetaManagerError(
      `${context}: auth start failed`,
      502,
      startRes.data
    );
  }

  const srvRandAnswer = calculateSrvRandAnswer(
    config.managerPassword,
    startPayload.srv_rand
  );
  const cliRand = randomBytes(16).toString("hex");
  const answerPath = `/api/auth/answer?srv_rand_answer=${encodeURIComponent(srvRandAnswer)}&cli_rand=${encodeURIComponent(cliRand)}`;
  const answerRes = await metaRequest({
    agent,
    host: config.host,
    port: config.port,
    hostnameHeader: config.hostnameHeader,
    path: answerPath,
  });
  if (answerRes.status >= 400 || !isRetcodeOk(answerRes.data)) {
    throw new MetaManagerError(
      `${context}: auth answer failed`,
      502,
      answerRes.data
    );
  }
}

async function executeAuthenticatedMetaRequest<T = unknown>(options: {
  path: string;
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
  context: string;
  retryCount?: number;
}): Promise<T> {
  const { path, method = "GET", body, context, retryCount = 3 } = options;
  const config = getConfigFromEnv();
  const agent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 30_000,
    maxSockets: 5,
    timeout: 30_000,
    rejectUnauthorized: false,
  });

  try {
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= retryCount; attempt += 1) {
      try {
        await authenticateWithMeta({ config, agent, context });
        const reqRes = await metaRequest({
          agent,
          host: config.host,
          port: config.port,
          hostnameHeader: config.hostnameHeader,
          path,
          method,
          body,
        });

        if (reqRes.status >= 400 || !isMetaRetcodePayload(reqRes.data)) {
          throw new MetaManagerError(
            `${context}: request failed`,
            502,
            reqRes.data
          );
        }
        if (
          reqRes.data.retcode.includes("not authorized") ||
          reqRes.status === 401
        ) {
          await authenticateWithMeta({
            config,
            agent,
            context,
            force: true,
          });
          throw new MetaManagerError(
            `${context}: session expired`,
            502,
            reqRes.data
          );
        }
        if (!reqRes.data.retcode.startsWith("0")) {
          throw new MetaManagerError(
            `${context}: retcode ${reqRes.data.retcode}`,
            502,
            reqRes.data
          );
        }

        return (reqRes.data.answer as T) ?? ({} as T);
      } catch (error) {
        lastError = error;
        if (attempt < retryCount) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
          continue;
        }
      }
    }

    if (lastError instanceof MetaManagerError) throw lastError;
    throw new MetaManagerError(`${context}: request failed`, 502, lastError);
  } finally {
    agent.destroy();
  }
}

export async function changeMetaUserPassword(options: {
  login: string;
  password: string;
  type?: MetaPasswordType;
}): Promise<void> {
  const { login, password, type = "main" } = options;
  await executeAuthenticatedMetaRequest({
    path: "/api/user/change_password",
    method: "POST",
    body: {
      Login: login,
      Type: type,
      Password: password,
    },
    context: "change password",
  });
}

export async function getMetaUser(login: string): Promise<unknown> {
  return await executeAuthenticatedMetaRequest({
    path: `/api/user/get?login=${encodeURIComponent(login)}`,
    context: "get user",
  });
}

export async function getMetaUserAccount(login: string): Promise<unknown> {
  return await executeAuthenticatedMetaRequest({
    path: `/api/user/account/get?login=${encodeURIComponent(login)}`,
    context: "get user account",
  });
}

export async function getMetaLoginsByGroup(group: string): Promise<unknown[]> {
  const normalizedGroup = String(group).trim();
  if (!normalizedGroup) {
    throw new MetaManagerError("get logins by group: group is required", 400);
  }

  const result = await executeAuthenticatedMetaRequest<unknown>({
    path: `/api/user/logins?group=${encodeURIComponent(normalizedGroup)}`,
    context: "get logins by group",
  });
  return Array.isArray(result) ? result : [];
}

export async function sendMetaNotification(options: {
  login: string;
  message: string;
}): Promise<unknown> {
  const normalizedLogin = String(options.login).trim();
  const normalizedMessage = String(options.message).trim();
  if (!normalizedLogin) {
    throw new MetaManagerError("send notification: login is required", 400);
  }
  if (!normalizedMessage) {
    throw new MetaManagerError("send notification: message is required", 400);
  }

  // Keep escaping behavior aligned with existing bridge service.
  const safeMessage = normalizedMessage.replaceAll("\n", "\\\n");

  return await executeAuthenticatedMetaRequest({
    path:
      `/api/notification/send?login=${encodeURIComponent(normalizedLogin)}` +
      `&text=${encodeURIComponent(safeMessage)}`,
    context: "send notification",
  });
}

export async function checkMetaUserBalance(login: string): Promise<unknown> {
  try {
    return await executeAuthenticatedMetaRequest({
      path: `/api/user/check_balance?login=${encodeURIComponent(login)}&fixflag=0`,
      context: "check user balance",
    });
  } catch (error) {
    // Some manager roles do not have access to /api/user/check_balance.
    // Fallback to account endpoint to keep behavior aligned with metamanager-nodejs.
    if (error instanceof MetaManagerError) {
      return await getMetaUserAccount(login);
    }
    throw error;
  }
}

export type AddMetaUserInput = {
  group: string;
  name: string;
  leverage: number | string;
  passMain: string;
  passInvestor: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  zipcode?: string;
  company?: string;
  comment?: string;
  id?: string;
  state?: string;
  agent?: string | number;
};

export async function addMetaUser(input: AddMetaUserInput): Promise<unknown> {
  const query = [
    `group=${encodeURIComponent(String(input.group))}`,
    `name=${encodeURIComponent(String(input.name))}`,
    `leverage=${encodeURIComponent(String(input.leverage))}`,
  ].join("&");

  const body: Record<string, unknown> = {
    PassMain: input.passMain,
    PassInvestor: input.passInvestor,
  };
  if (input.email) body.Email = input.email;
  if (input.phone) body.Phone = input.phone;
  if (input.country) body.Country = input.country;
  if (input.city) body.City = input.city;
  if (input.address) body.Address = input.address;
  if (input.zipcode) body.ZIPCode = input.zipcode;
  if (input.company) body.Company = input.company;
  if (input.comment) body.Comment = input.comment;
  if (input.id) body.ID = input.id;
  if (input.state) body.State = input.state;
  if (input.agent !== undefined) body.Agent = input.agent;

  return await executeAuthenticatedMetaRequest({
    path: `/api/user/add?${query}`,
    method: "POST",
    body,
    context: "add user",
  });
}

export async function applyMetaTradeBalance(options: {
  login: string;
  type: 2 | 3 | 4 | 5 | 6;
  balance: number;
  comment: string;
  checkMargin?: 0 | 1;
}): Promise<unknown> {
  const { login, type, balance, comment, checkMargin } = options;
  const normalizedLogin = String(login).trim();
  const normalizedComment = String(comment).trim();

  if (!normalizedLogin) {
    throw new MetaManagerError("apply trade balance: login is required", 400);
  }
  if (!Number.isFinite(balance)) {
    throw new MetaManagerError("apply trade balance: balance is invalid", 400);
  }
  if (!normalizedComment) {
    throw new MetaManagerError("apply trade balance: comment is required", 400);
  }

  const params = [
    `login=${encodeURIComponent(normalizedLogin)}`,
    `type=${encodeURIComponent(String(type))}`,
    `balance=${encodeURIComponent(String(balance))}`,
    `comment=${encodeURIComponent(normalizedComment.slice(0, 32))}`,
  ];
  if (checkMargin === 0 || checkMargin === 1) {
    params.push(`check_margin=${checkMargin}`);
  }

  return await executeAuthenticatedMetaRequest({
    path: `/api/trade/balance?${params.join("&")}`,
    method: "POST",
    context: "apply trade balance",
  });
}

