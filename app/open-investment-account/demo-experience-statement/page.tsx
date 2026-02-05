"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api-client";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import WhatsAppButton from "../../components/WhatsAppButton";
import OpenAccountStepProgress from "../../components/OpenAccountStepProgress";

const inputBase =
  "w-full px-2.5 py-2 rounded-md border border-gray-200 text-xs text-gray-900 outline-none transition-colors focus:ring-1 focus:ring-[#00C2FF]/30 focus:border-[#00C2FF]";
const inputDisabled = "bg-gray-50 text-gray-600 cursor-not-allowed";
const labelClass = "block text-xs font-medium text-gray-600 mb-1";

function formatDateNow() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function DemoExperienceStatementPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileHovered, setProfileHovered] = useState(false);
  const [userName, setUserName] = useState("");
  const [userInitial, setUserInitial] = useState("M");
  const [accepted, setAccepted] = useState("");
  const [tanggalPenerimaan] = useState(() => formatDateNow());

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
        <div className="flex-1 p-4 lg:px-8 lg:pt-0 lg:pb-0 overflow-x-hidden min-h-0 flex flex-col w-full">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:gap-12 lg:min-h-full flex-1 w-full min-w-0 open-account-content-wrap">
            <OpenAccountStepProgress currentStep={3} mobileTitle="Pernyataan Pengalaman Demo" />

            {/* Main content */}
            <div className="flex-1 min-w-0 w-full bg-white rounded-lg overflow-x-hidden px-4 py-4 sm:px-5 sm:py-5 lg:py-6 lg:px-6 open-account-form-card">
              <h2 className="text-base font-semibold text-gray-900 tracking-tight mb-1">Pernyataan Pengalaman Demo</h2>
              <p className="text-xs text-gray-500 mb-4">PERNYATAAN TELAH MELAKUKAN SIMULASI PERDAGANGAN BERJANGKA KOMODITI</p>

              <form onSubmit={handleSubmit} className="space-y-4 w-full min-w-0 max-w-full">
                <div className="min-w-0">
                  <label className={labelClass}>Nama lengkap</label>
                  <input className={`${inputBase} ${inputDisabled}`} type="text" value="MOHAMMAD SOPYAN" disabled />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
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
                      <input type="radio" name="accepted" value="ya" checked={accepted === "ya"} onChange={() => setAccepted("ya")} className="radio-primary" /> Ya
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                      <input type="radio" name="accepted" value="tidak" checked={accepted === "tidak"} onChange={() => setAccepted("tidak")} className="radio-primary" /> Tidak
                    </label>
                  </div>
                  <div className="mb-4">
                    <label className={labelClass}>Tanggal Penerimaan:</label>
                    <input className={`${inputBase} ${inputDisabled}`} type="text" value={tanggalPenerimaan} disabled readOnly />
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
