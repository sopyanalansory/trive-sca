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

interface Process {
  no: number;
  process: string;
  status: boolean;
}

export default function AdditionalStatement8Page() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileHovered, setProfileHovered] = React.useState(false);
  const [userName, setUserName] = React.useState("");
  const [userInitial, setUserInitial] = React.useState("M");
  const [accepted, setAccepted] = React.useState("");
  const [tanggalPenerimaan] = React.useState(() => formatDateNow());

  const processes: Process[] = [
    { no: 1, process: "Profil Perusahaan Pialang Berjangka", status: true },
    {
      no: 2,
      process: "Pernyataan Telah Melakukan Simulasi Perdagangan Berjangka Komoditi",
      status: true,
    },
    {
      no: 3,
      process: "Pernyataan Telah Berpengalaman Melaksanakan Transaksi Perdagangan Berjangka Komoditi",
      status: true,
    },
    {
      no: 4,
      process: "Pernyataan Pengungkapan (Disclosure Statement)",
      status: true,
    },
    {
      no: 5,
      process: "Aplikasi Pembukaan Rekening Transaksi Secara Elektronik Online",
      status: true,
    },
    {
      no: 6,
      process: "Pernyataan Pengungkapan (Disclosure Statement)",
      status: true,
    },
    {
      no: 7,
      process: "Dokumen Pemberitahuan Adanya Risiko Yang Harus Disampaikan Oleh Pialang Perjangka Untuk Transaksi Kontrak Derivatif Dalam Sistem Perdagangan Alternatif",
      status: true,
    },
    {
      no: 8,
      process: "Pernyataan Pengungkapan (Disclosure Statement)",
      status: true,
    },
    {
      no: 9,
      process: "Perjanjian Pemberian Amanat Secara Elektronik Online Untuk Transaksi Kontrak Derivatif Dalam Sistem Perdagangan Alternatif",
      status: true,
    },
    {
      no: 10,
      process: "Peraturan Perdagangan (Trading Rules)",
      status: true,
    },
    {
      no: 11,
      process: "Pernyataan Bertanggung Jawab Atas Kode Akses Transaksi Nasabah (Personal Access Password)",
      status: true,
    },
    {
      no: 12,
      process: "Pernyataan Bahwa Dana Yang Digunakan Sebagai Margin Merupakan Dana Milik Nasabah Sendiri",
      status: true,
    },
  ];

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

  const handleNext = () => {
    router.push("/open-investment-account/atur-akun");
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
                          idx < 8
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
                  <div className="font-semibold text-sm text-gray-900 mb-2 uppercase leading-tight">
                    VERIFIKASI KELENGKAPAN PROSES PENERIMAAN NASABAH
                  </div>
                  <div className="font-semibold text-sm text-gray-900 mb-6 uppercase leading-tight">
                    SECARA ELEKTRONIK ON-LINE
                  </div>
                </div>

                {/* Preview Section */}
                <div className="mb-6">
                  <div className="font-semibold text-xs text-gray-900 mb-2">
                    PREVIEW
                  </div>
                  <div className="text-xs text-gray-600 mb-4 italic">
                    Silahkan cek aplikasi Anda, jika sudah sesuai klik "Setuju"
                  </div>

                  {/* Process Table */}
                  <div className="border border-gray-900 mb-6 overflow-x-auto">
                    <table className="w-full border-collapse min-w-[500px]">
                      <thead>
                        <tr className="bg-white">
                          <th className="p-2 text-center font-bold text-xs text-gray-900 border border-gray-900 w-[50px]">
                            NO
                          </th>
                          <th className="p-2 text-center font-bold text-xs text-gray-900 border border-gray-900">
                            PROSES
                          </th>
                          <th className="p-2 text-center font-bold text-xs text-gray-900 border border-gray-900 w-[70px]">
                            STATUS
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {processes.map((item) => (
                          <tr key={item.no}>
                            <td className="p-1.5 text-center text-xs text-gray-900 border border-gray-900 font-normal">
                              {item.no}
                            </td>
                            <td className="p-2 text-xs text-gray-900 border border-gray-900 leading-tight text-left font-normal">
                              {item.process}
                            </td>
                            <td className="p-1.5 text-center text-sm text-gray-900 border border-gray-900 font-bold">
                              {item.status ? "✓" : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Declaration Text */}
                  <div className="text-xs text-gray-700 mb-6 leading-relaxed">
                    Dengan mengisi kolom "YA" di bawah ini, saya menyatakan bahwa saya telah membaca dan memahami seluruh isi dokumen yang disampaikan.
                    <br />
                    <br />
                    Demikian Pernyataan ini dibuat dengan sebenarnya dalam keadaan sadar, sehat jasmani dan rohani serta tanpa paksaan apapun dari pihak manapun.
                  </div>
                </div>

                {/* Acceptance Section */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="mb-4">
                    <label className={labelClass}>Diterima/Tidak Diterima:</label>
                    <div className="flex gap-6 mt-1.5">
                      {["ya", "tidak"].map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                          <input
                            type="radio"
                            name="acceptance"
                            value={opt}
                            checked={accepted === opt}
                            onChange={(e) => setAccepted(e.target.value)}
                            className="radio-primary"
                          />
                          {opt === "ya" ? "Ya" : "Tidak"}
                        </label>
                      ))}
                    </div>
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
                <div className="flex justify-start items-center mt-6 mb-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="bg-[#4fc3f7] hover:bg-[#3db3e7] text-white w-[36px] h-[36px] rounded-xl text-xl font-medium transition-colors flex items-center justify-center"
                  >
                    {"<"}
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
                    onClick={handleNext}
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
