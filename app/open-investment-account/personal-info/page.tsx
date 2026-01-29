"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api-client";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import WhatsAppButton from "../../components/WhatsAppButton";

const currentStep = 2;
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

interface UserPrefill {
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string | null;
}

interface FormData {
  tempatLahir: string;
  namaGadisIbu: string;
  alamatRumah: string;
  namaPasangan: string;
  kodePos: string;
  noTelpRumah: string;
  noFax: string;
  statusRumah: string;
}

export default function PersonalInfoPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileHovered, setProfileHovered] = React.useState(false);
  const [userName, setUserName] = React.useState("");
  const [userInitial, setUserInitial] = React.useState("M");
  const [userPrefill, setUserPrefill] = React.useState<UserPrefill | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [formData, setFormData] = React.useState<FormData>({
    tempatLahir: "",
    namaGadisIbu: "",
    alamatRumah: "",
    namaPasangan: "",
    kodePos: "",
    noTelpRumah: "",
    noFax: "",
    statusRumah: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
      return;
    }
    fetchUserData(token);
  }, [router]);

  React.useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch(buildApiUrl("/api/auth/me"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUserPrefill({
            id: data.user.id ?? "",
            name: data.user.name ?? "",
            email: data.user.email ?? "",
            phone: data.user.phone ?? "",
            countryCode: data.user.countryCode ?? null,
          });
          if (data.user.name) {
            setUserName(data.user.name.toUpperCase());
            setUserInitial(data.user.name.charAt(0).toUpperCase());
          }
        }
      } else if (response.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.tempatLahir.trim()) newErrors.tempatLahir = "Bagian ini diperlukan.";
    if (!formData.namaGadisIbu.trim()) newErrors.namaGadisIbu = "Bagian ini diperlukan.";
    if (!formData.alamatRumah.trim()) newErrors.alamatRumah = "Bagian ini diperlukan.";
    if (!formData.namaPasangan.trim()) newErrors.namaPasangan = "Bagian ini diperlukan.";
    if (!formData.statusRumah.trim()) newErrors.statusRumah = "Bagian ini diperlukan.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    router.push("/open-investment-account/company-profile");
  };

  const displayPhone = userPrefill
    ? [userPrefill.countryCode, userPrefill.phone].filter(Boolean).join("") || "-"
    : "-";

  const inputBase =
    "w-full px-2.5 py-2 rounded-md border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:ring-1 focus:ring-[#00C2FF]/30 focus:border-[#00C2FF]";
  const inputDisabled = "bg-gray-50 text-gray-600 cursor-not-allowed";
  const inputEditable = "bg-white";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";
  const errorClass = "mt-0.5 text-[11px] text-red-500";

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm lg:text-base text-gray-500">Memuat...</p>
      </div>
    );
  }

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
            {/* Step progress - gray mentok kiri (negative margin + padding agar isi tetap rapi) */}
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
                    <div
                      key={step}
                      className="flex items-center gap-3 py-2.5"
                    >
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

            {/* Mobile: progress bar + step counter */}
            <div className="lg:hidden mb-6">
              <div className="flex justify-between items-center mb-2">
                <h1 className="text-[15px] font-semibold text-gray-800">Informasi Pribadi</h1>
                <span className="text-[13px] font-medium text-gray-600">{currentStep}/{totalSteps}</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ff9000] rounded-full transition-all"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Form - section Informasi Pribadi (compact & clean) */}
            <div className="flex-1 min-w-0 bg-white py-5 px-5 lg:py-6 lg:px-6">
              <h2 className="text-base font-semibold text-gray-900 tracking-tight mb-1">Informasi Pribadi</h2>
              <p className="text-xs text-gray-500 mb-5">
                Mohon periksa informasi Anda di bawah ini, dan perbarui jika diperlukan. Pastikan sesuai dengan data pada kartu identitas (KTP/Paspor).
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Kode Nasabah</label>
                    <input className={`${inputBase} ${inputDisabled}`} value={userPrefill?.id ?? ""} disabled readOnly />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>No Telepon</label>
                    <input className={`${inputBase} ${inputDisabled}`} value={displayPhone} disabled readOnly />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input className={`${inputBase} ${inputDisabled}`} value={userPrefill?.email ?? ""} disabled readOnly />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Nama lengkap</label>
                    <input className={`${inputBase} ${inputDisabled}`} value={userPrefill?.name ? userPrefill.name.toUpperCase() : ""} disabled readOnly />
                  </div>
                  <div>
                    <label className={labelClass}>Kewarganegaraan</label>
                    <input className={`${inputBase} ${inputDisabled}`} value="Indonesia" disabled readOnly />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Nomor Kartu identitas</label>
                    <input className={`${inputBase} ${inputEditable}`} placeholder="Isi sesuai KTP" />
                  </div>
                  <div>
                    <label className={labelClass}>Jenis Kelamin</label>
                    <div className="flex gap-4 mt-1.5">
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                        <input type="radio" name="jenis_kelamin" value="Pria" className="accent-[#00C2FF] w-3.5 h-3.5" /> Pria
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                        <input type="radio" name="jenis_kelamin" value="Wanita" className="accent-[#00C2FF] w-3.5 h-3.5" /> Wanita
                      </label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Tanggal Lahir</label>
                    <input className={`${inputBase} ${inputEditable}`} placeholder="DD/MM/YYYY" />
                  </div>
                  <div>
                    <label className={labelClass}>Tempat Lahir</label>
                    <input
                      className={`${inputBase} ${inputEditable}`}
                      value={formData.tempatLahir}
                      onChange={(e) => handleInputChange("tempatLahir", e.target.value)}
                    />
                    {errors.tempatLahir && <p className={errorClass}>{errors.tempatLahir}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Status Perkawinan</label>
                    <div className="flex flex-wrap gap-4 mt-1.5">
                      {["Menikah", "Lajang", "Janda/Duda"].map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                          <input type="radio" name="status_perkawinan" value={opt} className="accent-[#00C2FF] w-3.5 h-3.5" /> {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Nama Gadis Ibu Kandung</label>
                    <input
                      className={`${inputBase} ${inputEditable}`}
                      value={formData.namaGadisIbu}
                      onChange={(e) => handleInputChange("namaGadisIbu", e.target.value)}
                    />
                    {errors.namaGadisIbu && <p className={errorClass}>{errors.namaGadisIbu}</p>}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Nama pasangan</label>
                  <input
                    className={`${inputBase} ${inputEditable}`}
                    value={formData.namaPasangan}
                    onChange={(e) => handleInputChange("namaPasangan", e.target.value)}
                  />
                  {errors.namaPasangan && <p className={errorClass}>{errors.namaPasangan}</p>}
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <h3 className="text-xs font-medium text-gray-700 mb-3">Informasi Alamat</h3>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Alamat Rumah</label>
                      <textarea
                        className={`${inputBase} ${inputEditable} min-h-[72px] resize-y`}
                        value={formData.alamatRumah}
                        onChange={(e) => handleInputChange("alamatRumah", e.target.value)}
                      />
                      {errors.alamatRumah && <p className={errorClass}>{errors.alamatRumah}</p>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Negara Asal (bagi WNA)</label>
                        <select className={`${inputBase} ${inputDisabled}`} disabled>
                          <option value="Indonesia">Indonesia</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Kode Pos</label>
                        <input
                          className={`${inputBase} ${inputEditable}`}
                          value={formData.kodePos}
                          onChange={(e) => handleInputChange("kodePos", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>No Telepon Rumah</label>
                        <input
                          className={`${inputBase} ${inputEditable}`}
                          value={formData.noTelpRumah}
                          onChange={(e) => handleInputChange("noTelpRumah", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>No Fax</label>
                        <input
                          className={`${inputBase} ${inputEditable}`}
                          value={formData.noFax}
                          onChange={(e) => handleInputChange("noFax", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Status Kepemilikan Rumah</label>
                      <div className="flex flex-col gap-1.5 mt-1.5">
                        {["Pribadi", "Sewa", "Keluarga", "Lainnya"].map((opt) => (
                          <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                            <input
                              type="radio"
                              name="status_rumah"
                              value={opt}
                              checked={formData.statusRumah === opt}
                              onChange={(e) => handleInputChange("statusRumah", e.target.value)}
                              className="accent-[#00C2FF] w-3.5 h-3.5"
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                      {errors.statusRumah && <p className={errorClass}>{errors.statusRumah}</p>}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="bg-[#69d7f6] hover:bg-[#5bc7e6] text-white px-4 py-2 rounded-full text-xs font-medium transition-colors min-w-[110px]"
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
