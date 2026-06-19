import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const BLOG_API = 'https://functions.poehali.dev/24adc9a7-714f-4df9-a6b0-3874d99d1577';
const OG_IMAGE_API = 'https://functions.poehali.dev/c6e24176-0014-4fee-8ecd-b597171ff766';

const REACTIONS = [
  { emoji: '👍', label: 'Полезно' },
  { emoji: '🔥', label: 'Огонь' },
  { emoji: '💡', label: 'Интересно' },
  { emoji: '❤️', label: 'Нравится' },
  { emoji: '😮', label: 'Удивительно' },
];

interface Post {
  id: number;
  slug: string;
  title: string;
  metaDescription: string;
  content: string;
  topic: string;
  publishedAt: string;
}

interface Stats {
  views: number;
  reactions: Record<string, number>;
  my_reaction: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getSessionId(): string {
  let sid = localStorage.getItem('blog_session_id');
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('blog_session_id', sid);
  }
  return sid;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [stats, setStats] = useState<Stats>({ views: 0, reactions: {}, my_reaction: null });
  const [reacting, setReacting] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const loadStats = useCallback((postId: number) => {
    const sid = getSessionId();
    fetch(`${BLOG_API}?action=stats&post_id=${postId}&session_id=${sid}`)
      .then(r => r.json())
      .then(d => setStats({ views: d.views || 0, reactions: d.reactions || {}, my_reaction: d.my_reaction || null }));
  }, []);

  useEffect(() => {
    if (!post) return;
    const sid = getSessionId();
    fetch(`${BLOG_API}?action=view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id, session_id: sid }),
    }).then(() => loadStats(post.id));
  }, [post, loadStats]);

  const handleReact = async (emoji: string) => {
    if (!post || reacting) return;
    setReacting(true);
    const sid = getSessionId();
    const r = await fetch(`${BLOG_API}?action=react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id, session_id: sid, emoji }),
    });
    const d = await r.json();
    setStats(prev => ({ ...prev, reactions: d.reactions || {}, my_reaction: d.my_reaction || null }));
    setReacting(false);
  };

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
  const ogImageUrl = `${OG_IMAGE_API}?title=${encodeURIComponent(post.title)}&department=${encodeURIComponent('HR & Рекрутинг')}&salary=${encodeURIComponent('iHUNT Блог')}`;
  const totalReactions = Object.values(stats.reactions).reduce((a, b) => a + b, 0);

  const shareLinks = {
    vk: `https://vk.com/share.php?url=${encodeURIComponent(postUrl)}&title=${encodeURIComponent(post.title)}&description=${encodeURIComponent(post.metaDescription)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.title + '\n\n' + post.metaDescription)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(post.title + '\n\n' + post.metaDescription + '\n\n' + postUrl)}`,
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="iHUNT Блог" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.metaDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          'headline': post.title,
          'description': post.metaDescription,
          'url': postUrl,
          'image': ogImageUrl,
          'datePublished': post.publishedAt,
          'dateModified': post.publishedAt,
          'inLanguage': 'ru',
          'publisher': { '@type': 'Organization', 'name': 'iHUNT', 'url': 'https://i-hunt.ru', 'logo': { '@type': 'ImageObject', 'url': 'https://i-hunt.ru/favicon.svg' } },
          'author': { '@type': 'Organization', 'name': 'iHUNT', 'url': 'https://i-hunt.ru' },
          'mainEntityOfPage': { '@type': 'WebPage', '@id': postUrl },
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': 'Главная', 'item': 'https://i-hunt.ru/' },
            { '@type': 'ListItem', 'position': 2, 'name': 'Блог', 'item': 'https://i-hunt.ru/blog' },
            { '@type': 'ListItem', 'position': 3, 'name': post.title, 'item': postUrl },
          ],
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
              <span className="sm:text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold text-xs">iHUNT - сервис реферального рекрутинга</span>
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
            <nav className="text-xs text-muted-foreground mb-6 overflow-hidden text-ellipsis whitespace-nowrap block">
              <Link to="/" className="hover:text-primary">Главная</Link>
              <span className="mx-1">›</span>
              <Link to="/blog" className="hover:text-primary">Блог</Link>
              <span className="mx-1">›</span>
              <span className="text-foreground">{post.title}</span>
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
                {stats.views > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                    <Icon name="Eye" size={12} />
                    {stats.views.toLocaleString('ru-RU')}
                  </span>
                )}
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

            {/* Реакции */}
            <div className="mt-10 border border-gray-100 rounded-2xl p-5 sm:p-6">
              <p className="text-sm font-semibold text-gray-700 mb-4 text-center">
                Как вам статья?
              </p>
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                {REACTIONS.map(({ emoji, label }) => {
                  const count = stats.reactions[emoji] || 0;
                  const isActive = stats.my_reaction === emoji;
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleReact(emoji)}
                      disabled={reacting}
                      title={label}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-all duration-200 select-none
                        ${isActive
                          ? 'border-primary bg-primary/10 text-primary font-semibold scale-105'
                          : 'border-gray-200 bg-white hover:border-primary/40 hover:bg-primary/5 text-gray-600'
                        }`}
                    >
                      <span className="text-base leading-none">{emoji}</span>
                      {count > 0 && <span className="text-xs font-medium">{count}</span>}
                    </button>
                  );
                })}
              </div>
              {totalReactions > 0 && (
                <p className="text-center text-xs text-muted-foreground mt-3">
                  {totalReactions} {totalReactions === 1 ? 'читатель оценил' : totalReactions < 5 ? 'читателя оценили' : 'читателей оценили'} статью
                </p>
              )}
            </div>

            {/* Поделиться */}
            <div className="mt-6 flex justify-center py-5 border-t border-gray-100">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: post.title, url: window.location.href });
                  } else {
                    handleCopyLink();
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
              >
                <Icon name={copied ? 'Check' : 'Share2'} size={15} />
                {copied ? 'Скопировано!' : 'Поделиться'}
              </button>
            </div>

            {/* CTA блок */}
            <div className="mt-6 sm:mt-8 bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-2xl p-5 sm:p-8 text-center">
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