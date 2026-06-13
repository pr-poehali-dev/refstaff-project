import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { Recommendation } from '@/types';

interface WalletHistoryTabProps {
  recommendations: Recommendation[];
  currentEmployeeId: number;
}

export function WalletHistoryTab({ recommendations, currentEmployeeId }: WalletHistoryTabProps) {
  const walletRecs = recommendations.filter(
    r => r.employeeId === currentEmployeeId && (r.status === 'accepted' || r.status === 'hired'),
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-2xl font-semibold flex items-center gap-2">
        <span>💳 История кошелька</span>
        <span className="hidden sm:inline"></span>
      </h2>
      <div className="space-y-2 sm:space-y-3">
        {walletRecs.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              История транзакций пуста
            </CardContent>
          </Card>
        ) : walletRecs.map((rec) => (
          <Card key={rec.id}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    rec.status === 'accepted' ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    <Icon
                      name={rec.status === 'accepted' ? 'Clock' : 'CheckCircle'}
                      className={rec.status === 'accepted' ? 'text-yellow-600' : 'text-green-600'}
                      size={16}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs sm:text-sm truncate">Вознаграждение за рекомендацию {rec.candidateName}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
                      {new Date(rec.date).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
                <div className={`text-sm sm:text-lg font-bold flex-shrink-0 ${
                  rec.status === 'accepted' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  +{(rec.reward || 0).toLocaleString()} ₽
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default WalletHistoryTab;
