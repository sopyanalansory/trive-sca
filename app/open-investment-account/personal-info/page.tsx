"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api-client";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import WhatsAppButton from "../../components/WhatsAppButton";
import OpenAccountStepProgress from "../../components/OpenAccountStepProgress";

interface UserPrefill {
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string | null;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  kewarganegaraan: string;
  nomorKartuIdentitas: string;
  jenisKelamin: string;
  tanggalLahir: string;
  statusPerkawinan: string;
  tempatLahir: string;
  namaGadisIbu: string;
  alamatRumah: string;
  namaPasangan: string;
  kodePos: string;
  noTelpRumah: string;
  noFax: string;
  statusRumah: string;
  negaraAsalWna: string;
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
    name: "",
    email: "",
    phone: "",
    countryCode: "",
    kewarganegaraan: "Indonesia",
    nomorKartuIdentitas: "",
    jenisKelamin: "",
    tanggalLahir: "",
    statusPerkawinan: "",
    tempatLahir: "",
    namaGadisIbu: "",
    alamatRumah: "",
    namaPasangan: "",
    kodePos: "",
    noTelpRumah: "",
    noFax: "",
    statusRumah: "",
    negaraAsalWna: "Indonesia",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [fotoKtp, setFotoKtp] = React.useState<File | null>(null);
  const [fotoSelfie, setFotoSelfie] = React.useState<File | null>(null);
  const [previewKtp, setPreviewKtp] = React.useState<string | null>(null);
  const [previewSelfie, setPreviewSelfie] = React.useState<string | null>(null);
  const [panduanModal, setPanduanModal] = React.useState<"ktp" | "selfie" | null>(null);

