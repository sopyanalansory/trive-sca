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

export default function AdditionalStatement5Page() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileHovered, setProfileHovered] = React.useState(false);
  const [userName, setUserName] = React.useState("");
  const [userInitial, setUserInitial] = React.useState("M");
  const [selected, setSelected] = React.useState("ICDX");
  const [acceptanceRadio, setAcceptanceRadio] = React.useState("");
  const [showError, setShowError] = React.useState(false);
  const [showPdfModal, setShowPdfModal] = React.useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = React.useState("");
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
    router.push("/open-investment-account/additional-statement-6");
  };

  const handleOpenPdf = (pdfType: string) => {
    let pdfUrl = "";
    if (pdfType === "ICDX") {
      pdfUrl =
        "https://cdn2.triveinvest.co.id/pdf/(ICDX)060923-PERATURAN-PERDAGANGAN-ONLINE(TRADING%20RULES)TRIVEINVEST.pdf";
    } else if (pdfType === "JFX") {
      pdfUrl =
        "https://cdn2.triveinvest.co.id/pdf/(BBJ)060923-PERATURAN-PERDAGANGAN-ONLINE(TRADING%20RULES)TRIVEINVEST.pdf";
    }
    setCurrentPdfUrl(pdfUrl);
    setShowPdfModal(true);
  };

  const handleClosePdf = () => {
    setShowPdfModal(false);
    setCurrentPdfUrl("");
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
                  {[...Array(8)].map((_, idx) => (
                    <div key={idx} className="text-center">
                      <div
                        className={`w-8 h-8 rounded-full text-white flex items-center justify-center mx-auto mb-2 font-bold text-sm border-2 ${
                          idx < 5
                            ? "bg-[#4fc3f7] border-[#4fc3f7]"
                            : "bg-gray-200 border-gray-200 text-gray-400"
                        }`}
                      >
                        <span>&#10003;</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Title */}
                <div className="text-center mb-6">
                  <div className="font-semibold text-base text-gray-900 mb-6 uppercase">
                    PERATURAN PERDAGANGAN
                    <br />
                    (TRADING RULES)
                  </div>
                </div>

                {/* Pemilihan Bursa Berjangka */}
                <div className="mb-6">
                  <div className="font-semibold text-xs text-gray-900 mb-2">
                    Pemilihan Bursa Berjangka
                  </div>
                  <div className="text-xs text-gray-700 mb-4 leading-relaxed">
                    Transaksi Anda akan dilaporkan ke Bursa Berjangka yang anda pilih. Jika terjadi perbedaan/perselisihan, bursa berjangka yang dipilih berwenang melakukan Peninjauan, Mediasi, dan Penyelesaian.
                  </div>
                  <div className="mb-4">
                    <div className="text-xs text-gray-700 mb-3">
                      Silahkan Pilih Bursa Berjangka:
                    </div>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="radio"
                          checked={selected === "ICDX"}
                          onChange={() => setSelected("ICDX")}
                          className="radio-primary"
                        />
                        ICDX
                      </label>
                      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-not-allowed">
                        <input
                          type="radio"
                          checked={selected === "JFX"}
                          onChange={() => setSelected("JFX")}
                          className="radio-primary"
                          disabled
                        />
                        JFX
                      </label>
                    </div>
                  </div>

                  {/* Warning Box */}
                  <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                    <span className="text-orange-500 text-xl flex-shrink-0 mt-0.5">⚠</span>
                    <span className="text-xs text-gray-700 leading-relaxed">
                      Harap klik tombol Peraturan Perdagangan (Trading Rules) untuk bursa berjangka yang dipilih, dan pastikan Anda menggulir ke bawah hingga akhir dokumen guna membaca, memahami, dan menerima syarat-syarat yang tertera. Langkah ini perlu diikuti sesuai dengan peraturan yang berlaku untuk melanjutkan ke tahap berikutnya.
                    </span>
                  </div>

                  {/* PDF Buttons */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => handleOpenPdf("ICDX")}
                      className="bg-[#4fc3f7] hover:bg-[#3db3e7] text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Trading Rules: ICDX
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenPdf("JFX")}
                      className="bg-[#4fc3f7] hover:bg-[#3db3e7] text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Trading Rules: JFX
                    </button>
                  </div>

                  {/* Informasi Bursa */}
                  <div className="mb-6">
                    <div className="font-semibold text-xs text-gray-900 mb-3">
                      Informasi Mengenai Bursa dan Kliring Berjangka
                    </div>
                    <div className="text-xs text-gray-700 leading-relaxed space-y-4">
                      <div>
                        Nama Perusahaan Peserta SPA: PT Trive Invest Futures
                        <br />
                        Menunjuk Bursa Berjangka: Indonesia Commodity & Derivatives Exchange (ICDX) Sebagai tempat Pelaporan Transaksi
                        <br />
                        Menunjuk Lembaga Kliring Berjangka: Indonesia Clearing House (ICH)
                        <br />
                        Sebagai tempat Pendaftaran Transaksi
                      </div>
                      <div>
                        Nama Perusahaan Peserta SPA: PT Trive Invest Futures
                        <br />
                        Menunjuk Bursa Berjangka: Jakarta Futures Exchange (JFX) Sebagai tempat Pelaporan Transaksi
                        <br />
                        Menunjuk Lembaga Kliring Berjangka: Kliring Berjangka Indonesia House (KBI)
                        <br />
                        Sebagai tempat Pendaftaran Transaksi
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acceptance Section */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-700 mb-4 leading-relaxed">
                    Dengan mengisi kolom "YA" dibawah ini, saya menyatakan bahwa saya telah membaca tentang PERATURAN PERDAGANGAN (TRADING RULES) mengerti dan menerima ketentuan dalam bertransaksi.
                  </div>
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

      {/* PDF Modal */}
      {showPdfModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={handleClosePdf}
        >
          <div
            className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                Peraturan Perdagangan (Trading Rules)
              </h3>
              <button
                onClick={handleClosePdf}
                className="bg-gray-100 hover:bg-gray-200 border-none rounded-md px-3 py-1.5 text-xs text-gray-600 transition-colors"
              >
                Tutup ✕
              </button>
            </div>
            <iframe
              src={currentPdfUrl}
              className="w-full flex-1 border-none"
              title="Trading Rules PDF"
            />
          </div>
        </div>
      )}
    </div>
  );
}
