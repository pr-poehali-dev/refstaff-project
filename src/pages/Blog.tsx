import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

const ICON_MAP: Array<{ keywords: string[]; icons: string[] }> = [
  { keywords: ['реферальн', 'рекоменд'], icons: ['Handshake', 'Users', 'Link2', 'MessageSquare', 'Target'] },
  { keywords: ['рекрутинг', 'рекрутер', 'подбор'], icons: ['Search', 'Target', 'ClipboardList', 'Puzzle', 'UserSearch'] },
  { keywords: ['найм', 'нанима', 'вакансии', 'вакансия'], icons: ['Pin', 'Briefcase', 'FileEdit', 'FolderOpen', 'Folder'] },
  { keywords: ['собеседован', 'интервью'], icons: ['Mic', 'MessageSquare', 'HelpCircle', 'BarChart3', 'MessagesSquare'] },
  { keywords: ['онбординг', 'адаптац', 'новичк'], icons: ['Rocket', 'Sprout', 'Hand', 'Map', 'Backpack'] },
  { keywords: ['удержан', 'текучк', 'лояльност'], icons: ['Trophy', 'Gem', 'Anchor', 'Shield', 'Heart'] },
  { keywords: ['мотивац', 'вовлечённ', 'вовлечен'], icons: ['Flame', 'Zap', 'Dumbbell', 'Star', 'Gamepad2'] },
  { keywords: ['аналитик', 'метрик', 'kpi', 'данн'], icons: ['BarChart3', 'TrendingUp', 'Hash', 'LineChart', 'Calculator'] },
  { keywords: ['бренд', 'evp', 'репутац'], icons: ['Sparkles', 'Star', 'Award', 'Medal', 'Globe'] },
  { keywords: ['автоматизац', 'технолог', 'цифров', 'ии', 'искусственн'], icons: ['Bot', 'Settings', 'Lightbulb', 'Monitor', 'Wrench'] },
  { keywords: ['выплат', 'бонус', 'зарплат', 'деньг'], icons: ['DollarSign', 'Wallet', 'Coins', 'CreditCard', 'Landmark'] },
  { keywords: ['геймификац', 'игр', 'рейтинг'], icons: ['Gamepad2', 'Trophy', 'Dices', 'Star', 'Medal'] },
  { keywords: ['стартап', 'малый бизнес', 'бизнес'], icons: ['Rocket', 'Lightbulb', 'Sprout', 'Zap', 'Target'] },
  { keywords: ['it', 'разработчик', 'программист', 'технич'], icons: ['Laptop', 'Code2', 'Keyboard', 'Monitor', 'Microscope'] },
  { keywords: ['ритейл', 'торговл', 'магазин'], icons: ['ShoppingCart', 'Store', 'ShoppingBag', 'Package', 'CreditCard'] },
  { keywords: ['производств', 'завод', 'фабрик'], icons: ['Factory', 'Settings', 'Wrench', 'HardHat', 'Cog'] },
  { keywords: ['обучен', 'развити', 'карьер', 'навык'], icons: ['BookOpen', 'GraduationCap', 'Book', 'Brain', 'PenLine'] },
  { keywords: ['команд', 'коллектив', 'корпоратив'], icons: ['Users', 'UsersRound', 'Building2', 'Briefcase', 'Globe'] },
  { keywords: ['ошибк', 'проблем', 'сложност'], icons: ['AlertTriangle', 'Construction', 'Search', 'Lightbulb', 'Wrench'] },
  { keywords: ['совет', 'лайфхак', 'практик', 'рекоменд'], icons: ['Lightbulb', 'CheckCircle2', 'Pin', 'Target', 'Key'] },
];

const iconCache = new Map<string, string>();

function getPostIcon(title: string, topic: string, id: number): string {
  const key = String(id);
  if (iconCache.has(key)) return iconCache.get(key)!;
  const text = (title + ' ' + topic).toLowerCase();
  for (const { keywords, icons } of ICON_MAP) {
    if (keywords.some(kw => text.includes(kw))) {
      const icon = icons[id % icons.length];
      iconCache.set(key, icon);
      return icon;
    }
  }
  const fallback = ['FileEdit', 'Briefcase', 'Target', 'Search', 'ClipboardList', 'Sparkles', 'Rocket', 'Lightbulb', 'BarChart3', 'Handshake'];
  const icon = fallback[id % fallback.length];
  iconCache.set(key, icon);
  return icon;
}

