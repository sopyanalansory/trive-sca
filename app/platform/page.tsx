"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api-client";
import Footer from "../components/Footer";

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
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSidebarOpen(false);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0 w-20"
        } fixed lg:static bg-[#24252c] min-h-screen flex flex-col transition-all duration-300 ease-in-out z-50 lg:z-50`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-[#334155]">
          {sidebarOpen && (
            <Link href="/accounts">
              <Image
                src="/logo.png"
                alt="Trive Invest"
                width={140}
                height={47}
                className="h-auto w-auto"
                priority
              />
            </Link>
          )}
        </div>

        {/* User Profile */}
        <button
          type="button"
          className="relative w-full p-4 border-b border-[#334155] flex items-center justify-between cursor-pointer hover:bg-[#334155] transition-colors text-left"
          onMouseEnter={() => setProfileHovered(true)}
          onMouseLeave={() => setProfileHovered(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setProfileHovered(!profileHovered);
            }
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#464857] flex items-center justify-center text-white font-semibold shrink-0">
              {userInitial}
            </div>
            {sidebarOpen && (
              <div>
                <p className="text-white text-sm font-medium">{userName || "Loading..."}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
        </button>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <Link
                href="/accounts"
                className={`flex items-center ${sidebarOpen ? "justify-between" : "justify-center"} p-3 rounded-lg text-gray-300 hover:bg-[#334155] hover:text-white transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  {sidebarOpen && (
                    <span className="text-sm font-medium">Akun</span>
                  )}
                </div>
              </Link>
            </li>
            <li>
              <span
                className={`flex items-center ${sidebarOpen ? "justify-between" : "justify-center"} p-3 rounded-lg text-gray-300 cursor-default opacity-75`}
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {sidebarOpen && (
                    <span className="text-sm font-medium">Riset</span>
                  )}
                </div>
              </span>
            </li>
            <li>
              <Link
                href="/platform"
                className={`flex items-center ${sidebarOpen ? "justify-between" : "justify-center"} p-3 rounded-lg bg-[#334155] text-white hover:bg-[#475569] transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  {sidebarOpen && (
                    <span className="text-sm font-medium">Platform</span>
                  )}
                </div>
                {sidebarOpen && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </Link>
            </li>
            <li>
              <span
                className={`flex items-center ${sidebarOpen ? "justify-between" : "justify-center"} p-3 rounded-lg text-gray-300 cursor-default opacity-75`}
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {sidebarOpen && (
                    <span className="text-sm font-medium">Partnership</span>
                  )}
                </div>
              </span>
            </li>
            <li>
              <span
                className={`flex items-center ${sidebarOpen ? "justify-between" : "justify-center"} p-3 rounded-lg text-gray-300 cursor-default opacity-75`}
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {sidebarOpen && (
                    <span className="text-sm font-medium">Program</span>
                  )}
                </div>
              </span>
            </li>
          </ul>
        </nav>

        {/* Profile Dropdown Menu - White Sidebar (Full Height) */}
        {profileHovered && sidebarOpen && (
          <div 
            className={`fixed top-0 w-64 h-screen bg-white shadow-xl z-[100] border-l border-gray-200 flex flex-col ${
              sidebarOpen ? "left-64" : "left-20"
            }`}
            onMouseEnter={() => setProfileHovered(true)}
            onMouseLeave={() => setProfileHovered(false)}
          >
            {/* Header with Close Button */}
            <div className="p-4 flex items-center justify-end">
              <button
                onClick={() => setProfileHovered(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close menu"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Menu Content */}
            <div className="flex-1 overflow-y-auto py-4">
              {/* Akun Section */}
              <div className="px-4 mb-4">
                <p className="text-sm font-semibold text-black mb-2">Akun</p>
                <span
                  className="block px-4 py-2 text-sm text-gray-400 cursor-not-allowed opacity-50 rounded"
                  onClick={(e) => e.preventDefault()}
                >
                  Akun
                </span>
                <span
                  className="block px-4 py-2 text-sm text-gray-400 cursor-not-allowed opacity-50 rounded"
                  onClick={(e) => e.preventDefault()}
                >
                  Profil
                </span>
              </div>

              {/* Bahasa Section */}
              <div className="px-4 mb-4">
                <p className="text-sm font-semibold text-black mb-2">Bahasa</p>
                <span
                  className="block px-4 py-2 text-sm text-gray-400 cursor-not-allowed opacity-50 rounded"
                  onClick={(e) => e.preventDefault()}
                >
                  Bahasa
                </span>
              </div>

              {/* Mode Gelap Toggle */}
              <div className="px-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-black">Mode Gelap</span>
                  <button
                    className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#69d7f6] focus:ring-offset-2"
                    role="switch"
                    aria-checked="false"
                  >
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
                  </button>
                </div>
                
                {/* Keluar Button */}
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    router.push("/login");
                  }}
                  className="flex items-center gap-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors mt-2 w-full text-left"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Tombol bulat biru untuk toggle sidebar - selalu ada */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed ${
          sidebarOpen 
            ? "left-64 lg:left-64" 
            : "left-0 lg:left-20"
        } top-1/2 -translate-y-1/2 ${
          sidebarOpen ? "-translate-x-1/2" : "translate-x-0 lg:-translate-x-1/2"
        } w-10 h-10 bg-[#69d7f6] rounded-full flex items-center justify-center shadow-lg hover:bg-[#5bc7e6] transition-all duration-300 z-50`}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <svg
          className="w-5 h-5 text-[#2b2c24]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {sidebarOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          )}
        </svg>
      </button>

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
    </div>
  );
}
