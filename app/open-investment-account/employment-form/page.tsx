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
const PEKERJAAN_OPTIONS = [
  "ASN",
  "Karyawan Swasta",
  "Wiraswasta",
  "Pensiunan",
  "Mahasiswa",
  "Profesional",
  "Ibu Rumah Tangga",
  "Pengangguran",
];
const JABATAN_OPTIONS = [
  "Pemilik/Eksekutif",
  "Manajemen Senior",
  "Manajemen Menengah / Kepala Bagian",
  "Staf",
];

type FormData = {
  bidangUsaha: string;
  namaPerusahaan: string;
  jabatan: string;
  lamaBekerja: string;
  nomorFaksKantor: string;
  alamatKantor: string;
  nomorTeleponKantor: string;
};

type EmploymentFieldsConfig = {
  showBidangUsaha: boolean;
  showNamaPerusahaan: boolean;
  showJabatan: boolean;
  showLamaBekerja: boolean;
  showNomorFaksKantor: boolean;
  showAlamatKantor: boolean;
  showNomorTeleponKantor: boolean;
  requiredFields: (keyof FormData)[];
};

function getEmploymentFields(pekerjaanType: string): EmploymentFieldsConfig {
  switch (pekerjaanType) {
    case "ASN":
    case "Karyawan Swasta":
    case "Wiraswasta":
    case "Pensiunan":
      return {
        showBidangUsaha: true,
        showNamaPerusahaan: true,
        showJabatan: true,
        showLamaBekerja: true,
        showNomorFaksKantor: true,
        showAlamatKantor: true,
        showNomorTeleponKantor: true,
        requiredFields: ["bidangUsaha", "namaPerusahaan", "jabatan", "lamaBekerja", "alamatKantor", "nomorTeleponKantor"],
      };
    case "Profesional":
      return {
        showBidangUsaha: true,
        showNamaPerusahaan: false,
        showJabatan: false,
        showLamaBekerja: true,
        showNomorFaksKantor: true,
        showAlamatKantor: true,
        showNomorTeleponKantor: true,
        requiredFields: ["bidangUsaha", "lamaBekerja", "alamatKantor", "nomorTeleponKantor"],
      };
    case "Mahasiswa":
      return {
        showBidangUsaha: false,
        showNamaPerusahaan: false,
        showJabatan: false,
        showLamaBekerja: true,
        showNomorFaksKantor: true,
        showAlamatKantor: true,
        showNomorTeleponKantor: true,
        requiredFields: ["lamaBekerja", "alamatKantor", "nomorTeleponKantor"],
      };
    case "Ibu Rumah Tangga":
    case "Pengangguran":
      return {
        showBidangUsaha: false,
        showNamaPerusahaan: false,
        showJabatan: false,
        showLamaBekerja: false,
        showNomorFaksKantor: false,
        showAlamatKantor: false,
        showNomorTeleponKantor: false,
        requiredFields: [],
      };
    default:
      return {
        showBidangUsaha: false,
        showNamaPerusahaan: false,
        showJabatan: false,
        showLamaBekerja: false,
        showNomorFaksKantor: false,
        showAlamatKantor: false,
        showNomorTeleponKantor: false,
        requiredFields: [],
      };
  }
}

const initialFormData: FormData = {
  bidangUsaha: "",
  namaPerusahaan: "",
  jabatan: "",
  lamaBekerja: "",
  nomorFaksKantor: "",
  alamatKantor: "",
  nomorTeleponKantor: "",
};

