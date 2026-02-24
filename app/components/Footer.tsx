import Link from "next/link";

interface FooterProps {
  variant?: "default" | "transparent";
}

const linkClass = "underline";
const linkClassDefault = "hover:text-[#69d7f6] transition-colors";

export default function Footer({ variant = "default" }: FooterProps) {
  const bgClass = variant === "transparent" ? "bg-transparent" : "bg-gray-100";
  const textClass = variant === "transparent" ? "text-black" : "text-[#1e293b]";
  const useUnderline = variant === "transparent";
  const linkCls = useUnderline ? linkClass : linkClassDefault;
  const linkRedirectCls = `${linkCls} font-medium ${variant === "transparent" ? "text-black hover:text-black" : "text-[#1e293b] hover:text-[#1e293b]"}`; // font-medium (lebih tipis), warna hitam untuk link redirect

  const firstLineClass = variant === "transparent"
    ? "flex flex-wrap items-baseline gap-x-2 gap-y-1.5 sm:gap-x-3 sm:gap-y-0 mb-3 text-[11px] sm:text-xs"
    : "flex flex-wrap items-baseline gap-3 mb-2 text-xs";

  const paddingClass = variant === "transparent" ? "py-5 px-4 sm:px-2" : "py-4 px-4 lg:px-8";

  return (
    <footer className={`${bgClass} ${paddingClass}`}>
      <div className="max-w-7xl mx-auto">
        {variant === "transparent" ? (
          <>
            {/* Mobile: 4 baris seperti referensi (kiri-aligned) */}
            <div className="sm:hidden space-y-2 text-[11px] text-left">
              <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${textClass}`}>
                <Link href="https://cdn2.triveinvest.co.id/pdf/legalitas/Privacy-Policy.pdf" className={linkRedirectCls} target="_blank" rel="noopener noreferrer">Privacy Policy</Link>
                <Link href="https://cdn2.triveinvest.co.id/pdf/legalitas/Terms_of_Business.pdf" className={linkRedirectCls} target="_blank" rel="noopener noreferrer">Terms of Business</Link>
              </div>
              <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${textClass}`}>
                <Link href="https://www.triveinvest.co.id/perusahaan/legalitas" className={linkRedirectCls} target="_blank" rel="noopener noreferrer">Risk Notification</Link>
                <Link href="https://www.triveinvest.co.id/perusahaan/regulasi-kami" className={linkRedirectCls} target="_blank" rel="noopener noreferrer">Licenses</Link>
                <span>© Trive Invest 2026</span>
              </div>
              <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 font-bold ${textClass}`}>
                <span>Call 5/24: 150898</span>
                <span>
                  Need help:{" "}
                  <a href="mailto:support@triveinvest.co.id" className={linkCls}>support@triveinvest.co.id</a>
                </span>
              </div>
            </div>

            {/* Desktop: layout asli (satu baris link + baris Call/Need help centered) */}
            <div className="hidden sm:block">
              <div className={`${firstLineClass} ${textClass}`}>
                <span>© Trive Invest 2026</span>
                <Link href="https://cdn2.triveinvest.co.id/pdf/legalitas/Privacy-Policy.pdf" className={linkRedirectCls} target="_blank" rel="noopener noreferrer">Privacy Policy</Link>
                <Link href="https://cdn2.triveinvest.co.id/pdf/legalitas/Terms_of_Business.pdf" className={linkRedirectCls} target="_blank" rel="noopener noreferrer">Terms of Business</Link>
                <Link href="https://www.triveinvest.co.id/perusahaan/legalitas" className={linkRedirectCls} target="_blank" rel="noopener noreferrer">Risk Notification</Link>
                <Link href="https://www.triveinvest.co.id/perusahaan/regulasi-kami" className={linkRedirectCls} target="_blank" rel="noopener noreferrer">Licenses</Link>
              </div>
              <div className={`flex flex-wrap items-baseline justify-center gap-3 text-xs font-bold ${textClass}`}>
                <span>Call 5/24: 150898</span>
                <span>
                  Need help:{" "}
                  <a href="mailto:support@triveinvest.co.id" className={linkCls}>support@triveinvest.co.id</a>
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Default variant: First Line - Copyright + Legal links */}
            <div className={`${firstLineClass} ${textClass}`}>
              <span>© Trive Invest 2026</span>
              <Link href="https://cdn2.triveinvest.co.id/pdf/legalitas/Privacy-Policy.pdf" className={linkRedirectCls} target="_blank" rel="noopener noreferrer">Privacy Policy</Link>
              <Link href="https://cdn2.triveinvest.co.id/pdf/legalitas/Terms_of_Business.pdf" className={linkRedirectCls} target="_blank" rel="noopener noreferrer">Terms of Business</Link>
              <Link href="https://www.triveinvest.co.id/perusahaan/legalitas" className={linkRedirectCls} target="_blank" rel="noopener noreferrer">Risk Notification</Link>
              <Link href="https://www.triveinvest.co.id/perusahaan/regulasi-kami" className={linkRedirectCls} target="_blank" rel="noopener noreferrer">Licenses</Link>
            </div>
          </>
        )}

        {variant !== "transparent" && (
          <>
            {/* Second Line - Chat Support */}
            <div className={`flex flex-wrap items-center gap-3 mb-2 text-xs ${textClass}`}>
              <span>Chat Support: <a href="https://wa.me/628815921000" className={linkCls}>+628815921000</a></span>
              <span>
                Chat Account Manager Anda:{" "}
                <a href="https://wa.me/628881683000" className={linkCls}>+628881683000</a>
              </span>
            </div>
            {/* Third Line - Call and Email */}
            <div className={`flex flex-wrap items-center gap-3 text-xs font-bold ${textClass}`}>
              <span>Call 5/24: <a href="tel:150898" className={linkCls}>150898</a></span>
              <span>
                Need help:{" "}
                <a href="mailto:support@triveinvest.co.id" className={linkCls}>support@triveinvest.co.id</a>
              </span>
            </div>
          </>
        )}
      </div>
    </footer>
  );
}
