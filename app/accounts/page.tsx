"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState("live");
  const [selectedAccount, setSelectedAccount] = useState("Semua akun live");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileHovered, setProfileHovered] = useState(false);
  const router = useRouter();

  // Check if user has token, redirect to login if not
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

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
    <div className="min-h-screen bg-[#f5f5f5] flex relative">
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
              M
            </div>
            {sidebarOpen && (
              <div>
                <p className="text-white text-sm font-medium">MOHAMMAD SOPYAN</p>
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
              <Link
                href="/research"
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {sidebarOpen && (
                    <span className="text-sm font-medium">Riset</span>
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
              <Link
                href="/platform"
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
              <Link
                href="/partnership"
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {sidebarOpen && (
                    <span className="text-sm font-medium">Partnership</span>
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
              <Link
                href="/program"
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
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {sidebarOpen && (
                    <span className="text-sm font-medium">Program</span>
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
          </ul>
        </nav>

        {/* Profile Dropdown Menu - White Sidebar (Full Height) */}
        {profileHovered && sidebarOpen && (
        // {true && (
          <div 
            className={`fixed top-0 w-64 h-screen bg-white shadow-xl z-[100] border-l border-gray-200 flex flex-col ${
              sidebarOpen ? "left-64" : "left-20"
            }`}
            onMouseEnter={() => setProfileHovered(true)}
            onMouseLeave={() => setProfileHovered(false)}
          >
            {/* Header with Close Button */}
            <div className="p-4 flex items-center justify-end">
              {/* <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#464857] flex items-center justify-center text-white font-semibold shrink-0">
                  M
                </div>
                <div>
                  <p className="text-black text-sm font-semibold">MOHAMMAD SOPYAN</p>
                  <p className="text-gray-500 text-xs">sopyan@example.com</p>
                </div>
              </div> */}
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
                <Link
                  href="/accounts"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  Akun
                </Link>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  Profil
                </Link>
              </div>

              {/* Bahasa Section */}
              <div className="px-4 mb-4">
                <p className="text-sm font-semibold text-black mb-2">Bahasa</p>
                <Link
                  href="/language"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  Bahasa
                </Link>
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
      <main className="flex-1 flex flex-col w-full lg:w-auto">
        {/* Top Banner */}
        <div className="bg-[#cdf0f7] px-4 lg:px-8 py-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <p className="text-black text-sm text-left">
            Anda belum memiliki akun live. Hanya butuh beberapa menit untuk membuat akun live. Mulai trading dengan Trive Invest.
          </p>
          <button className="bg-[#2b2c24] text-white px-4 lg:px-6 py-2 rounded-lg font-medium hover:bg-[#1a1b1c] transition-colors whitespace-nowrap">
            Buka Akun Live
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-8">
          {/* Breadcrumb */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">Dasbor / Akun</p>
          </div>

          {/* Page Title */}
          <div className="flex items-center gap-2 mb-4 lg:mb-6">
            <h1 className="text-2xl lg:text-3xl font-semibold text-black">Akun</h1>
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm">
              <p className="text-sm text-gray-600 mb-2">Ekuitas bersih</p>
              <p className="text-2xl font-semibold text-black">$0.00</p>
            </div>
            <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm">
              <p className="text-sm text-gray-600 mb-2">Keuntungan dan kerugian harian</p>
              <p className="text-2xl font-semibold text-black">$0.00</p>
            </div>
            <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm">
              <p className="text-sm text-gray-600 mb-2">Total uang tunai yang tersedia untuk investasi</p>
              <p className="text-2xl font-semibold text-black">$0.00</p>
            </div>
          </div>

          {/* Account Actions */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-4 mb-6">
            <div className="flex-1 w-full">
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#69d7f6]"
              >
                <option>Semua akun live</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
              <button className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-black hover:bg-gray-50 transition-colors">
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
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                Transfer
              </button>
              <button className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-black hover:bg-gray-50 transition-colors">
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Deposit
              </button>
              <button className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-black hover:bg-gray-50 transition-colors">
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
                Withdrawal
              </button>
            </div>
          </div>

          {/* Promotional Banners Carousel */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Banner 1 */}
              <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm relative">
                <div className="absolute top-4 right-4 bg-yellow-400 text-black text-xs px-2 py-1 rounded">
                  374 hari lagi
                </div>
                <div className="mb-4">
                  <Image
                    src="/logo.svg"
                    alt="Trive Invest"
                    width={120}
                    height={40}
                    className="h-auto"
                  />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  Dapatkan Kembali Biaya Komisi saat Anda Melakukan Deposit.
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Trading forex tanpa komisi dengan deposit $1 untuk 1 lot komisi kembali.
                </p>
                <button className="bg-[#69d7f6] text-[#2b2c24] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5bc7e6] transition-colors">
                  Deposit Sekarang
                </button>
              </div>

              {/* Banner 2 */}
              <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm relative">
                <div className="absolute top-4 right-4 bg-yellow-400 text-black text-xs px-2 py-1 rounded">
                  24 hari lagi
                </div>
                <div className="mb-4">
                  <Image
                    src="/logo.svg"
                    alt="Trive Invest"
                    width={120}
                    height={40}
                    className="h-auto"
                  />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  Ajukan Perubahan Leverage Tinggi dengan Berbagai Pilihan Auto-Cut
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Pilih leverage dan auto-cut yang sesuai dengan kebutuhan trading Anda.
                </p>
              </div>

              {/* Banner 3 */}
              <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm relative">
                <div className="absolute top-4 right-4 bg-yellow-400 text-black text-xs px-2 py-1 rounded">
                  9 hari lagi
                </div>
                <div className="mb-4">
                  <Image
                    src="/logo.svg"
                    alt="Trive Invest"
                    width={120}
                    height={40}
                    className="h-auto"
                  />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  Fleksibilitas Trading di Akun Bebas Swap
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Bandingkan keuntungan akun swap dan akun bebas swap.
                </p>
                <button className="bg-[#69d7f6] text-[#2b2c24] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5bc7e6] transition-colors">
                  Aktifkan Akun Bebas Swap
                </button>
              </div>
            </div>
          </div>

          {/* Account List Section */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("live")}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === "live"
                      ? "text-[#69d7f6] border-b-2 border-[#69d7f6]"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Akun Live
                </button>
                <button
                  onClick={() => setActiveTab("demo")}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === "demo"
                      ? "text-[#69d7f6] border-b-2 border-[#69d7f6]"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Akun Demo
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Akun Anda tidak memiliki data karena belum ada deposit yang
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Buttons */}
      {/* <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <button className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors">
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982a.524.524 0 01-.656-.68l.985-3.74-.214-.361a9.87 9.87 0 01-1.378-5.03c0-5.45 4.436-9.884 9.884-9.884 2.64 0 5.123 1.03 6.979 2.898a9.825 9.825 0 012.897 6.98c0 5.45-4.436 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.16 11.892c0 2.096.547 4.142 1.588 5.945L.05 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.89-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </button>
        <button className="w-14 h-14 bg-[#1e293b] rounded-full flex items-center justify-center shadow-lg hover:bg-[#334155] transition-colors">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
        <button className="bg-[#69d7f6] text-[#2b2c24] px-6 py-3 rounded-full font-medium shadow-lg hover:bg-[#5bc7e6] transition-colors">
          Buka Akun
        </button>
      </div> */}
    </div>
  );
}

