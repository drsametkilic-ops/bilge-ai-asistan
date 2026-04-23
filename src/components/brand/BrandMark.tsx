import { BRAND_IMAGES } from "@/lib/brandAssets";

const clsx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(" ");

const sizePx = { sm: 28, md: 36, lg: 48, xl: 88 } as const;

export function BrandMark({
  size = "md",
  className = "",
  rounded = "full",
  title = "",
  priority = false,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  /** favicon kare, sidebar daire */
  rounded?: "full" | "lg" | "xl";
  /** boş: dekoratif (yazı yanındaysa) */
  title?: string;
  /** LCP için ilk ekran görsellerinde true */
  priority?: boolean;
}) {
  const px = sizePx[size];
  return (
    <img
      src={BRAND_IMAGES.icon}
      width={px}
      height={px}
      alt={title}
      className={clsx(
        "h-auto w-auto shrink-0 object-contain",
        rounded === "full" && "rounded-full",
        rounded === "lg" && "rounded-lg",
        rounded === "xl" && "rounded-xl",
        className
      )}
      style={{ width: px, height: px, maxWidth: "100%" }}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
    />
  );
}
