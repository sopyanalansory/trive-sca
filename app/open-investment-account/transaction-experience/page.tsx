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

export default function TransactionExperiencePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileHovered, setProfileHovered] = React.useState(false);
  const [userName, setUserName] = React.useState("");
  const [userInitial, setUserInitial] = React.useState("M");
  const [accepted, setAccepted] = React.useState("");
  const [brokerName, setBrokerName] = React.useState("PT. Trive Invest Futures");
  const [brokerNameError, setBrokerNameError] = React.useState("");
  // Prefill from user/onboarding (can be wired to API later)
  const [prefill, setPrefill] = React.useState(() => ({
    namaLengkap: "",
    tempatLahir: "",
    tanggalLahir: "",
    alamatRumah: "",
    kodePos: "",
    nomorKartuIdentitas: "",
    nomorAkunDemo: "",
    tanggalPenerimaan: formatDateNow(),
  }));

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
            setPrefill((p) => ({ ...p, namaLengkap: data.user.name?.toUpperCase() ?? "" }));
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

  const handleBrokerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBrokerName(value);
    if (brokerNameError && value.trim()) setBrokerNameError("");
  };

  const validateForm = (): boolean => {
    if (brokerName.trim() === "") {
      setBrokerNameError('Mohon tulis nama broker atau "Saya tidak memiliki pengalaman".');
      return false;
    }
    setBrokerNameError("");
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    router.push("/open-investment-account/disclosure-statement");
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
            <OpenAccountStepProgress currentStep={5} mobileTitle="Pernyataan Pengalaman Transaksi" />

            <div className="flex-1 min-w-0 w-full bg-white rounded-lg overflow-x-hidden px-4 py-4 sm:px-5 sm:py-5 lg:py-6 lg:px-6 open-account-form-card">
              <h2 className="text-base font-semibold text-gray-900 tracking-tight mb-1">Pernyataan Pengalaman Transaksi</h2>
              <p className="text-xs text-gray-500 mb-5">
                PERNYATAAN TELAH BERPENGALAMAN MELAKSANAKAN TRANSAKSI PERDAGANGAN BERJANGKA KOMODITI
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 w-full min-w-0 max-w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                  <div>
                    <label className={labelClass}>Nama lengkap</label>
                    <input
                      type="text"
                      className={`${inputBase} ${inputDisabled}`}
                      value={prefill.namaLengkap || userName}
                      disabled
                      readOnly
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Tempat Lahir</label>
                    <input
                      type="text"
                      className={`${inputBase} ${inputDisabled}`}
                      value={prefill.tempatLahir}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                  <div>
                    <label className={labelClass}>Tanggal Lahir</label>
                    <input
                      type="text"
                      className={`${inputBase} ${inputDisabled}`}
                      value={prefill.tanggalLahir}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Alamat Rumah</label>
                  <textarea
                    className={`${inputBase} ${inputDisabled} min-h-[72px] resize-none`}
                    value={prefill.alamatRumah}
                    disabled
                    readOnly
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                  <div>
                    <label className={labelClass}>Kode Pos</label>
                    <input
                      type="text"
                      className={`${inputBase} ${inputDisabled}`}
                      value={prefill.kodePos}
                      disabled
                      readOnly
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Nomor Kartu identitas</label>
                    <input
                      type="text"
                      className={`${inputBase} ${inputDisabled}`}
                      value={prefill.nomorKartuIdentitas}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Nomor Akun Demo</label>
                  <input
                    type="text"
                    className={`${inputBase} ${inputDisabled}`}
                    value={prefill.nomorAkunDemo}
                    disabled
                    readOnly
                  />
                </div>

                <p className="text-xs text-gray-600">
                  Dengan mengisi kolom &quot;YA&quot; di bawah ini, saya menyatakan bahwa saya telah melakukan simulasi bertransaksi di Perusahaan Perdagangan Berjangka Komoditi yang disebutkan di bawah ini, dan telah memahami tentang tata cara bertransaksi di bidang Perdagangan Berjangka Komoditi.
                </p>

                <div>
                  <label className={labelClass}>Silakan tulis nama broker di sini</label>
                  <input
                    type="text"
                    className={`${inputBase} bg-white border ${brokerNameError ? "border-red-500" : "border-gray-200"}`}
                    value={brokerName}
                    onChange={handleBrokerNameChange}
                    placeholder='Nama broker atau "Saya tidak memiliki pengalaman"'
                  />
                  {brokerNameError && <p className={errorClass}>{brokerNameError}</p>}
                </div>

                <p className="text-xs text-gray-600">
                  Demikian Pernyataan ini dibuat dengan sebenarnya dalam keadaan sadar, sehat jasmani dan rohani serta tanpa paksaan apapun dari pihak manapun.
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
                  <div className="mt-4">
                    <label className={labelClass}>Tanggal Penerimaan:</label>
                    <input
                      type="text"
                      className={`${inputBase} ${inputDisabled}`}
                      value={prefill.tanggalPenerimaan}
                      disabled
                      readOnly
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/open-investment-account/demo-experience-statement")}
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
