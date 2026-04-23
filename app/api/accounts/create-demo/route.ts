import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import {
  AddMetaUserInput,
  applyMetaTradeBalance,
  MetaManagerError,
  addMetaUser,
} from "@/lib/metamanager";
import { apiLogger, logRouteError, requestLogFields } from "@/lib/logger";
import {
  getLatestValidSalesforceToken,
  requestSalesforceAccessToken,
  saveSalesforceAccessToken,
} from "@/lib/salesforce-oauth";

const log = apiLogger("accounts:create-demo");

const SALESFORCE_CREATE_PLATFORM_FLOW_URL =
  process.env.SALESFORCE_CREATE_PLATFORM_FLOW_URL ||
  "https://gkg-mfsa.my.salesforce.com/services/data/v66.0/actions/custom/flow/Trive_Invest_API_Create_Platform";

const DEFAULT_SALESFORCE_DEMO_AMOUNT = 100_000;
const PROVISION_STATUS = {
  BALANCE_APPLIED: "balance_applied",
  BALANCE_PENDING: "balance_pending",
  SF_FAILED: "sf_failed",
  SF_FAILED_BALANCE_PENDING: "sf_failed_balance_pending",
  COMPLETED: "completed",
  SF_SYNCED_BALANCE_PENDING: "sf_synced_balance_pending",
} as const;

type CreateDemoBody = AddMetaUserInput & {
  serverName?: string;
  accountType?: string;
  clientGroupName?: string;
  salesforceAccountType?: string;
  currency?: string;
  status?: string;
  platformRegistrationId?: string;
  accountId?: string;
  balance?: string | number;
  stopOutLevel?: string | number;
};

type MetaAddUserAnswer = {
  Login?: string | number;
  login?: string | number;
};

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function pickMetaLogin(answer: unknown): string {
  if (!answer || typeof answer !== "object") return "";
  const payload = answer as MetaAddUserAnswer;
  const candidate = payload.Login ?? payload.login;
  if (candidate == null) return "";
  return String(candidate).trim();
}

function isPasswordValid(password: string): boolean {
  if (password.length < 8 || password.length > 16) return false;
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  return hasLowerCase && hasUpperCase && hasNumber && hasSpecialChar;
}

function inferSalesforceAccountType(
  clientGroupName: string,
  explicit?: string
): string {
  const fromBody = pickString(explicit);
  if (fromBody) return fromBody;
  const parts = clientGroupName.split("\\");
  const tail = parts.length > 1 ? parts[1] : parts[0] || clientGroupName;
  const word = tail.split(/[-_]/)[0]?.trim() || "";
  if (!word) return "Classic";
  const normalized =
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  if (normalized.toLowerCase() === "demo") return "Classic";
  return normalized;
}

type SalesforceCreatePlatformFlowRow = {
  isSuccess?: boolean;
  errors?: unknown[] | null;
  outputValues?: {
    message?: string | null;
    platform?: { Id?: string; RegistrationDate__c?: string; CreatedDate?: string };
    RegistrationDate__c?: string;
    registrationDate?: string;
    CreatedDate?: string;
    createdDate?: string;
    [key: string]: unknown;
  };
};

