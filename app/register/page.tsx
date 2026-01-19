"use client";

import Image from "next/image";
import Link from "next/link";
import { buildApiUrl } from "@/lib/api-client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+62");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [termsConsent, setTermsConsent] = useState(true);
  const [marketingError, setMarketingError] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [hasInteractedWithMarketing, setHasInteractedWithMarketing] = useState(false);
  const [hasInteractedWithTerms, setHasInteractedWithTerms] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [verificationCodeError, setVerificationCodeError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const router = useRouter();

  // Countdown timer untuk resend code
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Normalisasi nomor HP: hapus 0 di depan atau 62/+62
  const normalizePhoneNumber = (phoneNumber: string): string => {
    // Hanya ambil angka
    let cleaned = phoneNumber.replace(/\D/g, "");
    
    // Jika dimulai dengan 0, hapus 0 di depan
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }
    // Jika dimulai dengan 62, hapus 62 di depan
    else if (cleaned.startsWith("62")) {
      cleaned = cleaned.substring(2);
    }
    
    return cleaned;
  };

  // Get nomor HP yang sudah dinormalisasi (tanpa 0 dan tanpa country code)
  const getNormalizedPhone = (): string => {
    return normalizePhoneNumber(phone);
  };

  // Get nomor HP lengkap dengan country code untuk dikirim ke API
  const getFullPhoneNumber = (): string => {
    const normalized = getNormalizedPhone();
    return countryCode.replace("+", "") + normalized;
  };

  // Validation functions
  const validateName = (nameValue: string): boolean => {
    if (!nameValue.trim()) {
      setNameError("Nama lengkap diperlukan");
      return false;
    }
    if (nameValue.trim().length < 2) {
      setNameError("Nama lengkap minimal 2 karakter");
      return false;
    }
    setNameError("");
    return true;
  };

  const validateEmail = (emailValue: string): boolean => {
    if (!emailValue.trim()) {
      setEmailError("Email diperlukan");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      setEmailError("Email tidak valid");
      return false;
    }
    setEmailError("");
    return true;
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

  const validateVerificationCode = (codeValue: string): boolean => {
    if (!codeValue.trim()) {
      setVerificationCodeError("Kode verifikasi diperlukan");
      return false;
    }
    if (codeValue.trim().length < 4) {
      setVerificationCodeError("Kode verifikasi minimal 4 karakter");
      return false;
    }
    setVerificationCodeError("");
    return true;
  };

  const validatePassword = (passwordValue: string): boolean => {
    if (!passwordValue.trim()) {
      setPasswordError("Kata sandi diperlukan");
      return false;
    }
    if (passwordValue.length < 8 || passwordValue.length > 15) {
      setPasswordError("Kata sandi harus terdiri dari 8-15 karakter");
      return false;
    }
    const hasLowerCase = /[a-z]/.test(passwordValue);
    const hasUpperCase = /[A-Z]/.test(passwordValue);
    const hasNumber = /\d/.test(passwordValue);
    
    if (!hasLowerCase || !hasUpperCase || !hasNumber) {
      setPasswordError("Kata sandi harus berisi huruf kecil, huruf besar, dan angka");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateConfirmPassword = (confirmPasswordValue: string): boolean => {
    if (!confirmPasswordValue.trim()) {
      setConfirmPasswordError("Konfirmasi kata sandi diperlukan");
      return false;
    }
    if (confirmPasswordValue !== password) {
      setConfirmPasswordError("Kata sandi tidak cocok");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  // Change handlers
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (nameError) {
      validateName(e.target.value);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) {
      validateEmail(e.target.value);
    }
  };

  const handlePhoneChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, "");
    setPhone(numericValue);
    if (phoneError) {
      validatePhone(numericValue);
    }
  };

  const handleVerificationCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationCode(e.target.value);
    if (verificationCodeError) {
      validateVerificationCode(e.target.value);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) {
      validatePassword(e.target.value);
    }
    // Re-validate confirm password if it has been filled
    if (confirmPassword && confirmPasswordError) {
      validateConfirmPassword(confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (confirmPasswordError) {
      validateConfirmPassword(e.target.value);
    }
  };

  // Blur handlers
  const handleNameBlur = () => {
    validateName(name);
  };

  const handleEmailBlur = () => {
    validateEmail(email);
  };

  const handlePhoneBlur = () => {
    validatePhone(phone);
  };

  const handleVerificationCodeBlur = () => {
    validateVerificationCode(verificationCode);
  };

  const handlePasswordBlur = () => {
    validatePassword(password);
  };

  const handleConfirmPasswordBlur = () => {
    validateConfirmPassword(confirmPassword);
  };

  const getVerificationButtonText = () => {
    if (isSendingCode) return "Mengirim...";
    if (resendCountdown > 0) return `Kirim Ulang (${resendCountdown}s)`;
    if (isCodeSent) return "Kirim Ulang";
    return "Kirim Kode";
  };

  const handleSendVerificationCode = async () => {
    // Validasi nomor telepon
    const normalizedPhone = getNormalizedPhone();
    if (!normalizedPhone || normalizedPhone.trim() === "") {
      alert("Mohon isi nomor telepon terlebih dahulu");
      return;
    }

    // Validasi panjang nomor HP (minimal 9 digit, maksimal 13 digit untuk Indonesia)
    if (normalizedPhone.length < 9 || normalizedPhone.length > 13) {
      alert("Nomor telepon tidak valid. Mohon masukkan nomor yang benar.");
      return;
    }

    setIsSendingCode(true);
    
    try {
      const response = await fetch(buildApiUrl("/api/auth/send-verification-code"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone,
          countryCode: countryCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Gagal mengirim kode verifikasi. Silakan coba lagi.");
        return;
      }

      setIsCodeSent(true);
      setResendCountdown(60); // Set countdown 60 detik
      
      // In development, show the code in console/alert for testing
      if (data.code) {
        console.log("Verification code (dev only):", data.code);
        alert(`Kode verifikasi (untuk testing): ${data.code}`);
      }
    } catch (error) {
      console.error("Error sending verification code:", error);
      alert("Gagal mengirim kode verifikasi. Silakan coba lagi.");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    
    // Validate all fields
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPhoneValid = validatePhone(phone);
    const isVerificationCodeValid = validateVerificationCode(verificationCode);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    
    setHasInteractedWithMarketing(true);
    setHasInteractedWithTerms(true);

    // Validate marketing consent
    if (!marketingConsent) {
      setMarketingError(true);
    } else {
      setMarketingError(false);
    }

    // Validate terms consent
    if (!termsConsent) {
      setTermsError(true);
    } else {
      setTermsError(false);
    }

    // If any validation fails, return
    if (!isNameValid || !isEmailValid || !isPhoneValid || !isVerificationCodeValid || 
        !isPasswordValid || !isConfirmPasswordValid || !marketingConsent || !termsConsent) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(buildApiUrl("/api/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone,
          countryCode: countryCode,
          password: password,
          verificationCode: verificationCode.trim(),
          referralCode: referralCode.trim() || null,
          marketingConsent: marketingConsent,
          termsConsent: termsConsent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error || "Terjadi kesalahan saat registrasi. Silakan coba lagi.");
        return;
      }

      // Save token to localStorage
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Redirect to accounts page
      router.push("/accounts");
    } catch (error) {
      console.error("Registration error:", error);
      setSubmitError("Terjadi kesalahan saat registrasi. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#69d7f6] relative overflow-hidden">
      <div className="w-full max-w-[1170px] mx-auto">
        {/* Two Column Layout */}
        <div className="w-full flex flex-col lg:flex-row relative z-10">
        {/* Left Section - Marketing */}
        <div className="w-full lg:w-1/2 flex flex-col justify-between px-4 py-6 sm:px-8 sm:py-12 lg:px-16 lg:py-16">
          {/* Logo */}
          <div className="w-full flex justify-center lg:justify-start items-start">
            <Link href="/" className="inline-block mb-4 sm:mb-6">
              <Image
                src="/logo.svg"
                alt="Trive Invest"
                width={180}
                height={60}
                className="h-[40px] sm:h-[51px] w-auto"
                priority
              />
            </Link>
          </div>

          {/* Marketing Content */}
          <div className="flex-1 flex flex-col justify-start max-w-2xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-black mb-4 sm:mb-6 leading-tight">
              Your financial wings to let your <span className="text-white">wealth go beyond.</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-black leading-relaxed">
              Kami di sini untuk membantu Anda meraihnya peluang untuk melampaui
              batas-batas
            </p>
          </div>
        </div>

        {/* Right Section - Register Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-6 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="w-full relative z-10">
            {/* Register Form Card */}
            <div className="bg-[#ffffffb3] px-4 py-6 sm:px-8 sm:py-10 md:px-[40px] md:py-[50px] lg:px-[60px] lg:py-[77px] rounded-lg shadow-lg relative z-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-black mb-4 sm:mb-6">
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
                    onChange={handleNameChange}
                    onBlur={handleNameBlur}
                    placeholder="Nama lengkap"
                    className={`w-full bg-white border rounded-[70px] shadow-none text-[#24252c] text-sm h-[53px] pl-6 pb-0 outline-none placeholder:text-[#9ca3af] focus:outline-none ${
                      nameError ? "border-red-500" : "border-white"
                    }`}
                    required
                  />
                  {nameError && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1 ml-2">{nameError}</p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    placeholder="Email"
                    className={`w-full bg-white border rounded-[70px] shadow-none text-[#24252c] text-sm h-[53px] pl-6 pb-0 outline-none placeholder:text-[#9ca3af] focus:outline-none ${
                      emailError ? "border-red-500" : "border-white"
                    }`}
                    required
                  />
                  {emailError && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1 ml-2">{emailError}</p>
                  )}
                </div>

                {/* Phone Number Field */}
                <div>
                  <div className="flex flex-row gap-1.5 sm:gap-2 min-w-0">
                    <div className="relative shrink-0 w-auto min-w-[75px] sm:min-w-[100px] lg:min-w-[120px]">
                      <select
                        id="countryCode"
                        name="countryCode"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-full bg-white border border-white rounded-[70px] shadow-none text-[#24252c] text-xs sm:text-sm h-[53px] pl-7 sm:pl-10 pr-5 sm:pr-8 pb-0 outline-none focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="+62">+62</option>
                      </select>
                      {/* Flag Indonesia */}
                      <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="w-3.5 h-2.5 sm:w-5 sm:h-3.5 flex flex-col">
                          <div className="h-1/2 bg-red-600"></div>
                          <div className="h-1/2 bg-white"></div>
                        </div>
                      </div>
                      {/* Dropdown Arrow */}
                      <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 text-[#666666]"
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
                      onChange={handlePhoneChangeWithValidation}
                      onBlur={handlePhoneBlur}
                      placeholder="Ponsel"
                      className={`flex-1 min-w-0 bg-white border rounded-[70px] shadow-none text-[#24252c] text-sm h-[53px] pl-4 sm:pl-6 pb-0 outline-none placeholder:text-[#9ca3af] focus:outline-none ${
                        phoneError ? "border-red-500" : "border-white"
                      }`}
                      required
                    />
                  </div>
                  {phoneError && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1 ml-2">{phoneError}</p>
                  )}
                </div>

                {/* Verification Code Field */}
                <div>
                  <div className="flex flex-row gap-1.5 sm:gap-2 min-w-0">
                    <input
                      type="text"
                      id="verificationCode"
                      name="verificationCode"
                      value={verificationCode}
                      onChange={handleVerificationCodeChange}
                      onBlur={handleVerificationCodeBlur}
                      placeholder="Kode verifikasi"
                      className={`flex-1 min-w-0 bg-white border rounded-[70px] shadow-none text-[#24252c] text-sm h-[53px] pl-4 sm:pl-6 pb-0 outline-none placeholder:text-[#9ca3af] focus:outline-none ${
                        verificationCodeError ? "border-red-500" : "border-white"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSendVerificationCode}
                      disabled={resendCountdown > 0 || isSendingCode || !phone}
                      className="shrink-0 bg-[#24252c] text-white text-[10px] sm:text-xs md:text-sm font-medium rounded-[70px] px-3 sm:px-3 md:px-4 h-[53px] whitespace-nowrap transition-colors duration-120 ease hover:bg-[#1a1b20] disabled:bg-[#d1d5db] disabled:text-[#9ca3af] disabled:cursor-not-allowed focus:outline-none"
                    >
                      {getVerificationButtonText()}
                    </button>
                  </div>
                  {verificationCodeError && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1 ml-2">{verificationCodeError}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={password}
                      onChange={handlePasswordChange}
                      onBlur={handlePasswordBlur}
                      placeholder="Kata sandi"
                      className={`w-full bg-white border rounded-[70px] shadow-none text-[#24252c] text-sm h-[53px] pl-6 pr-20 pb-0 outline-none placeholder:text-[#9ca3af] focus:outline-none ${
                        passwordError ? "border-red-500" : "border-white"
                      }`}
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
                  {passwordError && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1 ml-2">{passwordError}</p>
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
                      onChange={handleConfirmPasswordChange}
                      onBlur={handleConfirmPasswordBlur}
                      placeholder="Konfirmasi kata sandi"
                      className={`w-full bg-white border rounded-[70px] shadow-none text-[#24252c] text-sm h-[53px] pl-6 pr-20 pb-0 outline-none placeholder:text-[#9ca3af] focus:outline-none ${
                        confirmPasswordError ? "border-red-500" : "border-white"
                      }`}
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
                  {confirmPasswordError && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1 ml-2">{confirmPasswordError}</p>
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
                      className="text-xs sm:text-sm text-[#666666] cursor-pointer leading-relaxed"
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
                      className="text-xs sm:text-sm text-[#666666] cursor-pointer leading-relaxed"
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

                {/* Submit Error */}
                {submitError && (
                  <div className="mb-4">
                    <p className="text-red-500 text-xs sm:text-sm ml-2">{submitError}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex items-center justify-center">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center bg-[#69d7f6] rounded-[65px] text-[#2b2c24] text-sm sm:text-[15px] min-w-[217px] font-medium leading-4 tracking-[-0.03em] pt-4 px-[25px] pb-[13px] text-center transition-colors duration-120 ease hover:bg-[#5bc7e6] focus:outline-none disabled:bg-[#d1d5db] disabled:text-[#9ca3af] disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Mendaftar..." : "Daftar"}
                  </button>
                </div>

                {/* Login Link */}
                <div className="text-center text-xs sm:text-sm text-[#666666] pt-1">
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
            <div className="mt-4 sm:mt-6 relative z-10">
              <div className="text-center text-[10px] sm:text-xs text-black space-y-1 sm:space-y-1.5">
                <p className="font-medium">© Trive Invest 2025</p>
                <div className="flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-2.5 gap-y-0.5">
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
                <p className="text-[10px] sm:text-xs">
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