export default function EmploymentFormPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileHovered, setProfileHovered] = React.useState(false);
  const [userName, setUserName] = React.useState("");
  const [userInitial, setUserInitial] = React.useState("M");
  const [pekerjaan, setPekerjaan] = React.useState("");
  const [diterima, setDiterima] = React.useState<string | null>(null);
  const [tanggalPenerimaan] = React.useState(() => formatDateNow());
  const [formData, setFormData] = React.useState<FormData>(initialFormData);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const activeTabIndex = 2; // Pekerjaan

  const currentFields = React.useMemo(() => getEmploymentFields(pekerjaan), [pekerjaan]);

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

  const handlePekerjaanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setPekerjaan(value);
    setFormData(initialFormData);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.pekerjaan;
      (["bidangUsaha", "namaPerusahaan", "jabatan", "lamaBekerja", "nomorTeleponKantor", "alamatKantor"] as const).forEach((k) => delete next[k]);
      if (!value.trim()) next.pekerjaan = "Bagian ini diperlukan.";
      return next;
    });
  };

  const handleFieldChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (value.trim()) {
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    } else if (currentFields.requiredFields.includes(field)) {
      setErrors((prev) => ({ ...prev, [field]: "Bagian ini diperlukan." }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!pekerjaan.trim()) newErrors.pekerjaan = "Bagian ini diperlukan.";
    currentFields.requiredFields.forEach((field) => {
      if (!formData[field].trim()) newErrors[field] = "Bagian ini diperlukan.";
    });
    if (diterima !== "ya") newErrors.diterima = "Anda harus menerima pernyataan kebenaran dan tanggung jawab.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    router.push("/open-investment-account/wealth-list-form");
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
              <h2 className="text-base font-semibold text-gray-900 tracking-tight mb-1">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={currentFields.showBidangUsaha ? "min-w-0" : "min-w-0 sm:max-w-[50%]"}>
                    <label className={labelClass}>
                      Pekerjaan <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={`${inputBase} bg-white border ${errors.pekerjaan ? "border-red-500" : "border-gray-200"}`}
                      value={pekerjaan}
                      onChange={handlePekerjaanChange}
                    >
                      <option value="">Pilih</option>
                      {PEKERJAAN_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {errors.pekerjaan && <p className={errorClass}>{errors.pekerjaan}</p>}
                  </div>
                  {currentFields.showBidangUsaha && (
                    <div className="min-w-0">
                      <label className={labelClass}>
                        Bidang Usaha <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className={`${inputBase} bg-white border ${errors.bidangUsaha ? "border-red-500" : "border-gray-200"}`}
                        value={formData.bidangUsaha}
                        onChange={handleFieldChange("bidangUsaha")}
                        placeholder="Bidang Usaha"
                      />
                      {errors.bidangUsaha && <p className={errorClass}>{errors.bidangUsaha}</p>}
                    </div>
                  )}
                </div>

                {(currentFields.showNamaPerusahaan || currentFields.showJabatan) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentFields.showNamaPerusahaan && (
                      <div>
                        <label className={labelClass}>Nama Perusahaan <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          className={`${inputBase} bg-white border ${errors.namaPerusahaan ? "border-red-500" : "border-gray-200"}`}
                          value={formData.namaPerusahaan}
                          onChange={handleFieldChange("namaPerusahaan")}
                        />
                        {errors.namaPerusahaan && <p className={errorClass}>{errors.namaPerusahaan}</p>}
                      </div>
                    )}
                    {currentFields.showJabatan && (
                      <div>
                        <label className={labelClass}>Jabatan <span className="text-red-500">*</span></label>
                        <select
                          className={`${inputBase} bg-white border ${errors.jabatan ? "border-red-500" : "border-gray-200"}`}
                          value={formData.jabatan}
                          onChange={handleFieldChange("jabatan")}
                        >
                          <option value="">Pilih</option>
                          {JABATAN_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        {errors.jabatan && <p className={errorClass}>{errors.jabatan}</p>}
                      </div>
                    )}
                  </div>
                )}

                {(currentFields.showLamaBekerja || currentFields.showNomorFaksKantor) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentFields.showLamaBekerja && (
                      <div>
                        <label className={labelClass}>Lama Bekerja <span className="text-red-500">*</span></label>
                        <select
                          className={`${inputBase} bg-white border ${errors.lamaBekerja ? "border-red-500" : "border-gray-200"}`}
                          value={formData.lamaBekerja}
                          onChange={handleFieldChange("lamaBekerja")}
                        >
                          <option value="">Pilih</option>
                          {[...Array(10)].map((_, i) => (
                            <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                          ))}
                          <option value="10+">10+</option>
                        </select>
                        {errors.lamaBekerja && <p className={errorClass}>{errors.lamaBekerja}</p>}
                      </div>
                    )}
                    {currentFields.showNomorFaksKantor && (
                      <div>
                        <label className={labelClass}>Nomor Faks Kantor</label>
                        <input
                          type="text"
                          className={`${inputBase} bg-white`}
                          value={formData.nomorFaksKantor}
                          onChange={handleFieldChange("nomorFaksKantor")}
                        />
                      </div>
                    )}
                  </div>
                )}

                {(currentFields.showAlamatKantor || currentFields.showNomorTeleponKantor) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentFields.showAlamatKantor && (
                      <div>
                        <label className={labelClass}>Alamat Kantor <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          className={`${inputBase} bg-white border ${errors.alamatKantor ? "border-red-500" : "border-gray-200"}`}
                          value={formData.alamatKantor}
                          onChange={handleFieldChange("alamatKantor")}
                        />
                        {errors.alamatKantor && <p className={errorClass}>{errors.alamatKantor}</p>}
                      </div>
                    )}
                    {currentFields.showNomorTeleponKantor && (
                      <div>
                        <label className={labelClass}>Nomor Telepon Kantor <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          className={`${inputBase} bg-white border ${errors.nomorTeleponKantor ? "border-red-500" : "border-gray-200"}`}
                          value={formData.nomorTeleponKantor}
                          onChange={handleFieldChange("nomorTeleponKantor")}
                        />
                        {errors.nomorTeleponKantor && <p className={errorClass}>{errors.nomorTeleponKantor}</p>}
                      </div>
                    )}
                  </div>
                )}

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
                          name="diterima"
                          value={opt}
                          checked={diterima === opt}
                          onChange={() => {
                            setDiterima(opt);
                            if (errors.diterima) setErrors((prev) => ({ ...prev, diterima: "" }));
                          }}
                          className="radio-primary"
                        />
                        {opt === "ya" ? "Ya" : "Tidak"}
                      </label>
                    ))}
                  </div>
                  {errors.diterima && <p className={errorClass}>{errors.diterima}</p>}
                  <div>
                    <label className={labelClass}>Tanggal Penerimaan:</label>
                    <input type="text" className={`${inputBase} ${inputDisabled}`} value={tanggalPenerimaan} disabled readOnly />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/open-investment-account/emergency-contact-form")}
                    className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-xs font-medium hover:bg-gray-50 transition-colors min-w-[130px]"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={diterima !== "ya"}
                    className={`px-4 py-2 rounded-full text-xs min-w-[130px] transition-colors border ${
                      diterima === "ya"
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
