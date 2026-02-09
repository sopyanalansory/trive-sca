"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api-client";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import WhatsAppButton from "../../components/WhatsAppButton";
import OpenAccountStepProgress from "../../components/OpenAccountStepProgress";

function formatDateNow() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

const TAB_LABELS = ["Informasi Pribadi", "Kontak Darurat", "Pekerjaan", "Daftar Kekayaan", "Akun Bank"];

const TOTAL_ASSET_OPTIONS = [
  { value: "", label: "Pilih" },
  { value: "< 10jt", label: "< 10jt" },
  { value: "10jt - 100jt", label: "10jt - 100jt" },
  { value: "100jt - 250jt", label: "100jt - 250jt" },
  { value: "> 250jt", label: "> 250jt" },
];

const INCOME_OPTIONS = [
  { value: "", label: "Pilih" },
  { value: "0 - 120jt", label: "0 - 120jt" },
  { value: "250jt - 500jt", label: "250jt - 500jt" },
  { value: "> 500jt", label: "> 500jt" },
];

const NJOP_OPTIONS = [
  { value: "", label: "Pilih" },
  { value: "Di bawah 50jt", label: "Di bawah 50jt" },
  { value: "50jt - 100jt", label: "50jt - 100jt" },
  { value: "100jt - 500jt", label: "100jt - 500jt" },
  { value: "500jt - 1 bilion", label: "500jt - 1 bilion" },
  { value: "1 bilion - 2,5 bilion", label: "1 bilion - 2,5 bilion" },
  { value: "Di atas 2,5 bilion", label: "Di atas 2,5 bilion" },
];

const TOTAL_ASSET_ON_ACCOUNT_OPTIONS = [
  { value: "", label: "Pilih" },
  { value: "<50jt", label: "<50jt" },
  { value: "50jt - 100jt", label: "50jt - 100jt" },
  { value: "100jt - 500jt", label: "100jt - 500jt" },
  { value: "500jt - 1 bilion", label: "500jt - 1 bilion" },
  { value: "1 bilion - 2,5 bilion", label: "1 bilion - 2,5 bilion" },
  { value: ">2,5 bilion", label: ">2,5 bilion" },
];

const JUMLAH_ASSET_OPTIONS = [
  { value: "", label: "Pilih" },
  { value: "0 - 50jt", label: "0 - 50jt" },
  { value: "50jt - 100jt", label: "50jt - 100jt" },
  { value: "100jt - 500jt", label: "100jt - 500jt" },
  { value: "500jt - 1,000jt", label: "500jt - 1,000jt" },
  { value: ">1 bilion", label: ">1 bilion" },
];

