"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api-client";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";
import OpenAccountButton from "../components/OpenAccountButton";

export default function OpenInvestmentAccountPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileHovered, setProfileHovered] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userInitial, setUserInitial] = useState<string>("M");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [checkingProgress, setCheckingProgress] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<{
    spa: string[];
    multilateral: string[];
  }>({
    spa: [],
    multilateral: [],
  });
  const router = useRouter();

  const spaProducts = [
    "Akun Forex & Precious Metal",
    "Akun Gulir Index & Oil",
    "Akun Index",
    "Akun CFD",
  ];

  const multilateralProducts = ["Akun Komoditi Berjangka"];

  const hasSelectedProducts =
    selectedProducts.spa.length > 0 ||
    selectedProducts.multilateral.length > 0;

  // Step index -> path untuk resume (skip 0 = halaman ini)
  const stepToPath: Record<number, string> = {
    1: "/open-investment-account/personal-info",
    2: "/open-investment-account/company-profile",
    3: "/open-investment-account/demo-experience-statement",
    4: "/open-investment-account/transaction-experience",
    5: "/open-investment-account/disclosure-statement",
    6: "/open-investment-account/account-opening-form",
    7: "/open-investment-account/emergency-contact-form",
    8: "/open-investment-account/employment-form",
    9: "/open-investment-account/wealth-list-form",
    10: "/open-investment-account/account-bank-form",
    11: "/open-investment-account/additional-statement",
    12: "/open-investment-account/atur-akun",
  };

  // Check if user has token, redirect to login if not; fetch user + existing application for resume
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchUserData(token);
    checkProgressAndResume(token);
  }, [router]);

  const checkProgressAndResume = async (token: string) => {
    try {
      const res = await fetch(buildApiUrl("/api/investment-account"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        setCheckingProgress(false);
        return;
      }
      const json = await res.json();
      const app = json.application;
      if (!app || app.status === "submitted") {
        setCheckingProgress(false);
        return;
      }
      const step = app.currentStep ?? 0;
      // Sudah selesai step tertentu → tampilkan step berikutnya
      if (step >= 1) {
        const nextStep = step < 12 ? step + 1 : step;
        const path = stepToPath[nextStep];
        if (path) {
          router.replace(path);
          return;
        }
      }
      if (step === 0 && app.selectedProducts && (app.selectedProducts.spa?.length > 0 || app.selectedProducts.multilateral?.length > 0)) {
        setSelectedProducts({
          spa: app.selectedProducts.spa ?? [],
          multilateral: app.selectedProducts.multilateral ?? [],
        });
      }
      setCheckingProgress(false);
    } catch (_) {
      setCheckingProgress(false);
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

  // Handle form submission: simpan ke backend lalu ke Informasi Pribadi
  const [saving, setSaving] = useState(false);
  const handleSubmit = async () => {
    if (!hasSelectedProducts || !isConfirmed) return;
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(buildApiUrl("/api/investment-account"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ step: 0, data: selectedProducts }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Gagal menyimpan produk:", err);
        setSaving(false);
        return;
      }
      if (typeof window !== "undefined") {
        sessionStorage.setItem("openAccountSelectedProducts", JSON.stringify(selectedProducts));
      }
      router.push("/open-investment-account/personal-info");
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  if (checkingProgress) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 border-2 border-[#00C2FF] border-t-transparent rounded-full animate-spin"
            aria-hidden
          />
          <p className="text-sm text-gray-600">Memeriksa progres pembukaan akun...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex relative">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        profileHovered={profileHovered}
        setProfileHovered={setProfileHovered}
        userName={userName}
        userInitial={userInitial}
        activePage="accounts"
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full lg:w-auto overflow-x-hidden">
        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-8 overflow-x-hidden min-h-0">
          {/* Page Title */}
          <div className="mb-3">
            <h1 className="text-sm lg:text-base font-semibold text-gray-600 text-center">
              Produk mana yang Anda Minati?
            </h1>
          </div>

          {/* Product Selection Cards */}
          <div className="max-w-md mx-auto space-y-3 mb-3">
            {/* SPA Product Card */}
            <div className="bg-white rounded-lg border-[#00C2FF] p-6" style={{ borderWidth: '1.5px', borderStyle: 'solid' }}>
              {/* SPA Checkbox and Label */}
              <div className="flex items-center gap-2 mb-0.5">
                <input
                  type="checkbox"
                  id="spa-main"
                  checked={selectedProducts.spa.length === spaProducts.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProducts({
                        spa: [...spaProducts],
                        multilateral: [],
                      });
                    } else {
                      setSelectedProducts({
                        spa: [],
                        multilateral: [],
                      });
                    }
                  }}
                  className="w-4 h-4 accent-[#00C2FF] cursor-pointer"
                />
                <label
                  htmlFor="spa-main"
                  className="text-sm font-semibold text-[#00C2FF] cursor-pointer"
                >
                  SPA
                </label>
              </div>

              {/* SPA Products */}
              <div className="flex flex-col gap-0.5 ml-6">
                {spaProducts.map((product, index) => (
                  <label
                    key={index}
                    htmlFor={`spa-${index}`}
                    className="text-sm text-gray-800 cursor-pointer"
                  >
                    {product}
                  </label>
                ))}
              </div>
            </div>

            {/* MULTILATERAL Product Card */}
            <div className="bg-white rounded-lg border-[#00C2FF] p-6" style={{ borderWidth: '1.5px', borderStyle: 'solid' }}>
              {/* MULTILATERAL Checkbox and Label */}
              <div className="flex items-center gap-2 mb-0.5">
                <input
                  type="checkbox"
                  id="multilateral-main"
                  checked={
                    selectedProducts.multilateral.length ===
                    multilateralProducts.length
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProducts({
                        multilateral: [...multilateralProducts],
                        spa: [],
                      });
                    } else {
                      setSelectedProducts({
                        multilateral: [],
                        spa: [],
                      });
                    }
                  }}
                  className="w-4 h-4 accent-[#00C2FF] cursor-pointer"
                />
                <label
                  htmlFor="multilateral-main"
                  className="text-sm font-semibold text-[#00C2FF] cursor-pointer"
                >
                  MULTILATERAL
                </label>
              </div>

              {/* MULTILATERAL Products */}
              <div className="flex flex-col gap-0.5 ml-6">
                {multilateralProducts.map((product, index) => (
                  <label
                    key={index}
                    htmlFor={`multilateral-${index}`}
                    className="text-sm text-gray-800 cursor-pointer"
                  >
                    {product}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox - Show only when products are selected */}
          {hasSelectedProducts && (
            <div className="max-w-md mx-auto mb-4">
              <div className="flex items-start gap-2 py-2">
                <input
                  type="checkbox"
                  id="confirmation"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="w-4 h-4 accent-[#00C2FF] mt-0.5 flex-shrink-0 cursor-pointer"
                />
                <label
                  htmlFor="confirmation"
                  className="text-xs text-gray-800 cursor-pointer leading-relaxed"
                >
                  Saya mengonfirmasi bahwa saya telah membaca dan memahami{" "}
                  <a
                    href="#"
                    className="text-[#00C2FF] underline"
                    onClick={(e) => {
                      e.preventDefault();
                      // Add logic to open terms and conditions
                      console.log("Open Ketentuan Bisnis");
                    }}
                  >
                    Ketentuan Bisnis
                  </a>
                </label>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="max-w-md mx-auto flex justify-center">
            <OpenAccountButton
              onClick={handleSubmit}
              disabled={!hasSelectedProducts || !isConfirmed || saving}
            />
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
