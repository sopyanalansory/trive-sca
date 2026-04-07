import * as React from "react"

/** Auth login/register footer: two centered rows (legal + contact), on page background. */
export function AuthPageFooter() {
    const linkLegal: React.CSSProperties = {
        color: "#000000",
        textDecoration: "underline",
        fontWeight: 500,
    }
    const linkMail: React.CSSProperties = {
        color: "#000000",
        textDecoration: "underline",
        fontWeight: 700,
    }

    const row1: React.CSSProperties = {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "baseline",
        columnGap: 10,
        rowGap: 6,
        marginBottom: 10,
        color: "#000000",
        textAlign: "center",
    }

    const row2: React.CSSProperties = {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "baseline",
        columnGap: 10,
        rowGap: 6,
        color: "#000000",
        fontWeight: 700,
        textAlign: "center",
    }

    return (
        <footer
            className="auth-page-footer"
            style={{
                backgroundColor: "transparent",
                padding: "20px 16px",
                boxSizing: "border-box",
                width: "100%",
            }}
        >
            <style>{`
                .auth-page-footer-line1 { font-size: 11px; }
                .auth-page-footer-line2 { font-size: 11px; }
                @media (min-width: 640px) {
                    .auth-page-footer { padding: 20px 12px; }
                    .auth-page-footer-line1,
                    .auth-page-footer-line2 { font-size: 12px; }
                }
            `}</style>
            <div
                style={{
                    maxWidth: "1280px",
                    margin: "0 auto",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                }}
            >
                <div className="auth-page-footer-line1" style={row1}>
                    <span style={{ fontWeight: 400 }}>© Trive Invest 2026</span>
                    <a
                        href="https://cdn2.triveinvest.co.id/pdf/legalitas/Privacy-Policy.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkLegal}
                    >
                        Privacy Policy
                    </a>
                    <a
                        href="https://cdn2.triveinvest.co.id/pdf/legalitas/Terms_of_Business.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkLegal}
                    >
                        Terms of Business
                    </a>
                    <a
                        href="https://www.triveinvest.co.id/perusahaan/legalitas"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkLegal}
                    >
                        Risk Notification
                    </a>
                    <a
                        href="https://www.triveinvest.co.id/perusahaan/regulasi-kami"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkLegal}
                    >
                        Licenses
                    </a>
                </div>
                <div className="auth-page-footer-line2" style={row2}>
                    <span>Call 5/24: 150898</span>
                    <span>
                        Need help:{" "}
                        <a
                            href="mailto:support@triveinvest.co.id"
                            style={linkMail}
                        >
                            support@triveinvest.co.id
                        </a>
                    </span>
                </div>
            </div>
        </footer>
    )
}