  const inputFotoRef = React.useRef<HTMLInputElement>(null);
  const inputSelfieRef = React.useRef<HTMLInputElement>(null);
  const initialUserLoadedRef = React.useRef(false);

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
          const u = data.user;
          setUserPrefill({
            id: u.id ?? "",
            name: u.name ?? "",
            email: u.email ?? "",
            phone: u.phone ?? "",
            countryCode: u.countryCode ?? null,
          });
          // Hanya isi form dari API sekali (saat pertama load), supaya user bisa update tanpa tertimpa
          if (!initialUserLoadedRef.current) {
            initialUserLoadedRef.current = true;
            setFormData((prev) => ({
              ...prev,
              name: u.name ?? "",
              email: u.email ?? "",
              phone: [u.countryCode, u.phone].filter(Boolean).join("") || "",
              countryCode: u.countryCode ?? prev.countryCode ?? "",
              kewarganegaraan: prev.kewarganegaraan || "Indonesia",
            }));
            if (u.name) {
              setUserName(u.name.toUpperCase());
              setUserInitial(u.name.charAt(0).toUpperCase());
            }
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

  const handleFileKtp = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, fotoKtp: "Pilih file gambar (JPG, PNG)." }));
        return;
      }
      if (previewKtp) URL.revokeObjectURL(previewKtp);
      setFotoKtp(file);
      setPreviewKtp(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, fotoKtp: "" }));
    }
    e.target.value = "";
  };

  const handleFileSelfie = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, fotoSelfie: "Pilih file gambar (JPG, PNG)." }));
        return;
      }
      if (previewSelfie) URL.revokeObjectURL(previewSelfie);
      setFotoSelfie(file);
      setPreviewSelfie(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, fotoSelfie: "" }));
    }
    e.target.value = "";
  };

  const clearFotoKtp = () => {
    if (previewKtp) URL.revokeObjectURL(previewKtp);
    setFotoKtp(null);
    setPreviewKtp(null);
    setErrors((prev) => ({ ...prev, fotoKtp: "" }));
    if (inputFotoRef.current) inputFotoRef.current.value = "";
  };

  const clearFotoSelfie = () => {
    if (previewSelfie) URL.revokeObjectURL(previewSelfie);
    setFotoSelfie(null);
    setPreviewSelfie(null);
    setErrors((prev) => ({ ...prev, fotoSelfie: "" }));
    if (inputSelfieRef.current) inputSelfieRef.current.value = "";
  };

  const previewKtpRef = React.useRef<string | null>(null);
  const previewSelfieRef = React.useRef<string | null>(null);
  previewKtpRef.current = previewKtp;
  previewSelfieRef.current = previewSelfie;
  React.useEffect(() => {
    return () => {
      if (previewKtpRef.current) URL.revokeObjectURL(previewKtpRef.current);
      if (previewSelfieRef.current) URL.revokeObjectURL(previewSelfieRef.current);
    };
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (field === "name") {
      setUserName(value ? value.toUpperCase() : "");
      setUserInitial(value ? value.charAt(0).toUpperCase() : "M");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Bagian ini diperlukan.";
    if (!formData.email.trim()) newErrors.email = "Bagian ini diperlukan.";
    if (!formData.phone.trim()) newErrors.phone = "Bagian ini diperlukan.";
    if (!formData.tempatLahir.trim()) newErrors.tempatLahir = "Bagian ini diperlukan.";
    if (!formData.namaGadisIbu.trim()) newErrors.namaGadisIbu = "Bagian ini diperlukan.";
    if (!formData.alamatRumah.trim()) newErrors.alamatRumah = "Bagian ini diperlukan.";
    if (!formData.namaPasangan.trim()) newErrors.namaPasangan = "Bagian ini diperlukan.";
    if (!formData.statusRumah.trim()) newErrors.statusRumah = "Bagian ini diperlukan.";
    if (!fotoKtp) newErrors.fotoKtp = "Upload foto KTP diperlukan.";
    if (!fotoSelfie) newErrors.fotoSelfie = "Upload foto selfie diperlukan.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    router.push("/open-investment-account/company-profile");
  };

  const displayPhone = formData.phone;

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
        <div className="flex-1 p-4 lg:px-8 lg:pt-0 lg:pb-0 overflow-x-hidden min-h-0 flex flex-col w-full">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:gap-12 lg:min-h-full flex-1 w-full min-w-0 open-account-content-wrap">
            <OpenAccountStepProgress currentStep={1} mobileTitle="Informasi Pribadi" />

            {/* Form - section Informasi Pribadi (compact & clean) */}
            <div className="flex-1 min-w-0 w-full bg-white rounded-lg overflow-x-hidden px-4 py-4 sm:px-5 sm:py-5 lg:py-6 lg:px-6 open-account-form-card">
              <h2 className="text-base font-semibold text-gray-900 tracking-tight mb-1">Informasi Pribadi</h2>
              <p className="text-xs text-gray-500 mb-5">
                Mohon periksa informasi Anda di bawah ini, dan perbarui jika diperlukan. Pastikan sesuai dengan data pada kartu identitas (KTP/Paspor).
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 w-full min-w-0 max-w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                  <div>
                    <label className={labelClass}>Kode Nasabah</label>
                    <input className={`${inputBase} ${inputDisabled}`} value={userPrefill?.id ?? ""} disabled readOnly />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                  <div>
                    <label className={labelClass}>No Telepon</label>
                    <input
                      className={`${inputBase} ${inputEditable}`}
                      value={displayPhone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="Contoh: 628123456789"
                    />
                    {errors.phone && <p className={errorClass}>{errors.phone}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input
                      className={`${inputBase} ${inputEditable}`}
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="email@contoh.com"
                    />
                    {errors.email && <p className={errorClass}>{errors.email}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                  <div>
                    <label className={labelClass}>Nama lengkap</label>
                    <input
                      className={`${inputBase} ${inputEditable}`}
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Nama lengkap"
                    />
                    {errors.name && <p className={errorClass}>{errors.name}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Kewarganegaraan</label>
                    <select
                      className={`${inputBase} ${inputEditable}`}
                      value={formData.kewarganegaraan}
                      onChange={(e) => handleInputChange("kewarganegaraan", e.target.value)}
                    >
                      <option value="Indonesia">Indonesia</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                  <div>
                    <label className={labelClass}>Nomor Kartu identitas</label>
                    <input
                      className={`${inputBase} ${inputEditable}`}
                      placeholder="Isi sesuai KTP"
                      value={formData.nomorKartuIdentitas}
                      onChange={(e) => handleInputChange("nomorKartuIdentitas", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Jenis Kelamin</label>
                    <div className="flex gap-4 mt-1.5">
                      {["Pria", "Wanita"].map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                          <input
                            type="radio"
                            name="jenis_kelamin"
                            value={opt}
                            checked={formData.jenisKelamin === opt}
                            onChange={() => handleInputChange("jenisKelamin", opt)}
                            className="radio-primary"
                          />{" "}
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Upload Foto KTP & Selfie */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelClass}>Foto KTP</label>
                      <button
                        type="button"
                        onClick={() => setPanduanModal("ktp")}
                        className="text-[11px] font-medium text-[#00C2FF] hover:underline"
                      >
                        Lihat panduan
                      </button>
                    </div>
                    <input
                      ref={inputFotoRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      className="hidden"
                      onChange={handleFileKtp}
                    />
                    <div className="border border-gray-200 rounded-md overflow-hidden bg-gray-50 min-h-[100px]">
                      {previewKtp ? (
                        <div className="relative">
                          <img src={previewKtp} alt="Preview KTP" className="w-full h-40 object-contain bg-white" />
                          <div className="absolute inset-x-0 bottom-0 flex justify-between items-center px-2 py-1.5 bg-black/50 text-white text-[11px]">
                            <span className="truncate">{fotoKtp?.name}</span>
                            <button type="button" onClick={clearFotoKtp} className="text-white hover:underline ml-2">
                              Hapus
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => inputFotoRef.current?.click()}
                          className="w-full min-h-[100px] flex flex-col items-center justify-center gap-1 text-gray-500 hover:bg-gray-100 transition-colors p-4 text-xs"
                        >
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Klik untuk upload foto KTP</span>
                          <span className="text-[10px] text-gray-400">JPG atau PNG</span>
                        </button>
                      )}
                    </div>
                    {errors.fotoKtp && <p className={errorClass}>{errors.fotoKtp}</p>}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelClass}>Foto Selfie</label>
                      <button
                        type="button"
                        onClick={() => setPanduanModal("selfie")}
                        className="text-[11px] font-medium text-[#00C2FF] hover:underline"
                      >
                        Lihat panduan
                      </button>
                    </div>
                    <input
                      ref={inputSelfieRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      className="hidden"
                      onChange={handleFileSelfie}
                    />
                    <div className="border border-gray-200 rounded-md overflow-hidden bg-gray-50 min-h-[100px]">
                      {previewSelfie ? (
                        <div className="relative">
                          <img src={previewSelfie} alt="Preview Selfie" className="w-full h-40 object-contain bg-white" />
                          <div className="absolute inset-x-0 bottom-0 flex justify-between items-center px-2 py-1.5 bg-black/50 text-white text-[11px]">
                            <span className="truncate">{fotoSelfie?.name}</span>
                            <button type="button" onClick={clearFotoSelfie} className="text-white hover:underline ml-2">
                              Hapus
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => inputSelfieRef.current?.click()}
                          className="w-full min-h-[100px] flex flex-col items-center justify-center gap-1 text-gray-500 hover:bg-gray-100 transition-colors p-4 text-xs"
                        >
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Klik untuk upload foto selfie</span>
                          <span className="text-[10px] text-gray-400">JPG atau PNG</span>
                        </button>
                      )}
                    </div>
                    {errors.fotoSelfie && <p className={errorClass}>{errors.fotoSelfie}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                  <div>
                    <label className={labelClass}>Tanggal Lahir</label>
                    <input
                      className={`${inputBase} ${inputEditable}`}
                      placeholder="DD/MM/YYYY"
                      value={formData.tanggalLahir}
                      onChange={(e) => handleInputChange("tanggalLahir", e.target.value)}
                    />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                  <div>
                    <label className={labelClass}>Status Perkawinan</label>
                    <div className="flex flex-wrap gap-4 mt-1.5">
                      {["Menikah", "Lajang", "Janda/Duda"].map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                          <input
                            type="radio"
                            name="status_perkawinan"
                            value={opt}
                            checked={formData.statusPerkawinan === opt}
                            onChange={() => handleInputChange("statusPerkawinan", opt)}
                            className="radio-primary"
                          />{" "}
                          {opt}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                      <div>
                        <label className={labelClass}>Negara Asal (bagi WNA)</label>
                        <select
                          className={`${inputBase} ${inputEditable}`}
                          value={formData.negaraAsalWna}
                          onChange={(e) => handleInputChange("negaraAsalWna", e.target.value)}
                        >
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
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
                              className="radio-primary"
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

      {/* Modal Panduan KTP / Selfie */}
      {panduanModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setPanduanModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-[900px] w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-8 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                {panduanModal === "ktp" ? "Panduan Foto KTP" : "Panduan Foto Selfie"}
              </h2>
              <button
                type="button"
                onClick={() => setPanduanModal(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Tutup"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
                {/* Gambar */}
                <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4 sm:gap-0 sm:flex-col items-center sm:items-start shrink-0">
                  {panduanModal === "ktp" ? (
                    <>
                      <img
                        src="https://cdn2.triveinvest.co.id/assets/img/sca/guideline_document_identity_correct_2x.png"
                        alt="KTP Benar"
                        className="w-full max-w-[260px] rounded-xl"
                      />
                      <img
                        src="https://cdn2.triveinvest.co.id/assets/img/sca/guideline_document_identity_wrong_2x.png"
                        alt="KTP Salah"
                        className="w-full max-w-[260px] rounded-xl"
                      />
                    </>
                  ) : (
                    <>
                      <img
                        src="https://cdn2.triveinvest.co.id/assets/img/sca/selfie_bener.png"
                        alt="Selfie Benar"
                        className="w-full max-w-[260px] h-[170px] object-contain rounded-xl"
                      />
                      <img
                        src="https://cdn2.triveinvest.co.id/assets/img/sca/selfie_salah.png"
                        alt="Selfie Salah"
                        className="w-full max-w-[260px] h-[170px] object-contain rounded-xl"
                      />
                    </>
                  )}
                </div>
                {/* Panduan */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3">
                    {panduanModal === "ktp" ? "Tata Cara Foto KTP" : "Tata Cara Foto Selfie"}
                  </h3>
                  <ul className="text-xs sm:text-sm text-gray-700 list-disc pl-5 space-y-1.5">
                    {panduanModal === "ktp" ? (
                      <>
                        <li>Pastikan foto KTP ada di dalam bingkai dan tidak terpotong</li>
                        <li>Informasi di KTP harus jelas, tidak buram, atau memantulkan cahaya</li>
                        <li>Pastikan KTP milik Anda sendiri, bukan orang lain</li>
                      </>
                    ) : (
                      <>
                        <li>Gunakan pakaian rapi & sopan saat mengambil selfie</li>
                        <li>Pastikan wajah terlihat jelas, tidak buram atau gelap</li>
                        <li>Jangan gunakan filter, kacamata hitam, atau aksesoris berlebihan</li>
                        <li>Ambil foto di tempat dengan pencahayaan cukup</li>
                        <li>Pastikan wajah memenuhi bingkai sesuai arahan</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPanduanModal(null)}
                  className="bg-[#69d7f6] hover:bg-[#5bc7e6] text-white px-5 py-2 rounded-full text-xs font-medium transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
