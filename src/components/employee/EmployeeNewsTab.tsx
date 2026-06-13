import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { NewsPost } from '@/types';

interface EmployeeNewsTabProps {
  newsPosts: NewsPost[];
  onLike: (id: number) => void;
  onComments: (post: NewsPost) => void;
}

export function EmployeeNewsTab({ newsPosts, onLike, onComments }: EmployeeNewsTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
        <span>📢 Новости компании</span>
        <span className="hidden sm:inline"></span>
      </h2>

      {newsPosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon name="Newspaper" className="mx-auto mb-4 text-muted-foreground" size={48} />
            <p className="text-muted-foreground">Пока нет новостей</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {newsPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="p-3 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={
                    post.category === 'news' ? 'default' :
                    post.category === 'achievement' ? 'secondary' :
                    post.category === 'announcement' ? 'outline' :
                    'default'
                  } className="text-[10px] sm:text-xs">
                    {post.category === 'news' ? '📰 Новость' :
                     post.category === 'achievement' ? '🏆 Достижение' :
                     post.category === 'announcement' ? '📢 Объявление' :
                     '✍️ Блог'}
                  </Badge>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    {new Date(post.date).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <CardTitle className="text-base sm:text-xl">{post.title}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Автор: {post.author}</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>
              </CardContent>
              <CardFooter className="border-t pt-3 sm:pt-4 p-3 sm:p-6">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLike(post.id)}
                    >
                      <Icon name="Heart" className="mr-1" size={16} />
                      {post.likes}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onComments(post)}
                    >
                      <Icon name="MessageCircle" className="mr-1" size={16} />
                      {post.comments.length}
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default EmployeeNewsTab;
