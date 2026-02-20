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

  const firstLineClass = variant === "transparent"
    ? "flex flex-nowrap items-baseline gap-3 mb-2 text-xs overflow-x-auto"
    : "flex flex-wrap items-baseline gap-3 mb-2 text-xs";

  const paddingClass = variant === "transparent" ? "py-4 px-0 sm:px-2" : "py-4 px-4 lg:px-8";

  return (
    <footer className={`${bgClass} ${paddingClass}`}>
      <div className="max-w-7xl mx-auto">
        {/* First Line - Copyright + Legal links (transparent: full width, no wrap) */}
        <div className={`${firstLineClass} ${textClass}`}>
          <span>© Trive Invest 2026</span>
          <Link
            href="https://cdn2.triveinvest.co.id/pdf/legalitas/Privacy-Policy.pdf"
            className={linkCls}
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </Link>
          <Link
            href="https://cdn2.triveinvest.co.id/pdf/legalitas/Terms_of_Business.pdf"
            className={linkCls}
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Business
          </Link>
          <Link
            href="https://www.triveinvest.co.id/perusahaan/legalitas"
            className={linkCls}
            target="_blank"
            rel="noopener noreferrer"
          >
            Risk Notification
          </Link>
          <Link
            href="https://www.triveinvest.co.id/perusahaan/regulasi-kami"
            className={linkCls}
            target="_blank"
            rel="noopener noreferrer"
          >
            Licenses
          </Link>
        </div>

        {variant === "transparent" ? (
          /* Transparent variant (login/register): Call + Email only, centered */
          <div className={`flex flex-wrap items-baseline justify-center gap-3 text-xs font-bold ${textClass}`}>
            <span>Call 5/24: 150898</span>
            <span>
              Need help:{" "}
              <a href="mailto:support@triveinvest.co.id" className={linkCls}>
                support@triveinvest.co.id
              </a>
            </span>
          </div>
        ) : (
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
