import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import EmployeeChat from '@/components/EmployeeChat';

interface EmployeeDashboardProps {
  currentUser: { id: number; company_id: number; first_name?: string; last_name?: string } | null;
  onLogout: () => void;
}

export default function EmployeeDashboard({ currentUser, onLogout }: EmployeeDashboardProps) {
  const currentEmployeeId = currentUser?.id || 1;
  const currentCompanyId = currentUser?.company_id || 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-primary to-secondary p-1.5 rounded-lg">
              <Icon name="Rocket" className="text-white" size={20} />
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">iHUNT</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {currentUser && (
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {currentUser.first_name} {currentUser.last_name}
              </span>
            )}
            <Button variant="ghost" onClick={onLogout} size="sm" className="text-xs sm:text-sm">Выход</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
            <Icon name="MessageCircle" size={32} className="sm:w-9 sm:h-9" />
            <span className="hidden sm:inline">Чат с коллегами</span>
            <span className="sm:hidden text-base">Чат</span>
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground">Общайтесь с сотрудниками вашей компании</p>
        </div>

        <EmployeeChat
          currentUserId={currentEmployeeId}
          companyId={currentCompanyId}
        />
      </div>
    </div>
  );
}