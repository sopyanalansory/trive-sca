"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle forgot password logic here
    console.log("Forgot password attempt:", { email });
  };

  return (
    <div className="min-h-screen flex bg-[#69d7f6] relative overflow-hidden">
      <div className="w-full max-w-[1170px] mx-auto">
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

          {/* Right Section - Forgot Password Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 lg:px-8 lg:py-16">
            <div className="w-full relative z-10">
              {/* Forgot Password Form Card */}
              <div className="bg-[#ffffffb3] px-[60px] py-[77px] rounded-lg shadow-lg relative z-10">
                <h2 className="text-4xl font-medium text-black mb-6">
                  Lupa Kata Sandi
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

                  {/* Submit Button */}
                  <div className="flex items-center justify-center pt-4">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center bg-[#2b2c24] rounded-[65px] text-white text-[15px] min-w-[217px] font-medium leading-4 tracking-[-0.03em] pt-4 px-[25px] pb-[13px] text-center transition-colors duration-[120ms] ease hover:bg-[#1a1b1c] focus:outline-none"
                    >
                      Atur ulang kata sandi
                    </button>
                  </div>

                  {/* Back to Login Link */}
                  {/* <div className="text-center text-sm text-[#666666] pt-1">
                    <Link
                      href="/login"
                      className="text-[#2563eb] hover:text-[#1d4ed8] font-medium underline transition-colors"
                    >
                      Kembali ke halaman masuk
                    </Link>
                  </div> */}
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

