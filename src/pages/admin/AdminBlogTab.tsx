import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

const BLOG_API = 'https://functions.poehali.dev/24adc9a7-714f-4df9-a6b0-3874d99d1577';

interface PostPreview {
  id: number;
  slug: string;
  title: string;
  topic: string;
  publishedAt: string;
  views: number;
}

interface Props {
  secret: string;
}

type SortField = 'views' | 'date';
type SortOrder = 'desc' | 'asc';
type ViewsFilter = 'all' | '0' | '1-10' | '11-100' | '100+';

export default function AdminBlogTab({ secret }: Props) {
  const [posts, setPosts] = useState<PostPreview[]>([]);
  const [total, setTotal] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [genLog, setGenLog] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>('views');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewsFilter, setViewsFilter] = useState<ViewsFilter>('all');

  const loadPosts = async () => {
    const r = await fetch(
      `${BLOG_API}?action=list_with_views&sort=${sortField}&order=${sortOrder}&admin_secret=${encodeURIComponent(secret)}`
    );
    const d = await r.json();
    setPosts(d.posts || []);
    setTotal(d.total || 0);
  };

  useEffect(() => { loadPosts(); }, [sortField, sortOrder]);

  const filteredPosts = posts.filter(p => {
    if (viewsFilter === 'all') return true;
    if (viewsFilter === '0') return p.views === 0;
    if (viewsFilter === '1-10') return p.views >= 1 && p.views <= 10;
    if (viewsFilter === '11-100') return p.views >= 11 && p.views <= 100;
    if (viewsFilter === '100+') return p.views > 100;
    return true;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(o => o === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const generateBulk = async (count = 5) => {
    setGenerating(true);
    setGenLog([]);
    for (let i = 0; i < count; i++) {
      setGenLog(prev => [...prev, `⏳ Генерирую статью ${i + 1} из ${count}...`]);
      try {
        const r = await fetch(`${BLOG_API}?action=generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ admin_secret: secret }),
        });
        const d = await r.json();
        if (d.success) {
          setGenLog(prev => [...prev.slice(0, -1), `✅ ${i + 1}. ${d.title}`]);
        } else {
          setGenLog(prev => [...prev.slice(0, -1), `❌ Ошибка при генерации статьи ${i + 1}`]);
        }
      } catch {
        setGenLog(prev => [...prev.slice(0, -1), `❌ Ошибка сети при статье ${i + 1}`]);
      }
      if (i < count - 1) await new Promise(res => setTimeout(res, 2000));
    }
    setGenerating(false);
    loadPosts();
  };

  const deletePost = async (id: number) => {
    if (!confirm('Удалить статью?')) return;
    setDeleting(id);
    await fetch(`${BLOG_API}?action=delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, admin_secret: secret }),
    });
    setDeleting(null);
    loadPosts();
  };

  const totalViews = posts.reduce((sum, p) => sum + p.views, 0);

  const FILTERS: { value: ViewsFilter; label: string }[] = [
    { value: 'all', label: 'Все' },
    { value: '0', label: '0 просмотров' },
    { value: '1-10', label: '1–10' },
    { value: '11-100', label: '11–100' },
    { value: '100+', label: '100+' },
  ];

  return (
    <TabsContent value="blog">
      <div className="space-y-5">
        {/* Заголовок и кнопки */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-white font-semibold text-lg">SEO-блог</h2>
            <p className="text-gray-400 text-sm">
              Статей: {total} · Просмотров всего: {totalViews.toLocaleString('ru-RU')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-gray-700 text-gray-300 hover:text-white"
              onClick={() => generateBulk(1)}
              disabled={generating}
            >
              <Icon name="Plus" size={14} className="mr-1" />
              1 статья
            </Button>
            <Button
              size="sm"
              className="bg-primary"
              onClick={() => generateBulk(5)}
              disabled={generating}
            >
              {generating
                ? <><Icon name="Loader2" size={14} className="mr-1 animate-spin" />Генерирую...</>
                : <><Icon name="Sparkles" size={14} className="mr-1" />5 статей</>
              }
            </Button>
          </div>
        </div>

        {/* Лог генерации */}
        {genLog.length > 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 space-y-1">
              {genLog.map((line, i) => (
                <p key={i} className="text-sm font-mono text-gray-300">{line}</p>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Инструкция по cron */}
        <Card className="bg-gray-900 border-gray-700 border-dashed">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="Clock" size={16} className="text-blue-400" />
              </div>
              <div className="w-full">
                <p className="text-white text-sm font-medium mb-1">Автогенерация через cron-job.org</p>
                <p className="text-gray-400 text-xs mb-3">Вставь этот URL в cron-job.org — никаких заголовков не нужно, секрет уже в ссылке:</p>
                <div className="space-y-3 text-xs">
                  <div className="bg-gray-800 rounded p-3">
                    <p className="text-gray-400 mb-2 font-medium">Готовый URL для cron-job.org:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-green-400 break-all flex-1 text-[11px] leading-relaxed">
                        {BLOG_API}?action=generate&admin_secret=<span className="text-yellow-400">[вставь свой ADMIN_SECRET]</span>
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-white shrink-0 h-7 px-2"
                        onClick={() => {
                          const url = `${BLOG_API}?action=generate&admin_secret=${secret}`;
                          navigator.clipboard.writeText(url);
                          alert('✅ URL скопирован в буфер обмена');
                        }}
                      >
                        <Icon name="Copy" size={13} />
                      </Button>
                    </div>
                    <p className="text-gray-500 mt-2">👆 Нажми иконку копирования — секрет подставится автоматически</p>
                  </div>
                  <div className="bg-gray-800 rounded p-3 space-y-1">
                    <p className="text-gray-300 font-medium mb-2">Настройки в cron-job.org:</p>
                    <p className="text-gray-400">• <span className="text-white">URL</span> — скопируй сверху</p>
                    <p className="text-gray-400">• <span className="text-white">Request method</span> — <code className="text-green-400">GET</code> (не нужен POST)</p>
                    <p className="text-gray-400">• <span className="text-white">Schedule</span> — <code className="text-green-400">0 */4 * * *</code> (каждые 4 ч = 6 статей/день)</p>
                    <p className="text-gray-400">• <span className="text-white">Заголовки</span> — не нужны, оставь пустыми</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Фильтры и сортировка */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-500 text-xs">Просмотры:</span>
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setViewsFilter(f.value)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                viewsFilter === f.value
                  ? 'bg-primary border-primary text-white'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => toggleSort('views')}
              className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border transition-colors ${
                sortField === 'views'
                  ? 'border-primary text-primary'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              <Icon name="Eye" size={11} />
              По просмотрам
              {sortField === 'views' && <Icon name={sortOrder === 'desc' ? 'ArrowDown' : 'ArrowUp'} size={11} />}
            </button>
            <button
              onClick={() => toggleSort('date')}
              className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border transition-colors ${
                sortField === 'date'
                  ? 'border-primary text-primary'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              <Icon name="Calendar" size={11} />
              По дате
              {sortField === 'date' && <Icon name={sortOrder === 'desc' ? 'ArrowDown' : 'ArrowUp'} size={11} />}
            </button>
          </div>
        </div>

        {/* Список статей */}
        <div className="space-y-2">
          {filteredPosts.length === 0 && !generating && (
            <p className="text-gray-400 text-sm">
              {posts.length === 0 ? 'Статей пока нет. Нажми «5 статей» чтобы сгенерировать.' : 'Нет статей с такими фильтрами.'}
            </p>
          )}
          {filteredPosts.map(post => (
            <Card key={post.id} className="bg-gray-900 border-gray-800 hover:border-gray-600 transition-colors">
              <CardContent className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{post.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-[10px] bg-gray-800 text-gray-400">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('ru-RU') : ''}
                    </Badge>
                    <span className="text-gray-500 text-xs truncate">/blog/{post.slug}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Icon name="Eye" size={13} />
                    <span className={`text-xs font-medium tabular-nums ${post.views > 100 ? 'text-green-400' : post.views > 0 ? 'text-gray-300' : 'text-gray-600'}`}>
                      {post.views.toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Icon name="ExternalLink" size={14} />
                  </a>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-500 hover:text-red-400 h-7 w-7 p-0"
                    onClick={() => deletePost(post.id)}
                    disabled={deleting === post.id}
                  >
                    {deleting === post.id
                      ? <Icon name="Loader2" size={13} className="animate-spin" />
                      : <Icon name="Trash2" size={13} />
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </TabsContent>
  );
}
