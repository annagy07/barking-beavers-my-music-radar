import clsx from "clsx";
import Image from "next/image";

/** Text wordmark — used in the nav, footer and anywhere an image is
 * impractical (email HTML, small chips). Mirrors the pink-on-white
 * poster logo's bold condensed all-caps look with CSS instead of an
 * image, so it scales cleanly at any size. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={clsx("font-brand text-accent", className)}>
      Barking Beaver
    </span>
  );
}

/** The actual poster logo, for high-fidelity brand moments (landing hero). */
export function BrandLogoImage({
  className,
  priority,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/logo.png"
      alt="Barking Beaver"
      width={646}
      height={796}
      priority={priority}
      className={clsx("h-auto w-auto", className)}
    />
  );
}
