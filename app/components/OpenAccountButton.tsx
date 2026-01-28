"use client";

interface OpenAccountButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function OpenAccountButton({
  onClick,
  disabled = false,
  className = "",
  children = "Buka Akun",
}: OpenAccountButtonProps) {
  const baseClasses = "text-white px-5 py-2 rounded-full text-sm font-normal transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full lg:w-auto";
  const defaultClasses = "bg-[#69d7f6] hover:bg-[#5bc7e6]";
  
  // If custom className is provided, use it (must include bg and hover:bg); otherwise use default
  const finalClassName = className.trim()
    ? `${baseClasses} ${className}` 
    : `${baseClasses} ${defaultClasses}`;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={finalClassName}
    >
      {children}
    </button>
  );
}
