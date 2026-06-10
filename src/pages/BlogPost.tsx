import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const BLOG_API = 'https://functions.poehali.dev/24adc9a7-714f-4df9-a6b0-3874d99d1577';

interface Post {
  id: number;
  slug: string;
  title: string;
  metaDescription: string;
  content: string;
  topic: string;
  publishedAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${BLOG_API}?action=get&slug=${encodeURIComponent(slug)}`)
      .then(async r => {
        if (r.status === 404) { setNotFound(true); return; }
        const d = await r.json();
        setPost(d.post || null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound || !post) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
        <Icon name="FileX" size={32} className="text-primary" />
      </div>
      <h1 className="text-2xl font-bold">Статья не найдена</h1>
      <p className="text-muted-foreground">Возможно, она была удалена или ссылка устарела</p>
      <Button onClick={() => navigate('/blog')}>← Вернуться в блог</Button>
    </div>
  );

  const postUrl = `https://i-hunt.ru/blog/${post.slug}`;

  return (
    <>
      <Helmet>
        <title>{post.title} | Блог iHUNT</title>
        <meta name="description" content={post.metaDescription} />
        <link rel="canonical" href={postUrl} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.metaDescription} />
        <meta property="og:url" content={postUrl} />
        <meta property="og:type" content="article" />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          'headline': post.title,
          'description': post.metaDescription,
          'url': postUrl,
          'datePublished': post.publishedAt,
          'publisher': { '@type': 'Organization', 'name': 'iHUNT', 'url': 'https://i-hunt.ru' },
          'author': { '@type': 'Organization', 'name': 'iHUNT' },
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-white">
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
              <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">← Блог</Link>
            </div>
          </div>
        </header>

        <main className="pt-20 pb-16">
          <article className="container mx-auto max-w-3xl px-4 py-10 sm:py-14">
            {/* Хлебные крошки */}
            <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
              <Link to="/" className="hover:text-primary">Главная</Link>
              <Icon name="ChevronRight" size={12} />
              <Link to="/blog" className="hover:text-primary">Блог</Link>
              <Icon name="ChevronRight" size={12} />
              <span className="text-foreground line-clamp-1">{post.title}</span>
            </nav>

            {/* Заголовок */}
            <header className="mb-8 sm:mb-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-muted-foreground bg-gray-100 px-3 py-1 rounded-full">
                  {post.publishedAt ? formatDate(post.publishedAt) : ''}
                </span>
                <span className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full font-medium">HR & Рекрутинг</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
                {post.title}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {post.metaDescription}
              </p>
            </header>

            {/* Контент */}
            <div
              className="
                prose prose-gray max-w-none

                prose-p:text-gray-700 prose-p:leading-[1.85] prose-p:text-base prose-p:mb-5

                prose-h2:text-xl prose-h2:sm:text-2xl prose-h2:font-bold
                prose-h2:text-gray-900 prose-h2:mt-10 prose-h2:mb-4
                prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-100

                prose-ul:my-4 prose-ul:space-y-2 prose-ul:pl-0
                prose-li:text-gray-700 prose-li:leading-relaxed

                prose-strong:text-gray-900 prose-strong:font-semibold

                prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
              "
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* CTA блок в конце статьи */}
            <div className="mt-12 sm:mt-16 bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-2xl p-6 sm:p-8 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mx-auto mb-4">
                <Icon name="Rocket" size={22} className="text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Попробуйте iHUNT бесплатно</h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
                Запустите реферальную программу за 5 минут. 14 дней без ограничений и без банковской карты.
              </p>
              <Button size="lg" onClick={() => navigate('/')}>
                <Icon name="Rocket" className="mr-2" size={16} />
                Начать бесплатно
              </Button>
            </div>

            {/* Навигация */}
            <div className="mt-8 flex justify-center">
              <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Icon name="ArrowLeft" size={14} />
                Все статьи блога
              </Link>
            </div>
          </article>
        </main>

        <footer className="border-t bg-gray-50 py-6 px-4 text-center text-xs text-muted-foreground">
          © 2026 iHUNT — <Link to="/" className="hover:text-primary">реферальный рекрутинг</Link>
        </footer>
      </div>
    </>
  );
}