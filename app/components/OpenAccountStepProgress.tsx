"use client";

import * as React from "react";

/** Langkah proses buka rekening (tanpa Verifikasi Identitas). Step 1 = Informasi Pribadi. */
export const OPEN_ACCOUNT_STEPS = [
  "Informasi Pribadi",
  "Profil Perusahaan",
  "Pernyataan Pengalaman Demo",
  "Pernyataan Pengalaman Transaksi",
  "Pernyataan Pengungkapan",
  "Aplikasi Pembukaan Rekening Transaksi Secara Elektronik Online",
  "Pernyataan Tambahan",
  "Atur Akun Anda",
] as const;

export const OPEN_ACCOUNT_TOTAL_STEPS = OPEN_ACCOUNT_STEPS.length;

interface OpenAccountStepProgressProps {
  /** Step saat ini (1-based). 1 = Informasi Pribadi. */
  currentStep: number;
  /** Judul untuk tampilan mobile (di atas progress bar). */
  mobileTitle: string;
}

export default function OpenAccountStepProgress({
  currentStep,
  mobileTitle,
}: OpenAccountStepProgressProps) {
  const totalSteps = OPEN_ACCOUNT_TOTAL_STEPS;
  const steps = OPEN_ACCOUNT_STEPS;

  return (
    <>
      {/* Desktop: sidebar step list + circular progress */}
      <div className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-gray-100 py-6 min-h-full self-stretch lg:-ml-8 lg:pl-8 pr-6">
        <div className="w-20 h-20 mx-auto mb-6 relative flex items-center justify-center">
          <svg className="w-20 h-20" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none" />
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="#ff9000"
              strokeWidth="8"
              fill="none"
              strokeDasharray={2 * Math.PI * 36}
              strokeDashoffset={2 * Math.PI * 36 * (1 - currentStep / totalSteps)}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[15px] font-semibold text-gray-800">
            {currentStep}/{totalSteps}
          </span>
        </div>
        <nav className="space-y-0.5">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep - 1;
            const isActive = idx === currentStep - 1;
            return (
              <div key={step} className="flex items-center gap-3 py-2.5">
                <span
                  className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold text-white ${
                    isCompleted ? "bg-[#4fc3f7]" : isActive ? "bg-[#ff9000]" : "bg-gray-200"
                  }`}
                >
                  {isCompleted ? "✓" : ""}
                </span>
                <span
                  className={`text-[13px] leading-snug ${
                    isActive ? "font-medium text-gray-800" : isCompleted ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Mobile: progress bar + step counter */}
      <div className="lg:hidden mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-[15px] font-semibold text-gray-800">{mobileTitle}</h1>
          <span className="text-[13px] font-medium text-gray-600">
            {currentStep}/{totalSteps}
          </span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#ff9000] rounded-full transition-all"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </>
  );
}
