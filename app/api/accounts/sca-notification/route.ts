import { NextRequest, NextResponse } from "next/server";
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
