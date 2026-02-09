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

export default function AdditionalStatementPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileHovered, setProfileHovered] = React.useState(false);
  const [userName, setUserName] = React.useState("");
  const [userInitial, setUserInitial] = React.useState("M");
  const [accepted, setAccepted] = React.useState("");
  const [tanggalPenerimaan] = React.useState(() => formatDateNow());
  const [errors, setErrors] = React.useState<Record<string, string>>({});

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

  const handleAcceptedChange = (value: string) => {
    setAccepted(value);
    if (errors.accepted) {
      setErrors((prev) => ({
        ...prev,
        accepted: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!accepted) {
      newErrors.accepted = "Anda harus memilih Ya atau Tidak.";
    }

    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formErrors = validateForm();

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    if (accepted !== "ya") {
      alert("Anda harus menerima pernyataan untuk melanjutkan");
      return;
    }

    // Navigate to next step - adjust route as needed
    router.push("/open-investment-account/additional-statement-2");
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
              <p className="text-xs text-gray-900 mt-3 mb-5 text-center">
                <span className="font-bold">PERNYATAAN PENGUNGKAPAN</span>
                <br />
                <span className="text-gray-600">(DISCLOSURE STATEMENT)</span>
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 w-full min-w-0 max-w-full">
                {/* Stepper Horizontal */}
                <div className="flex items-center justify-center gap-6 mb-6 mt-2">
                  {[...Array(7)].map((_, idx) => (
                    <div key={idx} className="text-center">
                      <div
                        className={`w-8 h-8 rounded-full text-white flex items-center justify-center mx-auto mb-2 font-bold text-sm border-2 ${
                          idx === 0
                            ? "bg-[#4fc3f7] border-[#4fc3f7]"
                            : "bg-gray-200 border-gray-200 text-gray-400"
                        }`}
                      >
                        <span>&#10003;</span>
                      </div>
                    </div>
                  ))}
                </div>
                <ol className="text-xs text-gray-600 pl-5 list-decimal space-y-2.5 mb-6">
                  <li>
                    Perdagangan Berjangka <b>BERISIKO SANGAT TINGGI</b> tidak cocok untuk semua orang. Pastikan bahwa anda <b>SEPENUHNYA MEMAHAMI RISIKO</b> ini sebelum melakukan perdagangan.
                  </li>
                  <li>
                    Perdagangan Berjangka merupakan produk keuangan dengan <i>leverage</i> dan dapat menyebabkan{" "}
                    <b>KERUGIAN ANDA MELEBIHI</b> setoran awal Anda. Anda harus siap apabila <b>SELURUH DANA ANDA HABIS</b>.
                  </li>
                  <li>
                    <b>
                      TIDAK ADA PENDAPATAN TETAP (<i>FIXED INCOME</i>)
                    </b>{" "}
                    dalam Perdagangan Berjangka.
                  </li>
                  <li>
                    Apabila anda <b>PEMULA</b> kami sarankan untuk mempelajari mekanisme transaksinya, PERDAGANGAN BERJANGKA membutuhkan pengetahuan dan pemahaman khusus.
                  </li>
                  <li>
                    <b>ANDA HARUS MELAKUKAN TRANSAKSI SENDIRI</b>, segala risiko yang akan timbul akibat transaksi sepenuhnya akan menjadi tanggung jawab Saudara.
                  </li>
                  <li>
                    User Id dan Password <b>BERSIFAT PRIBADI DAN RAHASIA</b>, anda bertanggung jawab atas penggunaannya, <b>JANGAN SERAHKAN</b> ke pihak lain terutama Wakil Pialang Berjangka dan pegawai Pialang Berjangka.
                  </li>
                  <li>
                    ANDA berhak menerima <b>LAPORAN ATAS TRANSAKSI</b> yang anda lakukan. Waktu anda 2 X 24 JAM UNTUK MEMBERIKAN SANGGAHAN. Untuk transaksi yang TELAH SELESAI (<i>DONE/SETTLE</i>) DAPAT ANDA CEK melalui sistem informasi transaksi nasabah yang berfungsi untuk memastikan transaksi anda telah terdaftar di Lembaga Kliring Berjangka.
                  </li>
                </ol>

                <p className="text-xs font-semibold text-gray-700 mb-4 text-center">
                  SECARA DETAIL BACA DOKUMEN PEMBERITAHUAN ADANYA RISIKO DAN DOKUMEN PERJANJIAN PEMBERIAN AMANAT
                </p>
                <p className="text-xs text-gray-600 mb-6">
                  Untuk mempelajari lebih lanjut mengenai Perdagangan Berjangka dapat anda mengunjungi situs{" "}
                  <a
                    href="https://www.bappebti.go.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:underline font-medium"
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
                  {errors.accepted && <p className={errorClass}>{errors.accepted}</p>}
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
                    onClick={() => router.back()}
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
