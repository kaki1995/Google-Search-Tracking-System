import React from 'react';

interface StudyButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export default function StudyButton({
  children,
  variant = "primary",
  onClick,
  disabled = false,
  className = ""
}: StudyButtonProps) {
  const baseClasses = "flex h-12 justify-center items-center px-6 py-3 rounded-full text-sm font-medium leading-5 tracking-[0.1px] transition-colors";

  const variantClasses = {
    primary: "bg-[#6750A4] text-white hover:bg-[#5940A3] active:bg-[#4A399C]",
    secondary: "bg-white text-black border border-[#CAC4D0] hover:bg-[#F5F5F5] active:bg-[#E0E0E0]"
  };

  const disabledClasses = disabled
    ? "opacity-50 cursor-not-allowed"
    : "cursor-pointer";

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}