import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProductCarouselRow({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsReady(true);
        observer.disconnect();
      },
      { rootMargin: "700px 0px" },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const move = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * Math.max(rail.clientWidth * 0.82, 300),
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (!isReady || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      const rail = railRef.current;
      if (!rail || pausedRef.current) return;
      const nearEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 12;
      rail.scrollTo({
        left: nearEnd ? 0 : rail.scrollLeft + Math.max(rail.clientWidth * 0.82, 300),
        behavior: "smooth",
      });
    }, 4800);
    return () => window.clearInterval(timer);
  }, [isReady]);

  return (
    <section
      ref={sectionRef}
      id={title}
      className="sv-product-row scroll-mt-32"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onFocusCapture={() => { pausedRef.current = true; }}
      onBlurCapture={() => { pausedRef.current = false; }}
    >
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <h3 className="truncate text-xl font-bold text-white sm:text-2xl">{title}</h3>
          <span className="shrink-0 rounded-full border border-cyan-500/30 bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300">
            {count} Products
          </span>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={`Slide ${title} left`}
            onClick={() => move(-1)}
            className="sv-row-arrow"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={`Slide ${title} right`}
            onClick={() => move(1)}
            className="sv-row-arrow"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div
        ref={railRef}
        className={`sv-product-rail ${isReady ? "is-ready" : "is-loading"}`}
        aria-label={`${title} products`}
        aria-busy={!isReady}
      >
        {isReady ? children : <div className="sv-product-placeholder" aria-hidden />}
      </div>
    </section>
  );
}

export default ProductCarouselRow;