import * as React from "react"
// Host Framer menyediakan modul ini di Code Component (tidak ada di Next.js).
// @ts-expect-error — types tidak terpasang di repo ini
import { addPropertyControls, ControlType, RenderTarget } from "framer"
import { AuthPageFooter } from "./AuthPageFooter.tsx"

interface RegisterSuccessResponse {
    token?: string
    error?: string
    message?: string
}

type RegisterClientAreaProps = {
    registerApiUrl?: string
    sendVerificationCodeApiUrl?: string
    accentColor?: string
    pageBgColor?: string
    logoUrl?: string
    homeUrl?: string
    bubblesImageUrl?: string
    loginUrl?: string
    accountsUrl?: string
    whatsappUrl?: string
    privacyPolicyUrl?: string
    termsOfBusinessUrl?: string
    redirectIfAlreadyLoggedIn?: boolean
    fullViewport?: boolean
}

const BASE = "https://www.triveinvest.co.id/sca"
const API_BASE = "https://api.trive.co.id/api"

function normalizePhoneNumber(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/\D/g, "")
    if (cleaned.startsWith("0")) {
        cleaned = cleaned.substring(1)
    } else if (cleaned.startsWith("62")) {
        cleaned = cleaned.substring(2)
    }
    return cleaned
}

function RegisterClientArea(props: RegisterClientAreaProps) {
    const {
        registerApiUrl = `${API_BASE}/auth/register`,
        sendVerificationCodeApiUrl = `${API_BASE}/auth/send-verification-code`,
        accentColor = "#69d7f6",
        pageBgColor = "#69d7f6",
        logoUrl = "https://cdn2.triveinvest.co.id/assets/img/sca/logo.svg",
        homeUrl = `${BASE}/`,
        bubblesImageUrl = "https://cdn2.triveinvest.co.id/assets/img/sca/bubbles-small.png",
        loginUrl = `${BASE}/login`,
        accountsUrl = `${BASE}/accounts`,
        whatsappUrl = "https://wa.me/628815921000",
        privacyPolicyUrl = "https://cdn2.triveinvest.co.id/pdf/legalitas/Privacy-Policy.pdf",
        termsOfBusinessUrl = "https://cdn2.triveinvest.co.id/pdf/legalitas/Terms_of_Business.pdf",
        redirectIfAlreadyLoggedIn = true,
        fullViewport = false,
    } = props

    const [name, setName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [countryCode, setCountryCode] = React.useState("+62")
    const [phone, setPhone] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [confirmPassword, setConfirmPassword] = React.useState("")
    const [referralCode, setReferralCode] = React.useState("")
    const [verificationCode, setVerificationCode] = React.useState("")
    const [marketingConsent, setMarketingConsent] = React.useState(true)
    const [termsConsent, setTermsConsent] = React.useState(true)
    const [marketingError, setMarketingError] = React.useState(false)
    const [termsError, setTermsError] = React.useState(false)
    const [nameError, setNameError] = React.useState("")
    const [emailError, setEmailError] = React.useState("")
    const [phoneError, setPhoneError] = React.useState("")
    const [verificationCodeError, setVerificationCodeError] = React.useState("")
    const [passwordError, setPasswordError] = React.useState("")
    const [confirmPasswordError, setConfirmPasswordError] = React.useState("")
    const [showPassword, setShowPassword] = React.useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
    const [isCodeSent, setIsCodeSent] = React.useState(false)
    const [resendCountdown, setResendCountdown] = React.useState(0)
    const [isSendingCode, setIsSendingCode] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [submitError, setSubmitError] = React.useState("")
    const [sendCodeError, setSendCodeError] = React.useState("")

    React.useEffect(() => {
        if (resendCountdown > 0) {
            const timer = setTimeout(() => {
                setResendCountdown(resendCountdown - 1)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [resendCountdown])

    React.useEffect(() => {
        if (!redirectIfAlreadyLoggedIn || typeof window === "undefined") return
        const rt = RenderTarget.current()
        if (
            rt === RenderTarget.canvas ||
            rt === RenderTarget.export ||
            rt === RenderTarget.thumbnail
        ) {
            return
        }
        const token = localStorage.getItem("token")
        if (token) {
            window.location.href = accountsUrl
        }
    }, [accountsUrl, redirectIfAlreadyLoggedIn])

    const getNormalizedPhone = (): string => normalizePhoneNumber(phone)

    const validateName = (nameValue: string): boolean => {
        if (!nameValue.trim()) {
            setNameError("Nama lengkap diperlukan")
            return false
        }
        if (nameValue.trim().length < 2) {
            setNameError("Nama lengkap minimal 2 karakter")
            return false
        }
        setNameError("")
        return true
    }

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
        const normalized = normalizePhoneNumber(phoneValue)
        if (!normalized || normalized.trim() === "") {
            setPhoneError("Nomor telepon diperlukan")
            return false
        }
        if (normalized.length < 9 || normalized.length > 13) {
            setPhoneError("Nomor telepon harus 9-13 digit")
            return false
        }
        setPhoneError("")
        return true
    }

    const validateVerificationCode = (codeValue: string): boolean => {
        if (!codeValue.trim()) {
            setVerificationCodeError("Kode verifikasi diperlukan")
            return false
        }
        if (codeValue.trim().length < 4) {
            setVerificationCodeError("Kode verifikasi minimal 4 karakter")
            return false
        }
        setVerificationCodeError("")
        return true
    }

    const validatePassword = (passwordValue: string): boolean => {
        if (!passwordValue.trim()) {
            setPasswordError("Kata sandi diperlukan")
            return false
        }
        if (passwordValue.length < 8 || passwordValue.length > 15) {
            setPasswordError("Kata sandi harus terdiri dari 8-15 karakter")
            return false
        }
        const hasLowerCase = /[a-z]/.test(passwordValue)
        const hasUpperCase = /[A-Z]/.test(passwordValue)
        const hasNumber = /\d/.test(passwordValue)
        if (!hasLowerCase || !hasUpperCase || !hasNumber) {
            setPasswordError(
                "Kata sandi harus berisi huruf kecil, huruf besar, dan angka"
            )
            return false
        }
        setPasswordError("")
        return true
    }

    const validateConfirmPassword = (
        confirmPasswordValue: string,
        pwd: string
    ): boolean => {
        if (!confirmPasswordValue.trim()) {
            setConfirmPasswordError("Konfirmasi kata sandi diperlukan")
            return false
        }
        if (confirmPasswordValue !== pwd) {
            setConfirmPasswordError("Kata sandi tidak cocok")
            return false
        }
        setConfirmPasswordError("")
        return true
    }

    const getVerificationButtonText = () => {
        if (isSendingCode) return "Mengirim..."
        if (resendCountdown > 0) return `Kirim Ulang (${resendCountdown}s)`
        if (isCodeSent) return "Kirim Ulang"
        return "Kirim Kode"
    }

    const handleSendVerificationCode = async () => {
        setSendCodeError("")
        const normalizedPhone = getNormalizedPhone()
        if (!normalizedPhone || normalizedPhone.trim() === "") {
            setSendCodeError("Mohon isi nomor telepon terlebih dahulu")
            setPhoneError("Nomor telepon diperlukan")
            return
        }
        if (normalizedPhone.length < 9 || normalizedPhone.length > 13) {
            setSendCodeError(
                "Nomor telepon tidak valid. Mohon masukkan nomor yang benar."
            )
            validatePhone(phone)
            return
        }

        setIsSendingCode(true)
        try {
            const response = await fetch(sendVerificationCodeApiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, countryCode }),
            })
            const data = await response.json()
            if (!response.ok) {
                setSendCodeError(
                    data.error ||
                        "Gagal mengirim kode verifikasi. Silakan coba lagi."
                )
                return
            }
            setIsCodeSent(true)
            setResendCountdown(60)
            if (data.code && typeof console !== "undefined") {
                console.log("Verification code (dev only):", data.code)
            }
        } catch (err) {
            console.error("Error sending verification code:", err)
            setSendCodeError(
                "Gagal mengirim kode verifikasi. Silakan coba lagi."
            )
        } finally {
            setIsSendingCode(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitError("")

        const isNameValid = validateName(name)
        const isEmailValid = validateEmail(email)
        const isPhoneValid = validatePhone(phone)
        const isVerificationCodeValid =
            validateVerificationCode(verificationCode)
        const isPasswordValid = validatePassword(password)
        const isConfirmPasswordValid = validateConfirmPassword(
            confirmPassword,
            password
        )

        if (!marketingConsent) {
            setMarketingError(true)
        } else {
            setMarketingError(false)
        }
        if (!termsConsent) {
            setTermsError(true)
        } else {
            setTermsError(false)
        }

        if (
            !isNameValid ||
            !isEmailValid ||
            !isPhoneValid ||
            !isVerificationCodeValid ||
            !isPasswordValid ||
            !isConfirmPasswordValid ||
            !marketingConsent ||
            !termsConsent
        ) {
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch(registerApiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    phone,
                    countryCode,
                    password,
                    verificationCode: verificationCode.trim(),
                    referralCode: referralCode.trim() || null,
                    marketingConsent,
                    termsConsent,
                }),
            })
            const data: RegisterSuccessResponse = await response.json()
            if (!response.ok) {
                setSubmitError(
                    data.error ||
                        "Terjadi kesalahan saat registrasi. Silakan coba lagi."
                )
                return
            }
            if (data.token && typeof window !== "undefined") {
                localStorage.setItem("token", data.token)
            }
            window.location.href = accountsUrl
        } catch (error) {
            console.error("Registration error:", error)
            setSubmitError(
                "Terjadi kesalahan saat registrasi. Silakan coba lagi."
            )
        } finally {
            setIsSubmitting(false)
        }
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

    const linkStyle: React.CSSProperties = {
        fontSize: "14px",
        color: "#2563eb",
        fontWeight: 600,
        textDecoration: "underline",
    }

    const rootLayout: React.CSSProperties = fullViewport
        ? { minHeight: "100vh", width: "100%" }
        : {
              width: "100%",
              maxWidth: "100%",
              minHeight: "100%",
              height: "100%",
              flex: "1 1 auto",
              alignSelf: "stretch",
          }

    const eyePaths = (visible: boolean) =>
        visible ? (
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
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
            </>
        )

    return (
        <div
            className="register-client-area-root"
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
                .register-client-area-root,
                .register-client-area-root * {
                    box-sizing: border-box;
                }
                @media (max-width: 1023px) {
                    .register-col-layout { flex-direction: column !important; }
                    .register-left-col { width: 100% !important; max-width: 100% !important; }
                    .register-right-col { width: 100% !important; max-width: 100% !important; }
                    .register-left-col { padding: 40px 28px 24px !important; }
                    .register-right-col { padding: 20px 20px 40px !important; }
                    .register-card { padding: 48px 40px !important; }
                    .register-main-heading { font-size: 2rem !important; margin-bottom: 16px !important; }
                    .register-main-copy { font-size: 16px !important; line-height: 1.5 !important; }
                    .register-form-title { font-size: 1.9rem !important; margin-bottom: 20px !important; }
                    .register-card input { height: 50px !important; font-size: 14px !important; }
                    .register-verify-row { flex-wrap: wrap !important; }
                    .register-verify-btn { flex: 1 1 auto !important; min-width: 0 !important; }
                    .register-submit-wrap { width: 100% !important; }
                    .register-submit-btn { width: 100% !important; }
                    .register-submit-btn { min-height: 48px !important; min-width: 100% !important; }
                    .register-bubbles-wrap { width: 90px !important; height: 80px !important; }
                    .register-wa-btn { bottom: 20px !important; right: 20px !important; padding: 14px !important; }
                }
                @media (max-width: 767px) {
                    .register-left-col { padding: 28px 16px 18px !important; }
                    .register-right-col { padding: 14px 12px 28px !important; }
                    .register-card { padding: 34px 18px !important; border-radius: 12px !important; }
                    .register-main-heading { font-size: 1.6rem !important; line-height: 1.25 !important; margin-bottom: 12px !important; }
                    .register-main-copy { font-size: 14px !important; line-height: 1.45 !important; }
                    .register-form-title { font-size: 1.55rem !important; margin-bottom: 16px !important; }
                    .register-card input { height: 48px !important; padding-left: 18px !important; padding-right: 18px !important; }
                    .register-submit-btn { font-size: 14px !important; padding: 14px 20px 12px !important; }
                    .register-wa-btn { bottom: 14px !important; right: 14px !important; padding: 12px !important; }
                }
                .register-submit-btn:not(:disabled) {
                    transition: transform 0.12s ease, background-color 0.12s ease;
                }
                .register-submit-btn:not(:disabled):hover {
                    transform: scale(1.02);
                }
                .register-submit-btn:not(:disabled):active {
                    transform: scale(0.98);
                }
                .register-form-footer-wrap { margin-top: 16px; }
                @media (min-width: 640px) {
                    .register-form-footer-wrap { margin-top: 24px; }
                    .register-wa-chat-label { display: inline-block !important; }
                }
            `}</style>

            {whatsappUrl ? (
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chat dengan WhatsApp"
                    className="register-wa-btn"
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
                        className="register-wa-chat-label"
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
                    className="register-col-layout"
                    style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "row",
                        flex: 1,
                    }}
                >
                    <div
                        className="register-left-col"
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
                                className="register-main-heading"
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
                                className="register-main-copy"
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
                        className="register-right-col"
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
                            className="register-bubbles-wrap"
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
                                className="register-card"
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
                                    className="register-form-title"
                                    style={{
                                        fontSize: "2.25rem",
                                        fontWeight: 500,
                                        color: "#000000",
                                        margin: "0 0 24px 0",
                                    }}
                                >
                                    Buka akun
                                </h2>
                                <form
                                    onSubmit={handleSubmit}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "16px",
                                    }}
                                >
                                    <div>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={name}
                                            onChange={(e) => {
                                                setName(e.target.value)
                                                setSubmitError("")
                                                if (nameError)
                                                    validateName(e.target.value)
                                            }}
                                            onBlur={() => validateName(name)}
                                            placeholder="Nama lengkap"
                                            style={{
                                                ...inputBase,
                                                border: nameError
                                                    ? "1px solid #ef4444"
                                                    : "1px solid #ffffff",
                                            }}
                                        />
                                        {nameError && (
                                            <p
                                                style={{
                                                    color: "#ef4444",
                                                    fontSize: "14px",
                                                    margin: "4px 0 0 8px",
                                                }}
                                            >
                                                {nameError}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value)
                                                setSubmitError("")
                                                if (emailError)
                                                    validateEmail(
                                                        e.target.value
                                                    )
                                            }}
                                            onBlur={() => validateEmail(email)}
                                            placeholder="Email"
                                            autoComplete="email"
                                            style={{
                                                ...inputBase,
                                                border: emailError
                                                    ? "1px solid #ef4444"
                                                    : "1px solid #ffffff",
                                            }}
                                        />
                                        {emailError && (
                                            <p
                                                style={{
                                                    color: "#ef4444",
                                                    fontSize: "14px",
                                                    margin: "4px 0 0 8px",
                                                }}
                                            >
                                                {emailError}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "row",
                                                gap: 8,
                                                minWidth: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: "relative",
                                                    flexShrink: 0,
                                                    minWidth: 100,
                                                    width: "auto",
                                                }}
                                            >
                                                <select
                                                    id="countryCode"
                                                    name="countryCode"
                                                    value={countryCode}
                                                    onChange={(e) =>
                                                        setCountryCode(
                                                            e.target.value
                                                        )
                                                    }
                                                    style={{
                                                        width: "100%",
                                                        backgroundColor:
                                                            "#ffffff",
                                                        border: "1px solid #ffffff",
                                                        borderRadius: "70px",
                                                        color: "#24252c",
                                                        fontSize: "14px",
                                                        height: "53px",
                                                        paddingLeft: 36,
                                                        paddingRight: 28,
                                                        outline: "none",
                                                        cursor: "pointer",
                                                        appearance: "none",
                                                        WebkitAppearance:
                                                            "none",
                                                    }}
                                                >
                                                    <option value="+62">
                                                        +62
                                                    </option>
                                                </select>
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        left: 10,
                                                        top: "50%",
                                                        transform:
                                                            "translateY(-50%)",
                                                        pointerEvents: "none",
                                                        width: 20,
                                                        height: 14,
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        borderRadius: 2,
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            flex: 1,
                                                            backgroundColor:
                                                                "#dc2626",
                                                        }}
                                                    />
                                                    <div
                                                        style={{
                                                            flex: 1,
                                                            backgroundColor:
                                                                "#ffffff",
                                                        }}
                                                    />
                                                </div>
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        right: 10,
                                                        top: "50%",
                                                        transform:
                                                            "translateY(-50%)",
                                                        pointerEvents: "none",
                                                        color: "#666666",
                                                    }}
                                                >
                                                    <svg
                                                        width={16}
                                                        height={16}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 9l-7 7-7-7"
                                                        />
                                                    </svg>
                                                </div>
                                            </div>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                value={phone}
                                                onChange={(e) => {
                                                    const v =
                                                        e.target.value.replace(
                                                            /\D/g,
                                                            ""
                                                        )
                                                    setPhone(v)
                                                    setSubmitError("")
                                                    setSendCodeError("")
                                                    if (phoneError)
                                                        validatePhone(v)
                                                }}
                                                onBlur={() =>
                                                    validatePhone(phone)
                                                }
                                                placeholder="Ponsel"
                                                autoComplete="tel"
                                                style={{
                                                    ...inputBase,
                                                    flex: 1,
                                                    minWidth: 0,
                                                    border: phoneError
                                                        ? "1px solid #ef4444"
                                                        : "1px solid #ffffff",
                                                }}
                                            />
                                        </div>
                                        {phoneError && (
                                            <p
                                                style={{
                                                    color: "#ef4444",
                                                    fontSize: "14px",
                                                    margin: "4px 0 0 8px",
                                                }}
                                            >
                                                {phoneError}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <div
                                            className="register-verify-row"
                                            style={{
                                                display: "flex",
                                                flexDirection: "row",
                                                gap: 8,
                                                minWidth: 0,
                                                alignItems: "stretch",
                                            }}
                                        >
                                            <input
                                                type="text"
                                                id="verificationCode"
                                                name="verificationCode"
                                                value={verificationCode}
                                                onChange={(e) => {
                                                    setVerificationCode(
                                                        e.target.value
                                                    )
                                                    setSubmitError("")
                                                    if (verificationCodeError) {
                                                        validateVerificationCode(
                                                            e.target.value
                                                        )
                                                    }
                                                }}
                                                onBlur={() =>
                                                    validateVerificationCode(
                                                        verificationCode
                                                    )
                                                }
                                                placeholder="Kode verifikasi"
                                                autoComplete="one-time-code"
                                                style={{
                                                    ...inputBase,
                                                    flex: 1,
                                                    minWidth: 0,
                                                    border: verificationCodeError
                                                        ? "1px solid #ef4444"
                                                        : "1px solid #ffffff",
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="register-verify-btn"
                                                onClick={
                                                    handleSendVerificationCode
                                                }
                                                disabled={
                                                    resendCountdown > 0 ||
                                                    isSendingCode ||
                                                    !phone
                                                }
                                                style={{
                                                    flexShrink: 0,
                                                    backgroundColor:
                                                        resendCountdown > 0 ||
                                                        isSendingCode ||
                                                        !phone
                                                            ? "#d1d5db"
                                                            : "#24252c",
                                                    color:
                                                        resendCountdown > 0 ||
                                                        isSendingCode ||
                                                        !phone
                                                            ? "#9ca3af"
                                                            : "#ffffff",
                                                    fontSize: "13px",
                                                    fontWeight: 500,
                                                    borderRadius: "70px",
                                                    border: "none",
                                                    padding: "0 16px",
                                                    height: "53px",
                                                    whiteSpace: "nowrap",
                                                    cursor:
                                                        resendCountdown > 0 ||
                                                        isSendingCode ||
                                                        !phone
                                                            ? "not-allowed"
                                                            : "pointer",
                                                }}
                                            >
                                                {getVerificationButtonText()}
                                            </button>
                                        </div>
                                        {sendCodeError && (
                                            <p
                                                style={{
                                                    color: "#ef4444",
                                                    fontSize: "12px",
                                                    margin: "4px 0 0 8px",
                                                }}
                                            >
                                                {sendCodeError}
                                            </p>
                                        )}
                                        {verificationCodeError && (
                                            <p
                                                style={{
                                                    color: "#ef4444",
                                                    fontSize: "14px",
                                                    margin: "4px 0 0 8px",
                                                }}
                                            >
                                                {verificationCodeError}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <div style={{ position: "relative" }}>
                                            <input
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                id="password"
                                                name="password"
                                                value={password}
                                                onChange={(e) => {
                                                    setPassword(e.target.value)
                                                    setSubmitError("")
                                                    if (passwordError)
                                                        validatePassword(
                                                            e.target.value
                                                        )
                                                    if (
                                                        confirmPassword &&
                                                        confirmPasswordError
                                                    ) {
                                                        validateConfirmPassword(
                                                            confirmPassword,
                                                            e.target.value
                                                        )
                                                    }
                                                }}
                                                onBlur={() =>
                                                    validatePassword(password)
                                                }
                                                placeholder="Kata sandi"
                                                autoComplete="new-password"
                                                style={{
                                                    ...inputBase,
                                                    paddingRight: 52,
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
                                                    background: "transparent",
                                                    color: "#666666",
                                                    cursor: "pointer",
                                                    padding: 4,
                                                    display: "flex",
                                                }}
                                                aria-label={
                                                    showPassword
                                                        ? "Sembunyikan kata sandi"
                                                        : "Tampilkan kata sandi"
                                                }
                                            >
                                                <svg
                                                    width={20}
                                                    height={20}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    {eyePaths(showPassword)}
                                                </svg>
                                            </button>
                                        </div>
                                        {passwordError && (
                                            <p
                                                style={{
                                                    color: "#ef4444",
                                                    fontSize: "14px",
                                                    margin: "4px 0 0 8px",
                                                }}
                                            >
                                                {passwordError}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <div style={{ position: "relative" }}>
                                            <input
                                                type={
                                                    showConfirmPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                value={confirmPassword}
                                                onChange={(e) => {
                                                    setConfirmPassword(
                                                        e.target.value
                                                    )
                                                    setSubmitError("")
                                                    if (confirmPasswordError) {
                                                        validateConfirmPassword(
                                                            e.target.value,
                                                            password
                                                        )
                                                    }
                                                }}
                                                onBlur={() =>
                                                    validateConfirmPassword(
                                                        confirmPassword,
                                                        password
                                                    )
                                                }
                                                placeholder="Konfirmasi kata sandi"
                                                autoComplete="new-password"
                                                style={{
                                                    ...inputBase,
                                                    paddingRight: 52,
                                                    border: confirmPasswordError
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
                                                    background: "transparent",
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
                                                    {eyePaths(
                                                        showConfirmPassword
                                                    )}
                                                </svg>
                                            </button>
                                        </div>
                                        {confirmPasswordError && (
                                            <p
                                                style={{
                                                    color: "#ef4444",
                                                    fontSize: "14px",
                                                    margin: "4px 0 0 8px",
                                                }}
                                            >
                                                {confirmPasswordError}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <input
                                            type="text"
                                            id="referralCode"
                                            name="referralCode"
                                            value={referralCode}
                                            onChange={(e) =>
                                                setReferralCode(e.target.value)
                                            }
                                            placeholder="Kode Referral"
                                            style={inputBase}
                                        />
                                    </div>

                                    <div>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: 8,
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                id="marketingConsent"
                                                name="marketingConsent"
                                                checked={marketingConsent}
                                                onChange={(e) => {
                                                    const c = e.target.checked
                                                    setMarketingConsent(c)
                                                    setMarketingError(!c)
                                                }}
                                                style={{
                                                    width: 16,
                                                    height: 16,
                                                    marginTop: 2,
                                                    accentColor: accentColor,
                                                    cursor: "pointer",
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <label
                                                htmlFor="marketingConsent"
                                                style={{
                                                    fontSize: "13px",
                                                    color: "#666666",
                                                    cursor: "pointer",
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                Saya mengkonfirmasi dan
                                                memberikan izin kepada Trive
                                                Invest untuk menghubungi saya
                                                melalui telepon, email, SMS, dan
                                                WhatsApp untuk keperluan
                                                pemasaran. Saya memahami bahwa
                                                saya dapat memilih untuk tidak
                                                menerima komunikasi pemasaran
                                                setelah mengirimkan aplikasi
                                                saya atau pada setiap tahap
                                                selama hubungan bisnis saya
                                                dengan Trive Invest.
                                            </label>
                                        </div>
                                        {marketingError && (
                                            <p
                                                style={{
                                                    color: "#dc2626",
                                                    fontSize: "14px",
                                                    margin: "4px 0 0 24px",
                                                }}
                                            >
                                                Bidang harus dicentang
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: 8,
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                id="termsConsent"
                                                name="termsConsent"
                                                checked={termsConsent}
                                                onChange={(e) => {
                                                    const c = e.target.checked
                                                    setTermsConsent(c)
                                                    setTermsError(!c)
                                                }}
                                                style={{
                                                    width: 16,
                                                    height: 16,
                                                    marginTop: 2,
                                                    accentColor: accentColor,
                                                    cursor: "pointer",
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <label
                                                htmlFor="termsConsent"
                                                style={{
                                                    fontSize: "13px",
                                                    color: "#666666",
                                                    cursor: "pointer",
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                Saya mengonfirmasi bahwa saya
                                                telah membaca dan memahami{" "}
                                                <a
                                                    href={privacyPolicyUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        color: "#000000",
                                                        fontWeight: 600,
                                                        textDecoration:
                                                            "underline",
                                                    }}
                                                >
                                                    Privacy Policy
                                                </a>
                                                ,{" "}
                                                <a
                                                    href={termsOfBusinessUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        color: "#000000",
                                                        fontWeight: 600,
                                                        textDecoration:
                                                            "underline",
                                                    }}
                                                >
                                                    Ketentuan Bisnis
                                                </a>
                                            </label>
                                        </div>
                                        {termsError && (
                                            <p
                                                style={{
                                                    color: "#dc2626",
                                                    fontSize: "14px",
                                                    margin: "4px 0 0 24px",
                                                }}
                                            >
                                                Bidang harus dicentang
                                            </p>
                                        )}
                                    </div>

                                    {submitError && (
                                        <div style={{ marginBottom: 4 }}>
                                            <p
                                                style={{
                                                    color: "#ef4444",
                                                    fontSize: "12px",
                                                    paddingLeft: 8,
                                                    margin: 0,
                                                }}
                                            >
                                                {submitError}
                                            </p>
                                        </div>
                                    )}

                                    <div
                                        className="register-submit-wrap"
                                        style={{
                                            display: "flex",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="register-submit-btn"
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                backgroundColor: isSubmitting
                                                    ? "#d1d5db"
                                                    : accentColor,
                                                color: isSubmitting
                                                    ? "#9ca3af"
                                                    : "#2b2c24",
                                                border: "none",
                                                borderRadius: "65px",
                                                fontSize: "15px",
                                                fontWeight: 500,
                                                minWidth: 217,
                                                padding: "16px 25px 13px",
                                                cursor: isSubmitting
                                                    ? "not-allowed"
                                                    : "pointer",
                                            }}
                                        >
                                            {isSubmitting
                                                ? "Mendaftar..."
                                                : "Daftar"}
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
                                        Sudah punya akun?{" "}
                                        <a href={loginUrl} style={linkStyle}>
                                            Masuk
                                        </a>
                                    </div>
                                </form>
                            </div>
                            <div
                                className="register-form-footer-wrap"
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

RegisterClientArea.defaultProps = {
    registerApiUrl: `${API_BASE}/auth/register`,
    sendVerificationCodeApiUrl: `${API_BASE}/auth/send-verification-code`,
    accentColor: "#69d7f6",
    pageBgColor: "#69d7f6",
    logoUrl: "https://cdn2.triveinvest.co.id/assets/img/sca/logo.svg",
    homeUrl: `${BASE}/`,
    bubblesImageUrl:
        "https://cdn2.triveinvest.co.id/assets/img/sca/bubbles-small.png",
    loginUrl: `${BASE}/login`,
    accountsUrl: `${BASE}/accounts`,
    whatsappUrl: "https://wa.me/628815921000",
    privacyPolicyUrl:
        "https://cdn2.triveinvest.co.id/pdf/legalitas/Privacy-Policy.pdf",
    termsOfBusinessUrl:
        "https://cdn2.triveinvest.co.id/pdf/legalitas/Terms_of_Business.pdf",
    redirectIfAlreadyLoggedIn: true,
    fullViewport: false,
}

addPropertyControls(RegisterClientArea, {
    registerApiUrl: {
        type: ControlType.String,
        title: "Register API URL",
        defaultValue: `${API_BASE}/auth/register`,
        placeholder: "https://…/api/auth/register",
    },
    sendVerificationCodeApiUrl: {
        type: ControlType.String,
        title: "Send OTP API URL",
        defaultValue: `${API_BASE}/auth/send-verification-code`,
        placeholder: "https://…/api/auth/send-verification-code",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#69d7f6",
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
        title: "Login page URL",
        defaultValue: `${BASE}/login`,
    },
    accountsUrl: {
        type: ControlType.String,
        title: "After register redirect",
        defaultValue: `${BASE}/accounts`,
    },
    whatsappUrl: {
        type: ControlType.String,
        title: "WhatsApp button URL (empty = hide)",
        defaultValue: "https://wa.me/628815921000",
        placeholder: "https://wa.me/…",
    },
    privacyPolicyUrl: {
        type: ControlType.String,
        title: "Privacy Policy URL",
        defaultValue:
            "https://cdn2.triveinvest.co.id/pdf/legalitas/Privacy-Policy.pdf",
    },
    termsOfBusinessUrl: {
        type: ControlType.String,
        title: "Terms of Business URL",
        defaultValue:
            "https://cdn2.triveinvest.co.id/pdf/legalitas/Terms_of_Business.pdf",
    },
    redirectIfAlreadyLoggedIn: {
        type: ControlType.Boolean,
        title: "Redirect if already logged in",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    fullViewport: {
        type: ControlType.Boolean,
        title: "Full viewport height (100vh)",
        defaultValue: false,
        enabledTitle: "100vh",
        disabledTitle: "Fill frame",
    },
})

export default RegisterClientArea
