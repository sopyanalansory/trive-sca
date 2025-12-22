"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+62");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [termsConsent, setTermsConsent] = useState(true);
  const [marketingError, setMarketingError] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [hasInteractedWithMarketing, setHasInteractedWithMarketing] = useState(false);
  const [hasInteractedWithTerms, setHasInteractedWithTerms] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setPasswordError("");
    setHasInteractedWithMarketing(true);
    setHasInteractedWithTerms(true);

    // Validate marketing consent first
    if (!marketingConsent) {
      setMarketingError(true);
      return;
    }

    // Clear marketing error if checkbox is checked
    setMarketingError(false);

    // Validate terms consent
    if (!termsConsent) {
      setTermsError(true);
      return;
    }

    // Clear terms error if checkbox is checked
    setTermsError(false);

    // Validate password match
    if (password !== confirmPassword) {
      setPasswordError("Kata sandi tidak cocok");
      return;
    }

    // Handle registration logic here
    console.log("Registration attempt:", { 
      name, 
      email, 
      countryCode, 
      phone, 
      password, 
      confirmPassword, 
      referralCode, 
      marketingConsent, 
      termsConsent 
    });
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

        {/* Right Section - Register Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 lg:px-8 lg:py-16">
          <div className="w-full relative z-10">
            {/* Register Form Card */}
            <div className="bg-[#ffffffb3] px-[60px] py-[77px] rounded-lg shadow-lg relative z-10">
              <h2 className="text-4xl font-medium text-black mb-6">
                Buka akun
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama lengkap"
                    className="w-full bg-white border border-white rounded-[70px] shadow-none text-[#24252c] text-sm h-[53px] pl-6 pb-0 outline-none placeholder:text-[#9ca3af] focus:outline-none"
                    required
                  />
                </div>

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

                {/* Phone Number Field */}
                <div>
                  <div className="flex gap-2">
                    <div className="relative shrink-0 w-auto min-w-[120px]">
                      <select
                        id="countryCode"
                        name="countryCode"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-full bg-white border border-white rounded-[70px] shadow-none text-[#24252c] text-sm h-[53px] pl-10 pr-8 pb-0 outline-none focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="+62">+62</option>
                      </select>
                      {/* Flag Indonesia */}
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="w-5 h-3.5 flex flex-col">
                          <div className="h-1/2 bg-red-600"></div>
                          <div className="h-1/2 bg-white"></div>
                        </div>
                      </div>
                      {/* Dropdown Arrow */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-[#666666]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ponsel"
                      className="flex-1 bg-white border border-white rounded-[70px] shadow-none text-[#24252c] text-sm h-[53px] pl-6 pb-0 outline-none placeholder:text-[#9ca3af] focus:outline-none"
                      required
                    />
                  </div>
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

                {/* Confirm Password Field */}
                <div>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (passwordError && e.target.value === password) {
                          setPasswordError("");
                        }
                      }}
                      placeholder="Konfirmasi kata sandi"
                      className="w-full bg-white border border-white rounded-[70px] shadow-none text-[#24252c] text-sm h-[53px] pl-6 pr-20 pb-0 outline-none placeholder:text-[#9ca3af] focus:outline-none"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-[#666666] hover:text-black transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {showConfirmPassword ? (
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
                  {passwordError && (
                    <p className="text-sm text-red-600 mt-1 ml-2">
                      {passwordError}
                    </p>
                  )}
                </div>

                {/* Referral Code Field */}
                <div>
                  <input
                    type="text"
                    id="referralCode"
                    name="referralCode"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="Kode Referral"
                    className="w-full bg-white border border-white rounded-[70px] shadow-none text-[#24252c] text-sm h-[53px] pl-6 pb-0 outline-none placeholder:text-[#9ca3af] focus:outline-none"
                  />
                </div>

                {/* Marketing Consent Checkbox */}
                <div>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="marketingConsent"
                      name="marketingConsent"
                      checked={marketingConsent}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setMarketingConsent(isChecked);
                        setHasInteractedWithMarketing(true);
                        // Show error immediately when unchecked, clear when checked
                        if (isChecked) {
                          setMarketingError(false);
                        } else {
                          setMarketingError(true);
                        }
                      }}
                      className="w-4 h-4 mt-0.5 text-[#69d7f6] border-[#d1d5db] rounded focus:ring-[#69d7f6] cursor-pointer accent-[#69d7f6]"
                      required
                    />
                    <label
                      htmlFor="marketingConsent"
                      className="text-sm text-[#666666] cursor-pointer leading-relaxed"
                    >
                      Saya mengkonfirmasi dan memberikan izin kepada Trive Invest untuk menghubungi saya melalui telepon, email, SMS, dan WhatsApp untuk keperluan pemasaran. Saya memahami bahwa saya dapat memilih untuk tidak menerima komunikasi pemasaran setelah mengirimkan aplikasi saya atau pada setiap tahap selama hubungan bisnis saya dengan Trive Invest.
                    </label>
                  </div>
                  {marketingError && (
                    <p className="text-sm text-red-600 mt-1 ml-6">
                      Bidang harus dicentang
                    </p>
                  )}
                </div>

                {/* Terms Consent Checkbox */}
                <div>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="termsConsent"
                      name="termsConsent"
                      checked={termsConsent}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setTermsConsent(isChecked);
                        setHasInteractedWithTerms(true);
                        // Show error immediately when unchecked, clear when checked
                        if (isChecked) {
                          setTermsError(false);
                        } else {
                          setTermsError(true);
                        }
                      }}
                      className="w-4 h-4 mt-0.5 text-[#69d7f6] border-[#d1d5db] rounded focus:ring-[#69d7f6] cursor-pointer accent-[#69d7f6]"
                      required
                    />
                    <label
                      htmlFor="termsConsent"
                      className="text-sm text-[#666666] cursor-pointer leading-relaxed"
                    >
                      Saya mengonfirmasi bahwa saya telah membaca dan memahami{" "}
                      <Link
                        href="/privacy-policy"
                        className="text-[#666666] hover:text-black underline"
                      >
                        Privacy Policy
                      </Link>
                      ,{" "}
                      <Link
                        href="/terms-of-business"
                        className="text-[#666666] hover:text-black underline"
                      >
                        Ketentuan Bisnis
                      </Link>
                    </label>
                  </div>
                  {termsError && (
                    <p className="text-sm text-red-600 mt-1 ml-6">
                      Bidang harus dicentang
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-center">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center bg-[#69d7f6] rounded-[65px] text-[#2b2c24] text-[15px] min-w-[217px] font-medium leading-4 tracking-[-0.03em] pt-4 px-[25px] pb-[13px] text-center transition-colors duration-120 ease hover:bg-[#5bc7e6] focus:outline-none"
                  >
                    Daftar
                  </button>
                </div>

                {/* Login Link */}
                <div className="text-center text-sm text-[#666666] pt-1">
                  Sudah punya akun?{" "}
                  <Link
                    href="/login"
                    className="text-[#2563eb] hover:text-[#1d4ed8] font-medium underline transition-colors"
                  >
                    Masuk
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