function pickRegistrationDateFromFlowRow(
  row: SalesforceCreatePlatformFlowRow
): string | null {
  const fromOutputValues = row.outputValues;
  const candidate =
    (typeof fromOutputValues?.RegistrationDate__c === "string"
      ? fromOutputValues.RegistrationDate__c
      : null) ||
    (typeof fromOutputValues?.registrationDate === "string"
      ? fromOutputValues.registrationDate
      : null) ||
    (typeof fromOutputValues?.platform?.RegistrationDate__c === "string"
      ? fromOutputValues.platform.RegistrationDate__c
      : null) ||
    (typeof fromOutputValues?.CreatedDate === "string"
      ? fromOutputValues.CreatedDate
      : null) ||
    (typeof fromOutputValues?.createdDate === "string"
      ? fromOutputValues.createdDate
      : null) ||
    (typeof fromOutputValues?.platform?.CreatedDate === "string"
      ? fromOutputValues.platform.CreatedDate
      : null) ||
    null;

  if (!candidate) return null;
  const normalized = candidate.trim();
  if (!normalized) return null;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function parseCreatePlatformFlowResponse(parsed: unknown): {
  ok: true;
  sfPlatformId: string;
  sfRegistrationDate: string | null;
} | {
  ok: false;
  message: string;
  details?: unknown;
} {
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { ok: false, message: "Respons Salesforce tidak valid" };
  }
  const first = parsed[0] as SalesforceCreatePlatformFlowRow;
  if (first.errors && first.errors.length > 0) {
    return {
      ok: false,
      message: "Salesforce mengembalikan error",
      details: first.errors,
    };
  }
  if (first.isSuccess === false) {
    return {
      ok: false,
      message:
        pickString(first.outputValues?.message) || "Flow Salesforce gagal",
      details: first.outputValues ?? null,
    };
  }
  const id = first.outputValues?.platform?.Id;
  if (!id || typeof id !== "string") {
    return {
      ok: false,
      message: "Platform Id tidak ditemukan di respons Salesforce",
      details: first.outputValues ?? null,
    };
  }
  const trimmed = id.trim();
  if (!trimmed) {
    return {
      ok: false,
      message: "Platform Id tidak ditemukan di respons Salesforce",
      details: first.outputValues ?? null,
    };
  }
  return {
    ok: true,
    sfPlatformId: trimmed,
    sfRegistrationDate: pickRegistrationDateFromFlowRow(first),
  };
}

async function getValidSalesforceToken(): Promise<string> {
  let access = await getLatestValidSalesforceToken();
  if (!access) {
    const fresh = await requestSalesforceAccessToken();
    await saveSalesforceAccessToken(fresh);
    access = fresh.access_token;
  }
  return access;
}

async function callCreatePlatformFlow(payload: {
  clientId: string;
  amount: number;
  clientGroupName: string;
  leverage: string;
  loginNumber: string;
  accountType: string;
}): Promise<
  | { ok: true; sfPlatformId: string; sfRegistrationDate: string | null }
  | { ok: false; message: string; details?: unknown; httpStatus?: number }
