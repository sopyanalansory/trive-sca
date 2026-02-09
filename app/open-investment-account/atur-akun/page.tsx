"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api-client";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import WhatsAppButton from "../../components/WhatsAppButton";
import OpenAccountStepProgress from "../../components/OpenAccountStepProgress";

export default function AturAkunPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileHovered, setProfileHovered] = React.useState(false);
  const [userName, setUserName] = React.useState("");
  const [userInitial, setUserInitial] = React.useState("M");
  const [accountType, setAccountType] = React.useState("");
  const [platform, setPlatform] = React.useState("metatrader5");
  const [idrRate, setIdrRate] = React.useState("");
  const [riskManagement, setRiskManagement] = React.useState("");
  const [stopOutLevel, setStopOutLevel] = React.useState("");
  const [transactionCode, setTransactionCode] = React.useState("");
  const [confirmTransactionCode, setConfirmTransactionCode] = React.useState("");
  const [showTransactionCode, setShowTransactionCode] = React.useState(false);
  const [showConfirmCode, setShowConfirmCode] = React.useState(false);
  const [termsAccepted, setTermsAccepted] = React.useState(false);

  // Error states for validation
  const [errors, setErrors] = React.useState({
    accountType: false,
    idrRate: false,
    riskManagement: false,
    stopOutLevel: false,
    transactionCode: false,
    confirmTransactionCode: false,
    termsAccepted: false,
  });
  const [showErrors, setShowErrors] = React.useState(false);

  React.useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        const res = await fetch(buildApiUrl("/api/auth/me"), { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data.user?.name) {
            setUserName(data.user.name.toUpperCase());
            setUserInitial(data.user.name.charAt(0).toUpperCase());
          }
        }
      } catch {
        // ignore
      }
    })();
  }, [router]);

  React.useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Validation function
  const validateForm = () => {
    const newErrors = {
      accountType: !accountType,
      idrRate: !idrRate,
      riskManagement: !riskManagement,
      stopOutLevel: !stopOutLevel,
      transactionCode: !transactionCode,
      confirmTransactionCode: !confirmTransactionCode || confirmTransactionCode !== transactionCode,
      termsAccepted: !termsAccepted,
    };

    setErrors(newErrors);
    setShowErrors(true);

    // Return true if no errors
    return !Object.values(newErrors).some((error) => error);
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }
    router.push("/open-investment-account/success");
  };

  // Clear error when user starts typing/selecting
  const handleFieldChange = (field: string, value: any, setter: (value: any) => void) => {
    setter(value);
    if (showErrors) {
      setErrors((prev) => ({
        ...prev,
        [field]: false,
      }));
    }
  };

  const inputBase = "w-full h-[36px] px-2.5 py-2 rounded-md border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:ring-1 focus:ring-[#00C2FF]/30 focus:border-[#00C2FF] box-border appearance-none";
  const selectBase = "w-full h-[36px] px-2.5 py-2 rounded-md border border-gray-200 text-xs text-gray-900 outline-none transition-colors focus:ring-1 focus:ring-[#00C2FF]/30 focus:border-[#00C2FF] box-border appearance-none bg-white";
  const inputDisabled = "bg-gray-50 text-gray-600 cursor-not-allowed";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="min-h-screen bg-white flex relative">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        profileHovered={profileHovered}
        setProfileHovered={setProfileHovered}
        userName={userName}
        userInitial={userInitial}
        activePage="accounts"
      />

      <main className="flex-1 flex flex-col w-full lg:w-auto overflow-x-hidden min-h-0 bg-gray-100">
        <div className="flex-1 p-4 lg:px-8 lg:pt-0 lg:pb-0 overflow-x-hidden min-h-0 flex flex-col w-full">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:gap-12 lg:min-h-full flex-1 w-full min-w-0 open-account-content-wrap">
            <OpenAccountStepProgress currentStep={8} mobileTitle="Atur Akun Anda" />

            <div className="flex-1 min-w-0 w-full bg-white rounded-lg overflow-hidden px-4 py-4 sm:px-5 sm:py-5 lg:py-6 lg:px-6 open-account-form-card">
              <h2 className="text-base font-semibold text-gray-900 tracking-tight mb-1">Atur Akun Anda</h2>

              <form onSubmit={(e) => e.preventDefault()} className="flex flex-col w-full">
                {/* Description */}
                <div className="text-xs text-gray-600 mb-6 leading-relaxed">
                  Sederhana, transparan, dan adil! Trive Invest menawarkan spread paling ketat, komisi terendah, dan minimum deposit awal minimum, dengan pilihan program bebas swap, leverage level, dan stop-out level. Lihat link di bawah untuk informasi lebih lengkap mengenai syarat dan ketentuan.
                </div>

                {/* Section 1: Account Type */}
                <div className="mb-6">
                  <h3 className="font-semibold text-sm text-gray-900 mb-3">
                    1. Pilih Tipe Akun Trading
                  </h3>

                  <select
                    value={accountType}
                    onChange={(e) => handleFieldChange("accountType", e.target.value, setAccountType)}
                    className={`${selectBase} ${showErrors && errors.accountType ? "border-red-500" : ""}`}
                  >
                    <option value="">Pilih</option>
                    <option value="classic">Classic</option>
                    <option value="classic-gold">Classic Gold</option>
                    <option value="premium">Premium</option>
                  </select>

                  {showErrors && errors.accountType && (
                    <div className="text-xs text-red-500 mt-1 mb-2">Bagian ini diperlukan.</div>
                  )}

                  <div className="text-xs text-gray-600 mb-2 leading-relaxed">
                    Jelajahi Jenis Akun di Trive Invest. Kami menawarkan berbagai pilihan jenis akun yang disiapkan untuk memenuhi kebutuhan berbagai jenis trader.
                  </div>

                  <a
                    href="https://www.triveinvest.co.id/trading/tipe-akun-trading"
                    className="text-[#4fc3f7] text-xs break-all"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://www.triveinvest.co.id/trading/tipe-akun-trading
                  </a>
                </div>

                {/* Section 2: Trading Platform */}
                <div className="mb-6">
                  <h3 className="font-semibold text-sm text-gray-900 mb-3">
                    2. Pilih Platform Trading
                  </h3>

                  <div className="mb-3">
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="radio"
                        name="platform"
                        value="metatrader5"
                        checked={platform === "metatrader5"}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="radio-primary"
                      />
                      MetaTrader 5
                    </label>
                  </div>

                  <div className="text-xs text-gray-600 mb-2 leading-relaxed">
                    Trading yang sukses dimulai dengan trading yang nyaman dan fungsional. Trive Invest memberikan pilihan terbaik untuk para trader modern.
                  </div>

                  <a
                    href="https://www.triveinvest.co.id/trading-platform"
                    className="text-[#4fc3f7] text-xs break-all"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://www.triveinvest.co.id/trading-platform
                  </a>
                </div>

                {/* Section 3: IDR Rate */}
                <div className="mb-6">
                  <h3 className="font-semibold text-sm text-gray-900 mb-3">
                    3. Pilih IDR Rate (Deposit dan Withdrawal)
                  </h3>

                  <select
                    value={idrRate}
                    onChange={(e) => handleFieldChange("idrRate", e.target.value, setIdrRate)}
                    className={`${selectBase} ${showErrors && errors.idrRate ? "border-red-500" : ""}`}
                  >
                    <option value="">Pilih</option>
                    <option value="10.000">Rp10.000</option>
                    <option value="12.000">Rp12.000</option>
                    <option value="floating">Floating (USD)</option>
                  </select>

                  {showErrors && errors.idrRate && (
                    <div className="text-xs text-red-500 mt-1 mb-2">Bagian ini diperlukan.</div>
                  )}

                  <div className="text-xs text-gray-600 mb-2 leading-relaxed">
                    Pilihan rate anda akan digunakan untuk mengkonversi dana anda dari IDR ke USD atau sebaliknya disaat anda melakukan deposit ataupun withdrawal. Floating Rate hanya berlaku untuk deposit dalam USD.
                  </div>

                  <a
                    href="https://www.triveinvest.co.id/trading/deposit-dan-withdrawal"
                    className="text-[#4fc3f7] text-xs break-all"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://www.triveinvest.co.id/trading/deposit-dan-withdrawal
                  </a>
                </div>

                {/* Section 4: Risk Management */}
                <div className="mb-6">
                  <h3 className="font-semibold text-sm text-gray-900 mb-3">
                    4. Pilih Parameter Akun Manajemen Risiko
                  </h3>

                  <select
                    value={riskManagement}
                    onChange={(e) => handleFieldChange("riskManagement", e.target.value, setRiskManagement)}
                    className={`${selectBase} ${showErrors && errors.riskManagement ? "border-red-500" : ""}`}
                  >
                    <option value="">Pilih</option>
                    <option value="1:100">1:100</option>
                    <option value="1:200">1:200</option>
                    <option value="1:400">1:500</option>
                    <option value="1:1000">1:1000</option>
                  </select>

                  {showErrors && errors.riskManagement && (
                    <div className="text-xs text-red-500 mt-1 mb-2">Bagian ini diperlukan.</div>
                  )}
                </div>

                {/* Section 5: Stop Out Level */}
                <div className="mb-6">
                  <h3 className="font-semibold text-sm text-gray-900 mb-3">
                    Stop Out (Auto-Cut) Level (%)
                  </h3>

                  <select
                    value={stopOutLevel}
                    onChange={(e) => handleFieldChange("stopOutLevel", e.target.value, setStopOutLevel)}
                    className={`${selectBase} ${showErrors && errors.stopOutLevel ? "border-red-500" : ""}`}
                  >
                    <option value="">Pilih</option>
                    <option value="10">10%</option>
                    <option value="20">20%</option>
                    <option value="40">40%</option>
                    <option value="100">100%</option>
                  </select>

                  {showErrors && errors.stopOutLevel && (
                    <div className="text-xs text-red-500 mt-1 mb-2">Bagian ini diperlukan.</div>
                  )}

                  <div className="text-xs text-gray-600 mb-3 leading-relaxed">
                    Bagaimana cara Leverage dan Stop-Out Bekerja? Mana yang lebih baik untuk saya? <br />
                    <br />
                    dana anda dari IDR ke USD atau sebaliknya disaat anda melakukan deposit ataupun withdrawal. Floating Rate hanya berlaku untuk deposit dalam USD.
                  </div>

                  <a
                    href="https://www.triveinvest.co.id/trading/leverage-dan-stop-out"
                    className="text-[#4fc3f7] text-xs break-all"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://www.triveinvest.co.id/trading/leverage-dan-stop-out
                  </a>
                </div>

                {/* Section 6: Transaction Code */}
                <div className="mb-6">
                  <h3 className="font-semibold text-sm text-gray-900 mb-3">
                    Kode Akses Transaksi Nasabah
                  </h3>

                  <div className="relative mb-4">
                    <input
                      type={showTransactionCode ? "text" : "password"}
                      value={transactionCode}
                      onChange={(e) => handleFieldChange("transactionCode", e.target.value, setTransactionCode)}
                      className={`${inputBase} pr-10 ${showErrors && errors.transactionCode ? "border-red-500" : ""}`}
                      placeholder="Masukkan kode akses transaksi"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTransactionCode(!showTransactionCode)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1 flex items-center justify-center"
                    >
                      {showTransactionCode ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {showErrors && errors.transactionCode && (
                    <div className="text-xs text-red-500 mt-1 mb-4">Bagian ini diperlukan.</div>
                  )}

                  <h3 className="font-semibold text-sm text-gray-900 mb-3 mt-6">
                    Konfirmasi Kode Akses
                  </h3>

                  <div className="relative mb-4">
                    <input
                      type={showConfirmCode ? "text" : "password"}
                      value={confirmTransactionCode}
                      onChange={(e) => handleFieldChange("confirmTransactionCode", e.target.value, setConfirmTransactionCode)}
                      className={`${inputBase} pr-10 ${showErrors && errors.confirmTransactionCode ? "border-red-500" : ""}`}
                      placeholder="Konfirmasi kode akses transaksi"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmCode(!showConfirmCode)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1 flex items-center justify-center"
                    >
                      {showConfirmCode ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {showErrors && errors.confirmTransactionCode && (
                    <div className="text-xs text-red-500 mt-1 mb-4">
                      {confirmTransactionCode && confirmTransactionCode !== transactionCode
                        ? "Konfirmasi kode tidak sesuai."
                        : "Bagian ini diperlukan."}
                    </div>
                  )}

                  <div className={`flex items-start mb-3 mt-6 ${showErrors && errors.termsAccepted ? "border border-red-500 rounded-lg p-3" : ""}`}>
                    <input
                      type="checkbox"
                      id="terms-agreement"
                      checked={termsAccepted}
                      onChange={(e) => handleFieldChange("termsAccepted", e.target.checked, setTermsAccepted)}
                      className="mr-2 mt-0.5"
                      style={{ accentColor: "#4fc3f7" }}
                    />
                    <label htmlFor="terms-agreement" className="text-xs text-gray-600 leading-relaxed flex-1 cursor-pointer">
                      Saya membaca, memahami, dan menerima syarat dan ketentuan untuk jenis akun, syarat dan ketentuan untuk penggunaan high leverage (lebih dari 1:100) dan persyaratan margin dinamis (dynamic margin) berdasarkan leverage, ukuran posisi, kondisi pasar, dan profil risiko nasabah. Saya juga membaca, memahami, dan menerima kebijakan perusahaan, syarat dan ketentuan yang diumumkan di situs web perusahaan, mengenai penawaran komersial yang terkait dengan spread, komisi, program bebas swap, dan program.
                      <br />
                      <br />
                      Penggunaan high leverage adalah opsional. Keputusan untuk menggunakan fitur ini sepenuhnya menjadi tanggung jawab nasabah. Dengan menggunakan high leverage, nasabah secara otomatis menyetujui perubahan yang terkait dengan Persyaratan Margin, Margin Call, dan Auto-Cut. Apabila terjadi perubahan rasio leverage yang menyebabkan terjadinya Auto-Cut maka sepenuhnya menjadi tanggung jawab nasabah. Saya membaca, memahami, dan menerima{" "}
                      <a href="#" className="text-[#4fc3f7]">syarat dan ketentuan</a> untuk penggunaan high leverage.
                    </label>
                  </div>

                  {showErrors && errors.termsAccepted && (
                    <div className="text-xs text-red-500 mt-1 mb-3">Anda harus menyetujui syarat dan ketentuan.</div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex flex-wrap gap-3 justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-xs font-medium hover:bg-gray-50 transition-colors min-w-[130px]"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className={`px-4 py-2 rounded-full text-xs min-w-[130px] transition-colors border ${
                      accountType && idrRate && riskManagement && stopOutLevel && transactionCode && confirmTransactionCode === transactionCode && termsAccepted
                        ? "bg-[#4fc3f7] hover:bg-[#3db3e7] text-white cursor-pointer border-[#4fc3f7] font-bold"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 font-medium"
                    }`}
                  >
                    Berikutnya
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <Footer />
      </main>

      <WhatsAppButton />
    </div>
  );
}
