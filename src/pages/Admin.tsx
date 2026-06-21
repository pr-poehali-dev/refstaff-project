import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

import { adminFetch, Analytics, Company, User } from './admin/adminTypes';
import AdminAnalyticsTab from './admin/AdminAnalyticsTab';
import AdminCompaniesTab from './admin/AdminCompaniesTab';
import AdminUsersTab from './admin/AdminUsersTab';
import AdminBlogTab from './admin/AdminBlogTab';
import AdminPartnersTab from './admin/AdminPartnersTab';

export default function Admin() {
  const [secret, setSecret] = useState(() => localStorage.getItem('admin_secret') || '');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Record<string, unknown> | null>(null);
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [showSubDialog, setShowSubDialog] = useState(false);
  const [subForm, setSubForm] = useState({ company_id: 0, tier: 'advanced', days: '30' });
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ first_name: '', last_name: '', position: '', is_admin: false, is_fired: false });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');

  const handleLogin = async () => {
    if (!secret.trim()) { setAuthError('Введите секретный ключ'); return; }
    setLoading(true);
    try {
      const data = await adminFetch(secret, '?resource=analytics');
      if (data.error) { setAuthError('Неверный ключ'); return; }
      localStorage.setItem('admin_secret', secret);
      setAuthed(true);
      setAnalytics(data);
    } catch { setAuthError('Ошибка соединения'); }
    finally { setLoading(false); }
  };

  const loadCompanies = async () => {
    const data = await adminFetch(secret, '?resource=companies');
    if (Array.isArray(data)) setCompanies(data);
  };

  const loadUsers = async (q = '') => {
    const data = await adminFetch(secret, `?resource=users${q ? `&search=${q}` : ''}`);
    if (Array.isArray(data)) setUsers(data);
  };

  const loadCompanyDetail = async (id: number) => {
    const data = await adminFetch(secret, `?resource=company&company_id=${id}`);
    setSelectedCompany(data);
    setShowCompanyDialog(true);
  };

  const handleExtendSub = async () => {
    await adminFetch(secret, '?resource=company_subscription', 'PUT', subForm);
    setShowSubDialog(false);
    loadCompanies();
    if (selectedCompany) loadCompanyDetail(subForm.company_id);
    alert('✅ Подписка обновлена');
  };

  const handleCancelSub = async () => {
    if (!selectedCompany) return;
    if (!confirm('Отменить подписку компании? Доступ будет ограничен.')) return;
    await adminFetch(secret, '?resource=company_subscription', 'PUT', { company_id: selectedCompany.company.id, tier: 'none', days: '0' });
    loadCompanies();
    loadCompanyDetail(selectedCompany.company.id);
    alert('✅ Подписка отменена');
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    await adminFetch(secret, '?resource=user', 'PUT', { user_id: selectedUser.id, ...userForm });
    setShowUserDialog(false);
    if (selectedCompany?.company?.id) loadCompanyDetail(selectedCompany.company.id);
    else loadUsers(search);
    alert('✅ Данные сотрудника обновлены');
  };

  useEffect(() => {
    if (authed && activeTab === 'companies') loadCompanies();
    if (authed && activeTab === 'users') loadUsers(search);
  }, [authed, activeTab]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm bg-gray-900 border-gray-800">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-2">
              <Icon name="ShieldCheck" size={24} className="text-white" />
            </div>
            <CardTitle className="text-white">Admin Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="password"
              placeholder="Секретный ключ"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="bg-gray-800 border-gray-700 text-white"
            />
            {authError && <p className="text-destructive text-sm">{authError}</p>}
            <Button className="w-full" onClick={handleLogin} disabled={loading}>
              {loading ? <Icon name="Loader2" className="animate-spin mr-2" size={16} /> : null}
              Войти
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="ShieldCheck" size={20} className="text-primary" />
          <span className="font-bold">iHUNT Admin</span>
        </div>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white"
          onClick={() => { localStorage.removeItem('admin_secret'); setAuthed(false); setSecret(''); }}>
          <Icon name="LogOut" size={16} className="mr-1" />
          Выйти
        </Button>
      </header>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800 border border-gray-700 mb-6">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary">📊 Аналитика</TabsTrigger>
            <TabsTrigger value="companies" className="data-[state=active]:bg-primary">🏢 Компании</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary">👥 Сотрудники</TabsTrigger>
            <TabsTrigger value="blog" className="data-[state=active]:bg-primary">📝 Блог</TabsTrigger>
            <TabsTrigger value="partners" className="data-[state=active]:bg-primary">🤝 Партнёры</TabsTrigger>
          </TabsList>

          <AdminAnalyticsTab analytics={analytics} />

          <AdminCompaniesTab
            companies={companies}
            selectedCompany={selectedCompany}
            showCompanyDialog={showCompanyDialog}
            setShowCompanyDialog={setShowCompanyDialog}
            showSubDialog={showSubDialog}
            setShowSubDialog={setShowSubDialog}
            subForm={subForm}
            setSubForm={setSubForm}
            showUserDialog={showUserDialog}
            setShowUserDialog={setShowUserDialog}
            setSelectedUser={setSelectedUser}
            setUserForm={setUserForm}
            loadCompanies={loadCompanies}
            loadCompanyDetail={loadCompanyDetail}
            handleExtendSub={handleExtendSub}
            handleCancelSub={handleCancelSub}
          />

          <AdminUsersTab
            users={users}
            search={search}
            setSearch={setSearch}
            loadUsers={loadUsers}
            showUserDialog={showUserDialog}
            setShowUserDialog={setShowUserDialog}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            userForm={userForm}
            setUserForm={setUserForm}
            handleUpdateUser={handleUpdateUser}
          />

          <AdminBlogTab secret={secret} />
          <AdminPartnersTab secret={secret} />
        </Tabs>
      </div>
    </div>
  );
}