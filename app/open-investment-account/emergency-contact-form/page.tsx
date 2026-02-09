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

export default function EmergencyContactFormPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileHovered, setProfileHovered] = React.useState(false);
  const [userName, setUserName] = React.useState("");
  const [userInitial, setUserInitial] = React.useState("M");
  const [accepted, setAccepted] = React.useState("");
  const [tanggalPenerimaan] = React.useState(() => formatDateNow());
  const [formData, setFormData] = React.useState({
    emergencyContactName: "",
    address: "",
    postalCode: "",
    phoneNumber: "",
    relationship: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const activeTabIndex = 1; // Kontak Darurat

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

  const requiredFields: (keyof typeof formData)[] = ["emergencyContactName", "address", "phoneNumber", "relationship"];

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (value.trim()) {
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    } else if (requiredFields.includes(field)) {
      setErrors((prev) => ({ ...prev, [field]: "Bagian ini diperlukan." }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = "Bagian ini diperlukan.";
    if (!formData.address.trim()) newErrors.address = "Bagian ini diperlukan.";
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Bagian ini diperlukan.";
    if (!formData.relationship.trim()) newErrors.relationship = "Bagian ini diperlukan.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (accepted !== "ya") return;
    router.push("/open-investment-account/employment-form");
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

              {/* Tab navigation - Kontak Darurat active */}
              <div className="flex justify-start items-end gap-4 sm:gap-6 mb-6 mt-4 overflow-x-auto pb-1">
                {TAB_LABELS.map((label, idx) => {
                  const isCompleted = idx < activeTabIndex;
                  const isActive = idx === activeTabIndex;
                  return (
                    <div key={label} className="flex flex-col items-center shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isCompleted ? "bg-[#4fc3f7]" : isActive ? "bg-[#4fc3f7]" : "bg-gray-100"
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
                <div className="min-w-0">
                  <label className={labelClass}>
                    Nama Kontak Darurat <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`${inputBase} bg-white border ${errors.emergencyContactName ? "border-red-500" : "border-gray-200"}`}
                    value={formData.emergencyContactName}
                    onChange={handleInputChange("emergencyContactName")}
                    placeholder="Nama Kontak Darurat"
                  />
                  {errors.emergencyContactName && <p className={errorClass}>{errors.emergencyContactName}</p>}
                </div>

                <div>
                  <label className={labelClass}>
                    Alamat <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`${inputBase} bg-white border ${errors.address ? "border-red-500" : "border-gray-200"}`}
                    value={formData.address}
                    onChange={handleInputChange("address")}
                    placeholder="Alamat"
                  />
                  {errors.address && <p className={errorClass}>{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                  <div>
                    <label className={labelClass}>Kode Pos</label>
                    <input
                      type="text"
                      className={`${inputBase} bg-white`}
                      value={formData.postalCode}
                      onChange={handleInputChange("postalCode")}
                      placeholder="Kode Pos"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      No Telepon <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`${inputBase} bg-white border ${errors.phoneNumber ? "border-red-500" : "border-gray-200"}`}
                      value={formData.phoneNumber}
                      onChange={handleInputChange("phoneNumber")}
                      placeholder="No Telepon"
                    />
                    {errors.phoneNumber && <p className={errorClass}>{errors.phoneNumber}</p>}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Hubungan dengan Anda <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`${inputBase} bg-white border ${errors.relationship ? "border-red-500" : "border-gray-200"}`}
                    value={formData.relationship}
                    onChange={handleInputChange("relationship")}
                    placeholder="Hubungan dengan Anda"
                  />
                  {errors.relationship && <p className={errorClass}>{errors.relationship}</p>}
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
                    onClick={() => router.push("/open-investment-account/account-opening-form")}
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
