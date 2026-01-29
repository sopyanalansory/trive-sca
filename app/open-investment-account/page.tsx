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

  // Handle form submission: save selection and go to step Informasi Pribadi
  const handleSubmit = () => {
    if (!hasSelectedProducts || !isConfirmed) {
      return;
    }
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "openAccountSelectedProducts",
        JSON.stringify(selectedProducts)
      );
    }
    router.push("/open-investment-account/personal-info");
  };

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
              disabled={!hasSelectedProducts || !isConfirmed}
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
