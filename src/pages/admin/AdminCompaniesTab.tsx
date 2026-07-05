import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Company, User, daysLeft } from './adminTypes';

interface CompanyVacancy {
  id: number;
  title: string;
  department?: string;
  status: string;
  recs_count?: number;
}

interface CompanyDetail extends Company {
  users?: User[];
  vacancies?: CompanyVacancy[];
  description?: string;
  website?: string;
  industry?: string;
}

function SubBadge({ expiresAt, tier }: { expiresAt?: string; tier?: string }) {
  const days = daysLeft(expiresAt);
  if (days <= 0) return <Badge variant="destructive">Истекла</Badge>;
  if (days <= 7) return <Badge className="bg-orange-500 text-white">{days} дн.</Badge>;
  return <Badge variant="secondary">{tier === 'trial' ? 'Пробный' : 'Продвинутый'} · {days} дн.</Badge>;
}

interface Props {
  companies: Company[];
  selectedCompany: CompanyDetail | null;
  showCompanyDialog: boolean;
  setShowCompanyDialog: (v: boolean) => void;
  showSubDialog: boolean;
  setShowSubDialog: (v: boolean) => void;
  subForm: { company_id: number; tier: string; days: string };
  setSubForm: (f: { company_id: number; tier: string; days: string }) => void;
  showUserDialog: boolean;
  setShowUserDialog: (v: boolean) => void;
  setSelectedUser: (u: User | null) => void;
  setUserForm: (f: { first_name: string; last_name: string; position: string; is_admin: boolean; is_fired: boolean }) => void;
  loadCompanies: () => void;
  loadCompanyDetail: (id: number) => void;
  handleExtendSub: () => void;
  handleCancelSub: () => void;
}

export default function AdminCompaniesTab({
  companies, selectedCompany,
  showCompanyDialog, setShowCompanyDialog,
  showSubDialog, setShowSubDialog,
  subForm, setSubForm,
  setShowUserDialog, setSelectedUser, setUserForm,
  loadCompanies, loadCompanyDetail,
  handleExtendSub, handleCancelSub,
}: Props) {
  return (
    <>
      <TabsContent value="companies">
        <div className="space-y-4">
          <Input
            placeholder="Поиск компании..."
            className="bg-gray-800 border-gray-700 text-white max-w-sm"
            onChange={e => {
              const q = e.target.value.toLowerCase();
              loadCompanies();
              if (q) {
                // фильтрация происходит в родителе через setCompanies
              }
            }}
          />
          <div className="space-y-3">
            {companies.map(c => (
              <Card
                key={c.id}
                className="bg-gray-900 border-gray-800 hover:border-gray-600 transition-colors cursor-pointer"
                onClick={() => loadCompanyDetail(c.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-white">{c.name}</p>
                      {c.inn && <p className="text-gray-400 text-xs mt-0.5">ИНН: {c.inn}</p>}
                      <div className="flex gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Icon name="Users" size={12} />{c.users_count} польз.</span>
                        <span className="flex items-center gap-1"><Icon name="Briefcase" size={12} />{c.vacancies_count} вакансий</span>
                        <span className="flex items-center gap-1"><Icon name="Target" size={12} />{c.recommendations_count} рек.</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <SubBadge expiresAt={c.subscription_expires_at} tier={c.subscription_tier} />
                      <p className="text-gray-500 text-xs">{new Date(c.created_at).toLocaleDateString('ru-RU')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </TabsContent>

      {/* COMPANY DETAIL DIALOG */}
      <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
          {selectedCompany && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">{selectedCompany.company?.name}</DialogTitle>
                <DialogDescription className="text-gray-400">
                  ИНН: {selectedCompany.company?.inn || '—'} · Зарегистрирована: {selectedCompany.company?.created_at ? new Date(selectedCompany.company.created_at).toLocaleDateString('ru-RU') : '—'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Пользователей', value: selectedCompany.users?.length },
                    { label: 'Вакансий', value: selectedCompany.vacancies?.length },
                    { label: 'Нанято', value: selectedCompany.company?.hired_count || 0 },
                    { label: 'Выплачено', value: `${Number(selectedCompany.company?.total_payouts || 0).toLocaleString()} ₽` },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-800 rounded-lg p-3">
                      <p className="text-gray-400 text-xs">{s.label}</p>
                      <p className="text-white font-bold text-lg">{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                  <div>
                    <p className="text-gray-400 text-xs">Подписка</p>
                    <p className="text-white font-medium">{selectedCompany.company?.subscription_tier === 'trial' ? 'Пробный период' : 'Продвинутый'}</p>
                    {selectedCompany.company?.subscription_expires_at && (
                      <p className="text-gray-400 text-xs">До: {new Date(selectedCompany.company.subscription_expires_at).toLocaleDateString('ru-RU')}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" onClick={handleCancelSub}>Отменить</Button>
                    <Button size="sm" onClick={() => { setSubForm({ company_id: selectedCompany.company.id, tier: 'advanced', days: '30' }); setShowSubDialog(true); }}>Продлить</Button>
                  </div>
                </div>

                {selectedCompany.users?.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Сотрудники</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedCompany.users.map((u: User) => (
                        <div
                          key={u.id}
                          className="bg-gray-800 rounded-lg p-2 flex items-center justify-between cursor-pointer hover:bg-gray-700"
                          onClick={() => { setSelectedUser(u); setUserForm({ first_name: u.first_name, last_name: u.last_name, position: u.position || '', is_admin: u.is_admin, is_fired: u.is_fired }); setShowUserDialog(true); }}
                        >
                          <div>
                            <p className="text-white text-sm">{u.first_name} {u.last_name}</p>
                            <p className="text-gray-400 text-xs">{u.email}</p>
                          </div>
                          <div className="flex gap-1">
                            {u.is_admin && <Badge className="bg-blue-600 text-white text-xs">Админ</Badge>}
                            {u.is_fired && <Badge variant="destructive" className="text-xs">Уволен</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCompany.vacancies?.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Вакансии</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedCompany.vacancies.map((v) => (
                        <div key={v.id} className="bg-gray-800 rounded-lg p-2 flex items-center justify-between">
                          <div>
                            <p className="text-white text-sm">{v.title}</p>
                            <p className="text-gray-400 text-xs">{v.department}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs flex items-center gap-1"><Icon name="Target" size={12} />{v.recs_count}</span>
                            <Badge variant={v.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                              {v.status === 'active' ? 'Активна' : 'Архив'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* SUBSCRIPTION DIALOG */}
      <Dialog open={showSubDialog} onOpenChange={setShowSubDialog}>
        <DialogContent className="max-w-sm bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Продление подписки</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-gray-400 text-sm">Тариф</Label>
              <Select value={subForm.tier} onValueChange={v => setSubForm({ ...subForm, tier: v })}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="trial">Пробный период</SelectItem>
                  <SelectItem value="advanced">Продвинутый</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Период (дней)</Label>
              <Select value={subForm.days} onValueChange={v => setSubForm({ ...subForm, days: v })}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="14">14 дней (пробный)</SelectItem>
                  <SelectItem value="30">30 дней</SelectItem>
                  <SelectItem value="90">90 дней</SelectItem>
                  <SelectItem value="180">180 дней</SelectItem>
                  <SelectItem value="365">365 дней (1 год)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleExtendSub}>Применить</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}