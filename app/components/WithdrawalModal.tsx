"use client";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WithdrawalModal({ isOpen, onClose }: WithdrawalModalProps) {
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
            <h2 className="text-xl font-semibold text-black">Withdrawal</h2>
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
              {/* <div className="space-y-4">
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
              </div> */}

              {/* Right Column - Deposit Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Nasabah
                  </label>
                  <input
                    type="text"
                    className="w-full border-0 border-b border-gray-300 px-0 py-2 text-sm text-black focus:outline-none focus:border-[#69d7f6] focus:ring-0"
                    placeholder="Nama Nasabah"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dari Akun
                  </label>
                  <input
                    type="text"
                    className="w-full border-0 border-b border-gray-300 px-0 py-2 text-sm text-black focus:outline-none focus:border-[#69d7f6] focus:ring-0"
                    placeholder="Dari Akun"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarik Dana ke Bank
                  </label>
                  <input
                    type="text"
                    className="w-full border-0 border-b border-gray-300 px-0 py-2 text-sm text-black focus:outline-none focus:border-[#69d7f6] focus:ring-0"
                    placeholder="Tarik Dana ke Bank"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah (USD)
                  </label>
                  <input
                    type="number"
                    className="w-full border-0 border-b border-gray-300 px-0 py-2 text-sm text-black focus:outline-none focus:border-[#69d7f6] focus:ring-0"
                    placeholder="Jumlah (USD)"
                  />
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                  Jumlah penarikan Anda akan dikonversikan ke IDR jika rekening bank yang Anda daftarkan dalam IDR, dengan kurs konversi yang Anda pilih saat registrasi.
                  <br />
                  <br />
                  Rate: Rp10.000
                  <br />
                  <br />
                  Estimasi Nilai Konversi Penarikan Dana Anda:Rp 0
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keterangan
                  </label>
                  <textarea
                    rows={4}
                    className="w-full border-0 border-b border-gray-300 px-0 py-2 text-sm text-black focus:outline-none focus:border-[#69d7f6] focus:ring-0 resize-none"
                    placeholder="Keterangan"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    <a
                      href="https://www.triveinvest.co.id/trading/deposit-withdrawal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-black hover:text-[#4cc5e6] underline"
                    >
                      Syarat dan Ketentuan: Withdrawal
                    </a>
                  </p>
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