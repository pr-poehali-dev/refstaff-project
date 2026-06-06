import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import { User } from './adminTypes';

interface Props {
  users: User[];
  search: string;
  setSearch: (v: string) => void;
  loadUsers: (q?: string) => void;
  showUserDialog: boolean;
  setShowUserDialog: (v: boolean) => void;
  selectedUser: User | null;
  setSelectedUser: (u: User | null) => void;
  userForm: { first_name: string; last_name: string; position: string; is_admin: boolean; is_fired: boolean };
  setUserForm: (f: { first_name: string; last_name: string; position: string; is_admin: boolean; is_fired: boolean }) => void;
  handleUpdateUser: () => void;
}

export default function AdminUsersTab({
  users, search, setSearch, loadUsers,
  showUserDialog, setShowUserDialog,
  selectedUser, setSelectedUser,
  userForm, setUserForm,
  handleUpdateUser,
}: Props) {
  return (
    <>
      <TabsContent value="users">
        <div className="space-y-4">
          <div className="flex gap-2 max-w-sm">
            <Input
              placeholder="Email, имя или фамилия..."
              className="bg-gray-800 border-gray-700 text-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadUsers(search)}
            />
            <Button onClick={() => loadUsers(search)} size="sm">Найти</Button>
          </div>
          <div className="space-y-3">
            {users.map(u => (
              <Card
                key={u.id}
                className="bg-gray-900 border-gray-800 hover:border-gray-600 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedUser(u);
                  setUserForm({ first_name: u.first_name, last_name: u.last_name, position: u.position || '', is_admin: u.is_admin, is_fired: u.is_fired });
                  setShowUserDialog(true);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-white">{u.first_name} {u.last_name}</p>
                      <p className="text-gray-400 text-xs">{u.email}</p>
                      {u.company_name && <p className="text-gray-500 text-xs mt-0.5">🏢 {u.company_name}</p>}
                      <div className="flex gap-3 mt-2 text-xs text-gray-400">
                        <span>🎯 {u.total_recommendations} рек.</span>
                        <span>✅ {u.successful_hires} найм.</span>
                        <span>💰 {Number(u.wallet_balance).toLocaleString()} ₽</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {u.is_admin && <Badge className="bg-blue-600 text-white text-xs">Админ</Badge>}
                      {u.is_fired && <Badge variant="destructive" className="text-xs">Уволен</Badge>}
                      <span className="text-gray-500 text-xs">{u.role}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {users.length === 0 && <p className="text-gray-400 text-sm">Введите запрос для поиска сотрудников</p>}
          </div>
        </div>
      </TabsContent>

      {/* USER EDIT DIALOG */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-sm bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Редактировать сотрудника</DialogTitle>
            <DialogDescription className="text-gray-400">{selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-gray-400 text-xs">Имя</Label>
                <Input className="bg-gray-800 border-gray-700 text-white mt-1" value={userForm.first_name}
                  onChange={e => setUserForm({ ...userForm, first_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Фамилия</Label>
                <Input className="bg-gray-800 border-gray-700 text-white mt-1" value={userForm.last_name}
                  onChange={e => setUserForm({ ...userForm, last_name: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Должность</Label>
              <Input className="bg-gray-800 border-gray-700 text-white mt-1" value={userForm.position}
                onChange={e => setUserForm({ ...userForm, position: e.target.value })} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={userForm.is_admin} onChange={e => setUserForm({ ...userForm, is_admin: e.target.checked })} />
                <span className="text-sm text-gray-300">Администратор</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={userForm.is_fired} onChange={e => setUserForm({ ...userForm, is_fired: e.target.checked })} />
                <span className="text-sm text-gray-300">Уволен</span>
              </label>
            </div>
            {selectedUser && (
              <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400 space-y-1">
                <p>Рекомендаций: {selectedUser.total_recommendations} · Найм: {selectedUser.successful_hires}</p>
                <p>Баланс: {Number(selectedUser.wallet_balance).toLocaleString()} ₽ · В ожидании: {Number(selectedUser.wallet_pending).toLocaleString()} ₽</p>
                <p>Зарегистрирован: {new Date(selectedUser.created_at).toLocaleDateString('ru-RU')}</p>
              </div>
            )}
            <Button className="w-full" onClick={handleUpdateUser}>Сохранить</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
