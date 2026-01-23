"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api-client";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";
import Sidebar from "../components/Sidebar";

export default function PlatformPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileHovered, setProfileHovered] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userInitial, setUserInitial] = useState<string>("M");
  const router = useRouter();

  // Check if user has token, redirect to login if not
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      // Fetch user data
      fetchUserData(token);
    }
  }, [router]);

  // Fetch user data from API
  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch(buildApiUrl("/api/auth/me"), {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user && data.user.name) {
          setUserName(data.user.name.toUpperCase());
          // Get first letter of name for initial
          const initial = data.user.name.charAt(0).toUpperCase();
          setUserInitial(initial);
        }
      } else {
        // If token is invalid, redirect to login
        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // Set initial sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    // Listen for resize events
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-white flex relative">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        profileHovered={profileHovered}
        setProfileHovered={setProfileHovered}
        userName={userName}
        userInitial={userInitial}
        activePage="platform"
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full lg:w-auto overflow-x-hidden bg-white">
        <div className="flex-1 p-4 lg:p-8 overflow-x-hidden min-h-0">
          {/* Breadcrumb */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">Dasbor / Platform</p>
          </div>

          {/* Page Title */}
          <div className="mb-4 lg:mb-6">
            <h1 className="text-2xl lg:text-3xl font-semibold text-black">Platform</h1>
          </div>

          {/* Download Section */}
          <div className="max-w-4xl mx-auto">
            {/* Main Heading */}
            <h2 className="text-3xl lg:text-4xl font-bold text-black text-center mb-4">
              Download dan Mulai Trading Sekarang
            </h2>

            {/* Description */}
            <p className="text-base lg:text-lg text-black text-center mb-6">
              Ambil kesempatan Anda sekarang. Tidak semua trader berhasil dengan gaya trading yang sama.
            </p>

            {/* Server Name */}
            <div className="text-center mb-8">
              <p className="text-base lg:text-lg text-black">
                <span className="font-normal">Nama Server : </span>
                <span className="font-semibold">TriveInvest-MT5-Live</span>
              </p>
            </div>

            {/* Download Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Windows Button */}
              <a
                href="https://download.mql5.com/cdn/web/22794/mt5/triveinvest5setup.exe"
                download
                className="flex items-center gap-3 bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-3 shadow-sm transition-colors text-black font-medium"
              >
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .15V5.21L20 3zM3 13l6 .09v7.81l-6-1.15V13zm17 .25V22l-10-1.78v-7.03l10 .06z"/>
                </svg>
                <span className="text-sm lg:text-base">Download MT5 untuk Windows</span>
              </a>

              {/* macOS Button */}
              <a
                href="https://download.mql5.com/cdn/mobile/mt5/ios?server=TriveInvest-MT5-Live"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-3 shadow-sm transition-colors text-black font-medium"
              >
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span className="text-sm lg:text-base">Download MT5 untuk macOS</span>
              </a>

              {/* iOS Button */}
              <a
                href="https://download.mql5.com/cdn/mobile/mt5/ios?server=TriveInvest-MT5-Live"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-3 shadow-sm transition-colors text-black font-medium"
              >
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span className="text-sm lg:text-base">Download MT5 untuk iOS</span>
              </a>

              {/* Android Button */}
              <a
                href="https://download.mql5.com/cdn/mobile/mt5/android?server=TriveInvest-MT5-Live"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-3 shadow-sm transition-colors text-black font-medium"
              >
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997 0-.5511.4482-.9993.9993-.9993.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997 0-.5511.4482-.9993.9993-.9993.551 0 .9993.4482.9993.9993 0 .5511-.4483.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C18.0982 8.0029 17.9979 8 17.8927 8H6.1073c-.1052 0-.2055.0029-.3048.0086L3.7802 4.5054a.4157.4157 0 00-.5676-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 9.451 1.9998 10.6484 1.9998 12v4c0 .549.4448 1 1 1h18c.5552 0 1-.451 1-1v-4c0-1.3516-.6891-2.549-1.7305-3.6786m-4.8687 1.6786H6.3932c.1588.5306.4317 1.0186.7993 1.4314.5511.6206 1.2979 1.0006 2.1075 1.0006s1.5564-.38 2.1075-1.0006c.3676-.4128.6405-.9008.7993-1.4314z"/>
                </svg>
                <span className="text-sm lg:text-base">Download MT5 untuk Android</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </main>

      {/* WhatsApp Sticky Button */}
      <WhatsAppButton />
    </div>
  );
}
