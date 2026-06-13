import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import type { Employee, Recommendation } from '@/types';

interface AchievementsTabProps {
  employees: Employee[];
  recommendations: Recommendation[];
  currentEmployeeId: number;
}

export function AchievementsTab({ employees, recommendations, currentEmployeeId }: AchievementsTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
        <span>🏆 Достижения и рейтинг</span>
        <span className="hidden sm:inline"></span>
      </h2>

      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-xl">
            <Icon name="Trophy" size={20} className="text-primary" />
            <span className="hidden sm:inline">Рейтинг сотрудников</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          <div className="space-y-2 sm:space-y-3">
            {employees
              .sort((a, b) => {
                if (b.hired !== a.hired) return b.hired - a.hired;
                if (b.recommendations !== a.recommendations) return b.recommendations - a.recommendations;
                return b.earnings - a.earnings;
              })
              .slice(0, 10)
              .map((emp, idx) => (
                <div key={emp.id} className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg ${emp.id === currentEmployeeId ? 'bg-primary/20 border-2 border-primary' : 'bg-background'}`}>
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
                    idx === 0 ? 'bg-yellow-500 text-white' :
                    idx === 1 ? 'bg-gray-400 text-white' :
                    idx === 2 ? 'bg-orange-600 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {idx + 1}
                  </div>
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex">
                    <AvatarFallback>{emp.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs sm:text-sm truncate">{emp.name}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
                      {emp.hired} нанято <span className="hidden sm:inline">• {emp.recommendations} рекомендаций</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary text-xs sm:text-sm">
                      {emp.hired >= 10 ? '👑 Легенда' :
                       emp.hired >= 5 ? '⭐ Мастер' :
                       emp.hired >= 3 ? '🎯 Профи' :
                       emp.hired >= 1 ? '🌟 Новичок' : '🔰 Старт'}
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </CardContent>
      </Card>

      <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-6">Мои достижения</h3>
      {(() => {
        const me = employees.find(e => e.id === currentEmployeeId);
        const myRecs = recommendations.filter(r => r.employeeId === currentEmployeeId);
        const myHires = me?.hired || 0;
        const myRecsCount = me?.recommendations || 0;
        const firstRec = myRecs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
        const hasFirstRec = myRecsCount >= 1;
        const hasSharpEye = myHires >= 3;
        const recruiterProgress = Math.min(myHires, 5);
        const goldProgress = Math.min(myHires, 10);
        return (
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            <Card className={!hasFirstRec ? 'opacity-50' : ''}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <Icon name="Star" className="text-yellow-600" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-lg truncate">Первая рекомендация</div>
                    {hasFirstRec && firstRec
                      ? <div className="text-xs sm:text-sm text-muted-foreground">Получено {new Date(firstRec.date).toLocaleDateString('ru-RU')}</div>
                      : <div className="text-xs sm:text-sm text-muted-foreground">{myRecsCount}/1 рекомендаций<Progress value={myRecsCount * 100} className="h-1 mt-2" /></div>
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={!hasSharpEye ? 'opacity-50' : ''}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Icon name="Target" className="text-green-600" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-lg truncate">Меткий глаз</div>
                    {hasSharpEye
                      ? <div className="text-xs sm:text-sm text-muted-foreground">3 успешных найма выполнено ✓</div>
                      : <div className="text-xs sm:text-sm text-muted-foreground">{myHires}/3 успешных найма<Progress value={Math.round((myHires / 3) * 100)} className="h-1 mt-2" /></div>
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={myHires < 5 ? 'opacity-50' : ''}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Icon name="Award" className="text-purple-600" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-lg truncate">Рекрутер месяца</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{recruiterProgress}/5 наймов</div>
                    <Progress value={Math.round((recruiterProgress / 5) * 100)} className="h-1 mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={myHires < 10 ? 'opacity-50' : ''}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Icon name="Crown" className="text-blue-600" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-lg truncate">Золотой рекрутер</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{goldProgress}/10 успешных наймов</div>
                    <Progress value={Math.round((goldProgress / 10) * 100)} className="h-1 mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}
    </div>
  );
}

export default AchievementsTab;
