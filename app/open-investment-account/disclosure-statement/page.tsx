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

export default function DisclosureStatementPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileHovered, setProfileHovered] = React.useState(false);
  const [userName, setUserName] = React.useState("");
  const [userInitial, setUserInitial] = React.useState("M");
  const [accepted, setAccepted] = React.useState("");
  const [tanggalPenerimaan] = React.useState(() => formatDateNow());

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

  const handleAcceptedChange = (value: string) => setAccepted(value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/open-investment-account/account-opening-form");
  };

  const inputBase =
    "w-full px-2.5 py-2 rounded-md border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:ring-1 focus:ring-[#00C2FF]/30 focus:border-[#00C2FF]";
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
            <OpenAccountStepProgress currentStep={6} mobileTitle="Pernyataan Pengungkapan" />

            <div className="flex-1 min-w-0 w-full bg-white rounded-lg overflow-x-hidden px-4 py-4 sm:px-5 sm:py-5 lg:py-6 lg:px-6 open-account-form-card">
              <h2 className="text-base font-semibold text-gray-900 tracking-tight mb-1">Pernyataan Pengungkapan</h2>
              <p className="text-xs text-gray-500 mt-3 mb-5 text-center">
                PERNYATAAN PENGUNGKAPAN
                <br />
                (DISCLOSURE STATEMENT)
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 w-full min-w-0 max-w-full">
                <ol className="text-xs text-gray-600 pl-5 list-decimal space-y-2.5 mb-6">
                  <li>
                    Perdagangan Berjangka BERISIKO SANGAT TINGGI tidak cocok untuk semua orang. Pastikan bahwa anda SEPENUHNYA MEMAHAMI RISIKO ini sebelum melakukan perdagangan.
                  </li>
                  <li>
                    Perdagangan Berjangka merupakan produk keuangan dengan <i>leverage</i> dapat menyebabkan KERUGIAN ANDA MELEBIHI setoran awal Anda. Anda harus siap apabila SELURUH DANA ANDA HABIS.
                  </li>
                  <li>
                    TIDAK ADA PENDAPATAN TETAP (<i>FIXED INCOME</i>) dalam Perdagangan Berjangka.
                  </li>
                  <li>
                    Apabila anda PEMULA kami sarankan untuk mempelajari mekanisme transaksinya, PERDAGANGAN BERJANGKA membutuhkan pengetahuan dan pemahaman khusus.
                  </li>
                  <li>
                    ANDA HARUS MELAKUKAN TRANSAKSI SENDIRI, segala risiko yang akan timbul akibat transaksi sepenuhnya akan menjadi tanggung jawab Saudara.
                  </li>
                  <li>
                    User Id dan Password BERSIFAT PRIBADI DAN RAHASIA, anda bertanggung jawab atas penggunaannya, JANGAN SERAHKAN ke pihak lain terutama Wakil Pialang Berjangka dan pegawai Pialang Berjangka.
                  </li>
                  <li>
                    ANDA berhak menerima LAPORAN ATAS TRANSAKSI yang anda lakukan. Waktu anda 2 X 24 JAM UNTUK MEMBERIKAN SANGGAHAN. Untuk transaksi yang TELAH SELESAI (<i>DONE/SETTLE</i>) DAPAT ANDA CEK melalui sistem informasi transaksi nasabah yang berfungsi untuk memastikan transaksi anda telah terdaftar di Lembaga Kliring Berjangka.
                  </li>
                </ol>

                <p className="text-xs font-semibold text-gray-700 mb-4">
                  SECARA DETAIL BACA DOKUMEN PEMBERITAHUAN ADANYA RISIKO DAN DOKUMEN PERJANJIAN PEMBERIAN AMANAT
                </p>
                <p className="text-xs text-gray-600 mb-6">
                  Untuk mempelajari lebih lanjut mengenai Perdagangan Berjangka dapat anda mengunjungi situs{" "}
                  <a
                    href="https://www.bappebti.go.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00C2FF] hover:underline"
                  >
                    www.bappebti.go.id
                  </a>
                </p>

                <div className="pt-3 border-t border-gray-100">
                  <label className={labelClass}>Diterima/Tidak Diterima:</label>
                  <div className="flex gap-4 mt-1.5">
                    {["ya", "tidak"].map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="radio"
                          name="accepted"
                          value={opt}
                          checked={accepted === opt}
                          onChange={() => handleAcceptedChange(opt)}
                          className="radio-primary"
                        />
                        {opt === "ya" ? "Ya" : "Tidak"}
                      </label>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className={labelClass}>Tanggal Penerimaan:</label>
                    <input
                      type="text"
                      className={`${inputBase} ${inputDisabled}`}
                      value={tanggalPenerimaan}
                      disabled
                      readOnly
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/open-investment-account/transaction-experience")}
                    className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-xs font-medium hover:bg-gray-50 transition-colors min-w-[110px]"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={accepted !== "ya"}
                    className="bg-[#69d7f6] hover:bg-[#5bc7e6] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-full text-xs font-medium transition-colors min-w-[110px]"
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
