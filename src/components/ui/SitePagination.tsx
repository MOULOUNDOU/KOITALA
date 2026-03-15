import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SitePaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  pageKeyPrefix?: string;
}

function getVisiblePages(currentPage: number, totalPages: number): number[] {
  const firstVisiblePage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const lastVisiblePage = Math.min(totalPages, firstVisiblePage + 4);

  return Array.from(
    { length: lastVisiblePage - firstVisiblePage + 1 },
    (_, index) => firstVisiblePage + index
  );
}

export default function SitePagination({
  currentPage,
  totalPages,
  buildHref,
  pageKeyPrefix = "pagination",
}: SitePaginationProps) {
  const visiblePages = getVisiblePages(currentPage, totalPages);
  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;
  const baseButtonClass =
    "inline-flex items-center justify-center rounded-xl border font-semibold transition-all duration-300";
  const navButtonClass = "h-10 px-3 text-xs shadow-sm sm:h-11 sm:px-4 sm:text-sm";
  const activeNavClass =
    "border-[#1a3a5c] bg-[#1a3a5c] text-white hover:bg-[#102a44] hover:border-[#102a44]";
  const inactiveNavClass =
    "border-[#1a3a5c]/18 bg-white text-[#1a3a5c] hover:border-[#1a3a5c]/35 hover:bg-[#1a3a5c]/[0.06]";
  const disabledNavClass =
    "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300 shadow-none";

  return (
    <div className="mt-8">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max items-center justify-center gap-2">
        {isPrevDisabled ? (
          <span className={`${baseButtonClass} ${navButtonClass} ${disabledNavClass}`}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Précédent
          </span>
        ) : (
          <Link
            href={buildHref(currentPage - 1)}
            className={`${baseButtonClass} ${navButtonClass} ${inactiveNavClass}`}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Précédent
          </Link>
        )}

        {visiblePages.map((page) => {
          const isActive = page === currentPage;
          return (
            <Link
              key={`${pageKeyPrefix}-${page}`}
              href={buildHref(page)}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-bold transition-all duration-300 sm:h-11 sm:w-11 sm:text-sm ${
                isActive
                  ? "border-[#e8b86d] bg-[#e8b86d] text-[#0f1724] shadow-[0_10px_20px_rgba(232,184,109,0.22)]"
                  : "border-[#1a3a5c]/15 bg-white text-[#1a3a5c] hover:border-[#1a3a5c]/35 hover:-translate-y-0.5 hover:bg-[#1a3a5c]/[0.05]"
              }`}
            >
              {page}
            </Link>
          );
        })}

        {isNextDisabled ? (
          <span className={`${baseButtonClass} ${navButtonClass} ${disabledNavClass}`}>
            Suivant
            <ChevronRight className="ml-1 h-4 w-4" />
          </span>
        ) : (
          <Link
            href={buildHref(currentPage + 1)}
            className={`${baseButtonClass} ${navButtonClass} ${activeNavClass}`}
          >
            Suivant
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        )}
      </div>
      </div>
    </div>
  );
}
