"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api-client";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import WhatsAppButton from "../../components/WhatsAppButton";
import OpenAccountStepProgress from "../../components/OpenAccountStepProgress";

const linkClass = "text-[#00C2FF] hover:underline";
const inputBase =
  "w-full px-2.5 py-2 rounded-md border border-gray-200 text-xs text-gray-900 outline-none transition-colors focus:ring-1 focus:ring-[#00C2FF]/30 focus:border-[#00C2FF]";
const inputDisabled = "bg-gray-50 text-gray-600 cursor-not-allowed";
const labelClass = "block text-xs font-medium text-gray-600 mb-1";

function formatDateNow() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function CompanyProfilePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileHovered, setProfileHovered] = useState(false);
  const [userName, setUserName] = useState("");
  const [userInitial, setUserInitial] = useState("M");
  const [accepted, setAccepted] = useState("");
  const [tanggalPenerimaan] = useState(() => formatDateNow());

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
      return;
    }
    const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    (async () => {
      try {
        const res = await fetch(buildApiUrl("/api/auth/me"), {
          headers: { Authorization: `Bearer ${token}` },
        });
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
    return () => window.removeEventListener("resize", handleResize);
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accepted !== "ya") return;
    router.push("/open-investment-account/demo-experience-statement");
  };

  const handleBack = () => {
    router.push("/open-investment-account/personal-info");
  };

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
            <OpenAccountStepProgress currentStep={2} mobileTitle="Profil Perusahaan" />

            {/* Main content - Profil Perusahaan: scrollable area + pernyataan sticky di bawah */}
            <div className="flex-1 min-w-0 bg-white py-5 px-5 lg:py-6 lg:px-6 flex flex-col min-h-0">
              {/* Bagian profil: max height + scroll */}
              <div className="flex-1 min-h-0 overflow-y-auto max-h-[60vh]">
                <h2 className="text-base font-semibold text-gray-900 tracking-tight mb-1">Profil Perusahaan</h2>
                <div className="mt-4 space-y-4 text-xs text-gray-700">
                <h3 className="font-semibold text-center text-gray-800">PROFIL PERUSAHAAN PIALANG BERJANGKA</h3>
                <p><b>Nama Perusahaan</b>: PT. Trive Invest Futures</p>
                <p><b>Alamat</b>: Multivision Tower Lt. 20 Jl. Kuningan Mulia Lot 9B, Kuningan Persada Complex, Jakarta Selatan 12980</p>
                <p><b>Nomor Telepon</b>:{" "}
                  <a href="tel:+622122837975" className={linkClass}>+62 21 2283 7975</a>,{" "}
                  <a href="tel:+622131147401" className={linkClass}>+62 21 3114 7401</a>,{" "}
                  <a href="tel:+622131147402" className={linkClass}>+62 21 3114 7402</a>
                </p>
                <p><b>Nomor Faksimile</b>: -</p>
                <p><b>E-mail Perusahaan</b>:{" "}
                  <a href="mailto:info@triveinvest.co.id" className={linkClass}>info@triveinvest.co.id</a>
                </p>
                <p><b>Dukungan Pelanggan</b>:{" "}
                  <a href="mailto:support@triveinvest.co.id" className={linkClass}>support@triveinvest.co.id</a>
                </p>
                <p><b>Website</b>:{" "}
                  <a href="https://www.triveinvest.co.id" className={linkClass} target="_blank" rel="noopener noreferrer">www.triveinvest.co.id</a>
                </p>

                <h3 className="font-semibold text-center text-gray-800 pt-2">Susunan Pengurus Perusahaan</h3>
                <p><b>Direksi</b></p>
                <p>Direktur Utama: Muhamad Ali Jaya</p>
                <p>Direktur Kepatuhan: Tory Darmawan Hanindriyo</p>
                <p>Direktur: Umit Kaf</p>
                <p className="pt-1"><b>Dewan Komisaris</b></p>
                <p>Komisaris Utama: Tri Martono</p>
                <p>Komisaris: Irwan Abdullah Lewenusa</p>
                <p className="pt-1"><b>Susunan Pemegang Saham Perusahaan</b></p>
                <p>Trive Investment B.V</p>
                <p>Erwin Winenda</p>
                <p className="pt-1"><b>Nomor dan Tanggal Izin Usaha Dari Bappebti</b></p>
                <p>02/BAPPEBTI/SP-PN/08/2023 d/h 01/BAPPEBTI/SP-PN/06/2016 d/h 824/BAPPEBTI/SI/II/2005</p>
                <p className="pt-1"><b>Nomor dan Tanggal Keanggotaan Lembaga Kliring Berjangka</b></p>
                <p>142/SPKK/ICH-GKIB/VII/2016 KBI: 06/AK-KBI/PN/IX/2023</p>
                <p className="pt-1"><b>Nomor dan Tanggal Keanggotaan Bursa Berjangka</b></p>
                <p>ICDX: 164/spkb/icdx/Dir/VII/2016<br />JFX: SPAB-103/BBJ/12/04</p>
                <p className="pt-1"><b>Nomor Dan Tanggal Persetujuan Sebagai Peserta Sistem Perdagangan Alternatif</b></p>
                <p>1218/BAPPEBTI/SP/5/2007</p>
                <p className="pt-1"><b>Nama Penyelenggara Sistem Perdagangan Alternatif</b></p>
                <p>PT. Adhikarya Cipta Persada</p>
                <p className="pt-1"><b>Kontrak Berjangka Yang Diperdagangkan</b></p>
                <p>1. Forex<br />2. Index<br />3. Commodity<br />4. Metal</p>
                <p className="pt-1"><b>Kontrak Derivatif Lainnya dalam Sistem Perdagangan Alternatif</b></p>
                <p>1. Forex<br />2. Index<br />3. CFD<br />4. Metal<br />5. Commodity</p>
                <p className="pt-1"><b>Kontrak Derivatif Dalam Sistem Perdagangan Alternatif Volume Minimum 0,1 (Nol Koma Satu) Lot Yang Diperdagangkan</b></p>
                <p>1. Forex<br />2. Index<br />3. Metal<br />4. Commodity</p>
                <p className="pt-1"><b>Biaya Secara Rinci Yang Dibebankan Kepada Nasabah</b></p>
                <p>Terlampir dalam Peraturan Perdagangan (Trading Rules).</p>
                <p className="pt-1"><b>Nomor atau Alamat E-Mail Jika Terjadi Keluhan</b></p>
                <p><b>Nomor Telepon</b>: <a href="tel:+622131147401" className={linkClass}>+62 21 3114 7401</a>, <a href="tel:+622131147402" className={linkClass}>+62 21 3114 7402</a><br /><b>E-mail</b>: <a href="mailto:support@triveinvest.co.id" className={linkClass}>support@triveinvest.co.id</a></p>
                <p className="pt-1"><b>Pengaduan Online Bappebti</b></p>
                <p><a href="https://pengaduan.bappebti.go.id/" className={linkClass} target="_blank" rel="noopener noreferrer">https://pengaduan.bappebti.go.id/</a></p>
                <p className="pt-1"><b>Sarana Penyelesaian Perselisihan Yang Dipergunakan Apabila Terjadi Perselisihan</b></p>
                <p>1. Musyawarah dan Mufakat<br />2. Badan Arbitrase Perdagangan Berjangka Komoditi (BAKTI)<br />3. Pengadilan Negeri Jakarta Selatan</p>
                <p className="pt-1"><b>Nama – Nama Wakil Pialang Berjangka Yang Bekerja Di Perusahaan Pialang Berjangka</b></p>
                <div className="space-y-0.5">
                  {[
                    "Muhamad Ali Jaya", "Yuli Eni Kusrini", "Dwi Fery Kurniawan", "Dewi Hadijanti", "Rudi Octriyanto", "Moch Tafsirul Anam", "Daniel Agus Purwanto", "Bagus Frengky Thu Ing Wan", "Dian Kurniawan", "Ubaidir Rahman", "Simon Petrus", "Dewo Ari Kurniawan", "Hi Men", "Lie Hon Hau", "Danny Alfian", "Saverius Sanny", "Eno Anggun Kurniasih", "M Fahmi Andika", "Aan Rosana", "Rinaldi Andreas", "Alex Arfan", "Femy Yulianita Sadikin", "Herman", "Laurensia Diva", "Leonardo Krista Mahardika", "Mathias Christian Halomoan", "Sulistina", "Yunita", "Rihlah Farhati", "Yulia Chaerawati", "Nova Amelia", "Agus Prasetyo", "Aulia Akbar", "Edi Hartoyo", "Erna", "Fikarachma Ukhti", "R. Rachmatullah", "Ramadhana Siallagan", "Richi Lesmana", "Triyani", "Arief Razak", "Esmina Maelani", "Muhammad Haris Fadilah", "Yogi Causa Zulkarnaen", "Juli Hardiansyah", "Inda Wani", "Sanitera Darma", "Tomi Sanjaya", "Aulya Kartika Dewi", "Reinhard Persada Tampubolon", "Kuswanto", "Deannisa Ratih Arsatri", "Sutarto", "Irwanto", "KG Rindy VS Suzan", "Sylviana Tamsil", "Bthari Wangi Nafas Islami", "Mursidah SP", "Budi Susilo", "Devina Agustina", "Dewi Antini", "Indah Safitri", "Muhammad Ibrahim", "Nabila Syavitri", "Rajatul Alam", "Riana", "Sandi Septian", "Sandro P Simatupang", "Sarah Kartika Sari", "Suhendri", "Teliana Pricilia", "Tony Ari Djayanto", "Diah Sekar Asriningrum", "Aas Atalapu", "Agil Salmon Bernadus", "Maria Aryani Hadi", "Azaria Basauli", "Yuli Puspitasari", "Vincentius Ivan Irdianta A",
                  ].map((name, i) => (
                    <p key={i}>{i + 1}. {name}</p>
                  ))}
                </div>
                <p className="pt-1"><b>Nama-Nama Wakil Pialang Berjangka Yang Secara Khusus Ditunjuk untuk verifikasi penerimaan Nasabah elektronik online</b></p>
                <p>1. Aan Rosana 2. Dwi Fery Kurniawan 3. Eno Anggun Kurniasih</p>
                <p className="pt-1"><b>Nomor Rekening Terpisah (Segregated Account) Perusahaan Pialang Berjangka</b></p>
                <p><b>AKUN BANK</b><br /><b>Nama Bank: Bank Central Asia (BCA)</b><br />Nama Rekening: PT Trive Invest Futures<br />Kantor Cabang: KCU Sudirman Chase Plaza<br />Nomor Rekening: IDR: 035 316 9359 | USD: 035 316 9626 | Swift Code: CENAIDJA<br /><b>Nama Bank: Bank Mandiri</b><br />Nama Rekening: PT Trive Invest Futures<br />Kantor Cabang: KCP Jkt Wisma BNI 46<br />Nomor Rekening: IDR: 122 007 564 3216 | USD: 122 007 654 3225 | Swift Code: BMRIIDJA<br /><b>Nama Bank: Bank BNI</b><br />Nama Rekening: PT Trive Invest Futures<br />Kantor Cabang: KCU Dukuh Bawah<br />Nomor Rekening: IDR: 202 309 0880 | USD: 202 309 0891 | Swift Code: BNINIDJA</p>
                </div>
              </div>

              {/* Pernyataan - di luar scroll, selalu terlihat (sticky di bawah) */}
              <form onSubmit={handleSubmit} className="flex-shrink-0 mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-semibold text-gray-800 mb-3 text-center">PERNYATAAN TELAH MEMBACA PROFIL PERUSAHAAN PIALANG BERJANGKA</h3>
                <p className="text-xs text-gray-600 mb-3">Dengan mengisi kolom "YA" di bawah ini, saya menyatakan bahwa saya telah membaca dan menerima informasi PROFIL PERUSAHAAN PIALANG BERJANGKA, mengerti dan memahami isinya.</p>
                <div className="mb-3">
                  <label className={labelClass}>Diterima/Tidak Diterima:</label>
                  <div className="flex gap-4 mt-1.5">
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                      <input type="radio" name="accepted" value="ya" checked={accepted === "ya"} onChange={() => setAccepted("ya")} className="accent-[#00C2FF] w-3.5 h-3.5" /> Ya
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                      <input type="radio" name="accepted" value="tidak" checked={accepted === "tidak"} onChange={() => setAccepted("tidak")} className="accent-[#00C2FF] w-3.5 h-3.5" /> Tidak
                    </label>
                  </div>
                </div>
                <div className="mb-4">
                  <label className={labelClass}>Tanggal Penerimaan:</label>
                  <input className={`${inputBase} ${inputDisabled}`} value={tanggalPenerimaan} disabled readOnly />
                </div>
                <div className="flex flex-wrap gap-3 justify-between pt-2">
                  <button type="button" onClick={handleBack} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-xs font-medium hover:bg-gray-50 transition-colors min-w-[110px]">
                    Kembali
                  </button>
                  <button type="submit" disabled={accepted !== "ya"} className="bg-[#69d7f6] hover:bg-[#5bc7e6] text-white px-4 py-2 rounded-full text-xs font-medium transition-colors min-w-[110px] disabled:opacity-50 disabled:cursor-not-allowed">
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
