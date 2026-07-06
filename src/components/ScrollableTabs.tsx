import { useRef, useState, useEffect, type ReactNode, type TouchEvent, type MouseEvent } from 'react';
import Icon from '@/components/ui/icon';

interface ScrollableTabsProps {
  children: ReactNode;
}

export default function ScrollableTabs({ children }: ScrollableTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const touchStart = useRef({ x: 0, y: 0 });
  const suppressClick = useRef(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -120 : 120, behavior: 'smooth' });
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    const dx = Math.abs(e.touches[0].clientX - touchStart.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStart.current.y);
    if (dx > 6 || dy > 6) {
      suppressClick.current = true;
    }
  };

  const handleClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (suppressClick.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick.current = false;
    }
  };

  return (
    <div className="relative sm:static">
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-background/90 border shadow-sm sm:hidden"
        >
          <Icon name="ChevronLeft" size={16} className="text-muted-foreground" />
        </button>
      )}
      <div
        ref={scrollRef}
        className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none touch-pan-x"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onClickCapture={handleClickCapture}
      >
        {children}
      </div>
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-background/90 border shadow-sm sm:hidden"
        >
          <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
        </button>
      )}
    </div>
  );
}