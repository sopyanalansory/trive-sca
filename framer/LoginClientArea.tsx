import * as React from "react"
// Host Framer menyediakan modul ini di Code Component (tidak ada di Next.js).
// @ts-expect-error — types tidak terpasang di repo ini
import { addPropertyControls, ControlType, RenderTarget } from "framer"
import { AuthPageFooter } from "./AuthPageFooter.tsx"

const API_BASE = "https://api.trive.co.id/api"
const BASE = "https://www.triveinvest.co.id/sca"

// Response shape dari /api/auth/login (sesuaikan jika backend berbeda)
interface LoginSuccessResponse {
    token?: string
    error?: string
    errorType?: string
    email?: string
}

type LoginClientAreaProps = {
    loginApiUrl?: string
    accentColor?: string
    pageBgColor?: string
    logoUrl?: string
    homeUrl?: string
    bubblesImageUrl?: string
    registerUrl?: string
    forgotPasswordUrl?: string
    accountsUrl?: string
    redirectIfAlreadyLoggedIn?: boolean
    fullViewport?: boolean
}

function LoginClientArea(props: LoginClientAreaProps) {
    const {
        loginApiUrl = `${API_BASE}/auth/login`,
        accentColor = "#69d7f6",
        pageBgColor = "#69d7f6",
        logoUrl = "https://cdn2.triveinvest.co.id/assets/img/sca/logo.svg",
        homeUrl = `${BASE}/`,
        bubblesImageUrl = "https://cdn2.triveinvest.co.id/assets/img/sca/bubbles-small.png",
        registerUrl = `${BASE}/register`,
        forgotPasswordUrl = `${BASE}/forgot-password`,
        accountsUrl = `${BASE}/accounts`,
        redirectIfAlreadyLoggedIn = true,
        fullViewport = false,
    } = props

    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [rememberMe, setRememberMe] = React.useState(false)
    const [showPassword, setShowPassword] = React.useState(false)
    const [emailError, setEmailError] = React.useState("")
    const [passwordError, setPasswordError] = React.useState("")
    const [loginError, setLoginError] = React.useState("")
    const [showPasswordTooltip, setShowPasswordTooltip] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [showResetPasswordOption, setShowResetPasswordOption] =
        React.useState(false)

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

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const savedEmail = localStorage.getItem("rememberedEmail")
        if (savedEmail) {
            setEmail(savedEmail)
            setRememberMe(true)
        }
    }, [])

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

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value)
        setLoginError("")
        if (emailError) validateEmail(e.target.value)
    }

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value)
        setLoginError("")
        if (passwordError) validatePassword(e.target.value)
    }

    const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked
        setRememberMe(isChecked)
        if (!isChecked && typeof window !== "undefined") {
            localStorage.removeItem("rememberedEmail")
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const isEmailValid = validateEmail(email)
        const isPasswordValid = validatePassword(password)
        if (!isEmailValid || !isPasswordValid) return

        setLoginError("")
        setIsSubmitting(true)

        try {
            const response = await fetch(loginApiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password: password,
                }),
            })

            const data: LoginSuccessResponse = await response.json()

            if (!response.ok) {
                setLoginError(
                    data.error ||
                        "Terjadi kesalahan saat login. Silakan coba lagi."
                )
                if (data.errorType === "wrong_password" && data.email) {
                    setShowResetPasswordOption(true)
                } else {
                    setShowResetPasswordOption(false)
                }
                return
            }

            setShowResetPasswordOption(false)

            if (data.token && typeof window !== "undefined") {
                localStorage.setItem("token", data.token)
            }

            if (rememberMe && typeof window !== "undefined") {
                localStorage.setItem("rememberedEmail", email)
            } else if (typeof window !== "undefined") {
                localStorage.removeItem("rememberedEmail")
            }

            window.location.href = accountsUrl
        } catch (error) {
            console.error("Login error:", error)
            setLoginError("Terjadi kesalahan saat login. Silakan coba lagi.")
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
            className="login-client-area-root"
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
                .login-client-area-root,
                .login-client-area-root * {
                    box-sizing: border-box;
                }
                @media (max-width: 1023px) {
                    .login-col-layout { flex-direction: column !important; }
                    .login-left-col { width: 100% !important; max-width: 100% !important; }
                    .login-right-col { width: 100% !important; max-width: 100% !important; }
                    .login-left-col { padding: 40px 28px 24px !important; }
                    .login-right-col { padding: 20px 20px 40px !important; }
                    .login-card { padding: 48px 40px !important; }
                    .login-main-heading { font-size: 2rem !important; margin-bottom: 16px !important; }
                    .login-main-copy { font-size: 16px !important; line-height: 1.5 !important; }
                    .login-form-title { font-size: 1.9rem !important; margin-bottom: 20px !important; }
                    .login-card input { height: 50px !important; font-size: 14px !important; }
                    .login-remember-row { flex-direction: column !important; align-items: stretch !important; }
                    .login-remember-row { gap: 12px !important; }
                    .login-submit-btn { width: 100% !important; }
                    .login-submit-btn { min-height: 48px !important; min-width: 100% !important; }
                    .login-mobile-forgot { display: inline !important; }
                    .login-bubbles-wrap { width: 90px !important; height: 80px !important; }
                }
                @media (max-width: 767px) {
                    .login-left-col { padding: 28px 16px 18px !important; }
                    .login-right-col { padding: 14px 12px 28px !important; }
                    .login-card { padding: 34px 18px !important; border-radius: 12px !important; }
                    .login-main-heading { font-size: 1.6rem !important; line-height: 1.25 !important; margin-bottom: 12px !important; }
                    .login-main-copy { font-size: 14px !important; line-height: 1.45 !important; }
                    .login-form-title { font-size: 1.55rem !important; margin-bottom: 16px !important; }
                    .login-card input { height: 48px !important; padding-left: 18px !important; padding-right: 18px !important; }
                    .login-submit-btn { font-size: 14px !important; padding: 14px 20px 12px !important; }
                }
                @media (min-width: 1024px) {
                    .login-mobile-forgot { display: none !important; }
                }
                .login-form-footer-wrap { margin-top: 16px; }
                @media (min-width: 640px) {
                    .login-form-footer-wrap { margin-top: 24px; }
                }
                .login-submit-btn:not(:disabled) {
                    transition: transform 0.12s ease, background-color 0.12s ease;
                }
                .login-submit-btn:not(:disabled):hover {
                    transform: scale(1.02);
                }
                .login-submit-btn:not(:disabled):active {
                    transform: scale(0.98);
                }
            `}</style>

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
                    className="login-col-layout"
                    style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "row",
                        flex: 1,
                    }}
                >
                    {/* Kiri — marketing */}
                    <div
                        className="login-left-col"
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
                                className="login-main-heading"
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
                                className="login-main-copy"
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

                    {/* Kanan — form */}
                    <div
                        className="login-right-col"
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
                            className="login-bubbles-wrap"
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
                                className="login-card"
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
                                    className="login-form-title"
                                    style={{
                                        fontSize: "2.25rem",
                                        fontWeight: 500,
                                        color: "#000000",
                                        margin: "0 0 24px 0",
                                    }}
                                >
                                    Masuk ke client area
                                </h2>
                                <form
                                    onSubmit={handleSubmit}
                                    method="post"
                                    name="loginForm"
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "16px",
                                    }}
                                >
                                    <div>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={email}
                                            onChange={handleEmailChange}
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
                                                onChange={handlePasswordChange}
                                                onBlur={() =>
                                                    validatePassword(password)
                                                }
                                                placeholder="Kata sandi"
                                                autoComplete="current-password"
                                                style={{
                                                    ...inputBase,
                                                    paddingRight: 96,
                                                    border: passwordError
                                                        ? "1px solid #ef4444"
                                                        : "1px solid #ffffff",
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    right: 12,
                                                    top: "50%",
                                                    transform:
                                                        "translateY(-50%)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        position: "relative",
                                                        display: "flex",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        onMouseEnter={() =>
                                                            setShowPasswordTooltip(
                                                                true
                                                            )
                                                        }
                                                        onMouseLeave={() =>
                                                            setShowPasswordTooltip(
                                                                false
                                                            )
                                                        }
                                                        onTouchStart={() =>
                                                            setShowPasswordTooltip(
                                                                !showPasswordTooltip
                                                            )
                                                        }
                                                        style={{
                                                            border: "none",
                                                            background:
                                                                "transparent",
                                                            color: "#666666",
                                                            cursor: "help",
                                                            padding: 4,
                                                            display: "flex",
                                                        }}
                                                        aria-label="Info kata sandi"
                                                    >
                                                        <svg
                                                            width={20}
                                                            height={20}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                    </button>
                                                    {showPasswordTooltip && (
                                                        <div
                                                            style={{
                                                                position:
                                                                    "absolute",
                                                                left: "100%",
                                                                top: "50%",
                                                                transform:
                                                                    "translateY(-50%)",
                                                                marginLeft: 8,
                                                                width: 280,
                                                                backgroundColor:
                                                                    "#4a4a4a",
                                                                color: "#fff",
                                                                fontSize: 12,
                                                                borderRadius: 8,
                                                                padding:
                                                                    "12px 16px",
                                                                boxShadow:
                                                                    "0 4px 12px rgba(0,0,0,0.15)",
                                                                zIndex: 10,
                                                            }}
                                                        >
                                                            <p
                                                                style={{
                                                                    margin: 0,
                                                                    lineHeight: 1.5,
                                                                }}
                                                            >
                                                                Kata sandi harus
                                                                terdiri dari
                                                                8-15 karakter
                                                                dan berisi
                                                                masing-masing
                                                                jenis karakter
                                                                berikut: huruf
                                                                kecil, huruf
                                                                besar, angka.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPassword(
                                                            !showPassword
                                                        )
                                                    }
                                                    style={{
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

                                    {loginError && (
                                        <div style={{ marginBottom: 8 }}>
                                            <p
                                                style={{
                                                    color: "#ef4444",
                                                    fontSize: "12px",
                                                    paddingLeft: 8,
                                                    margin: 0,
                                                }}
                                            >
                                                {loginError}
                                            </p>
                                            {showResetPasswordOption && (
                                                <div
                                                    style={{
                                                        marginTop: 8,
                                                        paddingLeft: 8,
                                                    }}
                                                >
                                                    <a
                                                        href={forgotPasswordUrl}
                                                        style={linkStyle}
                                                    >
                                                        Reset password dengan
                                                        OTP
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div
                                        className="login-remember-row"
                                        style={{
                                            display: "flex",
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 16,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                flex: "1 1 auto",
                                                gap: 12,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    id="remember"
                                                    name="remember"
                                                    checked={rememberMe}
                                                    onChange={
                                                        handleRememberMeChange
                                                    }
                                                    style={{
                                                        width: 16,
                                                        height: 16,
                                                        accentColor:
                                                            accentColor,
                                                        cursor: "pointer",
                                                    }}
                                                />
                                                <label
                                                    htmlFor="remember"
                                                    style={{
                                                        marginLeft: 8,
                                                        fontSize: "14px",
                                                        color: "#666666",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    Ingat saya
                                                </label>
                                            </div>
                                            <a
                                                href={forgotPasswordUrl}
                                                className="login-mobile-forgot"
                                                style={{
                                                    ...linkStyle,
                                                    fontSize: "12px",
                                                }}
                                            >
                                                Lupa Kata Sandi
                                            </a>
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "flex-end",
                                            }}
                                        >
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="login-submit-btn"
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    backgroundColor:
                                                        isSubmitting
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
                                                    ? "Masuk..."
                                                    : "Masuk"}
                                            </button>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            textAlign: "center",
                                            fontSize: "14px",
                                            color: "#666666",
                                            paddingTop: 4,
                                        }}
                                    >
                                        Belum punya akun?{" "}
                                        <a href={registerUrl} style={linkStyle}>
                                            Buat Akun
                                        </a>
                                    </div>
                                </form>
                            </div>
                            <div
                                className="login-form-footer-wrap"
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

LoginClientArea.defaultProps = {
    loginApiUrl: `${API_BASE}/auth/login`,
    accentColor: "#69d7f6",
    pageBgColor: "#69d7f6",
    logoUrl: "https://cdn2.triveinvest.co.id/assets/img/sca/logo.svg",
    homeUrl: `${BASE}/`,
    bubblesImageUrl:
        "https://cdn2.triveinvest.co.id/assets/img/sca/bubbles-small.png",
    registerUrl: `${BASE}/register`,
    forgotPasswordUrl: `${BASE}/forgot-password`,
    accountsUrl: `${BASE}/accounts`,
    redirectIfAlreadyLoggedIn: true,
    fullViewport: false,
}

addPropertyControls(LoginClientArea, {
    loginApiUrl: {
        type: ControlType.String,
        title: "Login API URL",
        defaultValue: `${API_BASE}/auth/login`,
        placeholder: "https://…/api/auth/login",
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
    registerUrl: {
        type: ControlType.String,
        title: "Register URL",
        defaultValue: `${BASE}/register`,
    },
    forgotPasswordUrl: {
        type: ControlType.String,
        title: "Forgot password URL",
        defaultValue: `${BASE}/forgot-password`,
    },
    accountsUrl: {
        type: ControlType.String,
        title: "After login redirect",
        defaultValue: `${BASE}/accounts`,
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

export default LoginClientArea
