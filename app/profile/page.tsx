"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api-client";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";
import Sidebar from "../components/Sidebar";

// Component untuk render profile photo dengan Authorization header
function ProfilePhotoImage({ src, alt, userInitial, token }: { src: string; alt: string; userInitial: string; token: string }) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Fetch image dengan Authorization header
    if (src && token) {
      fetch(src, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (res.ok) {
            return res.blob();
          }
          throw new Error("Failed to load image");
        })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setImageSrc(url);
          setHasError(false);
        })
        .catch(() => {
          setHasError(true);
        });
    }
  }, [src, token]);

  if (hasError || !imageSrc) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#00C2FF] to-[#00B0E6] flex items-center justify-center">
        <span className="text-4xl font-bold text-white">{userInitial}</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setHasError(true)}
    />
  );
}

interface ProfileData {
  fullName: string;
  phone: string;
  email: string;
  placeOfBirth: string;
  city: string;
  postalCode: string;
  streetName: string;
  houseNumber: string;
}

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileHovered, setProfileHovered] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userInitial, setUserInitial] = useState<string>("M");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const [formData, setFormData] = useState<ProfileData>({
    fullName: "",
    phone: "",
    email: "",
    placeOfBirth: "",
    city: "",
    postalCode: "",
    streetName: "",
    houseNumber: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProfileData, string>>>({});
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [changingPassword, setChangingPassword] = useState(false);

  // Check if user has token, redirect to login if not
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      fetchUserData(token);
    }
  }, [router]);

  // Fetch user data from API
  const fetchUserData = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl("/api/auth/me"), {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          const user = data.user;
          setUserName(user.name?.toUpperCase() || "");
          setUserInitial(user.name?.charAt(0).toUpperCase() || "M");
          
          // Set profile photo if exists
          if (user.hasProfilePhoto) {
            // Use token in URL for image src (will be handled by API)
            setProfilePhotoPreview(buildApiUrl("/api/auth/profile-photo"));
          }
          
          // Set form data - gunakan name langsung dari API
          setFormData({
            fullName: user.name || "",
            phone: user.phone || "",
            email: user.email || "",
            placeOfBirth: user.placeOfBirth || "",
            city: user.city || "",
            postalCode: user.postalCode || "",
            streetName: user.streetName || "",
            houseNumber: user.houseNumber || "",
          });
        }
      } else {
        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setErrorMessage("Gagal memuat data profil");
    } finally {
      setLoading(false);
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

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    setSuccessMessage("");
    setErrorMessage("");
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileData, string>> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Nama lengkap wajib diisi";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Nomor telepon wajib diisi";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Format email tidak valid";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(buildApiUrl("/api/auth/me"), {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage("Profil berhasil diperbarui");
        
        // Update userName if name changed
        if (data.user?.name) {
          setUserName(data.user.name.toUpperCase());
          setUserInitial(data.user.name.charAt(0).toUpperCase());
          // Update formData dengan nama yang baru dari API
          setFormData(prev => ({ ...prev, fullName: data.user.name }));
        }
        
        // Clear message after 3 seconds
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || "Gagal memperbarui profil");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("Terjadi kesalahan saat memperbarui profil");
    } finally {
      setSaving(false);
    }
  };

  const inputBase =
    "w-full px-2.5 py-2 rounded-md border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:ring-1 focus:ring-[#00C2FF]/30 focus:border-[#00C2FF]";
  const inputDisabled = "bg-gray-50 text-gray-600 cursor-not-allowed";
  const inputEditable = "bg-white";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";
  const errorClass = "mt-0.5 text-[11px] text-red-500";
  
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrorMessage("Pilih file gambar (JPG, PNG)");
        return;
      }

      // Validate file size (max 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        setErrorMessage("Ukuran file terlalu besar. Maksimal 2MB");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Upload photo immediately
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const formData = new FormData();
        formData.append("photo", file);

        const response = await fetch(buildApiUrl("/api/auth/upload-profile-photo"), {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.ok) {
          setSuccessMessage("Foto profil berhasil diupload");
          
          // Update preview with new photo URL (add timestamp to force refresh)
          if (profilePhotoPreview && profilePhotoPreview.startsWith("blob:")) {
            URL.revokeObjectURL(profilePhotoPreview);
          }
          // Use profile photo endpoint with timestamp to force refresh
          setProfilePhotoPreview(buildApiUrl(`/api/auth/profile-photo?t=${Date.now()}`));
          setProfilePhoto(null);
          
          setTimeout(() => setSuccessMessage(""), 3000);
        } else {
          const errorData = await response.json();
          setErrorMessage(errorData.error || "Gagal mengupload foto profil");
        }
      } catch (error) {
        console.error("Error uploading photo:", error);
        setErrorMessage("Terjadi kesalahan saat mengupload foto");
      } finally {
        setSaving(false);
      }
    }
    if (e.target) e.target.value = "";
  };

  const validatePassword = (password: string): boolean => {
    if (password.length < 8 || password.length > 15) {
      return false;
    }
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasLowerCase && hasUpperCase && hasNumber;
  };

  const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    if (passwordErrors[field as keyof typeof passwordErrors]) {
      setPasswordErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof passwordErrors = {};

    if (!passwordData.currentPassword.trim()) {
      newErrors.currentPassword = "Password lama wajib diisi";
    }

    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = "Password baru wajib diisi";
    } else if (!validatePassword(passwordData.newPassword)) {
      newErrors.newPassword = "Password harus 8-15 karakter, berisi huruf kecil, huruf besar, dan angka";
    }

    if (!passwordData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Konfirmasi password wajib diisi";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Password dan konfirmasi password tidak sama";
    }

    setPasswordErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setChangingPassword(true);
    setErrorMessage("");

    try {
      const response = await fetch(buildApiUrl("/api/auth/change-password"), {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setSuccessMessage("Password berhasil diubah");
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordErrors({});
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorData = await response.json();
        setPasswordErrors({ currentPassword: errorData.error || "Gagal mengubah password" });
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordErrors({ currentPassword: "Terjadi kesalahan saat mengubah password" });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm lg:text-base text-gray-500">Memuat...</p>
      </div>
    );
  }

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

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full lg:w-auto overflow-x-hidden min-h-0 bg-gray-100">
        <div className="flex-1 p-4 lg:px-8 lg:pt-0 lg:pb-0 overflow-x-hidden min-h-0 flex flex-col w-full">
          <div className="max-w-6xl mx-auto flex flex-col lg:min-h-full flex-1 w-full min-w-0">
            {/* Breadcrumb */}
            <div className="mb-4 pt-4 lg:pt-6 pl-0">
              <p className="text-xs text-gray-600">Dasbor / Profil</p>
            </div>

            {/* Page Title */}
            <div className="mb-4">
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900 tracking-tight">Profil</h1>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-green-600 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-xs text-green-800">{successMessage}</p>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-red-600 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-xs text-red-800">{errorMessage}</p>
              </div>
            )}

            {/* Profile Content - Layout dengan foto di kiri */}
            <div className="flex flex-col lg:flex-row gap-6 flex-1">
              {/* Photo Section - Left Side */}
              <div className="lg:w-80 flex-shrink-0">
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 lg:p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Foto Profil</h3>
                  <div className="flex flex-col items-center">
                    <div className="relative mb-4">
                      <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center overflow-hidden">
                        {profilePhotoPreview ? (
                          <ProfilePhotoImage 
                            src={profilePhotoPreview}
                            alt="Profile"
                            userInitial={userInitial}
                            token={localStorage.getItem("token") || ""}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#00C2FF] to-[#00B0E6] flex items-center justify-center">
                            <span className="text-4xl font-bold text-white">
                              {userInitial}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/jpeg,image/jpg,image/png";
                          input.onchange = (e) => {
                            const target = e.target as HTMLInputElement;
                            if (target.files?.[0]) {
                              handlePhotoChange({
                                target,
                              } as React.ChangeEvent<HTMLInputElement>);
                            }
                          };
                          input.click();
                        }}
                        className="absolute bottom-0 right-0 w-10 h-10 bg-[#00C2FF] rounded-full flex items-center justify-center shadow-lg hover:bg-[#00B0E6] transition-colors border-2 border-white"
                      >
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 text-center mb-4">
                      Format: JPG, PNG
                      <br />
                      Maksimal: 2MB
                    </p>
                  </div>
                  
                  {/* Edit Kata Sandi Button */}
                  <div className="pt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(true)}
                      className="min-w-[130px] px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
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
                          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                        />
                      </svg>
                      Edit Kata Sandi
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Section - Right Side */}
              <div className="flex-1 min-w-0 w-full bg-white rounded-lg overflow-x-hidden px-4 py-4 sm:px-5 sm:py-5 lg:py-6 lg:px-6 border border-gray-200 pl-4 sm:pl-5 lg:pl-6">
                <h2 className="text-base font-semibold text-gray-900 tracking-tight mb-1">Informasi Pribadi</h2>
                <p className="text-xs text-gray-500 mb-5">
                  Mohon periksa informasi Anda di bawah ini, dan perbarui jika diperlukan.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5 w-full min-w-0 max-w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                  {/* Nama Lengkap */}
                  <div>
                    <label htmlFor="fullName" className={labelClass}>
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      className={`${inputBase} ${inputEditable}`}
                      placeholder="Masukkan nama lengkap"
                    />
                    {errors.fullName && (
                      <p className={errorClass}>{errors.fullName}</p>
                    )}
                  </div>

                  {/* Tempat Lahir */}
                  <div>
                    <label htmlFor="placeOfBirth" className={labelClass}>
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      id="placeOfBirth"
                      value={formData.placeOfBirth}
                      onChange={(e) => handleInputChange("placeOfBirth", e.target.value)}
                      className={`${inputBase} ${inputEditable}`}
                      placeholder="Masukkan tempat lahir"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                  {/* Ponsel */}
                  <div>
                    <label htmlFor="phone" className={labelClass}>
                      Ponsel
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className={`${inputBase} ${inputEditable}`}
                      placeholder="Contoh: 628123456789"
                    />
                    {errors.phone && (
                      <p className={errorClass}>{errors.phone}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`${inputBase} ${inputEditable}`}
                      placeholder="email@contoh.com"
                    />
                    {errors.email && (
                      <p className={errorClass}>{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* <div className="border-t border-gray-200 my-6"></div> */}

                <h2 className="text-base font-semibold text-gray-900 tracking-tight mb-1">Informasi Alamat</h2>
                <p className="text-xs text-gray-500 mb-5">
                  Mohon lengkapi informasi alamat Anda di bawah ini.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                  {/* Kota */}
                  <div>
                    <label htmlFor="city" className={labelClass}>
                      Kota
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      className={`${inputBase} ${inputEditable}`}
                      placeholder="Masukkan kota"
                    />
                  </div>

                  {/* Kode Pos */}
                  <div>
                    <label htmlFor="postalCode" className={labelClass}>
                      Kode Pos
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange("postalCode", e.target.value)}
                      className={`${inputBase} ${inputEditable}`}
                      placeholder="Masukkan kode pos"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:min-w-0">
                  {/* Nama Jalan */}
                  <div>
                    <label htmlFor="streetName" className={labelClass}>
                      Nama Jalan
                    </label>
                    <input
                      type="text"
                      id="streetName"
                      value={formData.streetName}
                      onChange={(e) => handleInputChange("streetName", e.target.value)}
                      className={`${inputBase} ${inputEditable}`}
                      placeholder="Masukkan nama jalan"
                    />
                  </div>

                  {/* Nomor Rumah */}
                  <div>
                    <label htmlFor="houseNumber" className={labelClass}>
                      Nomor Rumah
                    </label>
                    <input
                      type="text"
                      id="houseNumber"
                      value={formData.houseNumber}
                      onChange={(e) => handleInputChange("houseNumber", e.target.value)}
                      className={`${inputBase} ${inputEditable}`}
                      placeholder="Masukkan nomor rumah"
                    />
                  </div>
                </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className={`px-4 py-2 rounded-full text-xs min-w-[130px] transition-colors border flex items-center justify-center gap-2 ${
                        saving
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 font-medium"
                          : "bg-[#4fc3f7] hover:bg-[#3db3e7] text-white cursor-pointer border-[#4fc3f7] font-bold"
                      }`}
                    >
                      {saving ? (
                        <>
                          <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        "Simpan"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </main>

      {/* WhatsApp Sticky Button */}
      <WhatsAppButton />

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ubah Kata Sandi</h3>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setPasswordErrors({});
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
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

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div>
                <label htmlFor="currentPassword" className={labelClass}>
                  Password Lama
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                  className={`${inputBase} ${inputEditable} ${passwordErrors.currentPassword ? "border-red-500" : ""}`}
                  placeholder="Masukkan password lama"
                />
                {passwordErrors.currentPassword && (
                  <p className={errorClass}>{passwordErrors.currentPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className={labelClass}>
                  Password Baru
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                  className={`${inputBase} ${inputEditable} ${passwordErrors.newPassword ? "border-red-500" : ""}`}
                  placeholder="Masukkan password baru"
                />
                {passwordErrors.newPassword && (
                  <p className={errorClass}>{passwordErrors.newPassword}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Password harus 8-15 karakter, berisi huruf kecil, huruf besar, dan angka
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className={labelClass}>
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                  className={`${inputBase} ${inputEditable} ${passwordErrors.confirmPassword ? "border-red-500" : ""}`}
                  placeholder="Konfirmasi password baru"
                />
                {passwordErrors.confirmPassword && (
                  <p className={errorClass}>{passwordErrors.confirmPassword}</p>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex flex-wrap gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setPasswordErrors({});
                  }}
                  className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-xs font-medium hover:bg-gray-50 transition-colors min-w-[130px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className={`px-4 py-2 rounded-full text-xs min-w-[130px] transition-colors border flex items-center justify-center gap-2 ${
                    changingPassword
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 font-medium"
                      : "bg-[#4fc3f7] hover:bg-[#3db3e7] text-white cursor-pointer border-[#4fc3f7] font-bold"
                  }`}
                >
                  {changingPassword ? (
                    <>
                      <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Mengubah...</span>
                    </>
                  ) : (
                    "Ubah Password"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
