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
        <link rel="canonical" href="https://i-hunt.ru/blog" />
        <meta property="og:title" content="Блог iHUNT — о реферальном рекрутинге и HR" />
        <meta property="og:description" content="Экспертные статьи о реферальном найме, HR-автоматизации и снижении стоимости подбора персонала." />
        <meta property="og:url" content="https://i-hunt.ru/blog" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Хедер */}
        <header className="border-b bg-white/80 backdrop-blur-sm fixed w-full z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="bg-gradient-to-r from-primary to-secondary p-1.5 rounded-lg">
                <Icon name="Rocket" className="text-white" size={18} />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">iHUNT</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">← Главная</Link>
            </div>
          </div>
        </header>

        <main className="pt-20 pb-16 px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Hero блога */}
            <div className="text-center py-12 sm:py-16">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">📝 Блог</Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Реферальный рекрутинг: советы и практики
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
                Экспертные статьи для HR-специалистов, рекрутеров и руководителей — как нанимать лучших через свою команду
              </p>
            </div>

            {/* Список постов */}
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded mb-3 w-1/3" />
                    <div className="h-6 bg-gray-100 rounded mb-2" />
                    <div className="h-6 bg-gray-100 rounded mb-4 w-4/5" />
                    <div className="h-4 bg-gray-100 rounded mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon name="FileText" size={32} className="text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Статьи скоро появятся</h2>
                <p className="text-muted-foreground text-sm">Мы готовим полезный контент для HR-специалистов</p>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <Link
                      key={post.id}
                      to={`/blog/${post.slug}`}
                      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-muted-foreground">{post.publishedAt ? formatDate(post.publishedAt) : ''}</span>
                        </div>
                        <h2 className="text-base font-bold text-gray-900 mb-3 leading-snug group-hover:text-primary transition-colors line-clamp-3">
                          {post.title}
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                          {post.metaDescription}
                        </p>
                        <div className="mt-4 flex items-center gap-1 text-primary text-sm font-medium">
                          Читать
                          <Icon name="ArrowRight" size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Пагинация */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
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

        <footer className="border-t bg-gray-50 py-6 px-4 text-center text-xs text-muted-foreground">
          © 2026 iHUNT — <Link to="/" className="hover:text-primary">реферальный рекрутинг</Link>
        </footer>
      </div>
    </>
  );
}
