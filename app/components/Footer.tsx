import Link from "next/link";

interface FooterProps {
  variant?: "default" | "transparent";
}

export default function Footer({ variant = "default" }: FooterProps) {
  const bgClass = variant === "transparent" ? "bg-transparent" : "bg-gray-100";
  const textClass = variant === "transparent" ? "text-black" : "text-[#1e293b]";
  
  return (
    <footer className={`${bgClass} py-6 px-4 lg:px-8`}>
      <div className="max-w-7xl mx-auto">

      <div className={`flex flex-wrap items-center justify-center gap-4 mb-3 lg:gap-6 text-sm lg:text-base ${textClass}`}>
          <span>Chat Support: <a href="https://wa.me/628815921000" className="hover:text-[#69d7f6] transition-colors">+628815921000</a></span>
          <span className="hidden lg:inline">|</span>
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
        
        {/* First Line */}
        <div className={`flex flex-wrap items-center justify-center gap-4 lg:gap-6 mb-3 text-sm lg:text-base ${textClass}`}>
          <span>© Trive Invest 2025</span>
          <span className="hidden lg:inline">|</span>
          <Link 
            href="https://www.triveinvest.co.id/perusahaan/siapa-kami" 
            className="hover:text-[69d7f6] transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="hidden lg:inline">|</span>
          <Link 
            href="https://www.triveinvest.co.id/perusahaan/siapa-kami" 
            className="hover:text-[#69d7f6] transition-colors"
          >
            Terms Of Business
          </Link>
          <span className="hidden lg:inline">|</span>
          <Link 
            href="https://www.triveinvest.co.id/perusahaan/siapa-kami" 
            className="hover:text-[#69d7f6] transition-colors"
          >
            Risk Notification
          </Link>
          <span className="hidden lg:inline">|</span>
          <Link 
            href="https://www.triveinvest.co.id/perusahaan/siapa-kami" 
            className="hover:text-[#69d7f6] transition-colors"
          >
            Licenses
          </Link>
        </div>

        {/* Second Line */}
        <div className={`flex flex-wrap items-center justify-center gap-4 lg:gap-6 text-sm lg:text-base ${textClass}`}>
          <span>Call 5/24: <a href="tel:150898" className="hover:text-[#69d7f6] transition-colors">150898</a></span>
          <span className="hidden lg:inline">|</span>
          <span>
            Email:{" "}
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
