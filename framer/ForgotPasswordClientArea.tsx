import * as React from "react"
// Host Framer menyediakan modul ini di Code Component (tidak ada di Next.js).
// @ts-expect-error — types tidak terpasang di repo ini
import { addPropertyControls, ControlType } from "framer"
import { AuthPageFooter } from "./AuthPageFooter.tsx"

const BASE = "https://www.triveinvest.co.id/sca"
const API_BASE = "https://api.trive.co.id/api"
const OTP_RESEND_COOLDOWN_SEC = 120

function formatOtpCooldown(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

/** National mobile digits only (strip 0062 / 62 / leading 0). Input boleh 0813…, 813…, 0062…, 62813…; ke API selalu 62 + nasional. */
function stripIndonesiaNationalMobileDigits(input: string): string {
    let d = input.replaceAll(/\D/g, "")
    while (d.startsWith("0062")) d = d.slice(4)
    while (d.startsWith("62")) d = d.slice(2)
    while (d.startsWith("0")) d = d.slice(1)
    return d
}

interface SendOtpResponse {
    error?: string
    message?: string
    code?: string
}

interface CheckSalesforceClientResponse {
    found?: boolean
    error?: string
    message?: string
}

interface ResetPasswordResponse {
    error?: string
    message?: string
}

type ForgotPasswordClientAreaProps = {
    checkSalesforceClientApiUrl?: string
    sendResetPasswordOtpApiUrl?: string
    resetPasswordApiUrl?: string
    pageBgColor?: string
    logoUrl?: string
    homeUrl?: string
    bubblesImageUrl?: string
    loginUrl?: string
    whatsappUrl?: string
    fullViewport?: boolean
}

function ForgotPasswordClientArea(props: ForgotPasswordClientAreaProps) {
    const {
        checkSalesforceClientApiUrl = `${API_BASE}/auth/check-salesforce-client`,
        sendResetPasswordOtpApiUrl = `${API_BASE}/auth/send-reset-password-otp`,
        resetPasswordApiUrl = `${API_BASE}/auth/reset-password`,
        pageBgColor = "#69d7f6",
        logoUrl = "https://cdn2.triveinvest.co.id/assets/img/sca/logo.svg",
        homeUrl = `${BASE}/`,
        bubblesImageUrl = "https://cdn2.triveinvest.co.id/assets/img/sca/bubbles-small.png",
        loginUrl = `${BASE}/login`,
        whatsappUrl = "https://wa.me/628815921000",
        fullViewport = false,
    } = props

    const [step, setStep] = React.useState<"request" | "otp" | "reset">(
        "request"
    )
    const [email, setEmail] = React.useState("")
    const [phone, setPhone] = React.useState("")
    const [otp, setOtp] = React.useState("")
    const [newPassword, setNewPassword] = React.useState("")
    const [confirmPassword, setConfirmPassword] = React.useState("")
    const [showPassword, setShowPassword] = React.useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [isSendingOtp, setIsSendingOtp] = React.useState(false)
    const [error, setError] = React.useState("")
    const [success, setSuccess] = React.useState("")
    const [otpSentMessage, setOtpSentMessage] = React.useState("")
    const [emailError, setEmailError] = React.useState("")
    const [isEmailLocked, setIsEmailLocked] = React.useState(false)
    const [phoneError, setPhoneError] = React.useState("")
    const [passwordError, setPasswordError] = React.useState("")
    const [otpError, setOtpError] = React.useState("")
    const [otpResendSecondsLeft, setOtpResendSecondsLeft] = React.useState(0)
    const [isResendingOtp, setIsResendingOtp] = React.useState(false)

    React.useEffect(() => {
        if (globalThis.window === undefined) return
        const params = new URLSearchParams(globalThis.window.location.search)
        const emailFromQuery = params.get("email") || ""
        const emailFromStorage =
            localStorage.getItem("forgotPasswordEmail") ||
            localStorage.getItem("lastLoginEmail") ||
            localStorage.getItem("rememberedEmail") ||
            ""
        const resolvedEmail = (emailFromQuery || emailFromStorage).trim()
        setEmail(resolvedEmail)
        setIsEmailLocked(Boolean(resolvedEmail))
    }, [])

    React.useEffect(() => {
        if (!otpSentMessage || step !== "otp") return
        const timeoutId = globalThis.setTimeout(() => {
            setOtpSentMessage("")
        }, 6000)
        return () => {
            globalThis.clearTimeout(timeoutId)
        }
    }, [otpSentMessage, step])

    React.useEffect(() => {
        if (step !== "otp") {
            setOtpResendSecondsLeft(0)
            return
        }
        setOtpResendSecondsLeft(OTP_RESEND_COOLDOWN_SEC)
    }, [step])

    const otpCooldownActive = step === "otp" && otpResendSecondsLeft > 0
    React.useEffect(() => {
        if (!otpCooldownActive) return
        const id = globalThis.setInterval(() => {
            setOtpResendSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1))
        }, 1000)
        return () => globalThis.clearInterval(id)
    }, [otpCooldownActive])

    const validateEmail = (emailValue: string): boolean => {
        if (!emailValue.trim()) {
            setEmailError("Email diperlukan")
            return false
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(emailValue)) {
            setEmailError("Email tidak valid")
            return false
        }
        setEmailError("")
        return true
    }

    const validatePhone = (phoneValue: string): boolean => {
        const national = stripIndonesiaNationalMobileDigits(phoneValue)
        if (!national) {
            setPhoneError("Nomor HP diperlukan")
            return false
        }
        if (national.length < 9 || national.length > 13) {
            setPhoneError("Nomor HP tidak valid")
            return false
        }
        setPhoneError("")
        return true
    }

    const validatePassword = (passwordValue: string): boolean => {
        if (!passwordValue.trim()) {
            setPasswordError("Password diperlukan")
            return false
        }
        if (passwordValue.length < 8 || passwordValue.length > 15) {
            setPasswordError("Password harus terdiri dari 8-15 karakter")
            return false
        }
        const hasLowerCase = /[a-z]/.test(passwordValue)
        const hasUpperCase = /[A-Z]/.test(passwordValue)
        const hasNumber = /\d/.test(passwordValue)

        if (!hasLowerCase || !hasUpperCase || !hasNumber) {
            setPasswordError(
                "Password harus berisi huruf kecil, huruf besar, dan angka"
            )
            return false
        }
        setPasswordError("")
        return true
    }

    const isEmailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    const phoneNationalDigits = stripIndonesiaNationalMobileDigits(phone)
    const isPhoneFormatValid =
        phoneNationalDigits.length >= 9 && phoneNationalDigits.length <= 13
    const isRequestFormValid = isEmailFormatValid && isPhoneFormatValid

    /** Salesforce: selalu "62" + digit nasional (tanpa 00 di depan). */
    const normalizePhoneForApi = (phoneValue: string): string => {
        const national = stripIndonesiaNationalMobileDigits(phoneValue)
        if (!national) return ""
        return `62${national}`
    }

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateEmail(email)) {
            return
        }

        if (!validatePhone(phone)) {
            return
        }

        setIsSendingOtp(true)
        setError("")
        setSuccess("")
        setOtpSentMessage("")

        try {
            const emailPayload = email.trim()
            const phonePayload = normalizePhoneForApi(phone)
            const checkSalesforceResponse = await fetch(
                checkSalesforceClientApiUrl,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: emailPayload,
                        phone: phonePayload,
                    }),
                }
            )

            const checkSalesforceData: CheckSalesforceClientResponse =
                await checkSalesforceResponse.json()

            if (!checkSalesforceResponse.ok) {
                setError(
                    checkSalesforceData.error ||
                        "Gagal memverifikasi data klien. Silakan coba lagi."
                )
                return
            }

            if (!checkSalesforceData.found) {
                setError(
                    "Silahkan hubungi customer service untuk merubah no hp anda."
                )
                return
            }

            const response = await fetch(sendResetPasswordOtpApiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: emailPayload,
                    // phone: phonePayload,
                    // phoneNumber: phonePayload,
                }),
            })

            const data: SendOtpResponse = await response.json()

            if (!response.ok) {
                setError(
                    data.error || "Gagal mengirim kode OTP. Silakan coba lagi."
                )
                return
            }

            let sentMsg =
                data.message || "Kode OTP telah dikirim ke WhatsApp Anda"
            if (data.code) {
                console.log("OTP (dev only):", data.code)
                sentMsg = `Kode OTP telah dikirim. Kode (untuk testing): ${data.code}`
            }
            setOtpSentMessage(sentMsg)
            setOtpResendSecondsLeft(OTP_RESEND_COOLDOWN_SEC)
            setStep("otp")
        } catch (err) {
            console.error("Send OTP error:", err)
            setError("Gagal mengirim kode OTP. Silakan coba lagi.")
        } finally {
            setIsSendingOtp(false)
        }
    }

    const handleResendOtp = async () => {
        if (otpResendSecondsLeft > 0 || isResendingOtp) return
        if (!validateEmail(email)) {
            return
        }
        setIsResendingOtp(true)
        setError("")
        setOtpSentMessage("")
        try {
            const emailPayload = email.trim()
            const response = await fetch(sendResetPasswordOtpApiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: emailPayload,
                }),
            })

            const data: SendOtpResponse = await response.json()

            if (!response.ok) {
                setError(
                    data.error ||
                        "Gagal mengirim ulang kode OTP. Silakan coba lagi."
                )
                return
            }

            let sentMsg =
                data.message || "Kode OTP telah dikirim ke WhatsApp Anda"
            if (data.code) {
                console.log("OTP (dev only):", data.code)
                sentMsg = `Kode OTP telah dikirim. Kode (untuk testing): ${data.code}`
            }
            setOtpSentMessage(sentMsg)
            setOtpResendSecondsLeft(OTP_RESEND_COOLDOWN_SEC)
        } catch (err) {
            console.error("Resend OTP error:", err)
            setError("Gagal mengirim ulang kode OTP. Silakan coba lagi.")
        } finally {
            setIsResendingOtp(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!otp.trim()) {
            setOtpError("Kode OTP diperlukan")
            setStep("otp")
            return
        }
        setOtpError("")

        if (!validatePassword(newPassword)) {
            return
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("Password dan konfirmasi password tidak sama")
            return
        }

        setIsSubmitting(true)
        setError("")
        setSuccess("")

        try {
            const response = await fetch(resetPasswordApiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email.trim(),
                    otp: otp.trim(),
                    newPassword: newPassword,
                }),
            })

            const data: ResetPasswordResponse = await response.json()

            if (!response.ok) {
                setError(
                    data.error || "Gagal reset password. Silakan coba lagi."
                )
                return
            }

            setSuccess(data.message || "Password berhasil direset")
            setOtpSentMessage("")

            setTimeout(() => {
                if (globalThis.window !== undefined) {
                    globalThis.window.location.href = loginUrl
                }
            }, 2000)
        } catch (err) {
            console.error("Reset password error:", err)
            setError("Gagal reset password. Silakan coba lagi.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleContinueToResetPassword = (e: React.FormEvent) => {
        e.preventDefault()
        if (!otp.trim()) {
            setOtpError("Kode OTP diperlukan")
            return
        }
        if (otp.trim().length !== 4) {
            setOtpError("Kode OTP harus 4 digit")
            return
        }
        setOtpError("")
        setError("")
        setSuccess("")
        setStep("reset")
    }

    const inputBase: React.CSSProperties = {
        width: "100%",
        backgroundColor: "#ffffff",
        borderRadius: "70px",
        boxShadow: "none",
        color: "#24252c",
        fontSize: "14px",
        height: "53px",
        paddingLeft: "24px",
        paddingRight: "24px",
        outline: "none",
        border: "1px solid #ffffff",
        boxSizing: "border-box",
    }

    const inputDisabled: React.CSSProperties = {
        ...inputBase,
        backgroundColor: "#f3f4f6",
        border: "1px solid #d1d5db",
        cursor: "not-allowed",
    }

    const linkStyle: React.CSSProperties = {
        fontSize: "14px",
        color: "#2563eb",
        fontWeight: 600,
        textDecoration: "underline",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        padding: 0,
    }

    const submitBtnBase: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2b2c24",
        color: "#ffffff",
        border: "none",
        borderRadius: "65px",
        fontSize: "15px",
        fontWeight: 500,
        minWidth: 217,
        padding: "16px 25px 13px",
        cursor: "pointer",
        fontFamily: "inherit",
    }

    let formTitle = "Reset Kata Sandi"
    if (step === "request") formTitle = "Lupa Kata Sandi"
    if (step === "otp") formTitle = "Verifikasi OTP"

    const rootLayout: React.CSSProperties = fullViewport
        ? {
              minHeight: "100vh",
              width: "100%",
          }
        : {
              width: "100%",
              maxWidth: "100%",
              minHeight: "100%",
              height: "100%",
              flex: "1 1 auto",
              alignSelf: "stretch",
          }

    return (
        <div
            className="forgot-client-area-root"
            style={{
                ...rootLayout,
                display: "flex",
                backgroundColor: pageBgColor,
                position: "relative",
                overflow: "hidden",
                fontFamily: "system-ui, -apple-system, sans-serif",
                boxSizing: "border-box",
                isolation: "isolate",
            }}
        >
            <style>{`
                .forgot-client-area-root,
                .forgot-client-area-root * {
                    box-sizing: border-box;
                }
                @media (max-width: 1023px) {
                    .forgot-col-layout { flex-direction: column !important; }
                    .forgot-left-col { width: 100% !important; max-width: 100% !important; }
                    .forgot-right-col { width: 100% !important; max-width: 100% !important; }
                    .forgot-left-col { padding: 40px 28px 24px !important; }
                    .forgot-right-col { padding: 20px 20px 40px !important; }
                    .forgot-card { padding: 48px 40px !important; }
                    .forgot-main-heading { font-size: 2rem !important; margin-bottom: 16px !important; }
                    .forgot-main-copy { font-size: 16px !important; line-height: 1.5 !important; }
                    .forgot-form-title { font-size: 1.9rem !important; margin-bottom: 20px !important; }
                    .forgot-input { height: 50px !important; font-size: 14px !important; }
                    .forgot-submit-btn { width: 100% !important; }
                    .forgot-submit-btn { min-width: 100% !important; min-height: 48px !important; }
                    .forgot-bubbles-wrap { width: 90px !important; height: 80px !important; }
                    .forgot-wa-btn { bottom: 20px !important; right: 20px !important; padding: 14px !important; }
                }
                @media (max-width: 767px) {
                    .forgot-left-col { padding: 28px 16px 18px !important; }
                    .forgot-right-col { padding: 14px 12px 28px !important; }
                    .forgot-card { padding: 34px 18px !important; border-radius: 12px !important; }
                    .forgot-main-heading { font-size: 1.6rem !important; line-height: 1.25 !important; margin-bottom: 12px !important; }
                    .forgot-main-copy { font-size: 14px !important; line-height: 1.45 !important; }
                    .forgot-form-title { font-size: 1.55rem !important; margin-bottom: 16px !important; }
                    .forgot-form-copy { font-size: 13px !important; line-height: 1.45 !important; }
                    .forgot-input { height: 48px !important; padding-left: 18px !important; padding-right: 18px !important; }
                    .forgot-submit-btn { font-size: 14px !important; padding: 14px 20px 12px !important; }
                    .forgot-wa-btn { bottom: 14px !important; right: 14px !important; padding: 12px !important; }
                }
                .forgot-submit-btn:not(:disabled) {
                    transition: transform 0.12s ease, background-color 0.12s ease;
                }
                .forgot-submit-btn:not(:disabled):hover {
                    background-color: #1a1b1c !important;
                    transform: scale(1.02);
                }
                .forgot-submit-btn:not(:disabled):active {
                    transform: scale(0.98);
                }
                .forgot-form-footer-wrap { margin-top: 16px; }
                @media (min-width: 640px) {
                    .forgot-form-footer-wrap { margin-top: 24px; }
                    .forgot-wa-chat-label { display: inline-block !important; }
                }
            `}</style>

            {whatsappUrl ? (
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chat dengan WhatsApp"
                    className="forgot-wa-btn"
                    style={{
                        position: "fixed",
                        bottom: 24,
                        right: 24,
                        zIndex: 50,
                        backgroundColor: "#25D366",
                        color: "#ffffff",
                        borderRadius: 9999,
                        padding: "16px",
                        boxShadow:
                            "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textDecoration: "none",
                    }}
                >
                    <svg
                        width={24}
                        height={24}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982a.524.524 0 01-.656-.68l.985-3.74-.214-.361a9.87 9.87 0 01-1.378-5.03c0-5.45 4.436-9.884 9.884-9.884 2.64 0 5.123 1.03 6.979 2.898a9.825 9.825 0 012.897 6.98c0 5.45-4.436 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.16 11.892c0 2.096.547 4.142 1.588 5.945L.05 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.89-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    <span
                        style={{
                            marginLeft: 8,
                            fontSize: 14,
                            fontWeight: 500,
                            display: "none",
                        }}
                        className="forgot-wa-chat-label"
                    >
                        Chat
                    </span>
                </a>
            ) : null}

            <div
                style={{
                    width: "100%",
                    maxWidth: "1170px",
                    margin: "0 auto",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                }}
            >
                <div
                    className="forgot-col-layout"
                    style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "row",
                        flex: 1,
                    }}
                >
                    <div
                        className="forgot-left-col"
                        style={{
                            width: "50%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            padding: "64px 64px 64px 64px",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "flex-start",
                            }}
                        >
                            <a
                                href={homeUrl}
                                style={{
                                    display: "inline-block",
                                    marginBottom: "24px",
                                }}
                            >
                                <img
                                    src={logoUrl}
                                    alt="Trive Invest"
                                    style={{
                                        height: "51px",
                                        width: "auto",
                                        display: "block",
                                    }}
                                />
                            </a>
                        </div>
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "flex-start",
                                maxWidth: "42rem",
                            }}
                        >
                            <h1
                                className="forgot-main-heading"
                                style={{
                                    fontSize: "2.25rem",
                                    fontWeight: 500,
                                    color: "#000000",
                                    margin: "0 0 24px 0",
                                    lineHeight: 1.2,
                                }}
                            >
                                Your financial wings to let your{" "}
                                <span style={{ color: "#ffffff" }}>
                                    wealth go beyond.
                                </span>
                            </h1>
                            <p
                                className="forgot-main-copy"
                                style={{
                                    fontSize: "18px",
                                    color: "#000000",
                                    lineHeight: 1.6,
                                    margin: 0,
                                }}
                            >
                                Kami di sini untuk membantu Anda meraihnya
                                peluang untuk melampaui batas-batas
                            </p>
                        </div>
                    </div>

                    <div
                        className="forgot-right-col"
                        style={{
                            width: "50%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            padding: "64px 32px",
                            position: "relative",
                        }}
                    >
                        <div
                            className="forgot-bubbles-wrap"
                            style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                width: 130,
                                height: 120,
                                pointerEvents: "none",
                                zIndex: 0,
                            }}
                        >
                            <img
                                src={bubblesImageUrl}
                                alt=""
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    objectPosition: "top right",
                                    opacity: 0.9,
                                }}
                            />
                        </div>

                        <div
                            style={{
                                width: "100%",
                                maxWidth: 560,
                                position: "relative",
                                zIndex: 10,
                            }}
                        >
                            <div
                                className="forgot-card"
                                style={{
                                    backgroundColor: "rgba(255,255,255,0.7)",
                                    padding: "77px 60px",
                                    borderRadius: "8px",
                                    boxShadow:
                                        "0 10px 15px -3px rgba(0,0,0,0.1)",
                                    position: "relative",
                                    zIndex: 10,
                                }}
                            >
                                <h2
                                    className="forgot-form-title"
                                    style={{
                                        fontSize: "2.25rem",
                                        fontWeight: 500,
                                        color: "#000000",
                                        margin: "0 0 24px 0",
                                    }}
                                >
                                    {formTitle}
                                </h2>

                                {step === "request" && (
                                    <form
                                        onSubmit={handleSendOtp}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "16px",
                                        }}
                                    >
                                        <p
                                            className="forgot-form-copy"
                                            style={{
                                                fontSize: "14px",
                                                color: "#666666",
                                                margin: "0 0 4px 0",
                                            }}
                                        >
                                            Tolong masukin no hp untuk
                                            melanjutkan lupa kata sandi.
                                        </p>
                                        <div>
                                            <input
                                                type="email"
                                                id="forgot-email"
                                                name="email"
                                                value={email}
                                                readOnly={isEmailLocked}
                                                onChange={(e) => {
                                                    setEmail(e.target.value)
                                                    setEmailError("")
                                                    setError("")
                                                }}
                                                onBlur={() =>
                                                    validateEmail(email)
                                                }
                                                placeholder="Email"
                                                autoComplete="email"
                                                className="forgot-input"
                                                style={{
                                                    ...(isEmailLocked
                                                        ? inputDisabled
                                                        : inputBase),
                                                    border: emailError
                                                        ? "1px solid #ef4444"
                                                        : "1px solid #ffffff",
                                                }}
                                            />
                                            {emailError && (
                                                <p
                                                    style={{
                                                        color: "#ef4444",
                                                        fontSize: "12px",
                                                        margin: "4px 0 0 8px",
                                                    }}
                                                >
                                                    {emailError}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            {/* <label
                                                htmlFor="forgot-phone"
                                                style={{
                                                    display: "block",
                                                    fontSize: "13px",
                                                    color: "#444444",
                                                    marginBottom: 6,
                                                    fontWeight: 500,
                                                }}
                                            >
                                                Nomor WhatsApp / HP{" "}
                                                <span
                                                    style={{
                                                        fontWeight: 400,
                                                        color: "#666666",
                                                    }}
                                                >
                                                    (sesuai data terdaftar)
                                                </span>
                                            </label> */}
                                            <div
                                                className="forgot-phone-combo"
                                                style={{
                                                    display: "flex",
                                                    alignItems: "stretch",
                                                    width: "100%",
                                                    borderRadius: "70px",
                                                    overflow: "hidden",
                                                    border: phoneError
                                                        ? "1px solid #ef4444"
                                                        : "1px solid #ffffff",
                                                    backgroundColor: "#ffffff",
                                                }}
                                            >
                                                <span
                                                    aria-hidden
                                                    style={{
                                                        flexShrink: 0,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 8,
                                                        paddingLeft: "16px",
                                                        paddingRight: "12px",
                                                        backgroundColor:
                                                            "#f3f4f6",
                                                        color: "#24252c",
                                                        fontSize: "14px",
                                                        fontWeight: 600,
                                                        borderRight:
                                                            "1px solid #e5e7eb",
                                                    }}
                                                >
                                                    <svg
                                                        width={22}
                                                        height={15}
                                                        viewBox="0 0 22 15"
                                                        style={{
                                                            flexShrink: 0,
                                                            borderRadius: 2,
                                                            boxShadow:
                                                                "0 0 0 1px rgba(0,0,0,0.12)",
                                                        }}
                                                    >
                                                        <rect
                                                            width="22"
                                                            height="7.5"
                                                            fill="#E7000B"
                                                        />
                                                        <rect
                                                            y="7.5"
                                                            width="22"
                                                            height="7.5"
                                                            fill="#FFFFFF"
                                                        />
                                                    </svg>
                                                    +62
                                                </span>
                                                <input
                                                    type="tel"
                                                    id="forgot-phone"
                                                    name="phone"
                                                    inputMode="numeric"
                                                    value={phone}
                                                    onChange={(e) => {
                                                        const national =
                                                            stripIndonesiaNationalMobileDigits(
                                                                e.target.value
                                                            )
                                                        setPhone(
                                                            national.slice(
                                                                0,
                                                                13
                                                            )
                                                        )
                                                        setPhoneError("")
                                                        setError("")
                                                    }}
                                                    onBlur={() =>
                                                        validatePhone(phone)
                                                    }
                                                    placeholder="8xxxxxxxxxxx"
                                                    autoComplete="tel-national"
                                                    aria-label="Nomor seluler tanpa 62 (kode negara di kiri)"
                                                    className="forgot-input forgot-phone-national"
                                                    style={{
                                                        ...inputBase,
                                                        flex: 1,
                                                        minWidth: 0,
                                                        border: "none",
                                                        borderRadius: 0,
                                                    }}
                                                />
                                            </div>
                                            {/* <p
                                                style={{
                                                    fontSize: "12px",
                                                    color: "#666666",
                                                    margin: "6px 0 0 8px",
                                                    lineHeight: 1.45,
                                                }}
                                            >
                                                Isi hanya nomor setelah{" "}
                                                <span
                                                    style={{
                                                        fontVariantNumeric:
                                                            "tabular-nums",
                                                    }}
                                                >
                                                    62
                                                </span>
                                                —prefix{" "}
                                                <span
                                                    style={{
                                                        fontVariantNumeric:
                                                            "tabular-nums",
                                                    }}
                                                >
                                                    +62
                                                </span>{" "}
                                                sudah di kiri. Anda boleh ketik
                                                atau tempel{" "}
                                                <span
                                                    style={{
                                                        fontVariantNumeric:
                                                            "tabular-nums",
                                                    }}
                                                >
                                                    0813…
                                                </span>
                                                ,{" "}
                                                <span
                                                    style={{
                                                        fontVariantNumeric:
                                                            "tabular-nums",
                                                    }}
                                                >
                                                    813…
                                                </span>
                                                ,{" "}
                                                <span
                                                    style={{
                                                        fontVariantNumeric:
                                                            "tabular-nums",
                                                    }}
                                                >
                                                    0062813…
                                                </span>
                                                , dll.; ke Salesforce selalu
                                                dikirim{" "}
                                                <span
                                                    style={{
                                                        fontVariantNumeric:
                                                            "tabular-nums",
                                                    }}
                                                >
                                                    62
                                                </span>
                                                + minimal 9 digit nasional
                                                (mis. awalan operator{" "}
                                                <span
                                                    style={{
                                                        fontVariantNumeric:
                                                            "tabular-nums",
                                                    }}
                                                >
                                                    813
                                                </span>
                                                ).
                                            </p> */}
                                            {phoneError && (
                                                <p
                                                    style={{
                                                        color: "#ef4444",
                                                        fontSize: "12px",
                                                        margin: "4px 0 0 8px",
                                                    }}
                                                >
                                                    {phoneError}
                                                </p>
                                            )}
                                        </div>

                                        {error && (
                                            <div style={{ marginBottom: 4 }}>
                                                <p
                                                    style={{
                                                        color: "#ef4444",
                                                        fontSize: "14px",
                                                        paddingLeft: 8,
                                                        margin: 0,
                                                    }}
                                                >
                                                    {error}
                                                </p>
                                            </div>
                                        )}

                                        {success && (
                                            <div style={{ marginBottom: 4 }}>
                                                <p
                                                    style={{
                                                        color: "#16a34a",
                                                        fontSize: "14px",
                                                        paddingLeft: 8,
                                                        margin: 0,
                                                    }}
                                                >
                                                    {success}
                                                </p>
                                            </div>
                                        )}

                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "center",
                                                paddingTop: 8,
                                            }}
                                        >
                                            <button
                                                type="submit"
                                                disabled={
                                                    isSendingOtp ||
                                                    !isRequestFormValid
                                                }
                                                className="forgot-submit-btn"
                                                style={{
                                                    ...submitBtnBase,
                                                    cursor:
                                                        isSendingOtp ||
                                                        !isRequestFormValid
                                                            ? "not-allowed"
                                                            : "pointer",
                                                    backgroundColor:
                                                        isSendingOtp ||
                                                        !isRequestFormValid
                                                            ? "#d1d5db"
                                                            : "#2b2c24",
                                                    color:
                                                        isSendingOtp ||
                                                        !isRequestFormValid
                                                            ? "#9ca3af"
                                                            : "#ffffff",
                                                }}
                                            >
                                                {isSendingOtp
                                                    ? "Memverifikasi..."
                                                    : "Lanjutkan"}
                                            </button>
                                        </div>

                                        <div
                                            style={{
                                                textAlign: "center",
                                                fontSize: "14px",
                                                color: "#666666",
                                                paddingTop: 4,
                                            }}
                                        >
                                            <a
                                                href={loginUrl}
                                                style={linkStyle}
                                            >
                                                Kembali ke halaman masuk
                                            </a>
                                        </div>
                                    </form>
                                )}
                                {step === "otp" && (
                                    <form
                                        onSubmit={handleContinueToResetPassword}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "16px",
                                        }}
                                    >
                                        <p
                                            className="forgot-form-copy"
                                            style={{
                                                fontSize: "14px",
                                                color: "#666666",
                                                margin: "0 0 4px 0",
                                            }}
                                        >
                                            Masukkan kode OTP yang dikirim ke
                                            WhatsApp Anda.
                                        </p>
                                        <div>
                                            <input
                                                type="email"
                                                value={email}
                                                disabled
                                                readOnly
                                                className="forgot-input"
                                                style={inputDisabled}
                                            />
                                        </div>
                                        <div>
                                            <div
                                                className="forgot-phone-combo"
                                                style={{
                                                    display: "flex",
                                                    alignItems: "stretch",
                                                    width: "100%",
                                                    borderRadius: "70px",
                                                    overflow: "hidden",
                                                    border: "1px solid #d1d5db",
                                                    backgroundColor: "#f3f4f6",
                                                }}
                                            >
                                                <span
                                                    aria-hidden
                                                    style={{
                                                        flexShrink: 0,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 8,
                                                        paddingLeft: "16px",
                                                        paddingRight: "12px",
                                                        backgroundColor:
                                                            "#e5e7eb",
                                                        color: "#24252c",
                                                        fontSize: "14px",
                                                        fontWeight: 600,
                                                        borderRight:
                                                            "1px solid #d1d5db",
                                                    }}
                                                >
                                                    <svg
                                                        width={22}
                                                        height={15}
                                                        viewBox="0 0 22 15"
                                                        style={{
                                                            flexShrink: 0,
                                                            borderRadius: 2,
                                                            boxShadow:
                                                                "0 0 0 1px rgba(0,0,0,0.12)",
                                                        }}
                                                    >
                                                        <rect
                                                            width="22"
                                                            height="7.5"
                                                            fill="#E7000B"
                                                        />
                                                        <rect
                                                            y="7.5"
                                                            width="22"
                                                            height="7.5"
                                                            fill="#FFFFFF"
                                                        />
                                                    </svg>
                                                    +62
                                                </span>
                                                <input
                                                    type="tel"
                                                    value={phoneNationalDigits}
                                                    disabled
                                                    readOnly
                                                    className="forgot-input"
                                                    style={{
                                                        ...inputDisabled,
                                                        flex: 1,
                                                        minWidth: 0,
                                                        border: "none",
                                                        borderRadius: 0,
                                                        backgroundColor:
                                                            "#f3f4f6",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 12,
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    id="forgot-otp"
                                                    name="otp"
                                                    inputMode="numeric"
                                                    value={otp}
                                                    onChange={(e) => {
                                                        setOtp(
                                                            e.target.value
                                                                .replaceAll(
                                                                    /\D/g,
                                                                    ""
                                                                )
                                                                .slice(0, 4)
                                                        )
                                                        setOtpError("")
                                                        setError("")
                                                    }}
                                                    placeholder="Kode OTP (4 digit)"
                                                    maxLength={4}
                                                    autoComplete="one-time-code"
                                                    className="forgot-input"
                                                    style={{
                                                        ...inputBase,
                                                        flex: 1,
                                                        minWidth: 0,
                                                        border: otpError
                                                            ? "1px solid #ef4444"
                                                            : "1px solid #ffffff",
                                                    }}
                                                />
                                                <div
                                                    style={{
                                                        flexShrink: 0,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "flex-end",
                                                        minWidth: 72,
                                                    }}
                                                >
                                                    {isResendingOtp ? (
                                                        <span
                                                            style={{
                                                                fontSize:
                                                                    "13px",
                                                                color: "#666666",
                                                                whiteSpace:
                                                                    "nowrap",
                                                            }}
                                                        >
                                                            Mengirim...
                                                        </span>
                                                    ) : null}
                                                    {!isResendingOtp &&
                                                    otpResendSecondsLeft > 0 ? (
                                                        <span
                                                            style={{
                                                                fontSize:
                                                                    "15px",
                                                                fontWeight: 500,
                                                                color: "#24252c",
                                                                fontFamily:
                                                                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                                                fontVariantNumeric:
                                                                    "tabular-nums",
                                                                letterSpacing:
                                                                    "0.02em",
                                                                whiteSpace:
                                                                    "nowrap",
                                                            }}
                                                            aria-live="polite"
                                                            aria-label={`Sisa waktu tunggu kirim ulang OTP ${formatOtpCooldown(otpResendSecondsLeft)}`}
                                                        >
                                                            {formatOtpCooldown(
                                                                otpResendSecondsLeft
                                                            )}
                                                        </span>
                                                    ) : null}
                                                    {!isResendingOtp &&
                                                    otpResendSecondsLeft <=
                                                        0 ? (
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                handleResendOtp
                                                            }
                                                            style={{
                                                                ...linkStyle,
                                                                fontSize:
                                                                    "13px",
                                                                whiteSpace:
                                                                    "nowrap",
                                                                textAlign:
                                                                    "right",
                                                            }}
                                                        >
                                                            Minta kode baru
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                            {otpError && (
                                                <p
                                                    style={{
                                                        color: "#ef4444",
                                                        fontSize: "12px",
                                                        margin: "4px 0 0 8px",
                                                    }}
                                                >
                                                    {otpError}
                                                </p>
                                            )}
                                            {otpSentMessage && (
                                                <div
                                                    style={{
                                                        margin: "6px 0 0 8px",
                                                        display: "flex",
                                                        alignItems:
                                                            "flex-start",
                                                        gap: 8,
                                                    }}
                                                >
                                                    <p
                                                        style={{
                                                            color: "#16a34a",
                                                            fontSize: "14px",
                                                            margin: 0,
                                                            flex: 1,
                                                        }}
                                                    >
                                                        {otpSentMessage}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setOtpSentMessage(
                                                                ""
                                                            )
                                                        }
                                                        aria-label="Tutup pesan OTP"
                                                        style={{
                                                            border: "none",
                                                            background:
                                                                "transparent",
                                                            color: "#16a34a",
                                                            cursor: "pointer",
                                                            fontSize: "14px",
                                                            lineHeight: 1,
                                                            padding: 0,
                                                        }}
                                                    >
                                                        x
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {error && (
                                            <div style={{ marginBottom: 4 }}>
                                                <p
                                                    style={{
                                                        color: "#ef4444",
                                                        fontSize: "14px",
                                                        paddingLeft: 8,
                                                        margin: 0,
                                                    }}
                                                >
                                                    {error}
                                                </p>
                                            </div>
                                        )}
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "center",
                                                paddingTop: 8,
                                            }}
                                        >
                                            <button
                                                type="submit"
                                                className="forgot-submit-btn"
                                                style={submitBtnBase}
                                            >
                                                Lanjut ke reset kata sandi
                                            </button>
                                        </div>
                                        <div
                                            style={{
                                                textAlign: "center",
                                                fontSize: "14px",
                                                color: "#666666",
                                                paddingTop: 4,
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStep("request")
                                                    setOtp("")
                                                    setNewPassword("")
                                                    setConfirmPassword("")
                                                    setError("")
                                                    setSuccess("")
                                                    setOtpSentMessage("")
                                                    setOtpError("")
                                                    setPasswordError("")
                                                }}
                                                style={linkStyle}
                                            >
                                                Kembali
                                            </button>
                                        </div>
                                    </form>
                                )}
                                {step === "reset" && (
                                    <form
                                        onSubmit={handleResetPassword}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "16px",
                                        }}
                                    >
                                        <p
                                            className="forgot-form-copy"
                                            style={{
                                                fontSize: "14px",
                                                color: "#666666",
                                                margin: "0 0 4px 0",
                                            }}
                                        >
                                            Masukkan password baru Anda.
                                        </p>
                                        <div>
                                            <input
                                                type="email"
                                                value={email}
                                                disabled
                                                readOnly
                                                className="forgot-input"
                                                style={inputDisabled}
                                            />
                                            {emailError ? (
                                                <p
                                                    style={{
                                                        color: "#ef4444",
                                                        fontSize: "12px",
                                                        margin: "4px 0 0 8px",
                                                    }}
                                                >
                                                    {emailError}
                                                </p>
                                            ) : null}
                                        </div>
                                        <div>
                                            <div
                                                className="forgot-phone-combo"
                                                style={{
                                                    display: "flex",
                                                    alignItems: "stretch",
                                                    width: "100%",
                                                    borderRadius: "70px",
                                                    overflow: "hidden",
                                                    border: "1px solid #d1d5db",
                                                    backgroundColor: "#f3f4f6",
                                                }}
                                            >
                                                <span
                                                    aria-hidden
                                                    style={{
                                                        flexShrink: 0,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 8,
                                                        paddingLeft: "16px",
                                                        paddingRight: "12px",
                                                        backgroundColor:
                                                            "#e5e7eb",
                                                        color: "#24252c",
                                                        fontSize: "14px",
                                                        fontWeight: 600,
                                                        borderRight:
                                                            "1px solid #d1d5db",
                                                    }}
                                                >
                                                    <svg
                                                        width={22}
                                                        height={15}
                                                        viewBox="0 0 22 15"
                                                        style={{
                                                            flexShrink: 0,
                                                            borderRadius: 2,
                                                            boxShadow:
                                                                "0 0 0 1px rgba(0,0,0,0.12)",
                                                        }}
                                                    >
                                                        <rect
                                                            width="22"
                                                            height="7.5"
                                                            fill="#E7000B"
                                                        />
                                                        <rect
                                                            y="7.5"
                                                            width="22"
                                                            height="7.5"
                                                            fill="#FFFFFF"
                                                        />
                                                    </svg>
                                                    +62
                                                </span>
                                                <input
                                                    type="tel"
                                                    value={phoneNationalDigits}
                                                    disabled
                                                    readOnly
                                                    className="forgot-input"
                                                    style={{
                                                        ...inputDisabled,
                                                        flex: 1,
                                                        minWidth: 0,
                                                        border: "none",
                                                        borderRadius: 0,
                                                        backgroundColor:
                                                            "#f3f4f6",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div
                                                style={{ position: "relative" }}
                                            >
                                                <input
                                                    type={
                                                        showPassword
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    id="forgot-new-password"
                                                    name="newPassword"
                                                    value={newPassword}
                                                    onChange={(e) => {
                                                        setNewPassword(
                                                            e.target.value
                                                        )
                                                        setPasswordError("")
                                                        setError("")
                                                    }}
                                                    onBlur={() =>
                                                        validatePassword(
                                                            newPassword
                                                        )
                                                    }
                                                    placeholder="Password Baru"
                                                    autoComplete="new-password"
                                                    className="forgot-input"
                                                    style={{
                                                        ...inputBase,
                                                        paddingRight: 48,
                                                        border: passwordError
                                                            ? "1px solid #ef4444"
                                                            : "1px solid #ffffff",
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPassword(
                                                            !showPassword
                                                        )
                                                    }
                                                    style={{
                                                        position: "absolute",
                                                        right: 12,
                                                        top: "50%",
                                                        transform:
                                                            "translateY(-50%)",
                                                        border: "none",
                                                        background:
                                                            "transparent",
                                                        color: "#666666",
                                                        cursor: "pointer",
                                                        padding: 4,
                                                        display: "flex",
                                                    }}
                                                    aria-label={
                                                        showPassword
                                                            ? "Sembunyikan password"
                                                            : "Tampilkan password"
                                                    }
                                                >
                                                    <svg
                                                        width={20}
                                                        height={20}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        {showPassword ? (
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                                            />
                                                        ) : (
                                                            <>
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                />
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                                />
                                                            </>
                                                        )}
                                                    </svg>
                                                </button>
                                            </div>
                                            {passwordError && (
                                                <p
                                                    style={{
                                                        color: "#ef4444",
                                                        fontSize: "12px",
                                                        margin: "4px 0 0 8px",
                                                    }}
                                                >
                                                    {passwordError}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <div
                                                style={{ position: "relative" }}
                                            >
                                                <input
                                                    type={
                                                        showConfirmPassword
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    id="forgot-confirm-password"
                                                    name="confirmPassword"
                                                    value={confirmPassword}
                                                    onChange={(e) => {
                                                        setConfirmPassword(
                                                            e.target.value
                                                        )
                                                        setPasswordError("")
                                                        setError("")
                                                    }}
                                                    placeholder="Konfirmasi Password"
                                                    autoComplete="new-password"
                                                    className="forgot-input"
                                                    style={{
                                                        ...inputBase,
                                                        paddingRight: 48,
                                                        border: passwordError
                                                            ? "1px solid #ef4444"
                                                            : "1px solid #ffffff",
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowConfirmPassword(
                                                            !showConfirmPassword
                                                        )
                                                    }
                                                    style={{
                                                        position: "absolute",
                                                        right: 12,
                                                        top: "50%",
                                                        transform:
                                                            "translateY(-50%)",
                                                        border: "none",
                                                        background:
                                                            "transparent",
                                                        color: "#666666",
                                                        cursor: "pointer",
                                                        padding: 4,
                                                        display: "flex",
                                                    }}
                                                    aria-label={
                                                        showConfirmPassword
                                                            ? "Sembunyikan konfirmasi"
                                                            : "Tampilkan konfirmasi"
                                                    }
                                                >
                                                    <svg
                                                        width={20}
                                                        height={20}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        {showConfirmPassword ? (
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                                            />
                                                        ) : (
                                                            <>
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                />
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                                />
                                                            </>
                                                        )}
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {error && (
                                            <div style={{ marginBottom: 4 }}>
                                                <p
                                                    style={{
                                                        color: "#ef4444",
                                                        fontSize: "14px",
                                                        paddingLeft: 8,
                                                        margin: 0,
                                                    }}
                                                >
                                                    {error}
                                                </p>
                                            </div>
                                        )}

                                        {success && (
                                            <div style={{ marginBottom: 4 }}>
                                                <p
                                                    style={{
                                                        color: "#16a34a",
                                                        fontSize: "14px",
                                                        paddingLeft: 8,
                                                        margin: 0,
                                                    }}
                                                >
                                                    {success}
                                                </p>
                                            </div>
                                        )}

                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "center",
                                                paddingTop: 8,
                                            }}
                                        >
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="forgot-submit-btn"
                                                style={{
                                                    ...submitBtnBase,
                                                    cursor: isSubmitting
                                                        ? "not-allowed"
                                                        : "pointer",
                                                    backgroundColor:
                                                        isSubmitting
                                                            ? "#d1d5db"
                                                            : "#2b2c24",
                                                    color: isSubmitting
                                                        ? "#9ca3af"
                                                        : "#ffffff",
                                                }}
                                            >
                                                {isSubmitting
                                                    ? "Mengatur ulang..."
                                                    : "Atur ulang kata sandi"}
                                            </button>
                                        </div>

                                        <div
                                            style={{
                                                textAlign: "center",
                                                fontSize: "14px",
                                                color: "#666666",
                                                paddingTop: 4,
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStep("otp")
                                                    setNewPassword("")
                                                    setConfirmPassword("")
                                                    setError("")
                                                    setSuccess("")
                                                    setPasswordError("")
                                                }}
                                                style={linkStyle}
                                            >
                                                Kembali
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                            <div
                                className="forgot-form-footer-wrap"
                                style={{
                                    width: "100%",
                                    position: "relative",
                                    zIndex: 10,
                                }}
                            >
                                <AuthPageFooter />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

ForgotPasswordClientArea.defaultProps = {
    checkSalesforceClientApiUrl: `${API_BASE}/auth/check-salesforce-client`,
    sendResetPasswordOtpApiUrl: `${API_BASE}/auth/send-reset-password-otp`,
    resetPasswordApiUrl: `${API_BASE}/auth/reset-password`,
    pageBgColor: "#69d7f6",
    logoUrl: "https://cdn2.triveinvest.co.id/assets/img/sca/logo.svg",
    homeUrl: `${BASE}/`,
    bubblesImageUrl:
        "https://cdn2.triveinvest.co.id/assets/img/sca/bubbles-small.png",
    loginUrl: `${BASE}/login`,
    whatsappUrl: "https://wa.me/628815921000",
    fullViewport: false,
}

addPropertyControls(ForgotPasswordClientArea, {
    checkSalesforceClientApiUrl: {
        type: ControlType.String,
        title: "POST check-salesforce-client",
        defaultValue: `${API_BASE}/auth/check-salesforce-client`,
        placeholder: "https://…/auth/check-salesforce-client",
    },
    sendResetPasswordOtpApiUrl: {
        type: ControlType.String,
        title: "POST send-reset-password-otp",
        defaultValue: `${API_BASE}/auth/send-reset-password-otp`,
        placeholder: "https://…/auth/send-reset-password-otp",
    },
    resetPasswordApiUrl: {
        type: ControlType.String,
        title: "POST reset-password",
        defaultValue: `${API_BASE}/auth/reset-password`,
        placeholder: "https://…/auth/reset-password",
    },
    pageBgColor: {
        type: ControlType.Color,
        title: "Page background",
        defaultValue: "#69d7f6",
    },
    logoUrl: {
        type: ControlType.String,
        title: "Logo URL",
        defaultValue: "https://cdn2.triveinvest.co.id/assets/img/sca/logo.svg",
    },
    homeUrl: {
        type: ControlType.String,
        title: "Home URL",
        defaultValue: `${BASE}/`,
    },
    bubblesImageUrl: {
        type: ControlType.String,
        title: "Bubbles image URL",
        defaultValue:
            "https://cdn2.triveinvest.co.id/assets/img/sca/bubbles-small.png",
    },
    loginUrl: {
        type: ControlType.String,
        title: "After reset → login",
        defaultValue: `${BASE}/login`,
    },
    whatsappUrl: {
        type: ControlType.String,
        title: "WhatsApp button URL (empty = hide)",
        defaultValue: "https://wa.me/628815921000",
        placeholder: "https://wa.me/…",
    },
    fullViewport: {
        type: ControlType.Boolean,
        title: "Full viewport height (100vh)",
        defaultValue: false,
        enabledTitle: "100vh",
        disabledTitle: "Fill frame",
    },
})

export default ForgotPasswordClientArea
