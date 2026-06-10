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
}

interface Props {
  secret: string;
}

export default function AdminBlogTab({ secret }: Props) {
  const [posts, setPosts] = useState<PostPreview[]>([]);
  const [total, setTotal] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [genLog, setGenLog] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadPosts = async () => {
    const r = await fetch(`${BLOG_API}?action=list&per_page=50`);
    const d = await r.json();
    setPosts(d.posts || []);
    setTotal(d.total || 0);
  };

  useEffect(() => { loadPosts(); }, []);

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
      // Пауза 2 сек между запросами чтобы не перегружать GPT
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

  return (
    <TabsContent value="blog">
      <div className="space-y-5">
        {/* Заголовок и кнопки */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-white font-semibold text-lg">SEO-блог</h2>
            <p className="text-gray-400 text-sm">Всего статей: {total}</p>
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
              <div>
                <p className="text-white text-sm font-medium mb-1">Автогенерация через cron-job.org</p>
                <p className="text-gray-400 text-xs mb-3">Настрой бесплатный cron, чтобы статьи генерировались автоматически 5 штук в день:</p>
                <div className="space-y-2 text-xs">
                  <div className="bg-gray-800 rounded p-2">
                    <p className="text-gray-400 mb-1">1. Зайди на <span className="text-blue-400">cron-job.org</span> → Create cronjob</p>
                    <p className="text-gray-400 mb-1">2. URL:</p>
                    <code className="text-green-400 break-all block">{BLOG_API}?action=generate</code>
                  </div>
                  <div className="bg-gray-800 rounded p-2">
                    <p className="text-gray-400 mb-1">3. Метод: POST. Заголовки:</p>
                    <code className="text-green-400 block">X-Admin-Secret: [твой ADMIN_SECRET]</code>
                  </div>
                  <div className="bg-gray-800 rounded p-2">
                    <p className="text-gray-400 mb-1">4. Расписание: каждые 4 часа</p>
                    <code className="text-green-400">0 */4 * * *</code>
                    <p className="text-gray-400 mt-1">→ 6 запросов в сутки = ~6 новых статей</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Список статей */}
        <div className="space-y-2">
          {posts.length === 0 && !generating && (
            <p className="text-gray-400 text-sm">Статей пока нет. Нажми «5 статей» чтобы сгенерировать.</p>
          )}
          {posts.map(post => (
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
                <div className="flex items-center gap-2 shrink-0">
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