> {
  const body = JSON.stringify({
    inputs: [
      {
        clientId: payload.clientId,
        amount: payload.amount,
        clientGroupName: payload.clientGroupName,
        leverage: payload.leverage,
        loginNumber: payload.loginNumber,
        accountType: payload.accountType,
      },
    ],
  });

  let token = await getValidSalesforceToken();
  let response = await fetch(SALESFORCE_CREATE_PLATFORM_FLOW_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body,
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    const fresh = await requestSalesforceAccessToken();
    await saveSalesforceAccessToken(fresh);
    token = fresh.access_token;
    response = await fetch(SALESFORCE_CREATE_PLATFORM_FLOW_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    });
  }

  const raw = await response.text();
  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    return {
      ok: false,
      message: "Respons Salesforce bukan JSON yang valid",
      httpStatus: response.status,
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      message: `Salesforce Create Platform gagal: HTTP ${response.status}`,
      details: parsed,
      httpStatus: response.status,
    };
  }

  const parsedResult = parseCreatePlatformFlowResponse(parsed);
  if (!parsedResult.ok) {
    return {
      ok: false,
      message: parsedResult.message,
      details: parsedResult.details,
    };
  }
  return {
    ok: true,
    sfPlatformId: parsedResult.sfPlatformId,
    sfRegistrationDate: parsedResult.sfRegistrationDate,
  };
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || null;

    if (!token) {
      return NextResponse.json(
        { error: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Token tidak valid atau sudah kadaluarsa" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as Partial<CreateDemoBody>;
    const group = pickString(body.group);
    const clientGroupName = pickString(body.clientGroupName) || group;
    const name = pickString(body.name);
    const leverageRaw = body.leverage;
    const passMain = pickString(body.passMain);
    const passInvestor = pickString(body.passInvestor);
    const stopOutLevelRaw = body.stopOutLevel;
    const balanceRaw = body.balance;

    if (!group || !name || !leverageRaw || !passMain || !passInvestor) {
      return NextResponse.json(
        {
          error:
            "group, name, leverage, passMain, dan passInvestor wajib diisi",
        },
        { status: 400 }
      );
    }

    if (!isPasswordValid(passMain) || !isPasswordValid(passInvestor)) {
      return NextResponse.json(
        {
          error:
            "Kata sandi harus terdiri dari 8-16 karakter dan berisi huruf kecil, huruf besar, angka, dan karakter khusus",
        },
        { status: 400 }
      );
    }

    const leverage =
      typeof leverageRaw === "number" || typeof leverageRaw === "string"
        ? String(leverageRaw).trim()
        : "";
    if (!leverage) {
      return NextResponse.json(
        { error: "leverage tidak valid" },
        { status: 400 }
      );
    }

    const stopOutLevel =
      typeof stopOutLevelRaw === "number" || typeof stopOutLevelRaw === "string"
        ? String(stopOutLevelRaw).trim()
        : "";
    if (stopOutLevel) {
      const stopOutNumber = Number(stopOutLevel);
      if (!Number.isFinite(stopOutNumber) || stopOutNumber <= 0) {
        return NextResponse.json(
          { error: "stopOutLevel tidak valid" },
          { status: 400 }
        );
      }
    }

    const balance =
      typeof balanceRaw === "number" || typeof balanceRaw === "string"
        ? String(balanceRaw).trim()
        : "";
    if (balance) {
      const balanceNumber = Number(balance);
      if (!Number.isFinite(balanceNumber) || balanceNumber <= 0) {
        return NextResponse.json(
          { error: "balance tidak valid" },
          { status: 400 }
        );
      }
    }

    const userResult = await pool.query(
      `SELECT account_id, fullname, email, client_id
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [decoded.userId]
    );
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const userRow = userResult.rows[0] as {
      account_id: string | null;
      fullname: string | null;
      email: string | null;
      client_id: string | null;
    };
    const accountId =
      pickString(body.accountId) ||
      pickString(decoded.accountId) ||
      pickString(userRow.account_id) ||
      "";

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID user tidak ditemukan" },
        { status: 400 }
      );
    }

    const salesforceClientId = pickString(userRow.client_id);
    if (!salesforceClientId) {
      return NextResponse.json(
        {
          error:
            "Client ID Salesforce belum tersedia untuk user ini. Selesaikan registrasi atau sinkronisasi akun terlebih dahulu.",
        },
        { status: 400 }
      );
    }

    const baseComment = pickString(body.comment);
    const derivedCommentParts: string[] = [];
    if (balance) derivedCommentParts.push(`initial_balance=${balance}`);
    if (stopOutLevel) derivedCommentParts.push(`stop_out=${stopOutLevel}%`);
    const combinedComment = [baseComment, derivedCommentParts.join("; ")]
      .filter(Boolean)
      .join(" | ");

    const metaInput: AddMetaUserInput = {
      group,
      name,
      leverage,
      passMain,
      passInvestor,
      email: pickString(body.email) || pickString(userRow.email) || undefined,
      phone: pickString(body.phone) || undefined,
      country: pickString(body.country) || undefined,
      city: pickString(body.city) || undefined,
      address: pickString(body.address) || undefined,
      zipcode: pickString(body.zipcode) || undefined,
      company: pickString(body.company) || undefined,
      comment: combinedComment || undefined,
      id: pickString(body.id) || undefined,
      state: pickString(body.state) || undefined,
      agent:
        typeof body.agent === "number" || typeof body.agent === "string"
          ? body.agent
          : undefined,
    };

    let answer: unknown;
    try {
      answer = await addMetaUser(metaInput);
    } catch (error: unknown) {
      if (error instanceof MetaManagerError) {
        log.warn(
          {
            ...requestLogFields(request),
            userId: decoded.userId,
            detail: error.detail,
            status: error.statusCode,
          },
          "Create demo account to MetaManager failed"
        );
        return NextResponse.json(
          { error: error.message || "Gagal membuat akun demo di Meta" },
          { status: error.statusCode === 500 ? 500 : 502 }
        );
      }
      throw error;
    }

    const loginNumber = pickMetaLogin(answer);
    if (!loginNumber) {
      return NextResponse.json(
        { error: "Akun demo berhasil dibuat, tetapi login number tidak ditemukan" },
        { status: 502 }
      );
    }

    const initialDemoBalance = balance
      ? Number(balance)
      : DEFAULT_SALESFORCE_DEMO_AMOUNT;
    let balanceApplyError:
      | {
          message: string;
          statusCode: number;
          detail?: unknown;
        }
      | null = null;
    try {
      await applyMetaTradeBalance({
        login: loginNumber,
        type: 2,
        balance: initialDemoBalance,
        comment: "Initial Margin",
      });
    } catch (error: unknown) {
      if (error instanceof MetaManagerError) {
        balanceApplyError = {
          message:
            error.message ||
            "Gagal mengatur balance awal di Meta untuk akun demo yang sudah dibuat.",
          statusCode: error.statusCode,
          detail: error.detail,
        };
        log.warn(
          {
            ...requestLogFields(request),
            userId: decoded.userId,
            loginNumber,
            initialDemoBalance,
            detail: error.detail,
            status: error.statusCode,
          },
          "Apply initial demo balance to MetaManager failed"
        );
      } else {
        throw error;
      }
    }

    const platformRegistrationId =
      pickString(body.platformRegistrationId) || `META-DEMO-${loginNumber}`;
    const serverName = pickString(body.serverName) || "MetaTrader 5";
    const platformAccountType = pickString(body.accountType) || "Demo";
    const status = pickString(body.status) || "Enabled";
    const currency = pickString(body.currency) || "USD";
    const nickname = pickString(body.comment) || null;
    const provisionStatusAfterBalance =
      balanceApplyError == null
        ? PROVISION_STATUS.BALANCE_APPLIED
        : PROVISION_STATUS.BALANCE_PENDING;
    const provisionErrorAfterBalance =
      balanceApplyError == null
        ? null
        : JSON.stringify({
            stage: "balance",
            message: balanceApplyError.message,
            detail: balanceApplyError.detail ?? null,
            statusCode: balanceApplyError.statusCode,
          });

    const insertPlatform = await pool.query(
      `INSERT INTO platforms (
          platform_registration_id, user_id, account_id, login_number, server_name,
          account_type, client_group_name, status, currency, leverage, nickname,
          swap_free, type, provision_status, provision_error
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb)
        ON CONFLICT (platform_registration_id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          account_id = EXCLUDED.account_id,
          login_number = EXCLUDED.login_number,
          server_name = EXCLUDED.server_name,
          account_type = EXCLUDED.account_type,
          client_group_name = EXCLUDED.client_group_name,
          status = EXCLUDED.status,
          currency = EXCLUDED.currency,
          leverage = EXCLUDED.leverage,
          nickname = EXCLUDED.nickname,
          swap_free = EXCLUDED.swap_free,
          type = EXCLUDED.type,
          provision_status = EXCLUDED.provision_status,
          provision_error = EXCLUDED.provision_error,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id`,
      [
        platformRegistrationId,
        decoded.userId,
        accountId,
        loginNumber,
        serverName,
        platformAccountType,
        clientGroupName,
        status,
        currency,
        leverage,
        nickname,
        "Tidak",
        "Demo",
        provisionStatusAfterBalance,
        provisionErrorAfterBalance,
      ]
    );

    const platformRowId = insertPlatform.rows[0]?.id as string | number | undefined;
    if (platformRowId == null) {
      return NextResponse.json(
        { error: "Gagal menyimpan data platform" },
        { status: 500 }
      );
    }

    const salesforceAmount = initialDemoBalance;
    const salesforceAccountType = inferSalesforceAccountType(
      clientGroupName,
      body.salesforceAccountType
    );

    const sfResult = await callCreatePlatformFlow({
      clientId: salesforceClientId,
      amount: salesforceAmount,
      clientGroupName,
      leverage,
      loginNumber,
      accountType: salesforceAccountType,
    });

    if (!sfResult.ok) {
      log.warn(
        {
          ...requestLogFields(request),
          userId: decoded.userId,
          loginNumber,
          platformRowId,
          detail: sfResult.details,
        },
        "Create demo platform in Salesforce failed after Meta + DB"
      );
      const http = sfResult.httpStatus;
      const returnStatus =
        http != null && http >= 500 && http < 600 ? http : 502;
      const sfProvisionStatus =
        balanceApplyError == null
          ? PROVISION_STATUS.SF_FAILED
          : PROVISION_STATUS.SF_FAILED_BALANCE_PENDING;
      await pool.query(
        `UPDATE platforms
         SET provision_status = $1,
             provision_error = $2::jsonb,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND user_id = $4`,
        [
          sfProvisionStatus,
          JSON.stringify({
            stage: "salesforce",
            message: sfResult.message,
            details: sfResult.details ?? null,
            httpStatus: http ?? null,
            balanceApplyError,
          }),
          platformRowId,
          decoded.userId,
        ]
      );
      return NextResponse.json(
        {
          error:
            sfResult.message ||
            "Akun demo tersimpan di aplikasi, tetapi gagal mendaftarkan platform ke Salesforce.",
          partial: true,
          stage: "salesforce",
          loginNumber,
          platformRegistrationId,
          balanceApplied: balanceApplyError == null,
          balanceApplyError,
          salesforce: { details: sfResult.details ?? null, httpStatus: http ?? null },
        },
        { status: returnStatus }
      );
    }

    const sfPlatformId = sfResult.sfPlatformId;
    const sfRegistrationDate = sfResult.sfRegistrationDate;
    const finalProvisionStatus =
      balanceApplyError == null
        ? PROVISION_STATUS.COMPLETED
        : PROVISION_STATUS.SF_SYNCED_BALANCE_PENDING;
    const finalProvisionError =
      balanceApplyError == null
        ? null
        : JSON.stringify({
            stage: "balance",
            message: balanceApplyError.message,
            detail: balanceApplyError.detail ?? null,
            statusCode: balanceApplyError.statusCode,
          });
    await pool.query(
      `UPDATE platforms
       SET platform_registration_id = $1,
           registration_date = COALESCE($2::timestamptz, registration_date),
           provision_status = $3,
           provision_error = $4::jsonb,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6`,
      [
        sfPlatformId,
        sfRegistrationDate,
        finalProvisionStatus,
        finalProvisionError,
        platformRowId,
        decoded.userId,
      ]
    );

    return NextResponse.json(
      {
        ok: true,
        partial: balanceApplyError != null,
        stage: balanceApplyError ? "balance" : null,
        message:
          balanceApplyError == null
            ? "Akun demo berhasil dibuat"
            : "Akun demo berhasil dibuat, tetapi balance awal belum berhasil diterapkan di Meta.",
        loginNumber,
        platformRegistrationId: sfPlatformId,
        salesforceAccountType,
        salesforceAmount,
        registrationDate: sfRegistrationDate,
        balanceApplied: balanceApplyError == null,
        balanceApplyError,
        requestedBalance: balance || null,
        requestedStopOutLevel: stopOutLevel || null,
        provisionStatus: finalProvisionStatus,
        note:
          balanceApplyError == null
            ? "Balance awal akun demo sudah diterapkan ke Meta dengan trade balance type=2 (comment: Initial Margin). ID platform mengikuti PlatformRegistration__c di Salesforce."
            : "Akun demo dan sinkronisasi Salesforce berhasil, tetapi apply balance awal ke Meta gagal. Silakan lakukan retry balance secara manual.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logRouteError(log, request, error, "Create demo account failed");
    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat membuat akun demo. Silakan coba lagi.",
      },
      { status: 500 }
    );
  }
}

