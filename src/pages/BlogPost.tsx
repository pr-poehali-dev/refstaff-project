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
      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
        <Icon name="FileX" size={28} className="text-primary" />
      </div>
      <h1 className="text-xl sm:text-2xl font-bold">Статья не найдена</h1>
      <p className="text-muted-foreground text-sm">Возможно, она была удалена или ссылка устарела</p>
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
              <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">iHUNT</span>
            </div>
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <Icon name="ArrowLeft" size={14} />
              Блог
            </Link>
          </div>
        </header>

        <main className="pt-14 sm:pt-16 pb-12">
          <article className="container mx-auto max-w-2xl px-4 py-6 sm:py-10 md:py-14">

            {/* Хлебные крошки */}
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 flex-wrap">
              <Link to="/" className="hover:text-primary whitespace-nowrap">Главная</Link>
              <Icon name="ChevronRight" size={11} />
              <Link to="/blog" className="hover:text-primary whitespace-nowrap">Блог</Link>
              <Icon name="ChevronRight" size={11} />
              <span className="text-foreground line-clamp-1 min-w-0">{post.title}</span>
            </nav>

            {/* Заголовок */}
            <header className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs text-muted-foreground bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {post.publishedAt ? formatDate(post.publishedAt) : ''}
                </span>
                <span className="text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                  HR & Рекрутинг
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-3">
                {post.title}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {post.metaDescription}
              </p>
            </header>

            {/* Разделитель */}
            <div className="h-px bg-gradient-to-r from-primary/20 via-secondary/20 to-transparent mb-6 sm:mb-8" />

            {/* Контент */}
            <div
              className="
                prose prose-sm sm:prose-base prose-gray max-w-none

                prose-p:text-gray-700 prose-p:leading-[1.8] prose-p:mb-4

                prose-h2:text-lg prose-h2:sm:text-xl prose-h2:md:text-2xl
                prose-h2:font-bold prose-h2:text-gray-900
                prose-h2:mt-8 prose-h2:mb-3
                prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-100

                prose-ul:my-3 prose-ul:space-y-1.5 prose-ul:pl-0
                prose-li:text-gray-700 prose-li:leading-relaxed prose-li:text-sm prose-li:sm:text-base

                prose-strong:text-gray-900 prose-strong:font-semibold

                prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
              "
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* CTA блок */}
            <div className="mt-10 sm:mt-14 bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-2xl p-5 sm:p-8 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon name="Rocket" size={20} className="text-white" />
              </div>
              <h3 className="text-base sm:text-xl font-bold mb-2">Попробуйте iHUNT бесплатно</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Запустите реферальную программу за 5 минут. 14 дней без ограничений.
              </p>
              <Button size="default" className="sm:size-lg w-full sm:w-auto" onClick={() => navigate('/')}>
                <Icon name="Rocket" className="mr-2" size={15} />
                Начать бесплатно
              </Button>
            </div>

            {/* Навигация вниз */}
            <div className="mt-6 flex justify-center">
              <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-2">
                <Icon name="ArrowLeft" size={14} />
                Все статьи блога
              </Link>
            </div>

          </article>
        </main>

        <footer className="border-t bg-gray-50 py-5 px-4 text-center text-xs text-muted-foreground">
          © 2026 iHUNT — <Link to="/" className="hover:text-primary">реферальный рекрутинг</Link>
        </footer>
      </div>
    </>
  );
}
