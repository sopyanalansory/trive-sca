"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api-client";
import DepositModal from "../components/DepositModal";
import WithdrawalModal from "../components/WithdrawalModal";
import NotificationModal from "../components/NotificationModal";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";
import Sidebar from "../components/Sidebar";

// Interface untuk data slider dari API
interface SlideData {
  images: string[]; // Array of 3 image URLs
  badge?: {
    text: string;
    bgColor: string;
    textColor: string;
  };
}

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState("live");
  const [selectedAccount, setSelectedAccount] = useState("Semua akun live");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileHovered, setProfileHovered] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // Untuk mobile carousel per slide
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userInitial, setUserInitial] = useState<string>("M");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [resettingPassword, setResettingPassword] = useState<number | null>(null);
  const [notificationModal, setNotificationModal] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });
  const router = useRouter();

  // Data slider - nanti akan diisi dari API
  const [slidesData, setSlidesData] = useState<SlideData[]>([
    {
      images: [
        "/slider/SCA-KomisiKembali.jpg",
        "/slider/SCA-Spreadback.jpg",
        "/slider/SCA-Swap.jpg",
      ],
      badge: {
        text: "10 hari lagi",
        bgColor: "bg-yellow-400",
        textColor: "text-black",
      },
    },
  ]);

  // TODO: Fetch slides data from API
  // useEffect(() => {
  //   const fetchSlides = async () => {
  //     try {
  //       const response = await fetch('/api/slides');
  //       const data = await response.json();
  //       setSlidesData(data);
  //     } catch (error) {
  //       console.error('Error fetching slides:', error);
  //     }
  //   };
  //   fetchSlides();
  // }, []);

  // Check if user has token, redirect to login if not
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      // Fetch user data
      fetchUserData(token);
      // Fetch accounts
      fetchAccounts();
    }
  }, [router]);

  // Refetch accounts when tab changes
  useEffect(() => {
    fetchAccounts();
  }, [activeTab]);

  // Auto-slide untuk mobile (gambar dalam slide)
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const currentSlideData = slidesData[currentSlide];
    if (!currentSlideData || !currentSlideData.images || currentSlideData.images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => {
        const maxIndex = currentSlideData.images.length - 1;
        if (prev >= maxIndex) {
          // Jika sudah di gambar terakhir, lanjut ke slide berikutnya atau kembali ke awal
          if (currentSlide < slidesData.length - 1) {
            setCurrentSlide((prevSlide) => prevSlide + 1);
            return 0;
          } else {
            return 0; // Kembali ke gambar pertama slide pertama
          }
        }
        return prev + 1;
      });
    }, 4000); // Auto slide setiap 4 detik

    return () => clearInterval(interval);
  }, [isAutoPlaying, currentSlide, slidesData]);

  // Reset image index saat slide berubah
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [currentSlide]);

  // Touch handlers untuk swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsAutoPlaying(false); // Pause auto-play saat user swipe
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    const currentSlideData = slidesData[currentSlide];
    const maxImageIndex = currentSlideData?.images?.length ? currentSlideData.images.length - 1 : 0;

    if (isLeftSwipe) {
      // Swipe kiri: next image atau next slide
      if (currentImageIndex < maxImageIndex) {
        setCurrentImageIndex((prev) => prev + 1);
      } else if (currentSlide < slidesData.length - 1) {
        setCurrentSlide((prev) => prev + 1);
        setCurrentImageIndex(0);
      } else {
        // Kembali ke awal
        setCurrentSlide(0);
        setCurrentImageIndex(0);
      }
    }
    
    if (isRightSwipe) {
      // Swipe kanan: previous image atau previous slide
      if (currentImageIndex > 0) {
        setCurrentImageIndex((prev) => prev - 1);
      } else if (currentSlide > 0) {
        const prevSlideData = slidesData[currentSlide - 1];
        const prevMaxIndex = prevSlideData?.images?.length ? prevSlideData.images.length - 1 : 0;
        setCurrentSlide((prev) => prev - 1);
        setCurrentImageIndex(prevMaxIndex);
      } else {
        // Ke slide terakhir, gambar terakhir
        const lastSlideIndex = slidesData.length - 1;
        const lastSlideData = slidesData[lastSlideIndex];
        const lastMaxIndex = lastSlideData?.images?.length ? lastSlideData.images.length - 1 : 0;
        setCurrentSlide(lastSlideIndex);
        setCurrentImageIndex(lastMaxIndex);
      }
    }

    // Resume auto-play setelah 5 detik
    setTimeout(() => {
      setIsAutoPlaying(true);
    }, 5000);
  };

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

  // Fetch accounts from API
  const fetchAccounts = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoadingAccounts(true);
    try {
      const response = await fetch(buildApiUrl("/api/accounts"), {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      } else {
        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
        }
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Handle reset password
  const handleResetPassword = async (platformId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setResettingPassword(platformId);
    try {
      const response = await fetch(buildApiUrl("/api/accounts/reset-password"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ platformId }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotificationModal({
          isOpen: true,
          type: "success",
          title: "Berhasil",
          message: "Request reset password Anda berhasil kami terima. Silakan periksa email Anda.",
        });
      } else {
        const errorData = await response.json();
        setNotificationModal({
          isOpen: true,
          type: "error",
          title: "Gagal",
          message: errorData.error || "Gagal mengirim request reset password",
        });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setNotificationModal({
        isOpen: true,
        type: "error",
        title: "Gagal",
        message: "Terjadi kesalahan saat mengirim request reset password",
      });
    } finally {
      setResettingPassword(null);
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
        {/* Top Banner */}
        {/* <div className="bg-[#cdf0f7] px-4 lg:px-8 py-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <p className="text-black text-sm text-left">
            Anda belum memiliki akun live. Hanya butuh beberapa menit untuk membuat akun live. Mulai trading dengan Trive Invest.
          </p>
          <button className="bg-[#2b2c24] text-white px-4 lg:px-6 py-2 rounded-lg font-medium hover:bg-[#1a1b1c] transition-colors whitespace-nowrap">
            Buka Akun Live
          </button>
        </div> */}

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-8 overflow-x-hidden min-h-0">
          {/* Breadcrumb */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">Dasbor / Akun</p>
          </div>

          {/* Page Title */}
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <div className="flex items-center gap-2">
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
            {/* <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#69d7f6] w-[300px]"
            >
              <option>Semua akun live</option>
            </select> */}
          </div>

          {/* Financial Summary Cards & Account Actions */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mb-6">
          {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
              <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#69d7f6]"></div>
              {/* <p className="text-sm text-gray-600 mb-2">Ekuitas bersih</p> */}
              <p className="text-lg font-semibold text-gray-600 mb-2">Ekuitas Bersih</p>
              {/* <p className="text-2xl font-semibold text-black">$0.00</p> */}
              {/* <p className="text-lg font-semibold text-black">Memuat data...</p> */}
              <p className="text-sm text-black">Memuat data...</p>
            </div>
              <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-400"></div>
              <p className="text-lg font-semibold text-gray-600 mb-2">Profit dan Loss </p>
              {/* <p className="5 font-semibold text-black">$0.00</p> */}
              <p className="text-sm text-black">Memuat data...</p>
            </div>
              <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400"></div>
              {/* <p className="text-sm text-gray-600 mb-2">Total uang tunai yang tersedia untuk investasi</p> */}
              <p className="text-lg font-semibold text-gray-600 mb-2">Total Balance</p>
              {/* <p className="text-xl font-semibold text-black">$0.00</p> */}
              <p className="text-sm text-black">Memuat data...</p>
            </div>
          </div>

          {/* Account Actions */}
            <div className="flex flex-col gap-3">
              {/* <button className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-black hover:bg-black hover:text-white transition-colors w-[300px]">
                <span>Transfer</span>
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
              </button> */}
              <button 
                onClick={() => setDepositModalOpen(true)}
                className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-black hover:bg-black hover:text-white transition-colors w-full lg:w-[300px]"
              >
                <span>Deposit</span>
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
              </button>
              <button 
                onClick={() => setWithdrawalModalOpen(true)}
                className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-black hover:bg-black hover:text-white transition-colors w-full lg:w-[300px]">
                <span>Withdrawal</span>
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
              </button>
            </div>
          </div>

          {/* Promotional Banners Carousel */}
          <div className="mb-6 relative">
            <div 
              className="relative overflow-hidden w-full"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ 
                  transform: `translateX(-${currentSlide * 100}%)`
                }}
              >
                {slidesData.map((slide, slideIndex) => (
                  <div 
                    key={slideIndex} 
                    className="w-full shrink-0 bg-white rounded-lg shadow-sm relative"
                    style={{ minWidth: '100%' }}
                  >
                    {/* Mobile: Show single image at a time with carousel - Full width */}
                    <div className="lg:hidden relative overflow-hidden">
                      <div 
                        className="flex transition-transform duration-500 ease-in-out"
                        style={{ 
                          transform: `translateX(-${slideIndex === currentSlide ? currentImageIndex * 100 : 0}%)`
                        }}
                      >
                        {slide.images && slide.images.length > 0 ? (
                          slide.images.map((imageUrl, imageIndex) => (
                            <div key={imageIndex} className="w-full shrink-0" style={{ minWidth: '100%' }}>
                              <img
                                src={imageUrl}
                                alt={`Slide ${slideIndex + 1} - Image ${imageIndex + 1}`}
                                className="w-full h-48 md:h-64"
                              />
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-400 text-sm w-full p-4">No images available</div>
                        )}
                      </div>
                    </div>
                    {/* Desktop: Show all images side by side */}
                    <div className="hidden lg:block p-4 lg:p-6">
                      <div className="flex flex-row gap-3 lg:gap-4 justify-center items-center">
                        {slide.images && slide.images.length > 0 ? (
                          slide.images.map((imageUrl, imageIndex) => (
                            <div key={imageIndex} className="shrink-0 w-full max-w-sm lg:w-1/3">
                              <img
                                src={imageUrl}
                                alt={`Slide ${slideIndex + 1} - Image ${imageIndex + 1}`}
                                className="w-full h-40 md:h-52"
                              />
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-400 text-sm">No images available</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile: Prev/Next buttons untuk gambar dalam slide */}
            <div className="lg:hidden">
              {(() => {
                const currentSlideData = slidesData[currentSlide];
                const hasMultipleImages = currentSlideData?.images && currentSlideData.images.length > 1;
                if (!hasMultipleImages) return null;
                
                return (
                  <>
                    <button
                      onClick={() => {
                        setIsAutoPlaying(false);
                        if (currentImageIndex > 0) {
                          setCurrentImageIndex((prev) => prev - 1);
                        } else {
                          // Ke slide sebelumnya, gambar terakhir
                          if (currentSlide > 0) {
                            const prevSlideData = slidesData[currentSlide - 1];
                            const prevMaxIndex = prevSlideData?.images?.length ? prevSlideData.images.length - 1 : 0;
                            setCurrentSlide((prev) => prev - 1);
                            setCurrentImageIndex(prevMaxIndex);
                          } else {
                            // Ke slide terakhir, gambar terakhir
                            const lastSlideIndex = slidesData.length - 1;
                            const lastSlideData = slidesData[lastSlideIndex];
                            const lastMaxIndex = lastSlideData?.images?.length ? lastSlideData.images.length - 1 : 0;
                            setCurrentSlide(lastSlideIndex);
                            setCurrentImageIndex(lastMaxIndex);
                          }
                        }
                        setTimeout(() => setIsAutoPlaying(true), 5000);
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors z-10"
                      aria-label="Previous image"
                    >
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
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setIsAutoPlaying(false);
                        const maxImageIndex = currentSlideData.images.length - 1;
                        if (currentImageIndex < maxImageIndex) {
                          setCurrentImageIndex((prev) => prev + 1);
                        } else {
                          // Ke slide berikutnya, gambar pertama
                          if (currentSlide < slidesData.length - 1) {
                            setCurrentSlide((prev) => prev + 1);
                            setCurrentImageIndex(0);
                          } else {
                            // Kembali ke slide pertama, gambar pertama
                            setCurrentSlide(0);
                            setCurrentImageIndex(0);
                          }
                        }
                        setTimeout(() => setIsAutoPlaying(true), 5000);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors z-10"
                      aria-label="Next image"
                    >
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </>
                );
              })()}
            </div>
            {/* Desktop: Prev/Next buttons untuk slide */}
            {slidesData.length > 1 && (
              <div className="hidden lg:block">
                <button
                  onClick={() => setCurrentSlide((prev) => (prev === 0 ? slidesData.length - 1 : prev - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors z-10"
                  aria-label="Previous slide"
                >
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev === slidesData.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors z-10"
                  aria-label="Next slide"
                >
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Mobile: Dots untuk gambar dalam slide aktif */}
            <div className="lg:hidden flex justify-center gap-2 mt-4">
              {slidesData[currentSlide]?.images && slidesData[currentSlide].images.length > 1 && (
                slidesData[currentSlide].images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setIsAutoPlaying(false);
                      setTimeout(() => setIsAutoPlaying(true), 5000);
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      currentImageIndex === index ? "bg-[#69d7f6]" : "bg-gray-300"
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))
              )}
            </div>
            {/* Desktop: Dots untuk slide */}
            {slidesData.length > 1 && (
              <div className="hidden lg:flex justify-center gap-2 mt-4">
                {slidesData.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      currentSlide === index ? "bg-[#69d7f6]" : "bg-gray-300"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Daftar akun Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black">Daftar akun</h2>
              {/* <button className="bg-[#2b2c24] text-white px-4 lg:px-6 py-2 rounded-lg font-medium hover:bg-[#1a1b1c] transition-colors whitespace-nowrap">
                Buka Akun
              </button> */}
            </div>
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
                {/* <button
                  onClick={() => setActiveTab("demo")}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === "demo"
                      ? "text-[#69d7f6] border-b-2 border-[#69d7f6]"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Akun Demo
                </button> */}
              </div>
            </div>
            <div className="p-6">
              {loadingAccounts ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-gray-600">Memuat data...</p>
                </div>
              ) : accounts.length === 0 ? (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-sm text-yellow-800">
                    Akun Anda tidak memiliki data karena belum ada deposit yang dilakukan.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Account Type</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Platform</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Login</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ServerName</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((account) => (
                        <tr key={account.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-900">{account.accountType}</td>
                          {/* <td className="py-3 px-4 text-sm text-gray-900">{account.platform}</td> */}
                          <td className="py-3 px-4 text-sm text-gray-900">MetaTrader 5</td>
                          <td className="py-3 px-4 text-sm text-gray-900">{account.login}</td>
                          <td className="py-3 px-4 text-sm text-gray-900">TriveInvest-MT5-Live</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleResetPassword(account.id)}
                              disabled={resettingPassword === account.id}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-[#69d7f6] rounded hover:bg-[#5bc7e6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {resettingPassword === account.id ? "Mengirim..." : "Reset Password"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            </div>
          </div>

          {/* Riwayat Section */}
          {/* <div>
            <h2 className="text-lg font-semibold text-black mb-4">Riwayat</h2>
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 lg:p-6">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800">
                      Akun Anda tidak memiliki data karena belum ada deposit yang dilakukan.{" "}
                      <button className="underline font-medium hover:text-yellow-900">
                        Buka Akun Live
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div> */}
        </div>

        {/* Footer */}
        <Footer />
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

      {/* Deposit Modal */}
      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
      />


      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={withdrawalModalOpen}
        onClose={() => setWithdrawalModalOpen(false)}
      />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notificationModal.isOpen}
        onClose={() => setNotificationModal({ ...notificationModal, isOpen: false })}
        type={notificationModal.type}
        title={notificationModal.title}
        message={notificationModal.message}
      />

      {/* WhatsApp Sticky Button */}
      <WhatsAppButton />
    </div>
  );
}

