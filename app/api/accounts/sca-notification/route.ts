import { NextRequest, NextResponse } from "next/server";
import OSS from "ali-oss";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import {
  sendScaPasswordResetRequestNotificationEmail,
  sendScaClientAgreementRequestNotificationEmail,
} from "@/lib/email";
import { apiLogger, logRouteError, requestLogFields } from "@/lib/logger";

const log = apiLogger("accounts:sca-notification");

type NotificationType = "password_reset" | "client_agreement";

function isNotificationType(v: unknown): v is NotificationType {
  return v === "password_reset" || v === "client_agreement";
}

function normalizeObjectKey(input: string): string {
  return input.replace(/^\/+/, "").trim();
}

function getClientAgreementPrefixes(): string[] {
  const raw = String(process.env.OSS_CLIENT_AGREEMENT_PREFIXES ?? "").trim();
  if (!raw) return ["Migrasi Agreement"];
  const parts = raw
    .split(",")
    .map((item) => normalizeObjectKey(item))
    .filter(Boolean);
  return parts.length > 0 ? parts : [""];
}

function buildLoginPrefixes(loginNumber: string): string[] {
  const normalizedLogin = loginNumber.trim();
  if (!normalizedLogin) return [];
  return getClientAgreementPrefixes().map((prefix) => {
    if (!prefix) return normalizedLogin;
    return `${prefix.replace(/\/+$/, "")}/${normalizedLogin}`;
  });
}

function createOssClient(): OSS | null {
  const region = String(process.env.OSS_REGION ?? "").trim();
  const bucket = normalizeObjectKey(String(process.env.OSS_BUCKET ?? "").trim());
  const accessKeyId = String(process.env.OSS_ACCESS_KEY_ID ?? "").trim();
  const accessKeySecret = String(process.env.OSS_ACCESS_KEY_SECRET ?? "").trim();
  if (!region || !bucket || !accessKeyId || !accessKeySecret) return null;

  return new OSS({
    region,
    accessKeyId,
    accessKeySecret,
    bucket,
    timeout: "20s",
  });
}

async function findClientAgreementObjectKey(
  client: OSS,
  loginNumber: string
): Promise<string | null> {

  for (const prefix of buildLoginPrefixes(loginNumber)) {
    const listed = await client.listV2({
      prefix,
      "max-keys": 1,
    });
    const first = listed.objects?.[0];
    if (first?.name) return first.name;
  }
  return null;
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

    const body = await request.json();
    const { notificationType, platformId } = body as {
      notificationType?: unknown;
      platformId?: unknown;
    };

    if (!isNotificationType(notificationType)) {
      return NextResponse.json(
        {
          error:
            "notificationType harus 'password_reset' atau 'client_agreement'",
        },
        { status: 400 }
      );
    }

    const pid = Number(platformId);
    if (!Number.isFinite(pid) || pid <= 0) {
      return NextResponse.json(
        { error: "platformId tidak valid" },
        { status: 400 }
      );
    }

    const platformResult = await pool.query(
      `SELECT
        p.id,
        p.login_number,
        p.type AS account_type,
        u.fullname AS user_name,
        u.email AS user_email
      FROM platforms p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1 AND p.user_id = $2`,
      [pid, decoded.userId]
    );

    if (platformResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan atau tidak memiliki akses" },
        { status: 404 }
      );
    }

    const row = platformResult.rows[0];
    const platformKind = String(row.account_type ?? "")
      .trim()
      .toLowerCase();
    if (
      notificationType === "client_agreement" &&
      platformKind === "demo"
    ) {
      return NextResponse.json(
        {
          error:
            "Perjanjian nasabah tidak berlaku untuk akun demo.",
        },
        { status: 400 }
      );
    }
    const payload = {
      fullName: String(row.user_name || "").trim() || "—",
      email: String(row.user_email || "").trim() || "—",
      loginNumber: String(row.login_number ?? "").trim() || "—",
    };

    if (notificationType === "client_agreement") {
      try {
        const client = createOssClient();
        const key = client
          ? await findClientAgreementObjectKey(client, payload.loginNumber)
          : null;
        if (key) {
          const expiresInSeconds = Number(
            process.env.OSS_CLIENT_AGREEMENT_URL_EXPIRES ?? 600
          );
          const fileUrl = client!.signatureUrl(key, {
            expires: Number.isFinite(expiresInSeconds)
              ? Math.max(60, Math.floor(expiresInSeconds))
              : 600,
          });
          return NextResponse.json(
            {
              ok: true,
              delivery: "cdn",
              fileUrl,
              objectKey: key,
              message: "Client agreement found in OSS",
            },
            { status: 200 }
          );
        }
      } catch (error: unknown) {
        const detail = error instanceof Error ? error.message : String(error);
        log.warn(
          { ...requestLogFields(request), detail },
          "Unable to check client agreement in OSS, fallback to email"
        );
      }
    }

    const emailResult =
      notificationType === "password_reset"
        ? await sendScaPasswordResetRequestNotificationEmail(payload)
        : await sendScaClientAgreementRequestNotificationEmail(payload);

    if (!emailResult.success) {
      log.warn(
        { ...requestLogFields(request), detail: emailResult.error },
        "SCA account notification email failed"
      );
      return NextResponse.json(
        { error: "Gagal mengirim email notifikasi. Silakan coba lagi." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, message: "Notification queued" },
      { status: 200 }
    );
  } catch (error: unknown) {
    logRouteError(log, request, error, "SCA account notification failed");
    return NextResponse.json(
      {
        error:
          "Terjadi kesalahan saat memproses permintaan. Silakan coba lagi.",
      },
      { status: 500 }
    );
  }
}
