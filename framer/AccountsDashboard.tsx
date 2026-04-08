import * as React from "react"
// Host Framer menyediakan modul ini di Code Component (tidak ada di Next.js).
// @ts-expect-error — types tidak terpasang di repo ini
import { addPropertyControls, ControlType, RenderTarget } from "framer"

/** Origin halaman klien SCA di situs utama (path /sca). */
const BASE = "https://www.triveinvest.co.id/sca"
/** Endpoint backend (bukan origin halaman). */
const API_BASE = "https://api.trive.co.id/api"

interface MeResponse {
    user?: { name?: string; fullname?: string }
    error?: string
}

interface AccountsApiResponse {
    accounts?: AccountRow[]
    error?: string
}

interface AccountRow {
    id: number
    type?: string
    accountType?: string
    accountName?: string
    platform?: string
    login?: string
    serverName?: string
    status?: string
    currency?: string
    nickname?: string | null
    leverage?: string | number
    conversionRate?: string | number
    kursKonversi?: string | number
}

type AccountTab = "live" | "demo"

type AccountsDashboardProps = {
    meApiUrl?: string
    accountsApiUrl?: string
    loginUrl?: string
    accountsUrl?: string
    platformUrl?: string
    profileUrl?: string
    openAccountUrl?: string
    depositUrl?: string
    withdrawalUrl?: string
    logoUrl?: string
    accentColor?: string
    pageBgColor?: string
    sidebarBg?: string
    /** Tiga gambar promo (carousel). UI carousel dinonaktifkan; rujuk blok komentar di komponen untuk mengaktifkan kembali. */
    sliderImage1?: string
    sliderImage2?: string
    sliderImage3?: string
    whatsappUrl?: string
    redirectIfNotLoggedIn?: boolean
    fullViewport?: boolean
}

function isPreviewLike(): boolean {
    if (typeof window === "undefined") return false
    const rt = RenderTarget.current()
    return (
        rt !== RenderTarget.canvas &&
        rt !== RenderTarget.export &&
        rt !== RenderTarget.thumbnail
    )
}

