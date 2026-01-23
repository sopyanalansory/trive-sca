"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countryCode, setCountryCode] = useState("+62");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [otpError, setOtpError] = useState("");

  // Normalisasi nomor HP: hapus 0 di depan atau 62/+62
  const normalizePhoneNumber = (phoneNumber: string): string => {
    let cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    } else if (cleaned.startsWith("62")) {
      cleaned = cleaned.substring(2);
    }
    return cleaned;
  };

  const validatePhone = (phoneValue: string): boolean => {
    const normalized = normalizePhoneNumber(phoneValue);
    if (!normalized || normalized.trim() === "") {
      setPhoneError("Nomor telepon diperlukan");
      return false;
    }
    if (normalized.length < 9 || normalized.length > 13) {
      setPhoneError("Nomor telepon harus 9-13 digit");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const validatePassword = (passwordValue: string): boolean => {
    if (!passwordValue.trim()) {
      setPasswordError("Password diperlukan");
      return false;
    }
    if (passwordValue.length < 8 || passwordValue.length > 15) {
      setPasswordError("Password harus terdiri dari 8-15 karakter");
      return false;
    }
    const hasLowerCase = /[a-z]/.test(passwordValue);
    const hasUpperCase = /[A-Z]/.test(passwordValue);
    const hasNumber = /\d/.test(passwordValue);
    
    if (!hasLowerCase || !hasUpperCase || !hasNumber) {
      setPasswordError("Password harus berisi huruf kecil, huruf besar, dan angka");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhone(phone)) {
      return;
    }

    setIsSendingOtp(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(buildApiUrl("/api/auth/send-reset-password-otp"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone.trim(),
          countryCode: countryCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Gagal mengirim kode OTP. Silakan coba lagi.");
        return;
      }

      setSuccess(data.message || "Kode OTP telah dikirim ke WhatsApp Anda");
      
      // Show OTP in development mode
      if (data.code) {
        console.log("OTP (dev only):", data.code);
        setSuccess(`Kode OTP telah dikirim. Kode (untuk testing): ${data.code}`);
      }

      // Move to OTP step
      setStep("otp");
    } catch (error) {
      console.error("Send OTP error:", error);
      setError("Gagal mengirim kode OTP. Silakan coba lagi.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      setOtpError("Kode OTP diperlukan");
      return;
    }
    setOtpError("");

    if (!validatePassword(newPassword)) {
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Password dan konfirmasi password tidak sama");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(buildApiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone.trim(),
          countryCode: countryCode,
          otp: otp.trim(),
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Gagal reset password. Silakan coba lagi.");
        return;
      }

      setSuccess(data.message || "Password berhasil direset");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      console.error("Reset password error:", error);
      setError("Gagal reset password. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
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
                  {step === "phone" ? "Lupa Kata Sandi" : "Reset Kata Sandi"}
                </h2>

                {step === "phone" ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <p className="text-sm text-[#666666] mb-4">
                      Masukkan nomor WhatsApp Anda. Kami akan mengirim kode OTP ke WhatsApp Anda.
                    </p>

                    {/* Phone Field with Country Code */}
                    <div className="flex gap-2">
                      <div className="w-[120px]">
                        <select
                          id="countryCode"
                          name="countryCode"
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="w-full bg-white border border-white rounded-[70px] shadow-none text-[#24252c] text-xs sm:text-sm h-[53px] pl-7 sm:pl-10 pr-5 sm:pr-8 pb-0 outline-none focus:outline-none appearance-none cursor-pointer"
                        >
                          <option value="+62">+62</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={phone}
                          onChange={(e) => {
                            const numericValue = e.target.value.replace(/\D/g, "");
                            setPhone(numericValue);
                            setPhoneError("");
                            setError("");
                          }}
                          onBlur={() => validatePhone(phone)}
                          placeholder="Nomor WhatsApp"
                          className={`w-full bg-white border rounded-[70px] shadow-none text-[#24252c] text-sm h-[53px] pl-6 pb-0 outline-none placeholder:text-[#9ca3af] focus:outline-none ${
                            phoneError ? "border-red-500" : "border-white"
                          }`}
                          required
                        />
                        {phoneError && (
                          <p className="text-red-500 text-xs mt-1 ml-2">{phoneError}</p>
                        )}
                      </div>
                    </div>

                    {error && (
                      <div className="mb-4">
                        <p className="text-red-500 text-sm pl-2">{error}</p>
                      </div>
                    )}

                    {success && (
                      <div className="mb-4">
                        <p className="text-green-600 text-sm pl-2">{success}</p>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex items-center justify-center pt-4">
                      <button
                        type="submit"
                        disabled={isSendingOtp}
                        className="inline-flex items-center justify-center bg-[#2b2c24] rounded-[65px] text-white text-[15px] min-w-[217px] font-medium leading-4 tracking-[-0.03em] pt-4 px-[25px] pb-[13px] text-center transition-colors duration-[120ms] ease hover:bg-[#1a1b1c] focus:outline-none disabled:bg-[#d1d5db] disabled:text-[#9ca3af] disabled:cursor-not-allowed"
                      >
                        {isSendingOtp ? "Mengirim..." : "Kirim Kode OTP"}
                      </button>
                    </div>

                    {/* Back to Login Link */}
                    <div className="text-center text-sm text-[#666666] pt-1">
                      <Link
                        href="/login"
                        className="text-[#2563eb] hover:text-[#1d4ed8] font-medium underline transition-colors"
                      >
                        Kembali ke halaman masuk
                      </Link>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <p className="text-sm text-[#666666] mb-4">
                      Masukkan kode OTP yang dikirim ke WhatsApp Anda dan password baru.
                    </p>

                    {/* Phone (read-only) */}
                    <div className="flex gap-2">
                      <div className="w-[120px]">
                        <input
                          type="text"
                          value={countryCode}
                          disabled
                          className="w-full bg-gray-100 border border-gray-300 rounded-[70px] shadow-none text-[#24252c] text-xs sm:text-sm h-[53px] pl-7 sm:pl-10 pr-5 sm:pr-8 pb-0 outline-none cursor-not-allowed"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="tel"
                          value={phone}
                          disabled
                          className="w-full bg-gray-100 border border-gray-300 rounded-[70px] shadow-none text-[#24252c] text-sm h-[53px] pl-6 pb-0 outline-none cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* OTP Field */}
                    <div>
                      <input
                        type="text"
                        id="otp"
                        name="otp"
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 5));
                          setOtpError("");
                          setError("");
                        }}
                        placeholder="Kode OTP (5 digit)"
                        maxLength={5}
                        className={`w-full bg-white border rounded-[70px] shadow-none text-[#24252c] text-sm h-[53px] pl-6 pb-0 outline-none placeholder:text-[#9ca3af] focus:outline-none ${
                          otpError ? "border-red-500" : "border-white"
                        }`}
                        required
                      />
                      {otpError && (
                        <p className="text-red-500 text-xs mt-1 ml-2">{otpError}</p>
                      )}
                    </div>

                    {/* New Password Field */}
                    <div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="newPassword"
                          name="newPassword"
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            setPasswordError("");
                            setError("");
                          }}
                          onBlur={() => validatePassword(newPassword)}
                          placeholder="Password Baru"
                          className={`w-full bg-white border rounded-[70px] shadow-none text-[#24252c] text-sm h-[53px] pl-6 pr-12 pb-0 outline-none placeholder:text-[#9ca3af] focus:outline-none ${
                            passwordError ? "border-red-500" : "border-white"
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-black transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            {showPassword ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                              />
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
                      {passwordError && (
                        <p className="text-red-500 text-xs mt-1 ml-2">{passwordError}</p>
                      )}
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
                            setPasswordError("");
                            setError("");
                          }}
                          placeholder="Konfirmasi Password"
                          className={`w-full bg-white border rounded-[70px] shadow-none text-[#24252c] text-sm h-[53px] pl-6 pr-12 pb-0 outline-none placeholder:text-[#9ca3af] focus:outline-none ${
                            passwordError ? "border-red-500" : "border-white"
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-black transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            {showConfirmPassword ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                              />
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

                    {error && (
                      <div className="mb-4">
                        <p className="text-red-500 text-sm pl-2">{error}</p>
                      </div>
                    )}

                    {success && (
                      <div className="mb-4">
                        <p className="text-green-600 text-sm pl-2">{success}</p>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex items-center justify-center pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center bg-[#2b2c24] rounded-[65px] text-white text-[15px] min-w-[217px] font-medium leading-4 tracking-[-0.03em] pt-4 px-[25px] pb-[13px] text-center transition-colors duration-[120ms] ease hover:bg-[#1a1b1c] focus:outline-none disabled:bg-[#d1d5db] disabled:text-[#9ca3af] disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "Mengatur ulang..." : "Atur ulang kata sandi"}
                      </button>
                    </div>

                    {/* Back to phone step */}
                    <div className="text-center text-sm text-[#666666] pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStep("phone");
                          setOtp("");
                          setNewPassword("");
                          setConfirmPassword("");
                          setError("");
                          setSuccess("");
                        }}
                        className="text-[#2563eb] hover:text-[#1d4ed8] font-medium underline transition-colors"
                      >
                        Kembali
                      </button>
                    </div>
                  </form>
                )}
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
