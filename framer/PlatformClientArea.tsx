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

type PlatformClientAreaProps = {
    meApiUrl?: string
    loginUrl?: string
    accountsUrl?: string
    platformUrl?: string
    profileUrl?: string
    logoUrl?: string
    accentColor?: string
    /** Latar utama (konten); di app/platform pakai putih */
    pageBgColor?: string
    sidebarBg?: string
    serverName?: string
    downloadWindowsUrl?: string
    downloadMacUrl?: string
    downloadIosUrl?: string
    downloadAndroidUrl?: string
    heroTitle?: string
    heroDescription?: string
    pageTitle?: string
    breadcrumbLabel?: string
    labelWindows?: string
    labelMac?: string
    labelIos?: string
    labelAndroid?: string
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

const defaultWindows =
    "https://download.mql5.com/cdn/web/22794/mt5/triveinvest5setup.exe"
const defaultAppleMobile =
    "https://download.mql5.com/cdn/mobile/mt5/ios?server=TriveInvest-MT5-Live"
const collapsedLogoUrl = "https://cdn2.triveinvest.co.id/assets/img/sca/sayap.png"
function PlatformClientArea(props: PlatformClientAreaProps) {
    const {
        meApiUrl = `${API_BASE}/auth/me`,
        loginUrl = `${BASE}/login`,
        accountsUrl = `${BASE}/accounts`,
        platformUrl = `${BASE}/platform`,
        profileUrl = `${BASE}/profile`,
        logoUrl = "https://cdn2.triveinvest.co.id/assets/img/sca/sca-logo.png",
        accentColor = "#69d7f6",
        pageBgColor = "#ffffff",
        sidebarBg = "#24252c",
        serverName = "TriveInvest-MT5-Live",
        downloadWindowsUrl = defaultWindows,
        downloadMacUrl = defaultAppleMobile,
        downloadIosUrl = defaultAppleMobile,
        downloadAndroidUrl = "https://download.mql5.com/cdn/mobile/mt5/android?server=TriveInvest-MT5-Live",
        heroTitle = "Download dan Mulai Trading Sekarang",
        heroDescription = "Ambil kesempatan Anda sekarang. Tidak semua trader berhasil dengan gaya trading yang sama.",
        pageTitle = "Platform",
        breadcrumbLabel = "Dasbor / Platform",
        labelWindows = "Download MT5 untuk Windows",
        labelMac = "Download MT5 untuk macOS",
        labelIos = "Download MT5 untuk iOS",
        labelAndroid = "Download MT5 untuk Android",
        whatsappUrl = "https://wa.me/628815921000",
        redirectIfNotLoggedIn = true,
        fullViewport = false,
    } = props

    const [sidebarOpen, setSidebarOpen] = React.useState(true)
    const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)
    const [profilePanelOpen, setProfilePanelOpen] = React.useState(false)
    const [userName, setUserName] = React.useState("")
    const [userInitial, setUserInitial] = React.useState("—")
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

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (!isPreviewLike()) return
        const token = localStorage.getItem("token")
        if (!token) {
            if (redirectIfNotLoggedIn) {
                window.location.href = loginUrl
            }
            return
        }
        fetchUser(token)
    }, [redirectIfNotLoggedIn, loginUrl, fetchUser])

    const handleLogout = () => {
        if (typeof window === "undefined") return
        localStorage.removeItem("token")
        window.location.href = loginUrl
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

    const sidebarWidth = isMobile ? 256 : sidebarOpen ? 256 : 80
    const showExpandedSidebar = isMobile ? mobileSidebarOpen : sidebarOpen

    const linkInactive: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: showExpandedSidebar ? "space-between" : "center",
        padding: 12,
        borderRadius: 8,
        color: "#cbd5e1",
        textDecoration: "none",
        fontSize: 14,
    }

    const linkActive: React.CSSProperties = {
        ...linkInactive,
        background: "#334155",
        color: "#fff",
        fontWeight: 500,
    }

    const downloadBtnStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "#f3f4f6",
        borderRadius: 8,
        padding: "12px 16px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        color: "#000",
        fontWeight: 500,
        textDecoration: "none",
        fontSize: 14,
    }

    return (
        <div
            className="platform-client-area-root"
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
        .platform-client-area-root, .platform-client-area-root * { box-sizing: border-box; }
        .pca-download-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr;
          max-width: 56rem;
          margin-left: auto;
          margin-right: auto;
        }
        @media (min-width: 768px) {
          .pca-download-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .pca-download-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 1023px) {
          .pca-sidebar {
            position: fixed !important;
            left: 0; top: 0; bottom: 0;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          .pca-sidebar.pca-sidebar-open {
            transform: translateX(0);
          }
          .pca-main { margin-left: 0 !important; }
        }
        @media (min-width: 1024px) {
          .pca-sidebar { position: relative !important; transform: none !important; }
        }
        @media (max-width: 1023px) {
          .platform-wa-btn { bottom: 20px !important; right: 20px !important; padding: 14px !important; }
        }
        @media (max-width: 767px) {
          .platform-wa-btn { bottom: 14px !important; right: 14px !important; padding: 12px !important; }
        }
        @media (min-width: 640px) {
          .platform-wa-chat-label { display: inline-block !important; }
        }
      `}</style>

            {whatsappUrl ? (
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chat dengan WhatsApp"
                    className="platform-wa-btn"
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
                        className="platform-wa-chat-label"
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
                    className={`pca-sidebar ${mobileSidebarOpen ? "pca-sidebar-open" : ""}`}
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
                        <a
                            href={accountsUrl}
                            style={{
                                display: "flex",
                                justifyContent: showExpandedSidebar
                                    ? "flex-start"
                                    : "center",
                            }}
                        >
                            <img
                                src={showExpandedSidebar ? logoUrl : collapsedLogoUrl}
                                alt="Trive Invest"
                                width={showExpandedSidebar ? 140 : 32}
                                height={showExpandedSidebar ? 47 : 32}
                                style={{
                                    width: showExpandedSidebar ? 140 : 32,
                                    height: showExpandedSidebar ? "auto" : 32,
                                    display: "block",
                                }}
                            />
                        </a>
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
                                <a href={accountsUrl} style={linkInactive}>
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
                                <a href={platformUrl} style={linkActive}>
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
                className="pca-main"
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    overflowX: "hidden",
                    backgroundColor: pageBgColor,
                }}
            >
                <div
                    style={{
                        flex: 1,
                        padding: isMobile ? 16 : "32px 32px",
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

                    <p
                        style={{
                            fontSize: 14,
                            color: "#64748b",
                            margin: "0 0 16px",
                        }}
                    >
                        {breadcrumbLabel}
                    </p>

                    <div style={{ marginBottom: 16 }}>
                        <h1
                            style={{
                                margin: 0,
                                fontSize: "clamp(1.25rem, 3vw, 1.875rem)",
                                fontWeight: 600,
                                color: "#000",
                            }}
                        >
                            {pageTitle}
                        </h1>
                    </div>

                    <div className="pca-download-wrap">
                        <h2
                            style={{
                                margin: "0 0 16px",
                                fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
                                fontWeight: 700,
                                color: "#000",
                                textAlign: "center",
                            }}
                        >
                            {heroTitle}
                        </h2>
                        <p
                            style={{
                                margin: "0 0 24px",
                                fontSize: 16,
                                lineHeight: 1.5,
                                color: "#000",
                                textAlign: "center",
                                maxWidth: 42 * 16,
                                marginLeft: "auto",
                                marginRight: "auto",
                            }}
                        >
                            {heroDescription}
                        </p>
                        <div style={{ textAlign: "center", marginBottom: 32 }}>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 16,
                                    color: "#000",
                                }}
                            >
                                <span style={{ fontWeight: 400 }}>
                                    Nama Server :{" "}
                                </span>
                                <span style={{ fontWeight: 600 }}>
                                    {serverName}
                                </span>
                            </p>
                        </div>

                        <div className="pca-download-grid">
                            <a
                                href={downloadWindowsUrl}
                                download
                                style={downloadBtnStyle}
                            >
                                <svg
                                    width={24}
                                    height={24}
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    style={{ flexShrink: 0 }}
                                >
                                    <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .15V5.21L20 3zM3 13l6 .09v7.81l-6-1.15V13zm17 .25V22l-10-1.78v-7.03l10 .06z" />
                                </svg>
                                <span>{labelWindows}</span>
                            </a>
                            <a
                                href={downloadMacUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={downloadBtnStyle}
                            >
                                <svg
                                    width={24}
                                    height={24}
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    style={{ flexShrink: 0 }}
                                >
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                </svg>
                                <span>{labelMac}</span>
                            </a>
                            <a
                                href={downloadIosUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={downloadBtnStyle}
                            >
                                <svg
                                    width={24}
                                    height={24}
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    style={{ flexShrink: 0 }}
                                >
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                </svg>
                                <span>{labelIos}</span>
                            </a>
                            <a
                                href={downloadAndroidUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={downloadBtnStyle}
                            >
                                <svg
                                    width={24}
                                    height={24}
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    style={{ flexShrink: 0 }}
                                >
                                    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997 0-.5511.4482-.9993.9993-.9993.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997 0-.5511.4482-.9993.9993-.9993.551 0 .9993.4482.9993.9993 0 .5511-.4483.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C18.0982 8.0029 17.9979 8 17.8927 8H6.1073c-.1052 0-.2055.0029-.3048.0086L3.7802 4.5054a.4157.4157 0 00-.5676-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 9.451 1.9998 10.6484 1.9998 12v4c0 .549.4448 1 1 1h18c.5552 0 1-.451 1-1v-4c0-1.3516-.6891-2.549-1.7305-3.6786m-4.8687 1.6786H6.3932c.1588.5306.4317 1.0186.7993 1.4314.5511.6206 1.2979 1.0006 2.1075 1.0006s1.5564-.38 2.1075-1.0006c.3676-.4128.6405-.9008.7993-1.4314z" />
                                </svg>
                                <span>{labelAndroid}</span>
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

const androidDefault =
    "https://download.mql5.com/cdn/mobile/mt5/android?server=TriveInvest-MT5-Live"

PlatformClientArea.defaultProps = {
    meApiUrl: `${API_BASE}/auth/me`,
    loginUrl: `${BASE}/login`,
    accountsUrl: `${BASE}/accounts`,
    platformUrl: `${BASE}/platform`,
    profileUrl: `${BASE}/profile`,
    logoUrl: "https://cdn2.triveinvest.co.id/assets/img/sca/sca-logo.png",
    accentColor: "#69d7f6",
    pageBgColor: "#ffffff",
    sidebarBg: "#24252c",
    serverName: "TriveInvest-MT5-Live",
    downloadWindowsUrl: defaultWindows,
    downloadMacUrl: defaultAppleMobile,
    downloadIosUrl: defaultAppleMobile,
    downloadAndroidUrl: androidDefault,
    heroTitle: "Download dan Mulai Trading Sekarang",
    heroDescription:
        "Ambil kesempatan Anda sekarang. Tidak semua trader berhasil dengan gaya trading yang sama.",
    pageTitle: "Platform",
    breadcrumbLabel: "Dasbor / Platform",
    labelWindows: "Download MT5 untuk Windows",
    labelMac: "Download MT5 untuk macOS",
    labelIos: "Download MT5 untuk iOS",
    labelAndroid: "Download MT5 untuk Android",
    whatsappUrl: "https://wa.me/628815921000",
    redirectIfNotLoggedIn: true,
    fullViewport: false,
}

addPropertyControls(PlatformClientArea, {
    meApiUrl: {
        type: ControlType.String,
        title: "GET /api/auth/me",
        defaultValue: `${API_BASE}/auth/me`,
    },
    loginUrl: {
        type: ControlType.String,
        title: "Login URL (redirect)",
        defaultValue: `${BASE}/login`,
    },
    accountsUrl: {
        type: ControlType.String,
        title: "Akun URL",
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
    logoUrl: {
        type: ControlType.String,
        title: "Logo URL",
        defaultValue:
            "https://cdn2.triveinvest.co.id/assets/img/sca/sca-logo.png",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent (tombol sidebar)",
        defaultValue: "#69d7f6",
    },
    pageBgColor: {
        type: ControlType.Color,
        title: "Latar konten",
        defaultValue: "#ffffff",
    },
    sidebarBg: {
        type: ControlType.Color,
        title: "Sidebar",
        defaultValue: "#24252c",
    },
    serverName: {
        type: ControlType.String,
        title: "Nama server MT5",
        defaultValue: "TriveInvest-MT5-Live",
    },
    downloadWindowsUrl: {
        type: ControlType.String,
        title: "URL download Windows",
        defaultValue: defaultWindows,
    },
    downloadMacUrl: {
        type: ControlType.String,
        title: "URL download macOS",
        defaultValue: defaultAppleMobile,
    },
    downloadIosUrl: {
        type: ControlType.String,
        title: "URL download iOS",
        defaultValue: defaultAppleMobile,
    },
    downloadAndroidUrl: {
        type: ControlType.String,
        title: "URL download Android",
        defaultValue: androidDefault,
    },
    heroTitle: {
        type: ControlType.String,
        title: "Judul hero",
        defaultValue: "Download dan Mulai Trading Sekarang",
    },
    heroDescription: {
        type: ControlType.String,
        title: "Deskripsi hero",
        displayTextArea: true,
        defaultValue:
            "Ambil kesempatan Anda sekarang. Tidak semua trader berhasil dengan gaya trading yang sama.",
    },
    pageTitle: {
        type: ControlType.String,
        title: "Judul halaman (H1)",
        defaultValue: "Platform",
    },
    breadcrumbLabel: {
        type: ControlType.String,
        title: "Breadcrumb",
        defaultValue: "Dasbor / Platform",
    },
    labelWindows: {
        type: ControlType.String,
        title: "Label tombol Windows",
        defaultValue: "Download MT5 untuk Windows",
    },
    labelMac: {
        type: ControlType.String,
        title: "Label tombol macOS",
        defaultValue: "Download MT5 untuk macOS",
    },
    labelIos: {
        type: ControlType.String,
        title: "Label tombol iOS",
        defaultValue: "Download MT5 untuk iOS",
    },
    labelAndroid: {
        type: ControlType.String,
        title: "Label tombol Android",
        defaultValue: "Download MT5 untuk Android",
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

export default PlatformClientArea
