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

interface Statement {
  number: number;
  title: string;
  underline: boolean;
  content: string[];
}

export default function AdditionalStatement2Page() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileHovered, setProfileHovered] = React.useState(false);
  const [userName, setUserName] = React.useState("");
  const [userInitial, setUserInitial] = React.useState("M");
  const [checkedStatements, setCheckedStatements] = React.useState<Record<number, boolean>>({});
  const [acceptanceRadio, setAcceptanceRadio] = React.useState("");
  const [showError, setShowError] = React.useState(false);
  const [statementErrors, setStatementErrors] = React.useState<Record<number, boolean>>({});
  const [tanggalPenerimaan] = React.useState(() => formatDateNow());

  const statements: Statement[] = [
    {
      number: 1,
      title: "Perdagangan Kontrak Derivatif dalam Sistem Perdagangan Alternatif belum tentu layak bagi semua investor.",
      underline: true,
      content: [
        "Anda dapat menderita kerugian dalam jumlah besar dan dalam jangka waktu singkat. Jumlah kerugian uang dimungkinkan dapat melebihi jumlah uang yang pertama kali Anda setor (Margin Awal) ke Pialang Berjangka Anda.",
        "Anda mungkin menderita kerugian seluruh Margin dan Margin tambahan yang ditempatkan pada Pialang Berjangka untuk mempertahankan posisi Kontrak Derivatif dalam Sistem Perdagangan Alternatif Anda.",
        "Hal ini disebabkan Perdagangan Berjangka sangat dipengaruhi oleh mekanisme leverage, dimana dengan jumlah investasi dalam bentuk yang relatif kecil dapat digunakan untuk membuka posisi dengan aset yang bernilai jauh lebih tinggi. Apabila Anda tidak siap dengan risiko seperti ini, sebaiknya Anda tidak melakukan perdagangan Kontrak Derivatif dalam Sistem Perdagangan Alternatif.",
      ],
    },
    {
      number: 2,
      title: "Perdagangan Kontrak Derivatif dalam Sistem Perdagangan Alternatif mempunyai risiko dan mempunyai kemungkinan kerugian yang tidakterbatas yang jauh lebih besar dari jumlah uang yang disetor (Margin) ke Pialang Berjangka.",
      underline: true,
      content: [
        "Kontrak Derivatif dalam Sistem Perdagangan Alternatif sama dengan produk keuangan lainnya yang mempunyai risiko tinggi, Anda sebaiknya tidak menaruh risiko terhadap dana yang Anda tidak siap untuk menderita rugi, seperti tabungan pensiun, dana kesehatan atau dana untuk keadaan darurat, dana yang disediakan untuk pendidikan atau kepemilikan rumah, dana yang diperoleh dari pinjaman pendidikan atau gadai, atau dana yang digunakan untuk memenuhi kebutuhan sehari-hari.",
      ],
    },
    {
      number: 3,
      title: "Berhati-hatilah terhadap pernyataan bahwa Anda pasti mendapatkan keuntungan besar dari perdagangan Kontrak Derivatif dalam Sistem Perdagangan Alternatif.",
      underline: true,
      content: [
        'Meskipun perdagangan Kontrak Derivatif dalam Sistem Perdagangan Alternatif dapat memberikan keuntungan yang besar dan cepat, namun hal tersebut tidak pasti, bahkan dapat menimbulkan kerugian yang besar dan cepat juga. Seperti produk keuangan lainnya, tidak ada yang dinamakan "pasti untung".',
      ],
    },
    {
      number: 4,
      title: "Disebabkan adanya mekanisme leverage dan sifat dari transaksi Kontrak Derivatif dalam Sistem Perdagangan Alternatif, Anda dapat merasakan dampak bahwa Anda menderita kerugian dalam waktu cepat.",
      underline: true,
      content: [
        "Keuntungan maupun kerugian dalam transaksi akan langsung dikredit atau didebet ke rekening Anda, paling lambat secara harian. Apabila pergerakan di pasar terhadap Kontrak Derivatif dalam Sistem Perdagangan Alternatif menurunkan nilai posisi Anda dalam Kontrak Derivatif dalam Sistem Perdagangan Alternatif, dengan kata lain berlawanan dengan posisi yang Anda ambil, Anda diwajibkan untuk menambah dana untuk pemenuhan kewajiban Margin ke perusahaan Pialang Berjangka. Apabila rekening Anda berada dibawah minimum Margin yang telah ditetapkan Lembaga Kliring Berjangka atau Pialang Berjangka, maka posisi Anda dapat dilikuidasi pada saat rugi, dan Anda wajib menyelesaikan defisit (jika ada) dalam rekening Anda.",
      ],
    },
    {
      number: 5,
      title: "Pada saat pasar dalam keadaan tertentu, Anda mungkin akan sulit atau tidak mungkin melikuidasi posisi.",
      underline: true,
      content: [
        "Pada umumnya Anda harus melakukan transaksi mengambil posisi yang berlawanan dengan maksud melikuidasi posisi (offset) jika ingin melikuidasi posisi dalam Kontrak Derivatif dalam Sistem Perdagangan Alternatif. Apabila Anda tidak dapat melikuidasi posisi Kontrak Derivatif dalam Sistem Perdagangan Alternatif, Anda tidak dapat merealisasikan keuntungan pada nilai posisi tersebut atau mencegah kerugian yang lebih tinggi. Kemungkinan tidak dapat melikuidasi dapat terjadi, antara lain: jika perdagangan berhenti dikarenakan aktivitas perdagangan yang tidak lazim pada Kontrak Derivatif atau subjek Kontrak Derivatif, atau terjadi kerusakan sistem pada Pialang Berjangka Peserta Sistem Perdagangan Alternatif atau Pedagang Berjangka Penyelenggara Sistem Perdagangan Alternatif. Bahkan apabila Anda dapat melikuidasi posisi tersebut, Anda mungkin terpaksa melakukannya pada harga yang menimbulkan kerugian besar.",
      ],
    },
    {
      number: 6,
      title: 'Pada saat pasar dalam keadaan tertentu, Anda mungkin akan sulit atau tidak mungkin mengelola risiko atas posisi terbuka Kontrak Derivatif dalam Sistem Perdagangan Alternatif dengan cara membuka posisi dengan nilai yang sama namun dengan posisi yang berlawanan dalam kontrak bulan yang berbeda, dalam pasar yang berbeda atau dalam "subjek Kontrak Derivatif dalam Sistem Perdagangan Alternatif" yang berbeda.',
      underline: true,
      content: [
        'Kemungkinan untuk tidak dapat mengambil posisi dalam rangka membatasi risiko yang timbul, contohnya; jika perdagangan dihentikan pada pasar yang berbeda disebabkan aktivitas perdagangan yang tidak lazim pada Kontrak Derivatif dalam Sistem Perdagangan Alternatif atau "Kontrak Derivatif dalam Sistem Perdagangan Alternatif".',
      ],
    },
    {
      number: 7,
      title: "Anda dapat menderita kerugian yang disebabkan kegagalan sistem informasi.",
      underline: true,
      content: [
        "Sebagaimana yang terjadi pada setiap transaksi keuangan, Anda dapat menderita kerugian jika amanat untuk melaksanakan transaksi Kontrak Derivatif dalam Sistem Perdagangan Alternatif tidak dapat dilakukan karena kegagalan sistem informasi di Bursa Berjangka, Pedagang Berjangka Penyelenggara Sistem Perdagangan Alternatif, maupun sistem di Pialang Berjangka Peserta Sistem Perdagangan Alternatif yang mengelola posisi Anda. Kerugian Anda akan semakin besar jika Pialang Berjangka yang mengelola posisi Anda tidak memiliki sistem informasi cadangan atau prosedur yang layak.",
      ],
    },
    {
      number: 8,
      title: "Semua Kontrak Derivatif dalam Sistem Perdagangan Alternatif mempunyai risiko, dan tidak ada strategi berdagang yang dapat menjamin untuk menghilangkan risiko tersebut.",
      underline: true,
      content: [
        "Strategi dengan menggunakan kombinasi posisi seperti spread, dapat sama berisiko seperti posisi long atau short. Melakukan Perdagangan Berjangka memerlukan pengetahuan mengenai Kontrak Derivatif dalam Sistem Perdagangan Alternatif dan pasar berjangka.",
      ],
    },
    {
      number: 9,
      title: "Strategi perdagangan harian dalam Kontrak Derivatif dalam Sistem Perdagangan Alternatif dan produk lainnya memiliki risiko khusus.",
      underline: true,
      content: [
        'Seperti pada produk keuangan lainnya, pihak yang ingin membeli atau menjual Kontrak Derivatif dalam Sistem Perdagangan Alternatif yang sama dalam satu hari untuk mendapat keuntungan dari perubahan harga pada hari tersebut ("day traders") akan memiliki beberapa risiko tertentu antara lain jumlah komisi yang besar, risiko terkena efek pengungkit ("exposure to leverage"), dan persaingan dengan pedagang profesional. Anda harus mengerti risiko tersebut dan memiliki pengalaman yang memadai sebelum melakukan perdagangan harian ("day trading").',
      ],
    },
    {
      number: 10,
      title: "Menetapkan amanat bersyarat, Kontrak Derivatif dalam Sistem Perdagangan Alternatif dilikuidasi pada keadaan tertentu untuk membatasi rugi (stop loss), mungkin tidak akan dapat membatasi kerugian Anda sampai jumlah tertentu saja.",
      underline: true,
      content: [
        "Amanat bersyarat tersebut mungkin tidak dapat dilaksanakan karena terjadi kondisi pasar yang tidak memungkinkan melikuidasi Kontrak Derivatif dalam Sistem Perdagangan Alternatif.",
      ],
    },
    {
      number: 11,
      title: "Anda harus membaca dengan seksama dan memahami Perjanjian Pemberian Amanat Nasabah dengan Pialang Berjangka Anda sebelum melakukan transaksi Kontrak Derivatif dalam Sistem Perdagangan Alternatif.",
      underline: true,
      content: [],
    },
    {
      number: 12,
      title: "Pernyataan singkat ini tidak dapat memuat secara rinci seluruh risiko atau aspek penting lainnya tentang Perdagangan Berjangka.",
      underline: false,
      content: [
        "Oleh karena itu Anda harus mempelajari kegiatan Perdagangan Berjangka secara cermat sebelum memutuskan melakukan transaksi.",
      ],
    },
    {
      number: 13,
      title: "Dokumen Pemberitahuan Adanya Risiko (Risk Disclosure) ini dibuat dalam Bahasa Indonesia.",
      underline: false,
      content: [],
    },
  ];

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

  const handleCheckboxChange = (statementNumber: number) => {
    const newCheckedStatements = {
      ...checkedStatements,
      [statementNumber]: !checkedStatements[statementNumber],
    };

    setCheckedStatements(newCheckedStatements);

    const newStatementErrors = { ...statementErrors };
    if (!newCheckedStatements[statementNumber]) {
      newStatementErrors[statementNumber] = true;
    } else {
      delete newStatementErrors[statementNumber];
    }
    setStatementErrors(newStatementErrors);

    const allStatementsChecked = statements.every(
      (statement) => newCheckedStatements[statement.number] === true
    );
    const acceptanceSelected = acceptanceRadio === "ya";
    const isFormValid = allStatementsChecked && acceptanceSelected;

    if (!isFormValid) {
      setShowError(true);
    } else {
      setShowError(false);
    }
  };

  const handleAcceptanceChange = (value: string) => {
    setAcceptanceRadio(value);

    const allStatementsChecked = statements.every(
      (statement) => checkedStatements[statement.number] === true
    );
    const acceptanceSelected = value === "ya";
    const isFormValid = allStatementsChecked && acceptanceSelected;

    if (!isFormValid) {
      setShowError(true);
    } else {
      setShowError(false);
    }
  };

  const validateForm = () => {
    const allStatementsChecked = statements.every(
      (statement) => checkedStatements[statement.number] === true
    );
    const acceptanceSelected = acceptanceRadio === "ya";
    return allStatementsChecked && acceptanceSelected;
  };

  const handleNext = () => {
    if (!validateForm()) {
      setShowError(true);
      return;
    }
    router.push("/open-investment-account/additional-statement-3");
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

              <form onSubmit={(e) => e.preventDefault()} className="space-y-4 w-full min-w-0 max-w-full">
                {/* Stepper Horizontal */}
                <div className="flex items-center justify-center gap-6 mb-6 mt-2">
                  {[...Array(7)].map((_, idx) => (
                    <div key={idx} className="text-center">
                      <div
                        className={`w-8 h-8 rounded-full text-white flex items-center justify-center mx-auto mb-2 font-bold text-sm border-2 ${
                          idx === 0 || idx === 1
                            ? "bg-[#4fc3f7] border-[#4fc3f7]"
                            : "bg-gray-200 border-gray-200 text-gray-400"
                        }`}
                      >
                        <span>&#10003;</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Judul & Subjudul */}
                <div className="text-center mb-6">
                  <div className="font-semibold text-sm text-gray-900 mb-4 uppercase leading-tight">
                    DOKUMEN PEMBERITAHUAN ADANYA RISIKO YANG HARUS DISAMPAIKAN OLEH PIALANG BERJANGKA UNTUK TRANSAKSI KONTRAK DERIVATIF DALAM SISTEM PERDAGANGAN ALTERNATIF
                  </div>
                  <div className="text-xs text-gray-700 mb-6 text-justify leading-relaxed">
                    Dokumen Pemberitahuan Adanya Risiko ini disampaikan kepada Anda sesuai dengan Pasal 50 ayat (2) Undang-Undang Nomor 32 Tahun 1997 tentang Perdagangan Berjangka Komoditi sebagaimana telah diubah dengan Undang-Undang Nomor 10 Tahun 2011 tentang Perubahan Atas Undang-Undang Nomor 32 Tahun 1997 Tentang Perdagangan Berjangka Komoditi. Maksud dokumen ini adalah memberitahukan bahwa kemungkinan kerugian atau keuntungan dalam perdagangan Kontrak Derivatif dalam Sistem Perdagangan Alternatif bisa mencapai jumlah yang sangat besar. Oleh karena itu, Anda harus berhati-hati dalam memutuskan untuk melakukan transaksi, apakah kondisi keuangan Anda mencukupi.
                  </div>
                </div>

                {/* Statements dengan Checkbox */}
                <div className="space-y-4 mb-6">
                  {statements.map((item) => {
                    const hasError = statementErrors[item.number] === true;
                    return (
                      <div
                        key={item.number}
                        className={`flex items-start gap-3 ${
                          hasError ? "border border-red-500 rounded-md p-4 bg-red-50" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checkedStatements[item.number] || false}
                          onChange={() => handleCheckboxChange(item.number)}
                          className="w-4 h-4 mt-0.5 accent-[#4fc3f7] flex-shrink-0 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="mb-2">
                            <span className="text-xs font-medium text-gray-900">{item.number}.</span>
                            <span
                              className={`text-xs font-medium text-gray-900 ml-1 ${
                                item.underline ? "underline" : ""
                              }`}
                            >
                              {item.title}
                            </span>
                          </div>
                          {item.content.map((text, idx) => (
                            <div key={idx} className="text-xs text-gray-600 mb-2 text-justify leading-relaxed">
                              {text}
                            </div>
                          ))}
                          {hasError && (
                            <div className="text-xs text-red-500 mt-2 font-medium">Bagian ini diperlukan.</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Acceptance Section */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="font-medium text-xs text-gray-900 mb-4">
                    PERNYATAAN MENERIMA PEMBERITAHUAN ADANYA RISIKO
                  </div>
                  <div className="text-xs text-gray-600 mb-4">
                    Dengan mengisi kolom "YA" di bawah, saya menyatakan bahwa saya telah menerima "DOKUMEN PEMBERITAHUAN ADANYA RISIKO" mengerti dan menyetujui isinya.
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
                    disabled={!validateForm()}
                    className={`w-[36px] h-[36px] rounded-xl text-xl font-medium transition-colors flex items-center justify-center ${
                      validateForm()
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
                    disabled={true}
                    className="bg-gray-100 text-gray-400 border border-gray-200 rounded-full px-4 py-2 text-xs font-medium min-w-[130px] cursor-not-allowed transition-colors"
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