export default function WealthListFormPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileHovered, setProfileHovered] = React.useState(false);
  const [userName, setUserName] = React.useState("");
  const [userInitial, setUserInitial] = React.useState("M");
  const [deposit, setDeposit] = React.useState("");
  const [income, setIncome] = React.useState("");
  const [njop, setNjop] = React.useState("");
  const [accountBalance, setAccountBalance] = React.useState("");
  const [totalAsset, setTotalAsset] = React.useState("");
  const [otherInfo, setOtherInfo] = React.useState("");
  const [accepted, setAccepted] = React.useState("");
  const [tanggalPenerimaan] = React.useState(() => formatDateNow());
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const activeTabIndex = 3; // Daftar Kekayaan

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!deposit.trim()) newErrors.deposit = "Bagian ini diperlukan.";
    if (!income.trim()) newErrors.income = "Bagian ini diperlukan.";
    if (!njop.trim()) newErrors.njop = "Bagian ini diperlukan.";
    if (!accountBalance.trim()) newErrors.accountBalance = "Bagian ini diperlukan.";
    if (!totalAsset.trim()) newErrors.totalAsset = "Bagian ini diperlukan.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (accepted !== "ya") {
      setErrors((prev) => ({ ...prev, accepted: "Anda harus menerima pernyataan kebenaran dan tanggung jawab" }));
      return;
    }
    router.push("/open-investment-account/account-bank-form");
  };

  const inputBase =
    "w-full px-2.5 py-2 rounded-md border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:ring-1 focus:ring-[#00C2FF]/30 focus:border-[#00C2FF]";
  const inputDisabled = "bg-gray-50 text-gray-600 cursor-not-allowed";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";
  const errorClass = "mt-0.5 text-[11px] text-red-500";

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
            <OpenAccountStepProgress currentStep={6} mobileTitle="Aplikasi Pembukaan Rekening Transaksi Secara Elektronik Online" />

            <div className="flex-1 min-w-0 w-full bg-white rounded-lg overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 lg:py-6 lg:px-6 open-account-form-card">
              <h2 className="text-base font-semibold text-gray-900 tracking-tight mb-1 hidden sm:block">
                Aplikasi Pembukaan Rekening Transaksi Secara Elektronik Online
              </h2>

              <div className="flex justify-start items-end gap-4 sm:gap-6 mb-6 mt-4 overflow-x-auto pb-1">
                {TAB_LABELS.map((label, idx) => {
                  const isCompleted = idx < activeTabIndex;
                  const isActive = idx === activeTabIndex;
                  return (
                    <div key={label} className="flex flex-col items-center shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isCompleted || isActive ? "bg-[#4fc3f7]" : "bg-gray-100"
                        }`}
                      >
                        {isCompleted || isActive ? (
                          <svg width="16" height="16" viewBox="0 0 20 20" className="text-white">
                            <polyline points="5,11 9,15 15,7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <span className="text-gray-400 text-xs font-medium">{idx + 1}</span>
                        )}
                      </div>
                      <span
                        className={`text-[11px] mt-1 text-center leading-tight whitespace-nowrap ${
                          isActive ? "text-[#2196f3] font-medium" : isCompleted ? "text-[#2196f3]" : "text-gray-400"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 w-full min-w-0 max-w-full">
                <p className="text-xs text-gray-500 mb-3">Figures in IDR, jt : Million</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                  <div className="sm:col-span-2 min-w-0">
                    <label className={labelClass}>
                      Jumlah Dana yang akan Anda Depositkan <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={deposit}
                      onChange={(e) => setDeposit(e.target.value)}
                      className={`${inputBase} ${errors.deposit ? "border-red-500" : ""}`}
                    >
                      {TOTAL_ASSET_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {errors.deposit && <p className={errorClass}>{errors.deposit}</p>}
                  </div>

                  <div className="sm:col-span-2 min-w-0">
                    <label className={labelClass}>
                      Pendapatan Pertahun <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      className={`${inputBase} ${errors.income ? "border-red-500" : ""}`}
                    >
                      {INCOME_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {errors.income && <p className={errorClass}>{errors.income}</p>}
                  </div>

                  <div className="sm:col-span-2 min-w-0">
                    <label className={labelClass}>
                      Nilai NJOP <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={njop}
                      onChange={(e) => setNjop(e.target.value)}
                      className={`${inputBase} ${errors.njop ? "border-red-500" : ""}`}
                    >
                      {NJOP_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {errors.njop && <p className={errorClass}>{errors.njop}</p>}
                  </div>

                  <div className="sm:col-span-2 min-w-0">
                    <label className={labelClass}>
                      Jumlah Dana Dalam Rekening <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={accountBalance}
                      onChange={(e) => setAccountBalance(e.target.value)}
                      className={`${inputBase} ${errors.accountBalance ? "border-red-500" : ""}`}
                    >
                      {TOTAL_ASSET_ON_ACCOUNT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {errors.accountBalance && <p className={errorClass}>{errors.accountBalance}</p>}
                  </div>

                  <div className="sm:col-span-2 min-w-0">
                    <label className={labelClass}>
                      Total Aset <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={totalAsset}
                      onChange={(e) => setTotalAsset(e.target.value)}
                      className={`${inputBase} ${errors.totalAsset ? "border-red-500" : ""}`}
                    >
                      {JUMLAH_ASSET_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {errors.totalAsset && <p className={errorClass}>{errors.totalAsset}</p>}
                  </div>

                  <div className="sm:col-span-2 min-w-0">
                    <label className={labelClass}>Yang lain</label>
                    <textarea
                      value={otherInfo}
                      onChange={(e) => setOtherInfo(e.target.value)}
                      className={`${inputBase} min-h-[72px] resize-none`}
                      placeholder=""
                    />
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">PERNYATAAN KEBENARAN DAN TANGGUNG JAWAB</h3>
                  <p className="text-xs text-gray-600 mb-4 max-w-2xl">
                    Dengan mencentang kolom &quot;YA&quot; di bawah ini, saya dengan ini menyatakan bahwa semua informasi dan dokumen yang saya lampirkan pada APLIKASI PEMBUKAAN REKENING TRANSAKSI ELEKTRONIK ONLINE adalah sah dan benar. Saya akan bertanggung jawab penuh jika terjadi sesuatu yang berhubungan dengan ketidakabsahan data yang saya berikan.
                  </p>
                  <label className={labelClass}>Diterima/Tidak Diterima: <span className="text-red-500">*</span></label>
                  <div className="flex gap-4 mt-1.5 mb-4">
                    {["ya", "tidak"].map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="radio"
                          name="accepted"
                          value={opt}
                          checked={accepted === opt}
                          onChange={() => {
                            setAccepted(opt);
                            if (errors.accepted) setErrors((prev) => ({ ...prev, accepted: "" }));
                          }}
                          className="radio-primary"
                        />
                        {opt === "ya" ? "Ya" : "Tidak"}
                      </label>
                    ))}
                  </div>
                  {errors.accepted && <p className={errorClass}>{errors.accepted}</p>}
                  <div>
                    <label className={labelClass}>Tanggal Penerimaan:</label>
                    <input type="text" className={`${inputBase} ${inputDisabled}`} value={tanggalPenerimaan} disabled readOnly />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/open-investment-account/employment-form")}
                    className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-xs font-medium hover:bg-gray-50 transition-colors min-w-[130px]"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={accepted !== "ya"}
                    className={`px-4 py-2 rounded-full text-xs min-w-[130px] transition-colors border ${
                      accepted === "ya"
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
