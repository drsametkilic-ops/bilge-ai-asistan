import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants: Record<string, string> = {
  primary: "bg-primary text-slate-900 font-semibold shadow-sm hover:bg-primary-light",
  surface: "bg-slate-800 text-white hover:bg-slate-700",
  outline:
    "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-500",
};

export function Button({
  className = "",
  variant = "primary",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 ${variants[variant] ?? variants.primary} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
