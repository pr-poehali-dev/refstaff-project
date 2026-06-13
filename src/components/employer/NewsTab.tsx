import React, { lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import type { NewsPost } from '@/types';

const SubscriptionExpiredBlock = lazy(() => import('@/components/SubscriptionExpiredBlock').then(m => ({ default: m.SubscriptionExpiredBlock })));

const LazyFallback = () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

export interface NewsTabProps {
  isSubscriptionExpired: boolean;
  onRenew: () => void;
  newsPosts: NewsPost[];
  onCreateNews: () => void;
  onEditNews: (post: NewsPost) => void;
  onArchiveNews: (id: number, archived: boolean) => void;
  onLikeNews: (id: number) => void;
  onViewComments: (post: NewsPost) => void;
  showCreateNewsDialog: boolean;
  onCreateNewsDialogChange: (open: boolean) => void;
  newsForm: { title: string; content: string; category: string };
  onNewsFormChange: (f: NewsTabProps['newsForm']) => void;
  onSubmitNews: () => void;
  showEditNewsDialog: boolean;
  onEditNewsDialogChange: (open: boolean) => void;
  newsToEdit: NewsPost | null;
  onSubmitEditNews: () => void;
}

export function NewsTab({
  isSubscriptionExpired,
  onRenew,
  newsPosts,
  onCreateNews,
  onEditNews,
  onArchiveNews,
  onLikeNews,
  onViewComments,
  showCreateNewsDialog,
  onCreateNewsDialogChange,
  newsForm,
  onNewsFormChange,
  onSubmitNews,
  showEditNewsDialog,
  onEditNewsDialogChange,
  newsToEdit,
  onSubmitEditNews,
}: NewsTabProps) {
  return (
    <>
      {isSubscriptionExpired ? (
        <Suspense fallback={<LazyFallback />}>
          <SubscriptionExpiredBlock onRenew={onRenew} />
        </Suspense>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
              <span>📢</span>
              <span className="hidden sm:inline">Новости компании</span>
              <span className="sm:hidden">Новости</span>
            </h2>
            <Button onClick={onCreateNews} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              <Icon name="Plus" className="mr-1 sm:mr-2" size={16} />
              Создать
            </Button>
          </div>

          <div className="grid gap-4">
            {newsPosts.map((post) => (
              <Card key={post.id} className={`hover:shadow-md transition-shadow ${(post as NewsPost & { isArchived?: boolean }).isArchived ? 'opacity-60 border-dashed' : ''}`}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant={
                          post.category === 'news' ? 'default' :
                          post.category === 'achievement' ? 'secondary' :
                          post.category === 'announcement' ? 'outline' :
                          'default'
                        } className="text-xs">
                          {post.category === 'news' ? '📰 Новость' :
                           post.category === 'achievement' ? '🏆 Достижение' :
                           post.category === 'announcement' ? '📢 Объявление' :
                           '✍️ Блог'}
                        </Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(post.date).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <CardTitle className="text-base sm:text-xl">{post.title}</CardTitle>
                      <CardDescription className="mt-1 text-xs sm:text-sm truncate">Автор: {post.author}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      {(post as NewsPost & { isArchived?: boolean }).isArchived && (
                        <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">Архив</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onEditNews(post);
                        }}
                        className="h-8 w-8 p-0"
                        title="Редактировать"
                      >
                        <Icon name="Edit" size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onArchiveNews(post.id, !(post as NewsPost & { isArchived?: boolean }).isArchived)}
                        className="h-8 w-8 p-0"
                        title={(post as NewsPost & { isArchived?: boolean }).isArchived ? 'Вернуть из архива' : 'В архив'}
                      >
                        <Icon name={(post as NewsPost & { isArchived?: boolean }).isArchived ? 'ArchiveRestore' : 'Archive'} size={14} className="text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap line-clamp-3">{post.content}</p>
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-2 sm:gap-3 border-t pt-3 sm:pt-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLikeNews(post.id)}
                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                    >
                      <Icon name="ThumbsUp" size={14} />
                      {post.likes}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewComments(post)}
                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                    >
                      <Icon name="MessageCircle" size={14} />
                      {post.comments.length}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Create News Dialog */}
          <Dialog open={showCreateNewsDialog} onOpenChange={onCreateNewsDialogChange}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Создать новость</DialogTitle>
                <DialogDescription>Напишите новость для сотрудников компании</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label htmlFor="news-title" className="text-xs">Заголовок</Label>
                  <Input
                    id="news-title"
                    className="mt-1"
                    placeholder="Заголовок новости"
                    value={newsForm.title}
                    onChange={(e) => onNewsFormChange({ ...newsForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="news-category" className="text-xs">Категория</Label>
                  <Select value={newsForm.category} onValueChange={(value) => onNewsFormChange({ ...newsForm, category: value })}>
                    <SelectTrigger id="news-category" className="mt-1">
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="news">📰 Новость</SelectItem>
                      <SelectItem value="achievement">🏆 Достижение</SelectItem>
                      <SelectItem value="announcement">📢 Объявление</SelectItem>
                      <SelectItem value="blog">✍️ Блог</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="news-content" className="text-xs">Содержание</Label>
                  <Textarea
                    id="news-content"
                    className="mt-1"
                    placeholder="Текст новости..."
                    rows={5}
                    value={newsForm.content}
                    onChange={(e) => onNewsFormChange({ ...newsForm, content: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={onSubmitNews}>Опубликовать</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit News Dialog */}
          <Dialog open={showEditNewsDialog} onOpenChange={onEditNewsDialogChange}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Редактировать новость</DialogTitle>
                <DialogDescription>Измените данные новости {newsToEdit?.title}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label htmlFor="edit-news-title" className="text-xs">Заголовок</Label>
                  <Input
                    id="edit-news-title"
                    className="mt-1"
                    value={newsForm.title}
                    onChange={(e) => onNewsFormChange({ ...newsForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-news-category" className="text-xs">Категория</Label>
                  <Select value={newsForm.category} onValueChange={(value) => onNewsFormChange({ ...newsForm, category: value })}>
                    <SelectTrigger id="edit-news-category" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="news">📰 Новость</SelectItem>
                      <SelectItem value="achievement">🏆 Достижение</SelectItem>
                      <SelectItem value="announcement">📢 Объявление</SelectItem>
                      <SelectItem value="blog">✍️ Блог</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-news-content" className="text-xs">Содержание</Label>
                  <Textarea
                    id="edit-news-content"
                    className="mt-1"
                    rows={5}
                    value={newsForm.content}
                    onChange={(e) => onNewsFormChange({ ...newsForm, content: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={onSubmitEditNews}>Сохранить</Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}

export default NewsTab;
