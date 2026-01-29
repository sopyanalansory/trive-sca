"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api-client";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import WhatsAppButton from "../../components/WhatsAppButton";

const currentStep = 4;
const totalSteps = 9;
const steps = [
  "Verifikasi Identitas",
  "Informasi Pribadi",
  "Profil Perusahaan",
  "Pernyataan Pengalaman Demo",
  "Pernyataan Pengalaman Transaksi",
  "Pernyataan Pengungkapan",
  "Aplikasi Pembukaan Rekening Transaksi Secara Elektronik Online",
  "Pernyataan Tambahan",
  "Atur Akun Anda",
];

const inputBase =
  "w-full px-2.5 py-2 rounded-md border border-gray-200 text-xs text-gray-900 outline-none transition-colors focus:ring-1 focus:ring-[#00C2FF]/30 focus:border-[#00C2FF]";
const inputDisabled = "bg-gray-50 text-gray-600 cursor-not-allowed";
const labelClass = "block text-xs font-medium text-gray-600 mb-1";

export default function DemoExperienceStatementPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileHovered, setProfileHovered] = useState(false);
  const [userName, setUserName] = useState("");
  const [userInitial, setUserInitial] = useState("M");
  const [accepted, setAccepted] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
      return;
    }
    const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
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
    return () => window.removeEventListener("resize", handleResize);
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accepted !== "ya") return;
    router.push("/open-investment-account/transaction-experience");
  };

  const handleBack = () => {
    router.back();
  };

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
        <div className="flex-1 p-4 lg:px-8 lg:pt-0 lg:pb-0 overflow-x-hidden min-h-0 flex flex-col">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:gap-12 lg:min-h-full flex-1">
            {/* Step progress - same as personal-info */}
            <div className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-gray-100 py-6 min-h-full self-stretch lg:-ml-8 lg:pl-8 pr-6">
              <div className="w-20 h-20 mx-auto mb-6 relative flex items-center justify-center">
                <svg className="w-20 h-20" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="#ff9000"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 36}
                    strokeDashoffset={2 * Math.PI * 36 * (1 - currentStep / totalSteps)}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[15px] font-semibold text-gray-800">
                  {currentStep}/{totalSteps}
                </span>
              </div>
              <nav className="space-y-0.5">
                {steps.map((step, idx) => {
                  const isCompleted = idx < currentStep - 1;
                  const isActive = idx === currentStep - 1;
                  return (
                    <div key={step} className="flex items-center gap-3 py-2.5">
                      <span
                        className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold text-white ${
                          isCompleted ? "bg-[#4fc3f7]" : isActive ? "bg-[#ff9000]" : "bg-gray-200"
                        }`}
                      >
                        {isCompleted ? "✓" : ""}
                      </span>
                      <span
                        className={`text-[13px] leading-snug ${
                          isActive ? "font-medium text-gray-800" : isCompleted ? "text-gray-600" : "text-gray-400"
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Mobile progress */}
            <div className="lg:hidden mb-6">
              <div className="flex justify-between items-center mb-2">
                <h1 className="text-[15px] font-semibold text-gray-800">Pernyataan Pengalaman Demo</h1>
                <span className="text-[13px] font-medium text-gray-600">{currentStep}/{totalSteps}</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ff9000] rounded-full transition-all"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0 bg-white py-5 px-5 lg:py-6 lg:px-6">
              <h2 className="text-base font-semibold text-gray-900 tracking-tight mb-1">Pernyataan Pengalaman Demo</h2>
              <p className="text-xs text-gray-500 mb-4">PERNYATAAN TELAH MELAKUKAN SIMULASI PERDAGANGAN BERJANGKA KOMODITI</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelClass}>Nama lengkap</label>
                  <input className={`${inputBase} ${inputDisabled}`} type="text" value="MOHAMMAD SOPYAN" disabled />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Tempat Lahir</label>
                    <input className={`${inputBase} ${inputDisabled}`} type="text" value="BOGOR" disabled />
                  </div>
                  <div>
                    <label className={labelClass}>Tanggal Lahir</label>
                    <input className={`${inputBase} ${inputDisabled}`} type="text" value="27/04/1995" disabled />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Alamat Rumah</label>
                  <textarea className={`${inputBase} ${inputDisabled} min-h-[72px] resize-none`} value="KP. MAMPIR BARAT" disabled />
                </div>
                <div>
                  <label className={labelClass}>Kode Pos</label>
                  <input className={`${inputBase} ${inputDisabled}`} type="text" value="" disabled />
                </div>
                <div>
                  <label className={labelClass}>Nomor Kartu identitas</label>
                  <input className={`${inputBase} ${inputDisabled}`} type="text" value="3201070204950013" disabled />
                </div>
                <div>
                  <label className={labelClass}>Nomor Akun Demo</label>
                  <input className={`${inputBase} ${inputDisabled}`} type="text" value="" disabled />
                </div>

                <p className="text-xs text-gray-600">
                  Dengan mengisi kolom "YA" di bawah ini, saya menyatakan bahwa saya telah melakukan simulasi bertransaksi di Perusahaan Perdagangan Berjangka Komoditi yang disebutkan di bawah ini, dan telah memahami tentang tata cara bertransaksi di bidang Perdagangan Berjangka Komoditi.
                </p>
                <div>
                  <label className={labelClass}>Silakan tulis nama broker di sini</label>
                  <input className={`${inputBase} ${inputDisabled}`} type="text" value="PT. Trive Invest Futures" disabled />
                </div>
                <p className="text-xs text-gray-600">
                  Demikian Pernyataan ini dibuat dengan sebenarnya dalam keadaan sadar, sehat jasmani dan rohani serta tanpa paksaan apapun dari pihak manapun.
                </p>

                <div className="pt-3 border-t border-gray-100">
                  <label className={labelClass}>Diterima/Tidak Diterima:</label>
                  <div className="flex gap-4 mt-1.5 mb-3">
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                      <input type="radio" name="accepted" value="ya" checked={accepted === "ya"} onChange={() => setAccepted("ya")} className="accent-[#00C2FF] w-3.5 h-3.5" /> Ya
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                      <input type="radio" name="accepted" value="tidak" checked={accepted === "tidak"} onChange={() => setAccepted("tidak")} className="accent-[#00C2FF] w-3.5 h-3.5" /> Tidak
                    </label>
                  </div>
                  <div className="mb-4">
                    <label className={labelClass}>Tanggal Penerimaan:</label>
                    <input className={`${inputBase} ${inputDisabled}`} type="text" value="23/05/2025" disabled />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-between pt-2">
                  <button type="button" onClick={handleBack} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-xs font-medium hover:bg-gray-50 transition-colors min-w-[110px]">
                    Kembali
                  </button>
                  <button type="submit" disabled={accepted !== "ya"} className="bg-[#69d7f6] hover:bg-[#5bc7e6] text-white px-4 py-2 rounded-full text-xs font-medium transition-colors min-w-[110px] disabled:opacity-50 disabled:cursor-not-allowed">
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
