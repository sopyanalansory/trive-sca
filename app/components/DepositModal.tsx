"use client";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DepositModal({ isOpen, onClose }: DepositModalProps) {
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
          className="bg-white shadow-xl w-full lg:w-[1120px] h-full lg:h-full overflow-y-auto pointer-events-auto transform transition-transform duration-300 ease-out"
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Bank Details (Read-only) */}
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor Referensi Pembayaran
                    </label>
                    <div className="relative flex items-center justify-between">
                      <p className="text-sm text-white">-</p>
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
                    <p className="text-sm text-white">-</p>
                  </div>
                  <div className="border-b border-gray-200 pb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cabang/Kantor
                    </label>
                    <p className="text-sm text-white">-</p>
                  </div>
                  <div className="border-b border-gray-200 pb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama akun
                    </label>
                    <p className="text-sm text-white">-</p>
                  </div>
                  <div className="border-b border-gray-200 pb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor Rekening
                    </label>
                    <p className="text-sm text-white">-</p>
                  </div>
                  <div className="border-b border-gray-200 pb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kode Swift
                    </label>
                    <p className="text-sm text-white">-</p>
                  </div>
                </div>
              </div>

              {/* Right Column - Deposit Details */}
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    Saat mentransfer dana melalui Transfer Bank, Anda WAJIB menuliskan Nomor Rekening Anda sebagai referensi.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Akun Trading
                  </label>
                  <div className="relative">
                    <select className="w-full border-0 border-b border-gray-300 px-0 py-2 text-sm text-black focus:outline-none focus:border-[#69d7f6] focus:ring-0 appearance-none bg-transparent">
                      <option>Pilih Akun Trading</option>
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
                    Rekening Bank Terpisah untuk Deposit
                  </label>
                  <div className="relative">
                    <select className="w-full border-0 border-b border-gray-300 px-0 py-2 text-sm text-black focus:outline-none focus:border-[#69d7f6] focus:ring-0 appearance-none bg-transparent">
                      <option>Pilih Rekening Bank</option>
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
                    <select className="w-full border-0 border-b border-gray-300 px-0 py-2 text-sm text-black focus:outline-none focus:border-[#69d7f6] focus:ring-0 appearance-none bg-transparent">
                      <option>Pilih Mata Uang</option>
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
                    type="number"
                    className="w-full border-0 border-b border-gray-300 px-0 py-2 text-sm text-black focus:outline-none focus:border-[#69d7f6] focus:ring-0"
                    placeholder="Jumlah"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Penjelasan
                  </label>
                  <textarea
                    rows={4}
                    className="w-full border-0 border-b border-gray-300 px-0 py-2 text-sm text-black focus:outline-none focus:border-[#69d7f6] focus:ring-0 resize-none"
                    placeholder="Penjelasan"
                  />
                </div>
                <button className="w-full bg-[#2b2c24] text-white px-6 py-3 rounded-[400px] font-medium hover:bg-[#1a1b1c] transition-colors">
                  Kirim
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}