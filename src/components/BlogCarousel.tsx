import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const BLOG_API = 'https://functions.poehali.dev/24adc9a7-714f-4df9-a6b0-3874d99d1577';

interface PostPreview {
  id: number;
  slug: string;
  title: string;
  metaDescription: string;
  topic: string;
  publishedAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

const EMOJI_MAP: Array<{ keywords: string[]; emojis: string[] }> = [
  { keywords: ['реферальн', 'рекоменд'], emojis: ['🤝', '👥', '🔗', '💬', '🎯'] },
  { keywords: ['рекрутинг', 'рекрутер', 'подбор'], emojis: ['🔍', '🎯', '📋', '🧩', '🕵️'] },
  { keywords: ['найм', 'нанима', 'вакансии', 'вакансия'], emojis: ['📌', '💼', '📝', '🗂️', '📂'] },
  { keywords: ['собеседован', 'интервью'], emojis: ['🎤', '💬', '🤔', '📊', '🗣️'] },
  { keywords: ['онбординг', 'адаптац', 'новичк'], emojis: ['🚀', '🌱', '👋', '🗺️', '🎒'] },
  { keywords: ['удержан', 'текучк', 'лояльност'], emojis: ['🏆', '💎', '⚓', '🛡️', '❤️'] },
  { keywords: ['мотивац', 'вовлечённ', 'вовлечен'], emojis: ['🔥', '⚡', '💪', '🌟', '🎮'] },
  { keywords: ['аналитик', 'метрик', 'kpi', 'данн'], emojis: ['📊', '📈', '🔢', '📉', '🧮'] },
  { keywords: ['бренд', 'evp', 'репутац'], emojis: ['✨', '💫', '🏅', '🎖️', '🌐'] },
  { keywords: ['автоматизац', 'технолог', 'цифров', 'ии', 'искусственн'], emojis: ['🤖', '⚙️', '💡', '🖥️', '🔧'] },
  { keywords: ['выплат', 'бонус', 'зарплат', 'деньг'], emojis: ['💰', '💵', '🤑', '💳', '🏦'] },
  { keywords: ['геймификац', 'игр', 'рейтинг'], emojis: ['🎮', '🏆', '🎲', '⭐', '🥇'] },
  { keywords: ['стартап', 'малый бизнес', 'бизнес'], emojis: ['🚀', '💡', '🌱', '⚡', '🎯'] },
  { keywords: ['it', 'разработчик', 'программист', 'технич'], emojis: ['💻', '👨‍💻', '⌨️', '🖥️', '🔬'] },
  { keywords: ['ритейл', 'торговл', 'магазин'], emojis: ['🛒', '🏪', '🛍️', '📦', '💳'] },
  { keywords: ['производств', 'завод', 'фабрик'], emojis: ['🏭', '⚙️', '🔩', '🛠️', '👷'] },
  { keywords: ['обучен', 'развити', 'карьер', 'навык'], emojis: ['📚', '🎓', '📖', '🧠', '✏️'] },
  { keywords: ['команд', 'коллектив', 'корпоратив'], emojis: ['👫', '🤜', '🏃', '💼', '🌍'] },
  { keywords: ['ошибк', 'проблем', 'сложност'], emojis: ['⚠️', '🚧', '🔍', '💡', '🛠️'] },
  { keywords: ['совет', 'лайфхак', 'практик'], emojis: ['💡', '✅', '📌', '🎯', '🔑'] },
];

const emojiCache = new Map<string, string>();

function getPostEmoji(title: string, topic: string, id: number): string {
  const key = String(id);
  if (emojiCache.has(key)) return emojiCache.get(key)!;
  const text = (title + ' ' + topic).toLowerCase();
  for (const { keywords, emojis } of EMOJI_MAP) {
    if (keywords.some(kw => text.includes(kw))) {
      const emoji = emojis[id % emojis.length];
      emojiCache.set(key, emoji);
      return emoji;
    }
  }
  const fallback = ['📝', '💼', '🎯', '🔍', '📋', '✨', '🚀', '💡', '📊', '🤝'];
  const emoji = fallback[id % fallback.length];
  emojiCache.set(key, emoji);
  return emoji;
}

export default function BlogCarousel() {
  const [posts, setPosts] = useState<PostPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const dragDelta = useRef(0);
  const isDragging = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BLOG_API}?action=list&page=1&per_page=6`)
      .then(r => r.json())
      .then(d => {
        const raw: PostPreview[] = d.posts || [];
        const seen = new Set<string>();
        setPosts(raw.filter(p => {
          const key = p.slug || p.title;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }));
      })
      .finally(() => setLoading(false));
  }, []);

  const total = posts.length;
  const visibleCount = () => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  };

  const maxIndex = Math.max(0, total - visibleCount());

  const prev = () => setActiveIndex(i => Math.max(0, i - 1));
  const next = () => setActiveIndex(i => Math.min(maxIndex, i + 1));

  // Drag/swipe — без setPointerCapture, чтобы не блокировать клики по Link
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragDelta.current = 0;
    startX.current = e.clientX;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    dragDelta.current = e.clientX - startX.current;
  };
  const onMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (dragDelta.current < -40) next();
    else if (dragDelta.current > 40) prev();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    dragDelta.current = 0;
    startX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - startX.current;
    if (diff < -40) next();
    else if (diff > 40) prev();
  };

  const onCardClick = (e: React.MouseEvent, slug: string) => {
    if (Math.abs(dragDelta.current) > 10) return;
    navigate(`/blog/${slug}`);
  };

  if (loading) {
    return (
      <section className="py-12 sm:py-16 px-3 sm:px-4 lg:px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!posts.length) return null;

  const cardWidthPct = 100 / visibleCount();

  return (
    <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 lg:px-6 bg-white">
      <div className="container mx-auto max-w-6xl">

        {/* Header */}
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm">
              📝 Блог
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              Полезные статьи
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Советы по найму, HR-трендам и управлению командой
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={prev}
              disabled={activeIndex === 0}
              aria-label="Предыдущие статьи"
            >
              <Icon name="ChevronLeft" size={18} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={next}
              disabled={activeIndex >= maxIndex}
              aria-label="Следующие статьи"
            >
              <Icon name="ChevronRight" size={18} />
            </Button>
          </div>
        </div>

        {/* Carousel track */}
        <div
          className="overflow-hidden select-none"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            ref={trackRef}
            className="flex transition-transform duration-400 ease-in-out"
            style={{ transform: `translateX(-${activeIndex * cardWidthPct}%)` }}
          >
            {posts.map(post => (
              <div
                key={post.id}
                className="shrink-0 px-2"
                style={{ width: `${cardWidthPct}%` }}
              >
                <div
                  className="group flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
                  onClick={(e) => onCardClick(e, post.slug)}
                >
                  <div className="h-1 w-full bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="p-5 sm:p-6 flex flex-col flex-1">
                    <span className="text-xs text-muted-foreground mb-3">
                      {post.publishedAt ? formatDate(post.publishedAt) : ''}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 leading-snug group-hover:text-primary transition-colors line-clamp-3 flex-1">
                      <span className="mr-1.5">{getPostEmoji(post.title, post.topic, post.id)}</span>{post.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                      {post.metaDescription}
                    </p>
                    <div className="flex items-center gap-1 text-primary text-sm font-medium mt-auto">
                      Читать
                      <Icon name="ArrowRight" size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        {total > visibleCount() && (
          <div className="flex justify-center gap-1.5 mt-6">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                aria-label={`Слайд ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? 'bg-primary w-6 h-2'
                    : 'bg-gray-200 hover:bg-gray-300 w-2 h-2'
                }`}
              />
            ))}
          </div>
        )}

        {/* Link to full blog */}
        <div className="text-center mt-8">
          <Link to="/blog">
            <Button variant="outline" className="gap-2">
              <Icon name="BookOpen" size={16} />
              Все статьи
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}