import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import {
  AddMetaUserInput,
  MetaManagerError,
  addMetaUser,
} from "@/lib/metamanager";
import { apiLogger, logRouteError, requestLogFields } from "@/lib/logger";

const log = apiLogger("accounts:create-demo");

type CreateDemoBody = AddMetaUserInput & {
  serverName?: string;
  accountType?: string;
  clientGroupName?: string;
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
      `SELECT account_id, fullname, email
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

    const platformRegistrationId =
      pickString(body.platformRegistrationId) || `META-DEMO-${loginNumber}`;
    const serverName = pickString(body.serverName) || "MetaTrader 5";
    const platformAccountType = pickString(body.accountType) || "Demo";
    const clientGroupName = pickString(body.clientGroupName) || group;
    const status = pickString(body.status) || "Enabled";
    const currency = pickString(body.currency) || "USD";
    const nickname = pickString(body.comment) || null;

    await pool.query(
      `INSERT INTO platforms (
          platform_registration_id, user_id, account_id, login_number, server_name,
          account_type, client_group_name, status, currency, leverage, nickname,
          swap_free, type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
          updated_at = CURRENT_TIMESTAMP`,
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
      ]
    );

    return NextResponse.json(
      {
        ok: true,
        message: "Akun demo berhasil dibuat",
        loginNumber,
        platformRegistrationId,
        requestedBalance: balance || null,
        requestedStopOutLevel: stopOutLevel || null,
        note:
          "Nilai balance/stopOut disimpan sebagai metadata request. Set saldo real tetap mengikuti konfigurasi group/permission MetaManager.",
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

