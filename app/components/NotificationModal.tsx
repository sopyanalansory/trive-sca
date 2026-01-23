"use client";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "success" | "error";
  title: string;
  message: string;
}

export default function NotificationModal({
  isOpen,
  onClose,
  type,
  title,
  message,
}: NotificationModalProps) {
  if (!isOpen) return null;

  const iconColor = type === "success" ? "text-green-600" : "text-red-600";
  const bgColor = type === "success" ? "bg-green-50" : "bg-red-50";
  const borderColor = type === "success" ? "border-green-400" : "border-red-400";

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black bg-opacity-50"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`${bgColor} border-l-4 ${borderColor} rounded-lg shadow-xl max-w-md w-full p-6 pointer-events-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-4">
            {type === "success" ? (
              <svg
                className={`w-6 h-6 ${iconColor} shrink-0 mt-0.5`}
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
            ) : (
              <svg
                className={`w-6 h-6 ${iconColor} shrink-0 mt-0.5`}
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
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {title}
              </h3>
              <p className="text-sm text-gray-700 mb-4">{message}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-[#69d7f6] rounded-lg hover:bg-[#5bc7e6] transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