function AccountsDashboard(props: AccountsDashboardProps) {
    const {
        meApiUrl = `${API_BASE}/auth/me`,
        accountsApiUrl = `${API_BASE}/accounts`,
        loginUrl = `${BASE}/login`,
        accountsUrl = `${BASE}/accounts`,
        platformUrl = `${BASE}/platform`,
        profileUrl = `${BASE}/profile`,
        openAccountUrl = `${BASE}/open-investment-account`,
        depositUrl = `${BASE}/accounts`,
        withdrawalUrl = `${BASE}/accounts`,
        logoUrl = "https://cdn2.triveinvest.co.id/assets/img/sca/sca-logo.png",
        accentColor = "#69d7f6",
        pageBgColor = "#f5f5f5",
        sidebarBg = "#24252c",
        sliderImage1 = `${BASE}/slider/SCA-KomisiKembali.jpg`,
        sliderImage2 = `${BASE}/slider/SCA-Spreadback.jpg`,
        sliderImage3 = `${BASE}/slider/SCA-Swap.jpg`,
        whatsappUrl = "https://wa.me/628815921000",
        redirectIfNotLoggedIn = true,
        fullViewport = false,
    } = props

    const [sidebarOpen, setSidebarOpen] = React.useState(true)
    const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)
    const [profilePanelOpen, setProfilePanelOpen] = React.useState(false)
    const [userName, setUserName] = React.useState("")
    const [userInitial, setUserInitial] = React.useState("—")
    const [accounts, setAccounts] = React.useState<AccountRow[]>([])
    const [loadingAccounts, setLoadingAccounts] = React.useState(true)
    const [activeAccountTab, setActiveAccountTab] =
        React.useState<AccountTab>("live")

    const [toast, setToast] = React.useState<{
        open: boolean
        ok: boolean
        title: string
        message: string
    }>({ open: false, ok: true, title: "", message: "" })

    const [isMobile, setIsMobile] = React.useState(false)

    React.useEffect(() => {
        const mq = window.matchMedia("(max-width: 1023px)")
        const upd = () => setIsMobile(mq.matches)
        upd()
        mq.addEventListener("change", upd)
        return () => mq.removeEventListener("change", upd)
    }, [])

    React.useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true)
                setMobileSidebarOpen(false)
            } else {
                setSidebarOpen(false)
            }
        }
        onResize()
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [])

    const authRedirect = React.useCallback(() => {
        if (typeof window === "undefined") return
        localStorage.removeItem("token")
        window.location.href = loginUrl
    }, [loginUrl])

    const fetchUser = React.useCallback(
        async (token: string) => {
            try {
                const res = await fetch(meApiUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                })
                if (res.ok) {
                    const data: MeResponse = await res.json()
                    const name = data.user?.name || data.user?.fullname || ""
                    if (name) {
                        setUserName(name.toUpperCase())
                        setUserInitial(name.charAt(0).toUpperCase())
                    }
                } else if (res.status === 401) {
                    authRedirect()
                }
            } catch (e) {
                console.error("me:", e)
            }
        },
        [meApiUrl, authRedirect]
    )

    const fetchAccountsList = React.useCallback(
        async (token: string) => {
            setLoadingAccounts(true)
            try {
                const res = await fetch(accountsApiUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                })
                if (res.ok) {
                    const data: AccountsApiResponse = await res.json()
                    setAccounts(data.accounts || [])
                } else if (res.status === 401) {
                    authRedirect()
                }
            } catch (e) {
                console.error("accounts:", e)
            } finally {
                setLoadingAccounts(false)
            }
        },
        [accountsApiUrl, authRedirect]
    )

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (!isPreviewLike()) {
            setLoadingAccounts(false)
            return
        }
        const token = localStorage.getItem("token")
        if (!token) {
            if (redirectIfNotLoggedIn) {
                window.location.href = loginUrl
            } else {
                setLoadingAccounts(false)
            }
            return
        }
        fetchUser(token)
        fetchAccountsList(token)
    }, [redirectIfNotLoggedIn, loginUrl, fetchUser, fetchAccountsList])

    const hasLiveAccount = () =>
        accounts.some((a) => (a.type || "").toLowerCase() === "live")

    const isLiveType = React.useCallback(
        (a: AccountRow) => (a.type || "").toLowerCase() === "live",
        []
    )
    const isDemoType = React.useCallback(
        (a: AccountRow) => (a.type || "").toLowerCase() === "demo",
        []
    )

    const liveAccounts = React.useMemo(
        () => accounts.filter((a) => isLiveType(a)),
        [accounts, isLiveType]
    )
    const demoAccounts = React.useMemo(
        () => accounts.filter((a) => isDemoType(a)),
        [accounts, isDemoType]
    )
    const visibleAccounts =
        activeAccountTab === "live" ? liveAccounts : demoAccounts

    const handleLogout = () => {
        if (typeof window === "undefined") return
        localStorage.removeItem("token")
        window.location.href = loginUrl
    }

    /*
     * --- Slider promo (dinonaktifkan): hapus pembungkus komentar ini dan sesuaikan JSX di return untuk mengaktifkan kembali.
     *
     * const slidesImages = React.useMemo(
     *     () =>
     *         [sliderImage1, sliderImage2, sliderImage3].filter(
     *             (u) => u && u.trim() !== ""
     *         ),
     *     [sliderImage1, sliderImage2, sliderImage3]
     * )
     * const [currentImageIndex, setCurrentImageIndex] = React.useState(0)
     * const [isAutoPlaying, setIsAutoPlaying] = React.useState(true)
     * const [touchStart, setTouchStart] = React.useState<number | null>(null)
     * const [touchEnd, setTouchEnd] = React.useState<number | null>(null)
     *
     * React.useEffect(() => {
     *     if (!isAutoPlaying || slidesImages.length <= 1) return
     *     const t = window.setInterval(() => {
     *         setCurrentImageIndex((prev) =>
     *             prev >= slidesImages.length - 1 ? 0 : prev + 1
     *         )
     *     }, 4000)
     *     return () => window.clearInterval(t)
     * }, [isAutoPlaying, slidesImages.length])
     *
     * const minSwipe = 50
     * const onTouchStart = (e: React.TouchEvent) => {
     *     setTouchEnd(null)
     *     setTouchStart(e.targetTouches[0].clientX)
     *     setIsAutoPlaying(false)
     * }
     * const onTouchMove = (e: React.TouchEvent) => {
     *     setTouchEnd(e.targetTouches[0].clientX)
     * }
     * const onTouchEnd = () => {
     *     if (touchStart == null || touchEnd == null || slidesImages.length < 2)
     *         return
     *     const d = touchStart - touchEnd
     *     const max = slidesImages.length - 1
     *     if (d > minSwipe) setCurrentImageIndex((i) => (i >= max ? 0 : i + 1))
     *     if (d < -minSwipe) setCurrentImageIndex((i) => (i <= 0 ? max : i - 1))
     *     window.setTimeout(() => setIsAutoPlaying(true), 5000)
     * }
     */

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

    const sidebarWidth = isMobile ? 256 : sidebarOpen ? 256 : 80
    const showExpandedSidebar = isMobile ? mobileSidebarOpen : sidebarOpen

    return (
        <div
            className="accounts-dashboard-root"
            style={{
                ...rootLayout,
                display: "flex",
                backgroundColor: pageBgColor,
                fontFamily: "system-ui, -apple-system, sans-serif",
                position: "relative",
                overflow: "hidden",
                boxSizing: "border-box",
            }}
        >
            <style>{`
        .accounts-dashboard-root, .accounts-dashboard-root * { box-sizing: border-box; }
        @media (max-width: 1023px) {
          .ad-sidebar {
            position: fixed !important;
            left: 0; top: 0; bottom: 0;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          .ad-sidebar.ad-sidebar-open {
            transform: translateX(0);
          }
          .ad-main { margin-left: 0 !important; }
        }
        @media (min-width: 1024px) {
          .ad-sidebar { position: relative !important; transform: none !important; }
        }
        @media (max-width: 1023px) {
          .accounts-wa-btn { bottom: 20px !important; right: 20px !important; padding: 14px !important; }
        }
        @media (max-width: 767px) {
          .accounts-wa-btn { bottom: 14px !important; right: 14px !important; padding: 12px !important; }
        }
        @media (min-width: 640px) {
          .accounts-wa-chat-label { display: inline-block !important; }
        }
      `}</style>

            {whatsappUrl ? (
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chat dengan WhatsApp"
                    className="accounts-wa-btn"
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
                        className="accounts-wa-chat-label"
                    >
                        Chat
                    </span>
                </a>
            ) : null}

            {isMobile && mobileSidebarOpen && (
                <div
                    role="presentation"
                    onClick={() => setMobileSidebarOpen(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        zIndex: 40,
                    }}
                />
            )}

            <div
                style={{
                    display: "flex",
                    position: "relative",
                    flexShrink: 0,
                    alignSelf: "stretch",
                    minHeight: "100%",
                }}
            >
                <aside
                    className={`ad-sidebar ${mobileSidebarOpen ? "ad-sidebar-open" : ""}`}
                    style={{
                        width: sidebarWidth,
                        minWidth: sidebarWidth,
                        backgroundColor: sidebarBg,
                        minHeight: "100%",
                        display: "flex",
                        flexDirection: "column",
                        transition: "width 0.3s ease, min-width 0.3s ease",
                    }}
                >
                    <div
                        style={{
                            padding: 24,
                            borderBottom: "1px solid #334155",
                        }}
                    >
                        {showExpandedSidebar && (
                            <a href={accountsUrl} style={{ display: "block" }}>
                                <img
                                    src={logoUrl}
                                    alt="Trive Invest"
                                    width={140}
                                    height={47}
                                    style={{
                                        width: 140,
                                        height: "auto",
                                        display: "block",
                                    }}
                                />
                            </a>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => setProfilePanelOpen((v) => !v)}
                        style={{
                            width: "100%",
                            padding: 16,
                            border: "none",
                            borderBottom: "1px solid #334155",
                            background: "transparent",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: showExpandedSidebar
                                ? "space-between"
                                : "center",
                            color: "#fff",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    background: "#464857",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 600,
                                    flexShrink: 0,
                                }}
                            >
                                {userInitial}
                            </div>
                            {showExpandedSidebar && (
                                <span style={{ fontSize: 14, fontWeight: 500 }}>
                                    {userName || "Memuat..."}
                                </span>
                            )}
                        </div>
                        {showExpandedSidebar && (
                            <svg
                                width={20}
                                height={20}
                                fill="none"
                                stroke="#9ca3af"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        )}
                    </button>

                    <nav style={{ flex: 1, padding: 16 }}>
                        <ul
                            style={{ listStyle: "none", margin: 0, padding: 0 }}
                        >
                            <li style={{ marginBottom: 4 }}>
                                <a
                                    href={accountsUrl}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: showExpandedSidebar
                                            ? "space-between"
                                            : "center",
                                        padding: 12,
                                        borderRadius: 8,
                                        background: "#334155",
                                        color: "#fff",
                                        textDecoration: "none",
                                        fontSize: 14,
                                        fontWeight: 500,
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                        }}
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
                                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                            />
                                        </svg>
                                        {showExpandedSidebar && "Akun"}
                                    </span>
                                </a>
                            </li>
                            <li style={{ marginBottom: 4 }}>
                                <span
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: 12,
                                        borderRadius: 8,
                                        color: "#94a3b8",
                                        fontSize: 14,
                                        opacity: 0.75,
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                        }}
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
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        {showExpandedSidebar && "Riset"}
                                    </span>
                                </span>
                            </li>
                            <li style={{ marginBottom: 4 }}>
                                <a
                                    href={platformUrl}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: 12,
                                        borderRadius: 8,
                                        color: "#cbd5e1",
                                        textDecoration: "none",
                                        fontSize: 14,
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                        }}
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
                                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                            />
                                        </svg>
                                        {showExpandedSidebar && "Platform"}
                                    </span>
                                </a>
                            </li>
                            <li style={{ marginTop: 16 }}>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        width: "100%",
                                        padding: 12,
                                        border: "none",
                                        borderRadius: 8,
                                        background: "transparent",
                                        color: "#cbd5e1",
                                        cursor: "pointer",
                                        fontSize: 14,
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                        }}
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
                                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                            />
                                        </svg>
                                        {showExpandedSidebar && "Keluar"}
                                    </span>
                                </button>
                            </li>
                        </ul>
                    </nav>

                    {profilePanelOpen && showExpandedSidebar && (
                        <div
                            style={{
                                position: "fixed",
                                left: sidebarWidth,
                                top: 0,
                                width: 256,
                                height: "100%",
                                background: "#fff",
                                boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
                                zIndex: 100,
                                padding: 16,
                                overflowY: "auto",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    marginBottom: 8,
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setProfilePanelOpen(false)}
                                    style={{
                                        border: "none",
                                        background: "none",
                                        cursor: "pointer",
                                    }}
                                    aria-label="Tutup"
                                >
                                    <svg
                                        width={20}
                                        height={20}
                                        fill="none"
                                        stroke="#64748b"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                            <p
                                style={{
                                    fontWeight: 600,
                                    fontSize: 14,
                                    margin: "0 0 8px",
                                }}
                            >
                                Akun
                            </p>
                            <a
                                href={profileUrl}
                                style={{
                                    display: "block",
                                    padding: "8px 12px",
                                    color: "#374151",
                                    fontSize: 14,
                                    textDecoration: "none",
                                    borderRadius: 6,
                                }}
                            >
                                Profil
                            </a>
                            <button
                                type="button"
                                onClick={handleLogout}
                                style={{
                                    marginTop: 16,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    border: "none",
                                    background: "none",
                                    cursor: "pointer",
                                    fontSize: 14,
                                    color: "#374151",
                                }}
                            >
                                Keluar
                            </button>
                        </div>
                    )}
                </aside>

                {!isMobile && (
                    <button
                        type="button"
                        onClick={() => setSidebarOpen((v) => !v)}
                        title={sidebarOpen ? "Ciutkan sidebar" : "Buka sidebar"}
                        style={{
                            position: "absolute",
                            right: -20,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            border: "none",
                            background: accentColor,
                            cursor: "pointer",
                            zIndex: 45,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        }}
                    >
                        <svg
                            width={20}
                            height={20}
                            fill="none"
                            stroke="#2b2c24"
                            viewBox="0 0 24 24"
                        >
                            {sidebarOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            )}
                        </svg>
                    </button>
                )}
            </div>

            <main
                className="ad-main"
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    overflowX: "hidden",
                }}
            >
                <div
                    style={{
                        flex: 1,
                        padding: "16px 24px",
                        overflowX: "hidden",
                    }}
                >
                    {isMobile && (
                        <button
                            type="button"
                            onClick={() => setMobileSidebarOpen(true)}
                            style={{
                                marginBottom: 12,
                                padding: "8px 14px",
                                borderRadius: 8,
                                border: "1px solid #cbd5e1",
                                background: "#fff",
                                cursor: "pointer",
                                fontSize: 14,
                            }}
                        >
                            Menu
                        </button>
                    )}

                    {!loadingAccounts && !hasLiveAccount() && (
                        <div
                            style={{
                                background: "#cdf0f7",
                                padding: "16px 24px",
                                borderRadius: 8,
                                marginBottom: 16,
                                display: "flex",
                                flexWrap: "wrap",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                            }}
                        >
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 14,
                                    color: "#000",
                                    flex: "1 1 240px",
                                }}
                            >
                                Anda belum memiliki akun live. Hanya butuh
                                beberapa menit untuk membuat akun live. Mulai
                                trading dengan Trive Invest.
                            </p>
                            <a
                                href={openAccountUrl}
                                style={{
                                    display: "inline-block",
                                    padding: "10px 20px",
                                    background: "#02b5e7",
                                    color: "#fff",
                                    borderRadius: 8,
                                    fontSize: 14,
                                    fontWeight: 500,
                                    textDecoration: "none",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                Buka Akun Live
                            </a>
                        </div>
                    )}

                    <p
                        style={{
                            fontSize: 14,
                            color: "#64748b",
                            margin: "0 0 12px",
                        }}
                    >
                        Dasbor / Akun
                    </p>

                    {/*
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 20,
                        }}
                    >
                        <h1
                            style={{
                                margin: 0,
                                fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
                                fontWeight: 600,
                            }}
                        >
                            Akun
                        </h1>
                        <svg
                            width={24}
                            height={24}
                            fill="none"
                            stroke="#64748b"
                            viewBox="0 0 24 24"
                        >
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
                        </svg>
                    </div>
                    */}

                    {/*
                    Layout alternatif: kartu ringkasan + kolom Deposit/Withdrawal di samping (bukan di atas daftar akun).
                    <div
                        style={{
                            display: "flex",
                            flexDirection: isMobile ? "column" : "row",
                            gap: 20,
                            marginBottom: 24,
                            alignItems: "stretch",
                        }}
                    >
                        ... grid kartu ...
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: isMobile ? "100%" : 300 }}>
                            <a href={depositUrl}>Deposit</a>
                            <a href={withdrawalUrl}>Withdrawal</a>
                        </div>
                    </div>
                    */}

                    {/*
                    Kartu ringkasan: Ekuitas Bersih, Profit dan Loss, Total Balance (dinonaktifkan).
                    <div style={{ marginBottom: 24 }}>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: isMobile
                                    ? "1fr"
                                    : "repeat(3, 1fr)",
                                gap: 16,
                            }}
                        >
                            {[
                                { label: "Ekuitas Bersih", bar: accentColor },
                                { label: "Profit dan Loss", bar: "#4ade80" },
                                { label: "Total Balance", bar: "#fb923c" },
                            ].map((c) => (
                                <div
                                    key={c.label}
                                    style={{
                                        background: "#fff",
                                        borderRadius: 8,
                                        padding: "16px 20px",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                                        position: "relative",
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: 4,
                                            background: c.bar,
                                        }}
                                    />
                                    <p
                                        style={{
                                            margin: "0 0 8px",
                                            fontSize: 16,
                                            fontWeight: 600,
                                            color: "#64748b",
                                        }}
                                    >
                                        {c.label}
                                    </p>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: 14,
                                            color: "#000",
                                        }}
                                    >
                                        Memuat data...
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                    */}

                    {/*
                    Slider / carousel gambar promo (nyalakan kembali hook slidesImages + state di atas, lalu uncomment blok ini).
                    {slidesImages.length > 0 && (
                        <div style={{ marginBottom: 24, position: "relative" }}>
                            <div
                                onTouchStart={onTouchStart}
                                onTouchMove={onTouchMove}
                                onTouchEnd={onTouchEnd}
                                style={{
                                    overflow: "hidden",
                                    borderRadius: 8,
                                    background: "#fff",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                                }}
                            >
                                {isMobile ? (
                                    <div
                                        style={{
                                            display: "flex",
                                            transition: "transform 0.5s ease",
                                            transform: `translateX(-${currentImageIndex * 100}%)`,
                                        }}
                                    >
                                        {slidesImages.map((src, i) => (
                                            <div key={i} style={{ minWidth: "100%", flexShrink: 0 }}>
                                                <img src={src} alt="" style={{ width: "100%", height: 200, objectFit: "cover" }} />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", gap: 12, padding: 20, justifyContent: "center" }}>
                                        {slidesImages.map((src, i) => (
                                            <div key={i} style={{ flex: 1, maxWidth: 360 }}>
                                                <img src={src} alt="" style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 8 }} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {isMobile && slidesImages.length > 1 && (
                                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
                                    {slidesImages.map((_, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                                setCurrentImageIndex(i)
                                                setIsAutoPlaying(false)
                                                window.setTimeout(() => setIsAutoPlaying(true), 5000)
                                            }}
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: "50%",
                                                border: "none",
                                                padding: 0,
                                                background:
                                                    i === currentImageIndex ? accentColor : "#cbd5e1",
                                                cursor: "pointer",
                                            }}
                                            aria-label={`Gambar ${i + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    */}

                    <div
                        style={{
                            display: "flex",
                            flexDirection: isMobile ? "column" : "row",
                            alignItems: isMobile ? "flex-start" : "center",
                            justifyContent: "space-between",
                            gap: 12,
                            marginBottom: 12,
                        }}
                    >
                        <h2
                            style={{
                                fontSize: 18,
                                fontWeight: 600,
                                margin: 0,
                            }}
                        >
                            Daftar akun
                        </h2>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                flexWrap: "wrap",
                                gap: 10,
                                flexShrink: 0,
                                justifyContent: "flex-end",
                                width: isMobile ? "100%" : "auto",
                            }}
                        >
                            <a
                                href={withdrawalUrl}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-start",
                                    gap: 10,
                                    padding: "12px 16px",
                                    background: "#fff",
                                    border: "1px solid #d1d5db",
                                    borderRadius: 8,
                                    fontSize: 14,
                                    color: "#000",
                                    textDecoration: "none",
                                }}
                            >
                                Withdraw
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
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                    />
                                </svg>
                            </a>
                            <a
                                href={depositUrl}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-start",
                                    gap: 10,
                                    padding: "12px 16px",
                                    background: "#fff",
                                    border: "1px solid #d1d5db",
                                    borderRadius: 8,
                                    fontSize: 14,
                                    color: "#000",
                                    textDecoration: "none",
                                }}
                            >
                                Deposit
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
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                            </a>
                        </div>
                    </div>
                    <div
                        style={{
                            background: "#f8fafc",
                            borderRadius: 8,
                            border: "1px solid #e5e7eb",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                borderBottom: "1px solid #e5e7eb",
                                display: "flex",
                                alignItems: "stretch",
                                gap: 0,
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setActiveAccountTab("live")}
                                style={{
                                    display: "inline-flex",
                                    padding: "28px 24px 22px",
                                    border: "none",
                                    background: "none",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: "#2b2e38",
                                    borderBottom:
                                        activeAccountTab === "live"
                                            ? `4px solid ${accentColor}`
                                            : "2px solid transparent",
                                    cursor: "pointer",
                                    textAlign: "left",
                                }}
                            >
                                Akun Live
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveAccountTab("demo")}
                                style={{
                                    display: "inline-flex",
                                    padding: "28px 24px 22px",
                                    border: "none",
                                    background: "none",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: "#2b2e38",
                                    borderBottom:
                                        activeAccountTab === "demo"
                                            ? `4px solid ${accentColor}`
                                            : "2px solid transparent",
                                    cursor: "pointer",
                                    textAlign: "left",
                                }}
                            >
                                Akun Demo
                            </button>
                        </div>
                        <div style={{ padding: "18px 24px 22px" }}>
                            {loadingAccounts ? (
                                <p
                                    style={{
                                        textAlign: "center",
                                        color: "#64748b",
                                    }}
                                >
                                    Memuat data...
                                </p>
                            ) : visibleAccounts.length === 0 ? (
                                <div
                                    style={{
                                        background: "#fffbeb",
                                        borderLeft: "4px solid #facc15",
                                        padding: 16,
                                        borderRadius: 8,
                                        display: "flex",
                                        gap: 12,
                                        alignItems: "flex-start",
                                    }}
                                >
                                    <svg
                                        width={20}
                                        height={20}
                                        fill="none"
                                        stroke="#ca8a04"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                        />
                                    </svg>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: 14,
                                            color: "#854d0e",
                                        }}
                                    >
                                        {activeAccountTab === "live"
                                            ? "Belum ada data akun live."
                                            : "Belum ada data akun demo."}
                                    </p>
                                </div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table
                                        style={{
                                            width: "100%",
                                            minWidth: 980,
                                            borderCollapse: "collapse",
                                        }}
                                    >
                                        <thead>
                                            <tr
                                                style={{
                                                    borderBottom:
                                                        "1px solid #e5e7eb",
                                                }}
                                            >
                                                {[
                                                    "Nama Akun",
                                                    "Jenis Akun",
                                                    "Leverage",
                                                    "Kurs Konversi",
                                                ].map((h) => (
                                                    <th
                                                        key={h}
                                                        style={{
                                                            textAlign: "left",
                                                            padding: "12px 10px",
                                                            fontSize: 13,
                                                            fontWeight: 600,
                                                            color: "#475569",
                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                    >
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {visibleAccounts.map((account) => (
                                                <tr
                                                    key={account.id}
                                                    style={{
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            padding: "14px 10px",
                                                            fontSize: 13,
                                                            color: "#111827",
                                                        }}
                                                    >
                                                        {account.login &&
                                                        account.nickname
                                                            ? `${account.login} - ${account.nickname}`
                                                            : account.login ||
                                                              account.nickname ||
                                                              account.accountName ||
                                                              "-"}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: "14px 10px",
                                                            fontSize: 13,
                                                            color: "#111827",
                                                        }}
                                                    >
                                                        {account.accountType ||
                                                            account.type ||
                                                            "-"}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: "14px 10px",
                                                            fontSize: 13,
                                                            color: "#111827",
                                                        }}
                                                    >
                                                        {account.leverage
                                                            ? `1:${account.leverage}`
                                                            : "-"}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: "14px 10px",
                                                            fontSize: 13,
                                                            color: "#111827",
                                                        }}
                                                    >
                                                        {account.conversionRate ??
                                                            account.kursKonversi ??
                                                            "-"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {toast.open && (
                <div
                    role="dialog"
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.35)",
                        zIndex: 200,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 24,
                    }}
                >
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: 12,
                            padding: 24,
                            maxWidth: 400,
                            width: "100%",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                        }}
                    >
                        <p
                            style={{
                                margin: "0 0 8px",
                                fontWeight: 600,
                                fontSize: 18,
                            }}
                        >
                            {toast.title}
                        </p>
                        <p
                            style={{
                                margin: "0 0 20px",
                                fontSize: 14,
                                color: "#475569",
                            }}
                        >
                            {toast.message}
                        </p>
                        <button
                            type="button"
                            onClick={() =>
                                setToast((t) => ({ ...t, open: false }))
                            }
                            style={{
                                padding: "10px 20px",
                                borderRadius: 8,
                                border: "none",
                                background: toast.ok ? accentColor : "#ef4444",
                                color: toast.ok ? "#2b2c24" : "#fff",
                                fontWeight: 500,
                                cursor: "pointer",
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

AccountsDashboard.defaultProps = {
    meApiUrl: `${API_BASE}/auth/me`,
    accountsApiUrl: `${API_BASE}/accounts`,
    loginUrl: `${BASE}/login`,
    accountsUrl: `${BASE}/accounts`,
    platformUrl: `${BASE}/platform`,
    profileUrl: `${BASE}/profile`,
    openAccountUrl: `${BASE}/open-investment-account`,
    depositUrl: `${BASE}/accounts`,
    withdrawalUrl: `${BASE}/accounts`,
    logoUrl: "https://cdn2.triveinvest.co.id/assets/img/sca/sca-logo.png",
    accentColor: "#69d7f6",
    pageBgColor: "#f5f5f5",
    sidebarBg: "#24252c",
    sliderImage1: `${BASE}/slider/SCA-KomisiKembali.jpg`,
    sliderImage2: `${BASE}/slider/SCA-Spreadback.jpg`,
    sliderImage3: `${BASE}/slider/SCA-Swap.jpg`,
    whatsappUrl: "https://wa.me/628815921000",
    redirectIfNotLoggedIn: true,
    fullViewport: false,
}

addPropertyControls(AccountsDashboard, {
    meApiUrl: {
        type: ControlType.String,
        title: "GET /api/auth/me",
        defaultValue: `${API_BASE}/auth/me`,
    },
    accountsApiUrl: {
        type: ControlType.String,
        title: "GET /api/accounts",
        defaultValue: `${API_BASE}/accounts`,
    },
    loginUrl: {
        type: ControlType.String,
        title: "Login URL (redirect)",
        defaultValue: `${BASE}/login`,
    },
    accountsUrl: {
        type: ControlType.String,
        title: "Accounts URL",
        defaultValue: `${BASE}/accounts`,
    },
    platformUrl: {
        type: ControlType.String,
        title: "Platform URL",
        defaultValue: `${BASE}/platform`,
    },
    profileUrl: {
        type: ControlType.String,
        title: "Profil URL",
        defaultValue: `${BASE}/profile`,
    },
    openAccountUrl: {
        type: ControlType.String,
        title: "Buka akun live URL",
        defaultValue: `${BASE}/open-investment-account`,
    },
    depositUrl: {
        type: ControlType.String,
        title: "Deposit (tautan)",
        defaultValue: `${BASE}/accounts`,
    },
    withdrawalUrl: {
        type: ControlType.String,
        title: "Withdrawal (tautan)",
        defaultValue: `${BASE}/accounts`,
    },
    logoUrl: {
        type: ControlType.String,
        title: "Logo URL",
        defaultValue:
            "https://cdn2.triveinvest.co.id/assets/img/sca/sca-logo.png",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#69d7f6",
    },
    pageBgColor: {
        type: ControlType.Color,
        title: "Latar belakang",
        defaultValue: "#f5f5f5",
    },
    sidebarBg: {
        type: ControlType.Color,
        title: "Sidebar",
        defaultValue: "#24252c",
    },
    sliderImage1: {
        type: ControlType.String,
        title: "Slider gambar 1 (dinonaktifkan di UI)",
        defaultValue: `${BASE}/slider/SCA-KomisiKembali.jpg`,
    },
    sliderImage2: {
        type: ControlType.String,
        title: "Slider gambar 2 (dinonaktifkan di UI)",
        defaultValue: `${BASE}/slider/SCA-Spreadback.jpg`,
    },
    sliderImage3: {
        type: ControlType.String,
        title: "Slider gambar 3 (dinonaktifkan di UI)",
        defaultValue: `${BASE}/slider/SCA-Swap.jpg`,
    },
    whatsappUrl: {
        type: ControlType.String,
        title: "WhatsApp button URL (empty = hide)",
        defaultValue: "https://wa.me/628815921000",
        placeholder: "https://wa.me/…",
    },
    redirectIfNotLoggedIn: {
        type: ControlType.Boolean,
        title: "Redirect jika belum login",
        defaultValue: true,
        enabledTitle: "Ya",
        disabledTitle: "Tidak (canvas)",
    },
    fullViewport: {
        type: ControlType.Boolean,
        title: "Full viewport (100vh)",
        defaultValue: false,
        enabledTitle: "100vh",
        disabledTitle: "Fill frame",
    },
})

export default AccountsDashboard
