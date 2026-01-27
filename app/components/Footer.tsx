import Link from "next/link";

interface FooterProps {
  variant?: "default" | "transparent";
}

export default function Footer({ variant = "default" }: FooterProps) {
  const bgClass = variant === "transparent" ? "bg-transparent" : "bg-gray-100";
  const textClass = variant === "transparent" ? "text-black" : "text-[#1e293b]";
  
  return (
    <footer className={`${bgClass} py-4 px-4 lg:px-8`}>
      <div className="max-w-7xl mx-auto">
        {/* First Line */}
        <div className={`flex flex-wrap items-center gap-3 mb-2 text-xs ${textClass}`}>
          <span>© Trive Invest 2026</span>
          <Link 
            href="https://cdn2.triveinvest.co.id/pdf/legalitas/Privacy-Policy.pdf" 
            className="hover:text-[#69d7f6] transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </Link>
          <Link 
            href="https://cdn2.triveinvest.co.id/pdf/legalitas/Terms_of_Business.pdf" 
            className="hover:text-[#69d7f6] transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Business
          </Link>
          <Link 
            href="https://www.triveinvest.co.id/perusahaan/legalitas" 
            className="hover:text-[#69d7f6] transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Risk Notification
          </Link>
          <Link 
            href="https://www.triveinvest.co.id/perusahaan/regulasi-kami" 
            className="hover:text-[#69d7f6] transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Licenses
          </Link>
        </div>

        {/* Second Line - Chat Support */}
        <div className={`flex flex-wrap items-center gap-3 mb-2 text-xs ${textClass}`}>
          <span>Chat Support: <a href="https://wa.me/628815921000" className="hover:text-[#69d7f6] transition-colors">+628815921000</a></span>
          <span>
            Chat Account Manager Anda:{" "}
            <a 
              href="https://wa.me/628881683000" 
              className="hover:text-[#69d7f6] transition-colors"
            >
              +628881683000
            </a>
          </span>
        </div>

        {/* Third Line - Call and Email */}
        <div className={`flex flex-wrap items-center gap-3 text-xs font-bold ${textClass}`}>
          <span>Call 5/24: <a href="tel:150898" className="hover:text-[#69d7f6] transition-colors">150898</a></span>
          <span>
            Need help:{" "}
            <a 
              href="mailto:support@triveinvest.co.id" 
              className="hover:text-[#69d7f6] transition-colors"
            >
              support@triveinvest.co.id
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
