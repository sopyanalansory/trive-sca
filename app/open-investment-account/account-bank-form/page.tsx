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
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
}

const TAB_LABELS = ["Informasi Pribadi", "Kontak Darurat", "Pekerjaan", "Daftar Kekayaan", "Akun Bank"];

export default function AccountBankFormPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileHovered, setProfileHovered] = React.useState(false);
  const [userName, setUserName] = React.useState("");
  const [userInitial, setUserInitial] = React.useState("M");

  const [namaBank, setNamaBank] = React.useState("");
  const [nomorTelepon, setNomorTelepon] = React.useState("");
  const [namaPemilik, setNamaPemilik] = React.useState("");
  const [jenisRekening, setJenisRekening] = React.useState("");
  const [namaCabang, setNamaCabang] = React.useState("");
  const [noRekening, setNoRekening] = React.useState("");
  const [mataUang, setMataUang] = React.useState("");
  const [rekeningTambahan, setRekeningTambahan] = React.useState("");
  const [accepted, setAccepted] = React.useState("");
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [tanggalPenerimaan] = React.useState(() => formatDateNow());

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const activeTabIndex = 4; // Akun Bank

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
    if (errors.accepted) setErrors((prev) => ({ ...prev, accepted: "" }));
  };

  const handleInputChange =
    (field: keyof typeof fieldSetters) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value;
      fieldSetters[field](value);

      const requiredFields: (keyof typeof fieldSetters)[] = [
        "namaBank",
        "namaPemilik",
        "jenisRekening",
        "namaCabang",
        "noRekening",
        "mataUang",
        "rekeningTambahan",
      ];

      if (requiredFields.includes(field)) {
        if (!value.trim()) {
          setErrors((prev) => ({ ...prev, [field]: "Bagian ini diperlukan." }));
        } else {
          setErrors((prev) => ({ ...prev, [field]: "" }));
        }
      } else if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!namaBank.trim()) newErrors.namaBank = "Bagian ini diperlukan.";
    if (!namaPemilik.trim()) newErrors.namaPemilik = "Bagian ini diperlukan.";
    if (!jenisRekening.trim()) newErrors.jenisRekening = "Bagian ini diperlukan.";
    if (!namaCabang.trim()) newErrors.namaCabang = "Bagian ini diperlukan.";
    if (!noRekening.trim()) newErrors.noRekening = "Bagian ini diperlukan.";
    if (!mataUang.trim()) newErrors.mataUang = "Bagian ini diperlukan.";
    if (!rekeningTambahan.trim()) newErrors.rekeningTambahan = "Bagian ini diperlukan.";
    if (accepted !== "ya") newErrors.accepted = "Anda harus menerima pernyataan kebenaran dan tanggung jawab.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    router.push("/open-investment-account/additional-statement");
  };

  const inputBase =
    "w-full px-2.5 py-2 rounded-md border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:ring-1 focus:ring-[#00C2FF]/30 focus:border-[#00C2FF]";
  const inputDisabled = "bg-gray-50 text-gray-600 cursor-not-allowed";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";
  const errorClass = "mt-0.5 text-[11px] text-red-500";

  const fieldSetters = {
    namaBank: setNamaBank,
    nomorTelepon: setNomorTelepon,
    namaPemilik: setNamaPemilik,
    jenisRekening: setJenisRekening,
    namaCabang: setNamaCabang,
    noRekening: setNoRekening,
    mataUang: setMataUang,
    rekeningTambahan: setRekeningTambahan,
  } as const;

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
            <OpenAccountStepProgress currentStep={7} mobileTitle="Aplikasi Pembukaan Rekening Transaksi Secara Elektronik Online" />

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
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                    <div>
                      <label className={labelClass}>
                        Nama Bank <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={namaBank}
                        onChange={handleInputChange("namaBank")}
                        className={`${inputBase} ${errors.namaBank ? "border-red-500" : ""}`}
                        placeholder="Nama Bank"
                      />
                      {errors.namaBank && <p className={errorClass}>{errors.namaBank}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Nomor Telepon Bank</label>
                      <input
                        type="text"
                        value={nomorTelepon}
                        onChange={handleInputChange("nomorTelepon")}
                        className={inputBase}
                        placeholder="Nomor Telepon Bank"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                    <div>
                      <label className={labelClass}>
                        Nama Pemilik Rekening <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={namaPemilik}
                        onChange={handleInputChange("namaPemilik")}
                        className={`${inputBase} ${errors.namaPemilik ? "border-red-500" : ""}`}
                        placeholder="Nama Pemilik Rekening"
                      />
                      {errors.namaPemilik && <p className={errorClass}>{errors.namaPemilik}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>
                        Jenis Rekening <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-col gap-1.5 mt-1.5 text-xs text-gray-600">
                        {["Giro", "Tabungan", "Lainnya"].map((opt) => (
                          <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="jenisRekening"
                              value={opt}
                              checked={jenisRekening === opt}
                              onChange={handleInputChange("jenisRekening")}
                              className="radio-primary"
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                      {errors.jenisRekening && <p className={errorClass}>{errors.jenisRekening}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                    <div>
                      <label className={labelClass}>
                        Nama Cabang <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={namaCabang}
                        onChange={handleInputChange("namaCabang")}
                        className={`${inputBase} ${errors.namaCabang ? "border-red-500" : ""}`}
                        placeholder="Nama Cabang"
                      />
                      {errors.namaCabang && <p className={errorClass}>{errors.namaCabang}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>
                        No Rekening <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={noRekening}
                        onChange={handleInputChange("noRekening")}
                        className={`${inputBase} ${errors.noRekening ? "border-red-500" : ""}`}
                        placeholder="No Rekening"
                      />
                      {errors.noRekening && <p className={errorClass}>{errors.noRekening}</p>}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className={labelClass}>Mohon unggah halaman depan buku tabungan</label>
                    <select className={inputBase}>
                      <option>Akun bank</option>
                    </select>
                    <label
                      className="border border-dashed border-[#90caf9] rounded-md px-4 py-6 text-center text-xs text-[#90caf9] bg-[#f9fafd] cursor-pointer flex flex-col items-center gap-1"
                      htmlFor="fileInput"
                    >
                      <span className="text-2xl">⛅</span>
                      <span className="text-gray-500">
                        {uploadedFile ? uploadedFile.name : "Mohon unggah halaman depan buku tabungan"}
                      </span>
                    </label>
                    <input id="fileInput" type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Mata uang <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={mataUang}
                      onChange={handleInputChange("mataUang")}
                      className={`${inputBase} ${errors.mataUang ? "border-red-500" : ""}`}
                    >
                      <option value="">Pilih</option>
                      <option value="IDR">IDR</option>
                      <option value="USD">USD</option>
                    </select>
                    {errors.mataUang && <p className={errorClass}>{errors.mataUang}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>
                      Rekening Bank Tambahan <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4 mt-1.5">
                      {["ya", "tidak"].map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                          <input
                            type="radio"
                            name="rekeningTambahan"
                            value={opt}
                            checked={rekeningTambahan === opt}
                            onChange={handleInputChange("rekeningTambahan")}
                            className="radio-primary"
                          />
                          {opt === "ya" ? "Ya" : "Tidak"}
                        </label>
                      ))}
                    </div>
                    {errors.rekeningTambahan && <p className={errorClass}>{errors.rekeningTambahan}</p>}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">PERNYATAAN KEBENARAN DAN TANGGUNG JAWAB</h3>
                  <p className="text-xs text-gray-600 mb-4 max-w-2xl">
                    Dengan mencentang kolom &quot;YA&quot; di bawah ini, saya dengan ini menyatakan bahwa semua informasi dan dokumen yang saya lampirkan pada
                    APLIKASI PEMBUKAAN REKENING TRANSAKSI ELEKTRONIK ONLINE adalah sah dan benar. Saya akan bertanggung jawab penuh jika terjadi sesuatu yang
                    berhubungan dengan ketidakabsahan data yang saya berikan.
                  </p>
                  <label className={labelClass}>
                    Diterima/Tidak Diterima: <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4 mt-1.5 mb-4">
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
                  <div>
                    <label className={labelClass}>Tanggal Penerimaan:</label>
                    <input type="text" className={`${inputBase} ${inputDisabled}`} value={tanggalPenerimaan} disabled readOnly />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/open-investment-account/wealth-list-form")}
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

