import React, { lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import type { Employee } from '@/types';

const SubscriptionExpiredBlock = lazy(() => import('@/components/SubscriptionExpiredBlock').then(m => ({ default: m.SubscriptionExpiredBlock })));

const LazyFallback = () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

export interface EmployeesTabProps {
  isSubscriptionExpired: boolean;
  onRenew: () => void;
  employees: Employee[];
  employeeSearchQuery: string;
  onSearchChange: (q: string) => void;
  employeeStatusFilter: string;
  onStatusFilterChange: (f: string) => void;
  onReferralLink: () => void;
  onViewEmployee: (emp: Employee) => void;
  onOpenChat: (emp: Employee) => void;
  onEditEmployee: (emp: Employee) => void;
  showEditRolesDialog: boolean;
  onEditRolesDialogChange: (open: boolean) => void;
  employeeToEditRoles: Employee | null;
  onSetEmployeeToEditRoles: (emp: Employee | null) => void;
  rolesForm: { isAdmin: boolean };
  onRolesFormChange: (f: { isAdmin: boolean }) => void;
  onSaveRoles: () => void;
  onFireEmployee: (emp: Employee) => void;
  currentUserRole: string;
  calculateEmployeeRank: (emp: Employee) => number;
}

export function EmployeesTab({
  isSubscriptionExpired,
  onRenew,
  employees,
  employeeSearchQuery,
  onSearchChange,
  employeeStatusFilter,
  onStatusFilterChange,
  onReferralLink,
  onViewEmployee,
  onOpenChat,
  onEditEmployee,
  showEditRolesDialog,
  onEditRolesDialogChange,
  employeeToEditRoles,
  onSetEmployeeToEditRoles,
  rolesForm,
  onRolesFormChange,
  onSaveRoles,
  onFireEmployee,
  currentUserRole,
  calculateEmployeeRank,
}: EmployeesTabProps) {
  return (
    <>
      {isSubscriptionExpired ? (
        <Suspense fallback={<LazyFallback />}>
          <SubscriptionExpiredBlock onRenew={onRenew} />
        </Suspense>
      ) : (
        <>
          <div className="flex flex-col gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                <span>👥</span>
                <span className="hidden sm:inline">Сотрудники компании</span>
                <span className="sm:hidden">Сотрудники</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Всего: <span className="font-semibold">{employees.length}</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={onReferralLink} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                <Icon name="Link" className="mr-1 sm:mr-2" size={16} />
                <span>Пригласить сотрудника</span>
              </Button>
            </div>
          </div>
          <div className="mb-4 flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Поиск..."
              value={employeeSearchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full text-sm"
            />
            <select
              value={employeeStatusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as 'all' | 'active' | 'fired' | 'admin')}
              className="shrink-0 text-sm border border-input rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Все</option>
              <option value="active">Действующие</option>
              <option value="fired">Уволенные</option>
              <option value="admin">Администраторы</option>
            </select>
          </div>
          <div className="grid gap-4">
            {employees.filter(emp => {
              const matchesStatus =
                employeeStatusFilter === 'all' ||
                (employeeStatusFilter === 'active' && !emp.isFired) ||
                (employeeStatusFilter === 'fired' && emp.isFired) ||
                (employeeStatusFilter === 'admin' && emp.isAdmin);
              const matchesSearch =
                employeeSearchQuery === '' ||
                emp.name.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                emp.position.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                emp.department.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                (emp.email && emp.email.toLowerCase().includes(employeeSearchQuery.toLowerCase()));
              return matchesStatus && matchesSearch;
            }).map((employee) => (
              <Card
                key={employee.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onViewEmployee(employee)}
              >
                <CardHeader>
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                      <AvatarImage src={employee.avatar} />
                      <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                        <CardTitle className="text-base sm:text-lg truncate">{employee.name}</CardTitle>
                        {employee.isFired
                          ? <Badge variant="destructive" className="text-xs">Уволен</Badge>
                          : employee.isAdmin
                            ? <Badge className="text-xs bg-purple-600 hover:bg-purple-600">Администратор</Badge>
                            : <Badge variant="secondary" className="text-xs">Действующий</Badge>
                        }
                        <Badge variant="outline" className="bg-primary/10 text-xs hidden sm:inline-flex">
                          <Icon name="Trophy" size={12} className="mr-1" />
                          #{calculateEmployeeRank(employee)}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs sm:text-sm truncate">{employee.position} • {employee.department}</CardDescription>
                    </div>
                    <div className="hidden sm:flex flex-row gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenChat(employee);
                        }}
                        className="flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        <span className="sm:mr-1">💬</span>
                        <span className="hidden sm:inline">Написать</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEmployee(employee);
                        }}
                        className="flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        <span>✏️</span>
                      </Button>
                      <Dialog open={showEditRolesDialog && employeeToEditRoles?.id === employee.id} onOpenChange={(open) => {
                        if (!open) {
                          onEditRolesDialogChange(false);
                          onSetEmployeeToEditRoles(null);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            onSetEmployeeToEditRoles(employee);
                            onRolesFormChange({ isAdmin: employee.isAdmin || false });
                            onEditRolesDialogChange(true);
                          }} className="flex-1 sm:flex-none text-xs sm:text-sm">
                            <span>🛡️</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Управление ролями: {employee.name}</DialogTitle>
                            <DialogDescription>Назначьте права доступа сотруднику</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            {currentUserRole === 'admin' && (
                              <>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Label>Администратор</Label>
                                    <p className="text-xs text-muted-foreground">Полный доступ к системе</p>
                                  </div>
                                  <Checkbox
                                    checked={rolesForm.isAdmin}
                                    onCheckedChange={(checked) => onRolesFormChange({ ...rolesForm, isAdmin: checked as boolean })}
                                  />
                                </div>
                                <div className="border-t pt-4">
                                  <Button
                                    variant={employeeToEditRoles?.isFired ? "outline" : "destructive"}
                                    className="w-full"
                                    onClick={() => {
                                      if (employeeToEditRoles) {
                                        onEditRolesDialogChange(false);
                                        onFireEmployee(employeeToEditRoles);
                                      }
                                    }}
                                  >
                                    <Icon name={employeeToEditRoles?.isFired ? "UserCheck" : "UserX"} size={16} className="mr-2" />
                                    {employeeToEditRoles?.isFired ? 'Восстановить сотрудника' : 'Уволить сотрудника'}
                                  </Button>
                                </div>
                              </>
                            )}
                            <Button className="w-full" onClick={onSaveRoles}>Сохранить</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <div className="flex sm:hidden flex-wrap gap-1 sm:gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChat(employee);
                      }}
                      className="flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      <Icon name="MessageCircle" className="sm:mr-1" size={16} />
                      <span className="hidden sm:inline">Написать</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEmployee(employee);
                      }}
                      className="flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      <Icon name="Edit" size={16} />
                    </Button>
                    <Dialog open={showEditRolesDialog && employeeToEditRoles?.id === employee.id} onOpenChange={(open) => {
                      if (!open) {
                        onEditRolesDialogChange(false);
                        onSetEmployeeToEditRoles(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          onSetEmployeeToEditRoles(employee);
                          onRolesFormChange({ isAdmin: employee.isAdmin || false });
                          onEditRolesDialogChange(true);
                        }} className="flex-1 sm:flex-none text-xs sm:text-sm">
                          <Icon name="Shield" size={16} />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Управление ролями: {employee.name}</DialogTitle>
                          <DialogDescription>Назначьте права доступа сотруднику</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          {currentUserRole === 'admin' && (
                            <>
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label>Администратор</Label>
                                  <p className="text-xs text-muted-foreground">Полный доступ к системе</p>
                                </div>
                                <Checkbox
                                  checked={rolesForm.isAdmin}
                                  onCheckedChange={(checked) => onRolesFormChange({ ...rolesForm, isAdmin: checked as boolean })}
                                />
                              </div>
                              <div className="border-t pt-4">
                                <Button
                                  variant={employeeToEditRoles?.isFired ? "outline" : "destructive"}
                                  className="w-full"
                                  onClick={() => {
                                    if (employeeToEditRoles) {
                                      onEditRolesDialogChange(false);
                                      onFireEmployee(employeeToEditRoles);
                                    }
                                  }}
                                >
                                  <Icon name={employeeToEditRoles?.isFired ? "UserCheck" : "UserX"} size={16} className="mr-2" />
                                  {employeeToEditRoles?.isFired ? 'Восстановить сотрудника' : 'Уволить сотрудника'}
                                </Button>
                              </div>
                            </>
                          )}
                          <Button className="w-full" onClick={onSaveRoles}>Сохранить</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Badge variant="outline" className="mt-2">Уровень {employee.level}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-primary">{employee.recommendations}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">Реком.</div>
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-green-600">{employee.hired}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">Нанято</div>
                    </div>
                    <div>
                      <div className="text-base sm:text-xl font-bold text-secondary truncate">{employee.earnings.toLocaleString()} ₽</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">Зараб.</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default EmployeesTab;
