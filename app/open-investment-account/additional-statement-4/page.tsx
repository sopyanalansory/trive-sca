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

export default function AdditionalStatement4Page() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileHovered, setProfileHovered] = React.useState(false);
  const [userName, setUserName] = React.useState("");
  const [userInitial, setUserInitial] = React.useState("M");
  const [acceptanceRadio, setAcceptanceRadio] = React.useState("");
  const [showError, setShowError] = React.useState(false);
  const [disputeMethod, setDisputeMethod] = React.useState("");
  const [selectedOffice, setSelectedOffice] = React.useState("");
  const [showDisputeError, setShowDisputeError] = React.useState(false);
  const [showOfficeError, setShowOfficeError] = React.useState(false);
  const [tanggalPenerimaan] = React.useState(() => formatDateNow());

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

  const handleAcceptanceChange = (value: string) => {
    setAcceptanceRadio(value);
    if (value === "tidak") {
      setShowError(true);
    } else {
      setShowError(false);
    }
  };

  const handleDisputeMethodChange = (value: string) => {
    setDisputeMethod(value);
    setShowDisputeError(false);
  };

  const handleOfficeChange = (value: string) => {
    setSelectedOffice(value);
    setShowOfficeError(false);
  };

  const handleNext = () => {
    let hasError = false;

    if (acceptanceRadio !== "ya") {
      setShowError(true);
      hasError = true;
    }

    if (disputeMethod === "") {
      setShowDisputeError(true);
      hasError = true;
    }

    if (selectedOffice === "") {
      setShowOfficeError(true);
      hasError = true;
    }

    if (hasError) {
      return;
    }

    router.push("/open-investment-account/additional-statement-5");
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

            <div className="flex-1 min-w-0 w-full bg-white rounded-lg overflow-hidden px-4 py-4 sm:px-5 sm:py-5 lg:py-6 lg:px-6 open-account-form-card flex flex-col">
              <h2 className="text-base font-semibold text-gray-900 tracking-tight mb-1">Pernyataan Tambahan</h2>

              <form onSubmit={(e) => e.preventDefault()} className="flex flex-col flex-1 w-full min-w-0 max-w-full overflow-hidden">
                {/* Fixed Header Section */}
                <div className="flex-shrink-0">
                  {/* Stepper Horizontal */}
                  <div className="flex items-center justify-center gap-6 mb-6 mt-2">
                    {[...Array(7)].map((_, idx) => (
                      <div key={idx} className="text-center">
                        <div
                          className={`w-8 h-8 rounded-full text-white flex items-center justify-center mx-auto mb-2 font-bold text-sm border-2 ${
                            idx < 4
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
                    <div className="font-semibold text-sm text-gray-900 mb-6 uppercase leading-tight">
                      PERJANJIAN PEMBERIAN AMANAT SECARA ELEKTRONIK ON-LINE UNTUK TRANSAKSI KONTRAK DERIVATIF DALAM SISTEM PERDAGANGAN ALTERNATIF
                    </div>
                    <div className="border-2 border-gray-900 p-4 mb-6">
                      <div className="font-semibold text-xs text-gray-900 mb-2">PERHATIAN !!!</div>
                      <div className="text-xs text-gray-900">
                        PERJANJIAN INI MERUPAKAN KONTRAK HUKUM, HARAP DIBACA DENGAN SEKSAMA
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agreement Content - Scrollable */}
                <div className="text-xs text-gray-700 space-y-4 leading-relaxed overflow-y-auto flex-1 pr-2 mb-4" style={{ maxHeight: "calc(100vh - 600px)" }}>
                  <p>
                    Pada Hari ini, Jumat, 23 Mei 2025, kami yang mengisi perjanjian di bawah ini:
                  </p>

                  <div className="space-y-2">
                    <p>Nama: MOHAMMAD SOPYAN</p>
                    <p>Pekerjaan/Jabatan: Pengangguran</p>
                    <p>Alamat: KP. MAMPIR BARAT</p>
                  </div>

                  <p>
                    dalam hal ini bertindak untuk dan atas nama sendiri, yang selanjutnya disebut Nasabah,
                  </p>

                  <div className="space-y-2">
                    <p>Nama:</p>
                    <ol className="list-decimal ml-5 space-y-1">
                      <li>Dwi Fery Kurniawan</li>
                      <li>Eno Anggun Kurniasih</li>
                      <li>Aan Rosana</li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <p>
                      Pekerjaan/Jabatan: Petugas Wakil Pialang yang Ditunjuk Memverifikasi
                    </p>
                    <p>
                      Alamat: Multivision Tower Lt. 20 Jl. Kuningan Mulia Lot 9B, Jakarta Selatan 12980
                    </p>
                  </div>

                  <p>
                    dalam hal ini bertindak untuk dan atas nama PT. TRIVE INVEST FUTURES yang selanjutnya disebut Pialang Berjangka.
                  </p>
                  <p>
                    Nasabah dan Pialang Berjangka secara bersama-sama selanjutnya disebut Para Pihak.
                  </p>
                  <p>
                    Para pihak sepakat untuk mengadakan Perjanjian Pemberian Amanat untuk melakukan transaksi penjualan maupun pembelian Kontrak Derivatif dalam Sistem Perdagangan Alternatif dengan ketentuan sebagai berikut:
                  </p>

                  {/* Key sections with numbered points */}
                  <div className="space-y-4 mt-6">
                    {/* Section 1 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">1.</span>
                        <span className="font-semibold text-sm">Margin dan Pembayaran Lainnya</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-decimal">
                        <li>
                          Nasabah menempatkan sejumlah dana (Margin) ke Rekening Terpisah (Segregated Account) Pialang Berjangka sebagai Margin Awal dan wajib mempertahankannya sebagaimana ditetapkan
                        </li>
                        <li>
                          Membayar biaya-biaya yang diperlukan untuk transaksi, yaitu biaya transaksi, pajak, komisi, dan biaya pelayanan, biaya bunga sesuai tingkat yang berlaku, dan biaya lainnya yang dapat dipertanggungjawabkan berkaitan dengan transaksi sesuai amanat Nasabah, maupun biaya rekening Nasabah.
                        </li>
                      </ol>
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">2.</span>
                        <span className="font-semibold text-sm">Pelaksanaan Transaksi</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-decimal">
                        <li>
                          Setiap transaksi Nasabah dilaksanakan secara elektronik on-line oleh Nasabah yang bersangkutan;
                        </li>
                        <li>
                          Setiap amanat Nasabah yang diterima dapat langsung dilaksanakan sepanjang nilai Margin yang tersedia pada rekeningnya mencukupi dan eksekusinya dapat menimbulkan perbedaan waktu terhadap proses pelaksanaan transaksi tersebut. Nasabah harus mengetahui posisi Margin dan posisi terbuka sebelum memberikan amanat untuk transaksi berikutnya.
                        </li>
                        <li>
                          Setiap transaksi Nasabah secara bilateral dilawankan dengan Penyelenggara Sistem Perdagangan Alternatif PT. PT. Adhikarya Cipta Persada yang telah memiliki Perjanjian Kerjasama dengan Pialang Berjangka.
                        </li>
                        <li>
                          Nasabah bertanggung jawab atas keamanan dan penggunaan username dan password dalam transaksi Perdagangan Berjangka, oleh karenanya Nasabah dilarang memberitahukan, menyerahkan atau meminjamkan username dan password kepada pihak lain, termasuk kepada pegawai Pialang Berjangka.
                        </li>
                      </ol>
                    </div>

                    {/* Section 3 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">3.</span>
                        <span className="font-semibold text-sm">Kewajiban Memelihara Margin</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-decimal">
                        <li>
                          Nasabah wajib memelihara/memenuhi tingkat Margin yang harus tersedia di rekening pada Pialang Berjangka sesuai dengan jumlah yang telah ditetapkan baik diminta ataupun tidak oleh Pialang Berjangka.
                        </li>
                        <li>
                          Apabila jumlah Margin memerlukan penambahan maka Pialang Berjangka wajib memberitahukan dan memintakan kepada Nasabah untuk menambah Margin segera.
                        </li>
                        <li>
                          Apabila jumlah Margin memerlukan tambahan (Call Margin) maka Nasabah wajib melakukan penyerahan Call Margin selambatlambatnya sebelum dimulai hari perdagangan berikutnya. Kewajiban Nasabah sehubungan dengan penyerahan Call Margin tidak terbatas pada jumlah Margin awal.
                        </li>
                        <li>
                          Pialang Berjangka tidak berkewajiban melaksanakan amanat untuk melakukan transaksi yang baru dari Nasabah sebelum Call Margin dipenuhi.
                        </li>
                        <li>
                          Untuk memenuhi kewajiban Call Margin dan keuangan lainnya dari Nasabah, Pialang Berjangka dapat mencairkan dana Nasabah yang ada di Pialang Berjangka
                        </li>
                      </ol>
                    </div>

                    {/* Section 4 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">4.</span>
                        <span className="font-semibold text-sm">Hak Pialang Berjangka Melikuidasi Posisi Nasabah</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-none">
                        <li>
                          Nasabah bertanggung jawab memantau/mengetahui posisi terbukanya secara terus menerus dan memenuhi kewajibannya. Apabila dalam jangka waktu tertentu dana pada rekening Nasabah kurang dari yang dipersyaratkan, Pialang Berjangka dapat menutup posisi terbuka Nasabah secara keseluruhan atau sebagian, membatasi transaksi, atau tindakan lain untuk melindungi diri dalam pemenuhan Margin tersebut dengan terlebih dahulu memberitahu atau tanpa memberitahu Nasabah dan Pialang Berjangka tidak bertanggung jawab atas kerugian yang timbul akibat tindakan tersebut.
                        </li>
                      </ol>
                    </div>

                    {/* Section 5 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">5.</span>
                        <span className="font-semibold text-sm">Penggantian Kerugian Tidak Adanya Penutupan Posisi</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-none">
                        <li>
                          Apabila Nasabah tidak mampu melakukan penutupan atas transaksi yang jatuh tempo, Pialang Berjangka dapat melakukan penutupan atas transaksi Nasabah yang terjadi. Nasabah wajib membayar biayabiaya, termasuk biaya kerugian dan premi yang telah dibayarkan oleh Pialang Berjangka, dan apabila Nasabah lalai untuk membayar biayabiaya tersebut, Pialang Berjangka berhak untuk mengambil pembayaran dari dana Nasabah.
                        </li>
                      </ol>
                    </div>

                    {/* Section 6 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">6.</span>
                        <span className="font-semibold text-sm">Pialang Berjangka Dapat Membatasi Posisi</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-none">
                        <li>
                          Nasabah mengakui hak Pialang Berjangka untuk membatasi posisi terbuka Kontrak dan Nasabah tidak melakukan transaksi melebihi batas yang telah ditetapkan tersebut.
                        </li>
                      </ol>
                    </div>

                    {/* Section 7 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">7.</span>
                        <span className="font-semibold text-sm">Tidak Ada Jaminan atas Informasi atau Rekomendasi Nasabah mengakui bahwa:</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-decimal">
                        <li>
                          Informasi dan rekomendasi yang diberikan oleh Pialang Berjangka kepada Nasabah tidak selalu lengkap dan perlu diverifikasi.
                        </li>
                        <li>
                          Pialang Berjangka tidak menjamin bahwa informasi dan rekomendasi yang diberikan merupakan informasi yang akurat dan lengkap.
                        </li>
                        <li>
                          Informasi dan rekomendasi yang diberikan oleh Wakil Pialang Berjangka yang satu dengan yang lain mungkin berbeda karena perbedaan analisis fundamental atau teknikal. Nasabah menyadari bahwa ada kemungkinan Pialang Berjangka dan pihak terafiliasinya memiliki posisi di pasar dan memberikan rekomendasi tidak konsisten kepada Nasabah.
                        </li>
                      </ol>
                    </div>

                    {/* Section 8 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">8.</span>
                        <span className="font-semibold text-sm">Pembatasan Tanggung Jawab Pialang Berjangka.</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-decimal">
                        <li>
                          Pialang Berjangka tidak bertanggung jawab untuk memberikan penilaian kepada Nasabah mengenai iklim, pasar, keadaan politik dan ekonomi nasional dan internasional, nilai Kontrak Derivatif, kolateral, atau memberikan nasihat mengenai keadaan pasar. Pialang Berjangka hanya memberikan pelayanan untuk melakukan transaksi secara jujur serta memberikan laporan atas transaksi tersebut.
                        </li>
                        <li>
                          Perdagangan sewaktu-waktu dapat dihentikan oleh pihak yang memiliki otoritas (Bappebti/Bursa Berjangka) tanpa pemberitahuan terlebih dahulu kepada Nasabah. Atas posisi terbuka yang masih dimiliki oleh Nasabah pada saat perdagangan tersebut dihentikan, maka akan diselesaikan (likuidasi) berdasarkan pada peraturan/ketentuan yang dikeluarkan dan ditetapkan oleh pihak otoritas tersebut, dan semua kerugian serta biaya yang timbul sebagai akibat dihentikannya transaksi oleh pihak otoritas perdagangan tersebut, menjadi beban dan tanggung jawab Nasabah sepenuhnya.
                        </li>
                      </ol>
                    </div>

                    {/* Section 9 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">9.</span>
                        <span className="font-semibold text-sm">Transaksi Harus Mematuhi Peraturan Yang Berlaku</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-none">
                        <li>
                          Semua transaksi dilakukan sendiri oleh Nasabah dan wajib mematuhi peraturan perundang-undangan di bidang Perdagangan Berjangka, kebiasaan dan interpretasi resmi yang ditetapkan oleh Bappebti atau Bursa Berjangka.
                        </li>
                      </ol>
                    </div>

                    {/* Section 10 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">10.</span>
                        <span className="font-semibold text-sm">Pialang Berjangka tidak Bertanggung jawab atas Kegagalan Komunikasi</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-none">
                        <li>
                          Pialang Berjangka tidak bertanggung jawab atas keterlambatan atau tidak tepat waktunya pengiriman amanat atau informasi lainnya yang disebabkan oleh kerusakan fasilitas komunikasi atau sebab lain diluar kontrol Pialang Berjangka.
                        </li>
                      </ol>
                    </div>

                    {/* Section 11 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">11.</span>
                        <span className="font-semibold text-sm">Konfirmasi</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-decimal">
                        <li>
                          Konfirmasi dari Nasabah dapat berupa surat, media lain, surat elektronik, secara tertulis ataupun rekaman suara.
                        </li>
                        <li>
                          Pialang Berjangka berkewajiban menyampaikan konfirmasi transaksi, laporan rekening, permintaan Call Margin, dan pemberitahuan lainnya kepada Nasabah secara akurat, benar dan secepatnya pada alamat (email) Nasabah sesuai dengan yang tertera dalam rekening Nasabah. Apabila dalam jangka waktu 2 x 24 jam setelah amanat jual atau beli disampaikan, tetapi Nasabah belum menerima konfirmasi melalui alamat email Nasabah dan/atau sistem transaksi, Nasabah segera memberitahukan hal tersebut kepada Pialang Berjangka melalui telepon dan disusul dengan pemberitahuan tertulis.
                        </li>
                        <li>
                          Jika dalam waktu 2 x 24 jam sejak tanggal penerimaan konfirmasi tersebut tidak ada sanggahan dari Nasabah maka konfirmasi Pialang Berjangka dianggap benar dan sah.
                        </li>
                        <li>
                          Kekeliruan atas konfirmasi yang diterbitkan Pialang Berjangka akan diperbaiki oleh Pialang Berjangka sesuai keadaan yang sebenarnya dan demi hukum konfirmasi yang lama batal.
                        </li>
                        <li>
                          Nasabah tidak bertanggung jawab atas transaksi yang dilaksanakan atas rekeningnya apabila konfirmasi tersebut tidak disampaikan secara benar dan akurat.
                        </li>
                      </ol>
                    </div>

                    {/* Section 12 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">12.</span>
                        <span className="font-semibold text-sm">Kebenaran Informasi Nasabah</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-none">
                        <li>
                          Nasabah wajib memberikan informasi yang benar dan akurat mengenai data Nasabah yang diminta oleh Pialang Berjangka dan akan memberitahukan paling lambat dalam waktu 3 (tiga) hari kerja setelah terjadi perubahan, termasuk perubahan kemampuan keuangannya untuk terus melaksanakan transaksi.
                        </li>
                      </ol>
                    </div>

                    {/* Section 13 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">13.</span>
                        <span className="font-semibold text-sm">Komisi Transaksi</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-none">
                        <li>
                          Nasabah mengetahui dan menyetujui bahwa Pialang Berjangka berhak untuk memungut komisi atas transaksi yang telah dilaksanakan, dalam jumlah sebagaimana akan ditetapkan dari waktu ke waktu oleh Pialang Berjangka. Perubahan beban (fees) dan biaya lainnya harus disetujui secara tertulis oleh Para Pihak.
                        </li>
                      </ol>
                    </div>

                    {/* Section 14 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">14.</span>
                        <span className="font-semibold text-sm">Pemberian Kuasa</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-none">
                        <li>
                          Nasabah memberikan kuasa kepada Pialang Berjangka untuk menghubungi bank, lembaga keuangan, Pialang Berjangka lain, atau institusi lain yang terkait untuk memperoleh keterangan atau verifikasi mengenai informasi yang diterima dari Nasabah. Nasabah mengerti bahwa penelitian mengenai data hutang pribadi dan bisnis dapat dilakukan oleh Pialang Berjangka apabila diperlukan. Nasabah diberikan kesempatan untuk memberitahukan secara tertulis dalam jangka waktu yang telah disepakati untuk melengkapi persyaratan yang diperlukan.
                        </li>
                      </ol>
                    </div>

                    {/* Section 15 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">15.</span>
                        <span className="font-semibold text-sm">Pemindahan Dana</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-none">
                        <li>
                          Pialang Berjangka dapat setiap saat mengalihkan dana dari satu rekening ke rekening lainnya berkaitan dengan kegiatan transaksi yang dilakukan Nasabah seperti pembayaran komisi, pembayaran biaya transaksi, kliring dan keterlambatan dalam memenuhi kewajibannya, tanpa terlebih dahulu memberitahukan kepada Nasabah. Transfer yang telah dilakukan akan segera diberitahukan secara tertulis kepada Nasabah.
                        </li>
                      </ol>
                    </div>

                    {/* Section 16 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">16.</span>
                        <span className="font-semibold text-sm">Pemberitahuan</span>
                      </div>
                      <ol className="ml-6 space-y-4 list-none">
                        <li>
                          (1) Semua komunikasi, uang, surat berharga, dan kekayaan lainnya harus dikirimkan langsung ke alamat Nasabah seperti tertera dalam rekeningnya atau alamat lain yang ditetapkan/diberitahukan secara tertulis oleh Nasabah.
                        </li>
                        <li>
                          (2) Semua uang, harus disetor atau ditransfer langsung oleh Nasabah ke Rekening Terpisah (Segregated Account) Pialang Berjangka:
                          <div className="flex flex-col sm:flex-row gap-4 ml-4 mt-2">
                            <div className="min-w-[180px] font-medium">Nomor Rekening Terpisah:</div>
                            <div className="space-y-4">
                              <div>
                                <div><b>Nama Bank 1:</b> Bank Central Asia (BCA)</div>
                                <div><b>Nama Rekening:</b> PT Trive Invest Futures</div>
                                <div><b>Kantor Cabang:</b> KCU Sudirman Chase Plaza</div>
                                <div><b>Nomor Rekening:</b></div>
                                <div className="ml-4">
                                  IDR: 035 316 9359<br />
                                  USD: 035 316 9626<br />
                                  <b>Swift Code:</b> CENAIDJA
                                </div>
                              </div>
                              <div>
                                <div><b>Nama Bank 2:</b> Bank Mandiri</div>
                                <div><b>Nama Rekening:</b> PT Trive Invest Futures</div>
                                <div><b>Kantor Cabang:</b> KCP Jkt Wisma BNI 46</div>
                                <div><b>Nomor Rekening:</b></div>
                                <div className="ml-4">
                                  IDR: 122 007 564 3216<br />
                                  USD: 122 007 654 3225<br />
                                  <b>Swift Code:</b> BMRIIDJA
                                </div>
                              </div>
                              <div>
                                <div><b>Nama Bank 3:</b> Bank BNI</div>
                                <div><b>Nama Rekening:</b> PT Trive Invest Futures</div>
                                <div><b>Kantor Cabang:</b> KCU Dukuh Bawah</div>
                                <div><b>Nomor Rekening:</b></div>
                                <div className="ml-4">
                                  IDR: 202 309 0880<br />
                                  USD: 202 309 0891<br />
                                  <b>Swift Code:</b> BNINIDJA
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                        <li>
                          dan dianggap sudah diterima oleh Pialang Berjangka apabila sudah ada tanda bukti penerimaan dari pegawai Pialang Berjangka.
                        </li>
                      </ol>
                    </div>

                    {/* Section 17 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">17.</span>
                        <span className="font-semibold text-sm">Dokumen Pemberitahuan Adanya Risiko</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-none">
                        <li>
                          Nasabah mengakui menerima dan mengerti Dokumen Pemberitahuan Adanya Risiko.
                        </li>
                      </ol>
                    </div>

                    {/* Section 18 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">18.</span>
                        <span className="font-semibold text-sm">Jangka Waktu Perjanjian dan Pengakhiran</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-decimal">
                        <li>
                          (1) Perjanjian ini mulai berlaku terhitung sejak tanggal dilakukannya konfirmasi oleh Pialang Berjangka dengan diterimanya Bukti Konfirmasi Penerimaan Nasabah dari Pialang Berjangka oleh Nasabah.
                        </li>
                        <li>
                          (2) Nasabah dapat mengakhiri Perjanjian ini hanya jika Nasabah sudah tidak lagi memiliki posisi terbuka dan tidak ada kewajiban Nasabah yang diemban oleh atau terhutang kepada Pialang Berjangka.
                        </li>
                        <li>
                          (3) Pengakhiran tidak membebaskan salah satu Pihak dari tanggung jawab atau kewajiban yang terjadi sebelum pemberitahuan tersebut.
                        </li>
                      </ol>
                    </div>

                    {/* Section 19 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">19.</span>
                        <span className="font-semibold text-sm">Berakhirnya Perjanjian</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-decimal">
                        <li>
                          Perjanjian dapat berakhir dalam hal Nasabah:
                          <ol type="1" className="ml-6 mt-2 space-y-1">
                            <li>
                              dinyatakan pailit, memiliki hutang yang sangat besar, dalam proses peradilan, menjadi hilang ingatan, mengundurkan diri atau meninggal;
                            </li>
                            <li>
                              tidak dapat memenuhi atau mematuhi perjanjian ini dan/atau melakukan pelanggaran terhadapnya;
                            </li>
                            <li>
                              berkaitan dengan butir (1) dan (2) tersebut diatas, Pialang Berjangka dapat:
                              <ol type="i" className="ml-6 mt-1 space-y-1">
                                <li>
                                  Meneruskan atau menutup posisi Nasabah tersebut setelah mempertimbangkannya secara cermat dan jujur; dan
                                </li>
                                <li>
                                  Menolak transaksi dari Nasabah.
                                </li>
                              </ol>
                            </li>
                            <li>
                              Pengakhiran Perjanjian sebagaimana dimaksud dengan angka (1) dan (2) tersebut di atas tidak melepaskan kewajiban dari Para Pihak yang berhubungan dengan penerimaan atau kewajiban pembayaran atau pertanggungjawaban kewajiban lainnya yang timbul dari Perjanjian.
                            </li>
                          </ol>
                        </li>
                      </ol>
                    </div>

                    {/* Section 20 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">20.</span>
                        <span className="font-semibold text-sm">Force Majeure</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-none">
                        <li>
                          Tidak ada satupun pihak di dalam Perjanjian dapat diminta pertanggungjawabannya untuk suatu keterlambatan atau terhalangnya memenuhi kewajiban berdasarkan Perjanjian yang diakibatkan oleh suatu sebab yang berada di luar kemampuannya atau kekuasaannya (force majeure), sepanjang pemberitahuan tertulis mengenai sebab itu disampaikannya kepada pihak lain dalam Perjanjian dalam waktu tidak lebih dari 24 (dua puluh empat) jam sejak timbulnya sebab itu. Yang dimaksud dengan force majeur dalam Perjanjian adalah peristiwa kebakaran, bencana alam (seperti gempa bumi, banjir, angin topan, petir), pemogokan umum, huru hara, peperangan, perubahan terhadap peraturan perundang-undangan yang berlaku dan kondisi di bidang ekonomi, keuangan dan Perdagangan Berjangka, pembatasan yang dilakukan oleh otoritas Perdagangan Berjangka dan Bursa Berjangka serta terganggunya sistem perdagangan, kliring dan penyelesaian transaksi Kontrak Berjangka di mana transaksi dilaksanakan yang secara langsung mempengaruhi pelaksanaan pekerjaan berdasarkan Perjanjian.
                        </li>
                      </ol>
                    </div>

                    {/* Section 21 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">21.</span>
                        <span className="font-semibold text-sm">Perubahan atas Isian dalam Perjanjian Pemberian Amanat</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-none">
                        <li>
                          Perubahan atas isian dalam Perjanjian ini hanya dapat dilakukan atas persetujuan Para Pihak, atau Pialang Berjangka telah memberitahukan secara tertulis perubahan yang diinginkan, dan Nasabah tetap memberikan perintah untuk transaksi dengan tanpa memberikan tanggapan secara tertulis atas usul perubahan tersebut. Tindakan Nasabah tersebut dianggap setuju atas usul perubahan tersebut.
                        </li>
                      </ol>
                    </div>

                    {/* Section 22 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">22.</span>
                        <span className="font-semibold text-sm">Tanggung Jawab Kepada Nasabah</span>
                      </div>
                      <ol className="ml-6 space-y-4 list-none">
                        <li>
                          <b>(a)</b> Penyelenggara Sistem Perdagangan Alternatif yang merupakan pihak yang menguasai dan/atau memiliki sistem perdagangan elektronik bertanggung jawab atas pelanggaran penyalahgunaan sistem perdagangan elektronik sesuai dengan ketentuan yang diatur dalam Perjanjian Kerjasama (PKS) dan peraturan perdagangan (trading rules) antara Penyelenggara Sistem Perdagangan Alternatif dan Peserta Sistem Perdagangan Alternatif yang mengakibatkan kerugian Nasabah.
                        </li>
                        <li>
                          <b>(b)</b> Peserta Sistem Perdagangan Alternatif yang merupakan pihak yang menggunakan sistem perdagangan elektronik bertanggung jawab atas pelanggaran penyalahgunaan sistem perdagangan elektronik sebagaimana dimaksud pada angka 22 huruf (a) yang mengakibatkan kerugian Nasabah.
                        </li>
                        <li>
                          <b>(c)</b> Dalam pemanfaatan sistem perdagangan elektronik, Penyelenggara Sistem Perdagangan Alternatif dan/atau Peserta Sistem Perdagangan Alternatif tidak bertanggung jawab atas kerugian Nasabah diluar hal-hal yang telah diatur pada angka 22 huruf (a) dan (b), antara lain: kerugian yang diakibatkan oleh risiko-risiko yang disebutkan di dalam Dokumen Pemberitahuan Adanya Risiko yang telah dimengerti dan disetujui oleh Nasabah.
                        </li>
                      </ol>
                    </div>

                    {/* Section 23 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">23.</span>
                        <span className="font-semibold text-sm">Penyelesaian Perselisihan dan Domisili Hukum</span>
                      </div>
                      <ol className="ml-6 space-y-4 list-none">
                        <li>
                          (1) Semua perselisihan dan perbedaan pendapat yang timbul dalam pelaksanaan Perjanjian ini wajib diselesaikan terlebih dahulu secara musyawarah untuk mencapai mufakat antara Para Pihak.
                        </li>
                        <li>
                          (2) Apabila perselisihan dan perbedaan pendapat yang timbul tidak dapat diselesaikan secara musyawarah untuk mencapai mufakat, Para Pihak wajib memanfaatkan sarana penyelesaian perselisihan yang tersedia di Bursa Berjangka.
                        </li>
                        <li>
                          <div className="mt-2">
                            (3) Apabila perselisihan dan perbedaan pendapat yang timbul tidak dapat diselesaikan melalui cara sebagaimana dimaksud pada angka (1) dan angka (2), maka Para Pihak sepakat untuk menyelesaikan perselisihan melalui
                          </div>
                          <div className={`ml-4 mt-2 space-y-2 ${showDisputeError ? "border border-red-500 rounded p-2 bg-red-50" : ""}`}>
                            <label className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="disputeMethod"
                                value="bakti"
                                checked={disputeMethod === "bakti"}
                                onChange={(e) => handleDisputeMethodChange(e.target.value)}
                                className="radio-primary mt-0.5"
                              />
                              <span className="text-xs">
                                a. Badan Arbitrase Perdagangan Berjangka Komoditi (BAKTI) berdasarkan Peraturan dan Prosedur Badan Arbitrase Perdagangan Berjangka Komoditi (BAKTI)
                              </span>
                            </label>
                            <label className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="disputeMethod"
                                value="pengadilan"
                                checked={disputeMethod === "pengadilan"}
                                onChange={(e) => handleDisputeMethodChange(e.target.value)}
                                className="radio-primary mt-0.5"
                              />
                              <span className="text-xs">
                                b. Pengadilan Negeri Jakarta Selatan
                              </span>
                            </label>
                            {showDisputeError && (
                              <div className="text-xs text-red-500 font-medium">Bagian ini diperlukan.</div>
                            )}
                          </div>
                        </li>
                        <li>
                          <div className="mt-2">
                            (4) Kantor atau Kantor cabang Pialang Berjangka terdekat dengan domisili Nasabah tempat penyelesaian
                          </div>
                          <div className={`ml-4 mt-2 space-y-2 ${showOfficeError ? "border border-red-500 rounded p-2 bg-red-50" : ""}`}>
                            <div className="text-xs mb-2">Daftar kantor yang dipilih (salah satu):</div>
                            {[
                              { value: "pusat", label: "Kantor Pusat" },
                              { value: "bandung", label: "PT Trive Invest Futures Cabang Bandung" },
                              { value: "medan", label: "PT Trive Invest Futures Cabang Medan" },
                              { value: "surabaya", label: "PT Trive Invest Futures Cabang Surabaya" },
                              { value: "pontianak", label: "PT Trive Invest Futures Cabang Pontianak" },
                            ].map((office) => (
                              <label key={office.value} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="selectedOffice"
                                  value={office.value}
                                  checked={selectedOffice === office.value}
                                  onChange={(e) => handleOfficeChange(e.target.value)}
                                  className="radio-primary"
                                />
                                <span className="text-xs">{office.label}</span>
                              </label>
                            ))}
                            {showOfficeError && (
                              <div className="text-xs text-red-500 font-medium">Bagian ini diperlukan.</div>
                            )}
                          </div>
                        </li>
                      </ol>
                    </div>

                    {/* Section 24 */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-[#4fc3f7] font-semibold mr-2 text-base">24.</span>
                        <span className="font-semibold text-sm">Bahasa</span>
                      </div>
                      <ol className="ml-6 space-y-2 list-none">
                        <li>
                          Perjanjian ini dibuat dalam Bahasa Indonesia.
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Acceptance Section - Sticky */}
                <div className="flex-shrink-0 pt-3 border-t border-gray-100 bg-white sticky bottom-0 pb-2 mt-4">
                  <div className="mb-6 space-y-4">
                    <p className="text-xs text-gray-700">
                      Demikian Perjanjian Pemberian Amanat ini dibuat oleh Para Pihak dalam keadaan sadar, sehat jasmani rohani dan tanpa unsur paksaan dari pihak manapun.
                    </p>
                    <p className="text-xs text-gray-700 font-semibold">
                      "Saya telah membaca, mengerti dan setuju terhadap semua ketentuan yang tercantum dalam perjanjian ini"
                    </p>
                    <p className="text-xs text-gray-700">
                      Dengan mengisi kolom "YA" di bawah, saya menyatakan bahwa saya telah menerima <span className="font-semibold">"PERJANJIAN PEMBERIAN AMANAT TRANSAKSI KONTRAK DERIVATIF SISTEM PERDAGANGAN ALTERNATIF"</span> mengerti dan menyetujui isinya.
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className={labelClass}>Diterima/Tidak Diterima:</label>
                    <div className="flex gap-6 mt-1.5">
                      {["ya", "tidak"].map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                          <input
                            type="radio"
                            name="acceptance"
                            value={opt}
                            checked={acceptanceRadio === opt}
                            onChange={(e) => handleAcceptanceChange(e.target.value)}
                            className="radio-primary"
                          />
                          {opt === "ya" ? "Ya" : "Tidak"}
                        </label>
                      ))}
                    </div>
                    {showError && acceptanceRadio !== "ya" && (
                      <p className={errorClass}>Anda harus memilih Ya untuk melanjutkan.</p>
                    )}
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

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center mt-6 mb-4">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="bg-[#4fc3f7] hover:bg-[#3db3e7] text-white w-[36px] h-[36px] rounded-xl text-xl font-medium transition-colors flex items-center justify-center"
                    >
                      {"<"}
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={acceptanceRadio !== "ya" || disputeMethod === "" || selectedOffice === ""}
                      className={`w-[36px] h-[36px] rounded-xl text-xl font-medium transition-colors flex items-center justify-center ${
                        acceptanceRadio === "ya" && disputeMethod !== "" && selectedOffice !== ""
                          ? "bg-[#4fc3f7] hover:bg-[#3db3e7] text-white cursor-pointer"
                          : "bg-[#E9E9E9] text-white cursor-not-allowed"
                      }`}
                    >
                      {">"}
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
                      disabled={acceptanceRadio !== "ya" || disputeMethod === "" || selectedOffice === ""}
                      className={`px-4 py-2 rounded-full text-xs min-w-[130px] transition-colors border ${
                        acceptanceRadio === "ya" && disputeMethod !== "" && selectedOffice !== ""
                          ? "bg-[#4fc3f7] hover:bg-[#3db3e7] text-white cursor-pointer border-[#4fc3f7] font-bold"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 font-medium"
                      }`}
                    >
                      Berikutnya
                    </button>
                  </div>
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