export default function Blog() {
  const [posts, setPosts] = useState<PostPreview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const perPage = 12;

  useEffect(() => {
    setLoading(true);
    fetch(`${BLOG_API}?action=list&page=${page}&per_page=${perPage}`)
      .then(r => r.json())
      .then(d => { setPosts(d.posts || []); setTotal(d.total || 0); })
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <>
      <Helmet>
        <title>Блог iHUNT — экспертные статьи о реферальном рекрутинге и HR</title>
        <meta name="description" content="Полезные статьи для HR-специалистов и рекрутеров: реферальный найм, снижение стоимости найма, геймификация, мотивация команды. Практические советы от iHUNT." />
        <meta name="keywords" content="блог HR, реферальный рекрутинг статьи, HR советы, рекрутинг практики, подбор персонала статьи, HR менеджер блог, найм сотрудников советы" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://i-hunt.ru/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Блог iHUNT — о реферальном рекрутинге и HR" />
        <meta property="og:description" content="Экспертные статьи о реферальном найме, HR-автоматизации и снижении стоимости подбора персонала." />
        <meta property="og:url" content="https://i-hunt.ru/blog" />
        <meta property="og:image" content="https://i-hunt.ru/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="ru_RU" />
        <meta property="og:site_name" content="iHUNT" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Блог iHUNT — о реферальном рекрутинге и HR" />
        <meta name="twitter:description" content="Экспертные статьи о реферальном найме, HR-автоматизации и снижении стоимости подбора персонала." />
        <meta name="twitter:image" content="https://i-hunt.ru/og-image.jpg" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Blog',
          'name': 'Блог iHUNT',
          'description': 'Экспертные статьи о реферальном рекрутинге, HR-автоматизации и подборе персонала',
          'url': 'https://i-hunt.ru/blog',
          'publisher': { '@type': 'Organization', 'name': 'iHUNT', 'url': 'https://i-hunt.ru', 'logo': 'https://i-hunt.ru/favicon.svg' },
          'inLanguage': 'ru',
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': 'Главная', 'item': 'https://i-hunt.ru/' },
            { '@type': 'ListItem', 'position': 2, 'name': 'Блог', 'item': 'https://i-hunt.ru/blog' },
          ],
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Хедер */}
        <header className="border-b bg-white/80 backdrop-blur-sm fixed w-full z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="bg-gradient-to-r from-primary to-secondary p-1.5 rounded-lg">
                <Icon name="Rocket" className="text-white" size={18} />
              </div>
              <span className="font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent text-xs">iHUNT - реферальный рекрутинг</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                <Icon name="ArrowLeft" size={14} />
                Главная
              </Link>
            </div>
          </div>
        </header>

        <main className="pt-16 pb-12 px-3 sm:px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Hero блога */}
            <div className="text-center py-8 sm:py-12 md:py-16">
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 text-xs"><Icon name="FileText" size={12} className="inline-block mr-1" />Блог</Badge>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight px-2">Рекрутинг: советы и практики</h1>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2">
                Экспертные статьи для HR-специалистов, рекрутеров и руководителей
              </p>
            </div>

            {/* Партнёрская программа — баннер */}
            <Link to="/partner" className="group flex items-center gap-3 sm:gap-4 mb-8 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 px-4 py-3 sm:px-5 sm:py-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shrink-0">
                <Icon name="Handshake" size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-primary mb-0.5">Партнёрская программа iHUNT</div>
                <div className="text-xs text-gray-500 leading-snug">Вы HR-специалист или рекрутёр? Рекомендуйте iHUNT и зарабатывайте <strong className="text-gray-700">до 101 490 ₽</strong> с одного клиента</div>
              </div>
              <Icon name="ChevronRight" size={16} className="text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Список постов */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 animate-pulse">
                    <div className="h-3 bg-gray-100 rounded mb-3 w-1/3" />
                    <div className="h-5 bg-gray-100 rounded mb-2" />
                    <div className="h-5 bg-gray-100 rounded mb-4 w-4/5" />
                    <div className="h-3 bg-gray-100 rounded mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon name="FileText" size={28} className="text-primary" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold mb-2">Статьи скоро появятся</h2>
                <p className="text-muted-foreground text-sm">Мы готовим полезный контент для HR-специалистов</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
                  {posts.map((post) => (
                    <Link
                      key={post.id}
                      to={`/blog/${post.slug}`}
                      className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 overflow-hidden flex flex-col"
                    >
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="p-4 sm:p-5 lg:p-6 flex flex-col flex-1">
                        <span className="text-xs text-muted-foreground mb-2 block">
                          {post.publishedAt ? formatDate(post.publishedAt) : ''}
                        </span>
                        <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-3">
                          <Icon name={getPostIcon(post.title, post.topic, post.id)} size={16} className="inline-block mr-1 text-primary align-text-bottom" />{post.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-3 flex-1">
                          {post.metaDescription}
                        </p>
                        <div className="mt-3 flex items-center gap-1 text-primary text-xs sm:text-sm font-medium">
                          Читать
                          <Icon name="ArrowRight" size={12} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Пагинация */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <Icon name="ChevronLeft" size={16} />
                    </Button>
                    <span className="text-sm text-muted-foreground px-3">
                      {page} / {totalPages}
                    </span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                      <Icon name="ChevronRight" size={16} />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <footer className="border-t bg-gray-50 py-5 px-4 text-center text-xs text-muted-foreground">
          © 2026 iHUNT — <Link to="/" className="hover:text-primary">реферальный рекрутинг</Link>
        </footer>
      </div>
    </>
  );
}