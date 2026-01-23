"use client";

import Image from "next/image";
import Link from "next/link";
import { buildApiUrl } from "@/lib/api-client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Footer from "../components/Footer";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetPasswordOption, setShowResetPasswordOption] = useState(false);
  const router = useRouter();

  // Check if user already has token, redirect to accounts
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/accounts");
    }
  }, [router]);

  // Load saved email from localStorage (only email, not password for security)
  // Password should be handled by browser password manager (more secure)
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    // Don't load password from localStorage - let browser password manager handle it
  }, []);

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

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setLoginError(""); // Clear login error when user types
    if (emailError) {
      validateEmail(e.target.value);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setLoginError(""); // Clear login error when user types
    if (passwordError) {
      validatePassword(e.target.value);
    }
  };

  const handleEmailBlur = () => {
    validateEmail(email);
  };

  const handlePasswordBlur = () => {
    validatePassword(password);
  };

  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setRememberMe(isChecked);
    
    // If unchecking, remove saved email (password is handled by browser)
    if (!isChecked) {
      localStorage.removeItem("rememberedEmail");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    // Clear previous login error
    setLoginError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(buildApiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.error || "Terjadi kesalahan saat login. Silakan coba lagi.");
        // Show reset password option if password is wrong
        if (data.errorType === 'wrong_password' && data.email) {
          setShowResetPasswordOption(true);
        } else {
          setShowResetPasswordOption(false);
        }
        return;
      }

      // Clear reset password option on successful login
      setShowResetPasswordOption(false);

      // Save token to localStorage
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      
      // Handle remember me functionality
      // Only save email to localStorage (not password for security)
      // Password should be handled by browser password manager (more secure)
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      // Never save password to localStorage - let browser password manager handle it
      
      // Redirect to accounts page after successful login
      router.push("/accounts");
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Terjadi kesalahan saat login. Silakan coba lagi.");
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
        <div className="w-full lg:w-1/2 flex flex-col justify-between px-4 sm:px-6 md:px-8 py-8 sm:py-10 lg:px-16 lg:py-16">
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

        {/* Right Section - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 py-4 sm:py-10 lg:px-8 lg:py-16">
          <div className="w-full max-w-md lg:max-w-none relative z-10">
            {/* Login Form Card */}
            <div className="bg-[#ffffffb3] px-6 sm:px-8 md:px-12 lg:px-[60px] py-8 sm:py-10 md:py-12 lg:py-[77px] rounded-lg shadow-lg relative z-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-black mb-4 sm:mb-6">
                Masuk ke client area
              </h2>
              <form onSubmit={handleSubmit} method="post" className="space-y-4" name="loginForm" id="loginForm">
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
                    autoComplete="email"
                    className={`w-full bg-white border rounded-[70px] shadow-none text-[#24252c] text-sm h-[48px] sm:h-[53px] pl-4 sm:pl-6 pb-0 outline-none placeholder:text-[#9ca3af] focus:outline-none ${
                      emailError ? "border-red-500" : "border-white"
                    }`}
                  />
                  {emailError && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1 ml-2">{emailError}</p>
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
                      autoComplete="current-password"
                      className={`w-full bg-white border rounded-[70px] shadow-none text-[#24252c] text-sm h-[48px] sm:h-[53px] pl-4 sm:pl-6 pr-20 sm:pr-24 pb-0 outline-none placeholder:text-[#9ca3af] focus:outline-none ${
                        passwordError ? "border-red-500" : "border-white"
                      }`}
                    />
                    <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center justify-center gap-1.5 sm:gap-2">
                      {/* Info Icon with Tooltip */}
                      <div className="relative flex items-center justify-center">
                        <button
                          type="button"
                          onMouseEnter={() => setShowPasswordTooltip(true)}
                          onMouseLeave={() => setShowPasswordTooltip(false)}
                          onTouchStart={() => setShowPasswordTooltip(!showPasswordTooltip)}
                          className="text-[#666666] hover:text-black transition-colors cursor-help flex items-center justify-center"
                        >
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                        {/* Tooltip */}
                        {showPasswordTooltip && (
                          <>
                            {/* Desktop Tooltip */}
                            <div className="hidden sm:block absolute left-full top-1/2 -translate-y-1/2 ml-2 w-[280px] bg-[#4a4a4a] text-white text-xs rounded-lg px-4 py-3 shadow-lg z-50">
                              <p className="leading-relaxed">
                                Kata sandi harus terdiri dari 8-15 karakter dan berisi
                                masing-masing jenis karakter berikut: huruf kecil, huruf
                                besar, angka.
                              </p>
                              {/* Arrow */}
                              <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-t-transparent border-b-transparent border-r-[#4a4a4a]"></div>
                            </div>
                            {/* Mobile Tooltip */}
                            <div className="sm:hidden absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[calc(100vw-3rem)] max-w-[280px] bg-[#4a4a4a] text-white text-xs rounded-lg px-4 py-3 shadow-lg z-50">
                              <p className="leading-relaxed">
                                Kata sandi harus terdiri dari 8-15 karakter dan berisi
                                masing-masing jenis karakter berikut: huruf kecil, huruf
                                besar, angka.
                              </p>
                              {/* Arrow */}
                              <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-[#4a4a4a]"></div>
                            </div>
                          </>
                        )}
                      </div>
                      {/* Hide/Show Password Icon */}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[#666666] hover:text-black transition-colors flex items-center justify-center"
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5"
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
                  </div>
                  {passwordError && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1 ml-2">{passwordError}</p>
                  )}
                </div>

                {loginError && (
                  <div className="mb-4">
                    <p className="text-red-500 text-[11px] sm:text-[12px] pl-2 sm:pl-[22px]">{loginError}</p>
                    {showResetPasswordOption && (
                      <div className="mt-2 pl-2 sm:pl-[22px]">
                        <Link
                          href="/forgot-password"
                          className="text-sm text-[#2563eb] hover:text-[#1d4ed8] font-medium underline transition-colors"
                        >
                          Reset password dengan OTP
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Forgot Password - Desktop: kiri, Mobile: hidden (ada di baris Ingat saya) */}
                {/* <div className="hidden sm:flex justify-start mb-4">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-[#2563eb] hover:text-[#1d4ed8] font-medium underline transition-colors"
                  >
                    Lupa Kata Sandi
                  </Link>
                </div> */}

                {/* Remember Me & Submit Button - Sejajar di desktop, terpisah di mobile */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-0">
                  {/* Mobile: Ingat saya dan Lupa Kata Sandi sejajar */}
                  <div className="flex items-center justify-between sm:justify-start">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="remember"
                        name="remember"
                        checked={rememberMe}
                        onChange={handleRememberMeChange}
                        className="w-4 h-4 text-[#69d7f6] border-[#d1d5db] rounded focus:ring-[#69d7f6] cursor-pointer accent-[#69d7f6]"
                      />
                      <label
                        htmlFor="remember"
                        className="ml-2 text-xs sm:text-sm text-[#666666] cursor-pointer"
                      >
                        Ingat saya
                      </label>
                    </div>
                    {/* Lupa Kata Sandi di mobile - sejajar dengan Ingat saya */}
                    <Link
                      href="/forgot-password"
                      className="text-xs text-[#2563eb] hover:text-[#1d4ed8] font-medium underline transition-colors sm:hidden"
                    >
                      Lupa Kata Sandi
                    </Link>
                  </div>
                  <div className="flex justify-center sm:justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center bg-[#69d7f6] rounded-[65px] text-[#2b2c24] text-sm sm:text-[15px] sm:min-w-[217px] font-medium leading-4 tracking-[-0.03em] pt-3 sm:pt-4 px-6 sm:px-[25px] pb-3 sm:pb-[13px] text-center transition-colors duration-120 ease hover:bg-[#5bc7e6] focus:outline-none disabled:bg-[#d1d5db] disabled:text-[#9ca3af] disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Masuk..." : "Masuk"}
                    </button>
                  </div>
                </div>

                {/* Sign Up Link */}
                <div className="text-center text-xs sm:text-sm text-[#666666] pt-1">
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
            <div className="mt-4 sm:mt-6 relative z-10">
              <Footer variant="transparent" />
            </div>
          </div>
        </div>
        </div>
      </div>

    </div>
  );
}

