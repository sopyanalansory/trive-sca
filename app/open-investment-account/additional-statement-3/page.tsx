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

export default function AdditionalStatement3Page() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileHovered, setProfileHovered] = React.useState(false);
  const [userName, setUserName] = React.useState("");
  const [userInitial, setUserInitial] = React.useState("M");
  const [acceptanceRadio, setAcceptanceRadio] = React.useState("");
  const [showError, setShowError] = React.useState(false);
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

  const handleAcceptanceChange = (value: string) => {
    setAcceptanceRadio(value);
    if (value === "tidak") {
      setShowError(true);
    } else {
      setShowError(false);
    }
  };

  const validateForm = () => {
    return acceptanceRadio === "ya";
  };

  const handleNext = () => {
    if (!validateForm()) {
      setShowError(true);
      return;
    }
    router.push("/open-investment-account/additional-statement-4");
  };

  const inputBase =
    "w-full px-2.5 py-2 rounded-md border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:ring-1 focus:ring-[#00C2FF]/30 focus:border-[#00C2FF]";
  const inputDisabled = "bg-gray-50 text-gray-600 cursor-not-allowed";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";
  const errorClass = "text-xs text-red-500 mt-1";

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
            <OpenAccountStepProgress currentStep={7} mobileTitle="Pernyataan Tambahan" />

            <div className="flex-1 min-w-0 w-full bg-white rounded-lg overflow-x-hidden px-4 py-4 sm:px-5 sm:py-5 lg:py-6 lg:px-6 open-account-form-card">
              <h2 className="text-base font-semibold text-gray-900 tracking-tight mb-1">Pernyataan Tambahan</h2>

              <form onSubmit={(e) => e.preventDefault()} className="space-y-4 w-full min-w-0 max-w-full">
                {/* Stepper Horizontal */}
                <div className="flex items-center justify-center gap-6 mb-6 mt-2">
                  {[...Array(7)].map((_, idx) => (
                    <div key={idx} className="text-center">
                      <div
                        className={`w-8 h-8 rounded-full text-white flex items-center justify-center mx-auto mb-2 font-bold text-sm border-2 ${
                          idx < 3
                            ? "bg-[#4fc3f7] border-[#4fc3f7]"
                            : "bg-gray-200 border-gray-200 text-gray-400"
                        }`}
                      >
                        <span>&#10003;</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Judul & Subjudul */}
                <div className="text-center mb-6">
                  <div className="font-semibold text-base text-gray-900 mb-2 uppercase">
                    PERNYATAAN PENGUNGKAPAN
                  </div>
                  <div className="text-sm text-gray-600 italic mb-6">
                    (DISCLOSURE STATEMENT)
                  </div>
                </div>

                {/* Isi Pernyataan */}
                <ol className="text-xs text-gray-600 pl-6 list-decimal space-y-4 mb-6">
                  <li>
                    <span className="text-gray-900 font-semibold">Perdagangan Berjangka BERISIKO SANGAT TINGGI</span>
                    <span className="text-gray-900"> tidak cocok untuk semua orang. Pastikan bahwa anda <b>SEPENUHNYA MEMAHAMI RISIKO</b> ini sebelum melakukan perdagangan.</span>
                  </li>
                  <li>
                    <span className="text-gray-900">
                      Perdagangan Berjangka merupakan produk keuangan dengan <i>leverage</i> dan dapat menyebabkan{" "}
                      <b>KERUGIAN ANDA MELEBIHI</b> setoran awal Anda. Anda harus siap apabila <b>SELURUH DANA ANDA HABIS</b>.
                    </span>
                  </li>
                  <li>
                    <span className="text-gray-900">
                      TIDAK ADA PENDAPATAN TETAP (<i>FIXED INCOME</i>) dalam Perdagangan Berjangka.
                    </span>
                  </li>
                  <li>
                    <span className="text-gray-900">
                      Apabila anda <b>PEMULA</b> kami sarankan untuk mempelajari mekanisme transaksinya, <b>PERDAGANGAN BERJANGKA</b> membutuhkan pengetahuan dan pemahaman khusus.
                    </span>
                  </li>
                  <li>
                    <span className="text-gray-900">
                      <b>ANDA HARUS MELAKUKAN TRANSAKSI SENDIRI</b>, segala risiko yang akan timbul akibat transaksi sepenuhnya akan menjadi tanggung jawab Saudara.
                    </span>
                  </li>
                  <li>
                    <span className="text-gray-900">
                      User Id dan Password <b>BERSIFAT PRIBADI DAN RAHASIA</b>, anda bertanggung jawab atas penggunaannya, <b>JANGAN SERAHKAN</b> ke pihak lain terutama Wakil Pialang Berjangka dan pegawai Pialang Berjangka.
                    </span>
                  </li>
                  <li>
                    <span className="text-gray-900">
                      ANDA berhak menerima <b>LAPORAN ATAS TRANSAKSI</b> yang anda lakukan. Waktu anda 2 X 24 JAM UNTUK MEMBERIKAN SANGGAHAN. Untuk transaksi yang <b>TELAH SELESAI (<i>DONE/SETTLE</i>)</b> DAPAT ANDA CEK melalui sistem informasi transaksi nasabah yang berfungsi untuk memastikan transaksi anda telah terdaftar di Lembaga Kliring Berjangka.
                    </span>
                  </li>
                </ol>

                <p className="text-xs font-semibold text-gray-700 mb-4 text-center">
                  SECARA DETAIL BACA DOKUMEN PEMBERITAHUAN ADANYA RISIKO DAN DOKUMEN PERJANJIAN PEMBERIAN AMANAT
                </p>

                <div className="pt-3">
                  <p className="text-xs text-gray-600 mb-6">
                    Untuk mempelajari lebih lanjut mengenai Perdagangan Berjangka dapat anda mengunjungi situs{" "}
                    <a
                      href="https://www.bappebti.go.id"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline hover:underline font-medium"
                    >
                      www.bappebti.go.id
                    </a>
                  </p>

                  <div className="mb-4">
                    <label className={labelClass}>Diterima/Tidak Diterima:</label>
                    <div className="flex gap-6 mt-1.5">
                      {["ya", "tidak"].map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                          <input
                            type="radio"
                            name="acceptance"
                            value={opt}
                            checked={acceptanceRadio === opt}
                            onChange={(e) => handleAcceptanceChange(e.target.value)}
                            className="radio-primary"
                          />
                          {opt === "ya" ? "Ya" : "Tidak"}
                        </label>
                      ))}
                    </div>
                    {showError && acceptanceRadio !== "ya" && (
                      <p className={errorClass}>Anda harus memilih Ya untuk melanjutkan.</p>
                    )}
                  </div>
                  <div>
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

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-6 mb-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="bg-[#4fc3f7] hover:bg-[#3db3e7] text-white w-[36px] h-[36px] rounded-xl text-xl font-medium transition-colors flex items-center justify-center"
                  >
                    {"<"}
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!validateForm()}
                    className={`w-[36px] h-[36px] rounded-xl text-xl font-medium transition-colors flex items-center justify-center ${
                      validateForm()
                        ? "bg-[#4fc3f7] hover:bg-[#3db3e7] text-white cursor-pointer"
                        : "bg-[#E9E9E9] text-white cursor-not-allowed"
                    }`}
                  >
                    {">"}
                  </button>
                </div>

                {/* Bottom Buttons */}
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
                    disabled={true}
                    className="bg-gray-100 text-gray-400 border border-gray-200 rounded-full px-4 py-2 text-xs font-medium min-w-[130px] cursor-not-allowed transition-colors"
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
