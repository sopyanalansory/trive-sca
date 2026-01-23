"use client";

import { useState, useEffect } from "react";
import { buildApiUrl } from "@/lib/api-client";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Platform {
  id: number;
  accountId: string;
  loginNumber: string;
  serverName: string;
  accountType: string | null;
  clientGroupName: string | null;
  status: string;
  currency: string;
  leverage: string | null;
  swapFree: string;
}

export default function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetchPlatforms();
      // Reset form when modal opens
      setSelectedPlatform("");
      setSelectedBank("");
      setSelectedCurrency("");
      setAmount("");
      setDescription("");
      setError("");
      setSuccess("");
    }
  }, [isOpen]);

  const formatCurrency = (value: string): string => {
    // Remove all non-digit characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Split by decimal point
    const parts = numericValue.split('.');
    
    // Format the integer part with thousand separators
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    // Combine with decimal part if exists
    return parts.length > 1 ? `${integerPart},${parts[1].slice(0, 2)}` : integerPart;
  };

  const parseCurrency = (value: string): number => {
    // Remove thousand separators and replace comma with dot for decimal
    const numericString = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(numericString) || 0;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow empty string
    if (inputValue === '') {
      setAmount('');
      return;
    }
    // Format the display value
    const formatted = formatCurrency(inputValue);
    setAmount(formatted);
  };

  const fetchPlatforms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      const response = await fetch(buildApiUrl("/api/platforms"), {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlatforms(data.platforms || []);
      }
    } catch (error) {
      console.error("Error fetching platforms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!selectedPlatform) {
      setError("Pilih Akun Trading");
      return;
    }
    if (!selectedBank) {
      setError("Pilih Bank untuk transfer");
      return;
    }
    if (!selectedCurrency) {
      setError("Pilih Mata Uang");
      return;
    }
    const amountValue = parseCurrency(amount);
    if (!amount || amountValue <= 0) {
      setError("Jumlah harus lebih dari 0");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Token tidak ditemukan. Silakan login kembali.");
        return;
      }

      const response = await fetch(buildApiUrl("/api/deposit"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platformId: parseInt(selectedPlatform),
          bankName: selectedBank,
          currency: selectedCurrency,
          amount: parseCurrency(amount),
          description: description || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Deposit request berhasil dibuat");
        // Reset form
        setSelectedPlatform("");
        setSelectedBank("");
        setSelectedCurrency("");
        setAmount("");
        setDescription("");
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(data.error || "Terjadi kesalahan saat membuat deposit request");
      }
    } catch (error) {
      console.error("Error submitting deposit:", error);
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 lg:block"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        onClick={onClose}
      />
      {/* Modal - Desktop: dari kanan, Mobile: center */}
      <div className="fixed inset-0 z-50 flex items-center justify-end lg:justify-end p-0 pointer-events-none">
        <div
          className="bg-white shadow-xl w-full lg:w-[560px] h-full lg:h-full overflow-y-auto pointer-events-auto transform transition-transform duration-300 ease-out"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-black">Deposit</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
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

          {/* Modal Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Left Column - Bank Details (Read-only) */}
              <div className="space-y-4 hidden">
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor Referensi Pembayaran
                    </label>
                    <div className="relative flex items-center justify-between">
                      <p className="text-sm text-gray-700">-</p>
                      <button
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Copy"
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
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="border-b border-gray-200 pb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Bank
                    </label>
                    <p className="text-sm text-gray-700">-</p>
                  </div>
                  <div className="border-b border-gray-200 pb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cabang/Kantor
                    </label>
                    <p className="text-sm text-gray-700">-</p>
                  </div>
                  <div className="border-b border-gray-200 pb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama akun
                    </label>
                    <p className="text-sm text-gray-700">-</p>
                  </div>
                  <div className="border-b border-gray-200 pb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor Rekening
                    </label>
                    <p className="text-sm text-gray-700">-</p>
                  </div>
                  <div className="border-b border-gray-200 pb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kode Swift
                    </label>
                    <p className="text-sm text-gray-700">-</p>
                  </div>
                </div>
              </div>

              {/* Right Column - Deposit Details */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                    {success}
                  </div>
                )}
                {/* <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    Saat mentransfer dana melalui Transfer Bank, Anda WAJIB menuliskan Nomor Rekening Anda sebagai referensi.
                  </p>
                </div> */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Akun Trading
                  </label>
                  <div className="relative">
                    <select 
                      value={selectedPlatform}
                      onChange={(e) => setSelectedPlatform(e.target.value)}
                      className="w-full border-0 border-b border-gray-300 px-0 py-2 text-sm text-black focus:outline-none focus:border-[#69d7f6] focus:ring-0 appearance-none bg-transparent"
                      disabled={loading}
                    >
                      <option value="">Pilih Akun Trading</option>
                      {platforms.map((platform) => (
                        <option key={platform.id} value={platform.id.toString()}>
                          {platform.loginNumber} - {platform.accountType || platform.serverName}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank untuk transfer
                  </label>
                  <div className="relative">
                    <select 
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full border-0 border-b border-gray-300 px-0 py-2 text-sm text-black focus:outline-none focus:border-[#69d7f6] focus:ring-0 appearance-none bg-transparent"
                    >
                      <option value="">Pilih Rekening Bank</option>
                      <option value="BCA">BCA</option>
                      <option value="Mandiri">Mandiri</option>
                      <option value="BNI">BNI</option>
                      <option value="BRI">BRI</option>
                    </select>
                    <svg
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mata uang
                  </label>
                  <div className="relative">
                    <select 
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      className="w-full border-0 border-b border-gray-300 px-0 py-2 text-sm text-black focus:outline-none focus:border-[#69d7f6] focus:ring-0 appearance-none bg-transparent"
                    >
                      <option value="">Pilih Mata Uang</option>
                      <option value="USD">USD</option>
                      <option value="IDR">IDR</option>
                    </select>
                    <svg
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah
                  </label>
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    className="w-full border-0 border-b border-gray-300 px-0 py-2 text-sm text-black focus:outline-none focus:border-[#69d7f6] focus:ring-0"
                    placeholder="Jumlah"
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Penjelasan
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border-0 border-b border-gray-300 px-0 py-2 text-sm text-black focus:outline-none focus:border-[#69d7f6] focus:ring-0 resize-none"
                    placeholder="Penjelasan"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#2b2c24] text-white px-6 py-3 rounded-[400px] font-medium hover:bg-[#1a1b1c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Mengirim..." : "Kirim"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}