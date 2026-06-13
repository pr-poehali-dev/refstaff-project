import React, { lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { type Chat } from '@/lib/api';
import type { Employee } from '@/types';

const SubscriptionExpiredBlock = lazy(() => import('@/components/SubscriptionExpiredBlock').then(m => ({ default: m.SubscriptionExpiredBlock })));

const LazyFallback = () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

export interface ChatsTabProps {
  isSubscriptionExpired: boolean;
  onRenew: () => void;
  chats: Chat[];
  employees: Employee[];
  onOpenChat: (emp: Employee) => void;
}

export function ChatsTab({
  isSubscriptionExpired,
  onRenew,
  chats,
  employees,
  onOpenChat,
}: ChatsTabProps) {
  return (
    <>
      {isSubscriptionExpired ? (
        <Suspense fallback={<LazyFallback />}>
          <SubscriptionExpiredBlock onRenew={onRenew} />
        </Suspense>
      ) : (
        <>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
            <span>💬</span>
            <span className="hidden sm:inline">Чаты с сотрудниками</span>
            <span className="sm:hidden">Чаты</span>
          </h2>
          <div className="grid gap-3">
            {(chats.length > 0
              ? chats.filter((chat, idx, arr) => arr.findIndex(c => c.employee_id === chat.employee_id) === idx)
              : employees.slice(0, 3).map(emp => ({ employee_id: emp.id, unread_count: 0 }))
            ).map((chat) => {
              const emp = employees.find(e => e.id === chat.employee_id);
              if (!emp) return null;
              const unread = (chat as Chat & { unread_count?: number }).unread_count || 0;
              return (
                <Card key={emp.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onOpenChat(emp)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{emp.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-sm text-muted-foreground truncate">{emp.position}</div>
                      </div>
                      {unread > 0 && <Badge className="bg-red-500 hover:bg-red-500 text-white">{unread}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

export default ChatsTab;
