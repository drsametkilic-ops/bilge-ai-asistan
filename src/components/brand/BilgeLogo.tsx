import { BRAND_IMAGES } from "@/lib/brandAssets";
import { BrandMark } from "./BrandMark";
import type { SVGProps } from "react";

const clsx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(" ");

export function BilgeLogo({
  className = "",
  size = "md",
  showText = true,
  compact = false,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  /** İkon + "Bilge" / "AI" tek satır */
  compact?: boolean;
}) {
  return (
    <div className={clsx("inline-flex items-center gap-2.5", className)}>
      <BrandMark
        size={size === "sm" ? "sm" : size === "lg" ? "lg" : "md"}
        className="shadow-sm ring-1 ring-black/5"
        priority
        rounded="full"
      />
      {showText && (
        <div className={clsx("min-w-0", compact ? "flex items-baseline gap-1" : "")}>
          {compact ? (
            <>
              <span className="text-lg font-bold tracking-tight text-brand-dark">Bilge</span>
              <span className="text-lg font-semibold text-primary">AI</span>
            </>
          ) : (
            <>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">Bilge</p>
              <p
                className={clsx(
                  "font-bold leading-tight text-brand-dark",
                  size === "lg" ? "text-xl" : "text-base"
                )}
              >
                Asistan
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Inline SVG sarmalayıcı — PNG maskot (32px).
 * Modal / küçük alanlarda.
 */
export function BilgeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={32}
      height={32}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <image
        href={BRAND_IMAGES.icon}
        width="32"
        height="32"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
}
