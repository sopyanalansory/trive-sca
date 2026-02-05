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

export default function AccountOpeningFormPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileHovered, setProfileHovered] = React.useState(false);
  const [userName, setUserName] = React.useState("");
  const [userInitial, setUserInitial] = React.useState("M");
  const [accepted, setAccepted] = React.useState("");
  const [npwp, setNpwp] = React.useState("");
  const [npwpError, setNpwpError] = React.useState("");
  const [tanggalPenerimaan] = React.useState(() => formatDateNow());
  const [tujuanPembukaan, setTujuanPembukaan] = React.useState("Lindung Nilai");
  const [pengalamanInvestasi, setPengalamanInvestasi] = React.useState("Ya");
  const [pengalamanTransaksi, setPengalamanTransaksi] = React.useState("Ya");
  const [keluargaBappebti, setKeluargaBappebti] = React.useState("Ya");
  const [pailit, setPailit] = React.useState("Ya");
  const [prefill, setPrefill] = React.useState(() => ({
    kodeNasabah: "",
    noTelepon: "",
    email: "",
    namaLengkap: "",
    kewarganegaraan: "Indonesia",
    nomorKartuIdentitas: "",
    jenisKelamin: "Pria",
    tanggalLahir: "",
    tempatLahir: "",
    statusPerkawinan: "Menikah",
    namaGadisIbu: "",
    namaPasangan: "",
    alamatRumah: "",
    negaraAsal: "Indonesia",
    kodePos: "",
    noTeleponRumah: "",
    noFax: "",
    statusRumah: "Pribadi",
  }));

  const [formData, setFormData] = React.useState(() => ({
    noTelepon: "",
    email: "",
    namaLengkap: "",
    kewarganegaraan: "Indonesia",
    nomorKartuIdentitas: "",
    jenisKelamin: "Pria",
    tanggalLahir: "",
    tempatLahir: "",
    statusPerkawinan: "Menikah",
    namaGadisIbu: "",
    namaPasangan: "",
    alamatRumah: "",
    negaraAsal: "Indonesia",
    kodePos: "",
    noTeleponRumah: "",
    noFax: "",
    statusRumah: "Pribadi",
  }));

  const initialPrefillLoadedRef = React.useRef(false);

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
          const u = data.user;
          if (u) {
            if (u.name) {
              setUserName(u.name.toUpperCase());
              setUserInitial(u.name.charAt(0).toUpperCase());
            }
            const noTelepon = [u.countryCode, u.phone].filter(Boolean).join("") || "";
            const email = u.email ?? "";
            const namaLengkap = u.name ? u.name.toUpperCase() : "";
            setPrefill((p) => ({
              ...p,
              kodeNasabah: String(u.id ?? ""),
              noTelepon,
              email,
              namaLengkap,
            }));
            if (!initialPrefillLoadedRef.current) {
              initialPrefillLoadedRef.current = true;
              setFormData((prev) => ({
                ...prev,
                noTelepon,
                email,
                namaLengkap,
              }));
            }
          }
        }
      } catch {
        // ignore
      }
    })();
  }, [router]);

  const updateForm = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  React.useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleAcceptedChange = (value: string) => setAccepted(value);

  const handleNpwpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNpwp(value);
    if (npwpError && value.trim()) setNpwpError("");
    if (value.trim() === "") setNpwpError("Nomor Pokok Wajib Pajak harus diisi");
  };

  const validateForm = (): boolean => {
    if (npwp.trim() === "") {
      setNpwpError("Nomor Pokok Wajib Pajak harus diisi");
      return false;
    }
    setNpwpError("");
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    router.push("/open-investment-account/emergency-contact-form");
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
            <OpenAccountStepProgress currentStep={7} mobileTitle="Aplikasi Pembukaan Rekening Transaksi Secara Elektronik Online" />

            <div className="flex-1 min-w-0 w-full bg-white rounded-lg overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 lg:py-6 lg:px-6 open-account-form-card">
              <h2 className="text-base font-semibold text-gray-900 tracking-tight mb-1 hidden sm:block">
                Aplikasi Pembukaan Rekening Transaksi Secara Elektronik Online
              </h2>

              {/* Tab navigation - label satu baris, sejajar */}
              <div className="flex justify-start items-end gap-4 sm:gap-6 mb-6 mt-4 overflow-x-auto pb-1">
                {["Informasi Pribadi", "Kontak Darurat", "Pekerjaan", "Daftar Kekayaan", "Akun Bank"].map((label, idx) => (
                  <div key={label} className="flex flex-col items-center shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        idx === 0 ? "bg-[#4fc3f7]" : "bg-gray-100"
                      }`}
                    >
                      {idx === 0 ? (
                        <svg width="16" height="16" viewBox="0 0 20 20" className="text-white">
                          <polyline points="5,11 9,15 15,7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <span className="text-gray-400 text-xs font-medium">{idx + 1}</span>
                      )}
                    </div>
                    <span className={`text-[11px] mt-1 text-center leading-tight whitespace-nowrap ${idx === 0 ? "text-[#2196f3] font-medium" : "text-gray-400"}`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 w-full min-w-0 max-w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                  <div className="sm:col-span-2 min-w-0">
                    <label className={labelClass}>Kode Nasabah</label>
                    <input type="text" className={`${inputBase} ${inputDisabled}`} value={prefill.kodeNasabah} disabled readOnly />
                  </div>
                  <div>
                    <label className={labelClass}>No Telepon</label>
                    <input type="text" className={inputBase} value={formData.noTelepon} onChange={(e) => updateForm("noTelepon", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="text" className={inputBase} value={formData.email} onChange={(e) => updateForm("email", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Nama lengkap</label>
                    <input type="text" className={inputBase} value={formData.namaLengkap} onChange={(e) => updateForm("namaLengkap", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Kewarganegaraan</label>
                    <select className={inputBase} value={formData.kewarganegaraan} onChange={(e) => updateForm("kewarganegaraan", e.target.value)}>
                      <option value="Indonesia">Indonesia</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Nomor Kartu identitas</label>
                    <input type="text" className={inputBase} value={formData.nomorKartuIdentitas} onChange={(e) => updateForm("nomorKartuIdentitas", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Jenis Kelamin</label>
                    <div className="flex gap-4 mt-1.5">
                      {["Pria", "Wanita"].map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                          <input type="radio" name="jenisKelamin" checked={formData.jenisKelamin === opt} onChange={() => updateForm("jenisKelamin", opt)} className="radio-primary" />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Tanggal Lahir</label>
                    <input type="text" className={inputBase} value={formData.tanggalLahir} onChange={(e) => updateForm("tanggalLahir", e.target.value)} placeholder="DD/MM/YYYY" />
                  </div>
                  <div>
                    <label className={labelClass}>Tempat Lahir</label>
                    <input type="text" className={inputBase} value={formData.tempatLahir} onChange={(e) => updateForm("tempatLahir", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Status Perkawinan</label>
                    <div className="flex flex-wrap gap-4 mt-1.5">
                      {["Menikah", "Lajang", "Janda/Duda"].map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                          <input type="radio" name="statusPerkawinan" checked={formData.statusPerkawinan === opt} onChange={() => updateForm("statusPerkawinan", opt)} className="radio-primary" />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Nama Gadis Ibu Kandung</label>
                    <input type="text" className={inputBase} value={formData.namaGadisIbu} onChange={(e) => updateForm("namaGadisIbu", e.target.value)} />
                  </div>
                  <div className="sm:col-span-2 min-w-0">
                    <label className={labelClass}>Nama pasangan</label>
                    <input type="text" className={inputBase} value={formData.namaPasangan} onChange={(e) => updateForm("namaPasangan", e.target.value)} />
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <h3 className="text-xs font-medium text-gray-700 mb-3">Informasi Alamat</h3>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Alamat Rumah</label>
                      <textarea className={`${inputBase} min-h-[72px] resize-none`} value={formData.alamatRumah} onChange={(e) => updateForm("alamatRumah", e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                      <div>
                        <label className={labelClass}>Negara Asal (bagi WNA)</label>
                        <select className={inputBase} value={formData.negaraAsal} onChange={(e) => updateForm("negaraAsal", e.target.value)}>
                          <option value="Indonesia">Indonesia</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Kode Pos</label>
                        <input type="text" className={inputBase} value={formData.kodePos} onChange={(e) => updateForm("kodePos", e.target.value)} />
                      </div>
                      <div>
                        <label className={labelClass}>No Telepon Rumah</label>
                        <input type="text" className={inputBase} value={formData.noTeleponRumah} onChange={(e) => updateForm("noTeleponRumah", e.target.value)} />
                      </div>
                      <div>
                        <label className={labelClass}>No Fax</label>
                        <input type="text" className={inputBase} value={formData.noFax} onChange={(e) => updateForm("noFax", e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Status Kepemilikan Rumah</label>
                      <div className="flex flex-wrap gap-4 mt-1.5">
                        {["Pribadi", "Sewa", "Keluarga", "Lainnya"].map((opt) => (
                          <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                            <input type="radio" name="statusRumah" checked={formData.statusRumah === opt} onChange={() => updateForm("statusRumah", opt)} className="radio-primary" />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <label className={labelClass}>Tujuan Pembukaan Rekening</label>
                  <div className="flex flex-wrap gap-6 mt-1.5 mb-4">
                    {["Lindung Nilai", "Gain", "Spekulasi", "Lainnya"].map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="radio"
                          name="tujuanPembukaan"
                          value={opt}
                          checked={tujuanPembukaan === opt}
                          onChange={() => setTujuanPembukaan(opt)}
                          className="radio-primary"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                  <label className={labelClass}>Pengalaman Investasi</label>
                  <div className="flex gap-6 mt-1.5 mb-4">
                    {["Ya", "Tidak"].map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="radio"
                          name="pengalamanInvestasi"
                          value={opt}
                          checked={pengalamanInvestasi === opt}
                          onChange={() => setPengalamanInvestasi(opt)}
                          className="radio-primary"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                  <label className={labelClass}>Pengalaman Transaksi</label>
                  <div className="flex gap-6 mt-1.5 mb-4">
                    {["Ya", "Tidak"].map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="radio"
                          name="pengalamanTransaksi"
                          value={opt}
                          checked={pengalamanTransaksi === opt}
                          onChange={() => setPengalamanTransaksi(opt)}
                          className="radio-primary"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                  <label className={labelClass}>Apakah Anda memiliki anggota keluarga yang bekerja di Bappebti/Bursa Berjangka/Kliring Berjangka ?</label>
                  <div className="flex gap-6 mt-1.5 mb-4">
                    {["Ya", "Tidak"].map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="radio"
                          name="keluargaBappebti"
                          value={opt}
                          checked={keluargaBappebti === opt}
                          onChange={() => setKeluargaBappebti(opt)}
                          className="radio-primary"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                  <label className={labelClass}>Apakah Anda Pernah dinyatakan pailit oleh pengadilan ?</label>
                  <div className="flex gap-6 mt-1.5 mb-4">
                    {["Ya", "Tidak"].map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="radio"
                          name="pailit"
                          value={opt}
                          checked={pailit === opt}
                          onChange={() => setPailit(opt)}
                          className="radio-primary"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                  <div>
                    <label className={labelClass}>Nomor Pokok Wajib Pajak</label>
                    <input
                      type="text"
                      className={`${inputBase} bg-white border ${npwpError ? "border-red-500" : "border-gray-200"}`}
                      value={npwp}
                      onChange={handleNpwpChange}
                      placeholder="NPWP"
                    />
                    {npwpError && <p className={errorClass}>{npwpError}</p>}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">PERNYATAAN KEBENARAN DAN TANGGUNG JAWAB</h3>
                  <p className="text-xs text-gray-600 mb-4 max-w-2xl">
                    Dengan mencentang kolom &quot;YA&quot; di bawah ini, saya dengan ini menyatakan bahwa semua informasi dan dokumen yang saya lampirkan pada APLIKASI PEMBUKAAN REKENING TRANSAKSI ELEKTRONIK ONLINE adalah sah dan benar. Saya akan bertanggung jawab penuh jika terjadi sesuatu yang berhubungan dengan ketidakabsahan data yang saya berikan.
                  </p>
                  <label className={labelClass}>Diterima/Tidak Diterima:</label>
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
                  <div>
                    <label className={labelClass}>Tanggal Penerimaan:</label>
                    <input type="text" className={`${inputBase} ${inputDisabled}`} value={tanggalPenerimaan} disabled readOnly />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/open-investment-account/disclosure-statement")}
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
