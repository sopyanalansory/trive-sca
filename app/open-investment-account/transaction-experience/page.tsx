"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api-client";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import WhatsAppButton from "../../components/WhatsAppButton";

export default function TransactionExperiencePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileHovered, setProfileHovered] = useState(false);
  const [userName, setUserName] = useState("");
  const [userInitial, setUserInitial] = useState("M");

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
    return () => window.removeEventListener("resize", handleResize);
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex relative">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} profileHovered={profileHovered} setProfileHovered={setProfileHovered} userName={userName} userInitial={userInitial} activePage="accounts" />
      <main className="flex-1 flex flex-col w-full lg:w-auto overflow-x-hidden min-h-0 bg-gray-100">
        <div className="flex-1 p-4 lg:p-8 overflow-x-hidden min-h-0">
          <div className="max-w-2xl mx-auto bg-white rounded-lg border border-gray-200 p-6">
            <h1 className="text-base font-semibold text-gray-800 mb-2">Pernyataan Pengalaman Transaksi</h1>
            <p className="text-xs text-gray-600 mb-4">Step ini akan diisi konten pernyataan pengalaman transaksi.</p>
            <button type="button" onClick={() => router.push("/open-investment-account/demo-experience-statement")} className="text-xs font-medium text-[#00C2FF] hover:underline">← Kembali</button>
          </div>
        </div>
        <Footer />
      </main>
      <WhatsAppButton />
    </div>
  );
}
