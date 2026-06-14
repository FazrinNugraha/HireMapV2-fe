import type { ReactNode } from "react";

type FeatureHeaderProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/**
 * Header standar untuk kartu fitur DSS.
 * Dipakai agar judul, aksen titik, deskripsi, dan action badge konsisten di semua card.
 */
export function FeatureHeader({
  title,
  description,
  action,
  className = "",
}: FeatureHeaderProps) {
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-3 ${className}`}
    >
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-base font-extrabold text-[#141413] md:text-lg">
          <span className="text-lg leading-none text-[#F37338]">•</span>
          {title}
        </p>
        {description && (
          <p className="mt-2 text-sm leading-6 text-[#696969]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
