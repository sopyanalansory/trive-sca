"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api-client";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import WhatsAppButton from "../../components/WhatsAppButton";
import OpenAccountStepProgress from "../../components/OpenAccountStepProgress";

export default function SuccessPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileHovered, setProfileHovered] = React.useState(false);
  const [userName, setUserName] = React.useState("");
  const [userInitial, setUserInitial] = React.useState("M");

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

  const handleClose = () => {
    router.push("/accounts");
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
        <div className="flex-1 p-4 lg:px-8 lg:pt-0 lg:pb-0 overflow-x-hidden min-h-0 flex flex-col w-full">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:gap-12 lg:min-h-full flex-1 w-full min-w-0 open-account-content-wrap">
            <OpenAccountStepProgress currentStep={9} mobileTitle="Selamat" />

            <div className="flex-1 min-w-0 w-full bg-white rounded-lg overflow-hidden px-4 py-4 sm:px-5 sm:py-5 lg:py-6 lg:px-6 open-account-form-card">
              <h2 className="text-base font-semibold text-gray-900 tracking-tight mb-1">
                Selamat!
              </h2>
              <h3 className="text-sm font-normal text-gray-900 mb-6 leading-relaxed">
                Anda telah berhasil menyelesaikan aplikasi Anda untuk mendapatkan akun live.
              </h3>

              <div className="text-xs text-gray-600 leading-relaxed mb-6 space-y-5">
                <p>
                  Terima kasih atas kepercayaan Anda pada Trive Invest dan Anda akan segera mulai mengakses semua produk, layanan, dan program kami.
                </p>
                <p>
                  Satu langkah terakhir: Sesuai dengan peraturan yang diwajibkan di Indonesia, kami perlu menghubungi Anda melalui telepon untuk verifikasi identitas Anda dan memberikan informasi peraturan tentang akun Anda. Setelah panggilan ini, akun live Anda akan disiapkan dalam beberapa menit dan Anda akan dapat melakukan deposit dan memulai trading.
                </p>
                <p>
                  Customer Success Team Anda (Akun Manager Anda dan Wakil Pialang Berjangka) akan segera menghubungi Anda untuk verifikasi identitas dan memahami kebutuhan Anda, melalui panggilan telepon (
                  <a href="tel:150898" className="text-[#4fc3f7] hover:underline">
                    150 898
                  </a>
                  ) dan{" "}
                  <a
                    href="https://wa.me/628881683000"
                    className="text-[#4fc3f7] hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp (+62-888-168-3000)
                  </a>
                  .
                </p>
                <p>
                  Hubungi Akun Manager Anda:{" "}
                  <a
                    href="https://wa.me/628881683000"
                    className="text-[#4fc3f7] hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    +62 888 168 3000 (WhatsApp)
                  </a>
                  <br />
                  Customer Support 5/24:{" "}
                  <a
                    href="https://wa.me/628815921000"
                    className="text-[#4fc3f7] hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    +62 881 592 1000 (WhatsApp)
                  </a>
                  <br />
                  Call 5/24:{" "}
                  <a href="tel:150898" className="text-[#4fc3f7] hover:underline">
                    150 898
                  </a>
                  <br />
                  E-mail:{" "}
                  <a
                    href="mailto:support@triveinvest.co.id"
                    className="text-[#4fc3f7] hover:underline"
                  >
                    support@triveinvest.co.id
                  </a>
                </p>
                <p>
                  Hormat kami
                  <br />
                  <span className="font-semibold">PT Trive Invest Futures</span>
                </p>
              </div>

              <div className="flex justify-center lg:justify-start pt-2">
                <button
                  onClick={handleClose}
                  className="bg-[#4fc3f7] hover:bg-[#3db3e7] text-white px-4 py-2 rounded-full text-xs font-bold transition-colors min-w-[130px] border border-[#4fc3f7] cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>

      <WhatsAppButton />
    </div>
  );
}
