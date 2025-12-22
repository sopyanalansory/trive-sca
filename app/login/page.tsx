"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login attempt:", { email, password, rememberMe });
    
    // Redirect to accounts page after successful login
    router.push("/accounts");
  };

  return (
    <div className="min-h-screen flex bg-[#69d7f6] relative overflow-hidden">
      <div className="w-full max-w-[1170px] mx-auto">
        {/* Two Column Layout */}
        <div className="w-full flex flex-col lg:flex-row relative z-10">
        {/* Left Section - Marketing */}
        <div className="w-full lg:w-1/2 flex flex-col justify-between px-8 py-12 lg:px-16 lg:py-16">
          {/* Logo */}
          <div>
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/logo.svg"
                alt="Trive Invest"
                width={180}
                height={60}
                className="h-[51px] w-auto"
                priority
              />
            </Link>
          </div>

          {/* Marketing Content */}
          <div className="flex-1 flex flex-col justify-start max-w-2xl">
            <h1 className="text-4xl font-medium text-black mb-6 leading-tight">
              Your financial wings to let your <span className="text-white">wealth go beyond.</span>
            </h1>
            <p className="text-base lg:text-lg text-black leading-relaxed">
              Kami di sini untuk membantu Anda meraihnya peluang untuk melampaui
              batas-batas
            </p>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 lg:px-8 lg:py-16">
          <div className="w-full relative z-10">
            {/* Login Form Card */}
            <div className="bg-[#ffffffb3] px-[60px] py-[77px] rounded-lg shadow-lg relative z-10">
              <h2 className="text-4xl font-medium text-black mb-6">
                Masuk ke client area
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full bg-white border border-white rounded-[70px] shadow-none text-[#24252c] text-sm h-[53px] pl-6 pb-0 outline-none placeholder:text-[#9ca3af] focus:outline-none"
                    required
                  />
                </div>

                {/* Password Field */}
                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Kata sandi"
                      className="w-full bg-white border border-white rounded-[70px] shadow-none text-[#24252c] text-sm h-[53px] pl-6 pr-20 pb-0 outline-none placeholder:text-[#9ca3af] focus:outline-none"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[#666666] hover:text-black transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {showPassword ? (
                            <>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                              />
                            </>
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
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Forgot Password */}
                <div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-[#2563eb] hover:text-[#1d4ed8] font-medium underline transition-colors"
                  >
                    Lupa Kata Sandi
                  </Link>
                </div>

                {/* Remember Me & Submit Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      name="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-[#69d7f6] border-[#d1d5db] rounded focus:ring-[#69d7f6] cursor-pointer accent-[#69d7f6]"
                    />
                    <label
                      htmlFor="remember"
                      className="ml-2 text-sm text-[#666666] cursor-pointer"
                    >
                      Ingat saya
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center bg-[#69d7f6] rounded-[65px] text-[#2b2c24] text-[15px] min-w-[217px] font-medium leading-4 tracking-[-0.03em] pt-4 px-[25px] pb-[13px] text-center transition-colors duration-120 ease hover:bg-[#5bc7e6] focus:outline-none"
                  >
                    Masuk
                  </button>
                </div>

                {/* Sign Up Link */}
                <div className="text-center text-sm text-[#666666] pt-1">
                  Belum punya akun?{" "}
                  <Link
                    href="/register"
                    className="text-[#2563eb] hover:text-[#1d4ed8] font-medium underline transition-colors"
                  >
                    Buat Akun
                  </Link>
                </div>
              </form>
            </div>

            {/* Footer below form */}
            <div className="mt-6 relative z-10">
              <div className="text-center text-xs text-black space-y-1.5">
                <p className="font-medium">© Trive Invest 2025</p>
                <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5">
                  <Link
                    href="/privacy-policy"
                    className="text-black hover:text-[#374151] underline"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/terms-of-business"
                    className="text-black hover:text-[#374151] underline"
                  >
                    Terms of Business
                  </Link>
                  <Link
                    href="/risk-notification"
                    className="text-black hover:text-[#374151] underline"
                  >
                    Risk Notification
                  </Link>
                  <Link
                    href="/license"
                    className="text-black hover:text-[#374151] underline"
                  >
                    Licenses
                  </Link>
                </div>
                <p className="text-xs">
                  Call 5/24: 150898 Need help:{" "}
                  <a
                    href="mailto:support@triveinvest.co.id"
                    className="text-black hover:text-[#374151] underline"
                  >
                    support@triveinvest.co.id
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

    </div>
  );
}

