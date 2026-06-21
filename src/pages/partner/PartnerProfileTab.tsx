import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TabsContent } from '@/components/ui/tabs';

interface EditProfile {
  name: string;
  email: string;
  phone: string;
  payment_method: string;
  payment_details: string;
  inn: string;
  company_name: string;
  notes: string;
}

interface Props {
  editProfile: EditProfile;
  setEditProfile: (fn: (p: EditProfile) => EditProfile) => void;
  savingProfile: boolean;
  onSave: () => void;
}

export default function PartnerProfileTab({ editProfile, setEditProfile, savingProfile, onSave }: Props) {
  return (
    <TabsContent value="profile" className="mt-3">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Личные данные и реквизиты</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Имя *</Label>
              <Input value={editProfile.name} onChange={e => setEditProfile(p => ({ ...p, name: e.target.value }))} placeholder="Иванова Анна" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={editProfile.email} onChange={e => setEditProfile(p => ({ ...p, email: e.target.value }))} placeholder="anna@example.com" />
            </div>
            <div>
              <Label>Телефон</Label>
              <Input value={editProfile.phone} onChange={e => setEditProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+7 900 000 00 00" />
            </div>
            <div>
              <Label>ИНН (если ИП или ООО)</Label>
              <Input value={editProfile.inn} onChange={e => setEditProfile(p => ({ ...p, inn: e.target.value }))} placeholder="123456789012" />
            </div>
            <div className="sm:col-span-2">
              <Label>Название компании / ИП</Label>
              <Input value={editProfile.company_name} onChange={e => setEditProfile(p => ({ ...p, company_name: e.target.value }))} placeholder="ИП Иванова А.С." />
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Реквизиты для выплат</p>
            <div className="space-y-3">
              <div>
                <Label>Способ получения</Label>
                <Input value={editProfile.payment_method} onChange={e => setEditProfile(p => ({ ...p, payment_method: e.target.value }))} placeholder="СБП / Карта / Расчётный счёт" />
              </div>
              <div>
                <Label>Реквизиты</Label>
                <Textarea
                  value={editProfile.payment_details}
                  onChange={e => setEditProfile(p => ({ ...p, payment_details: e.target.value }))}
                  placeholder="Номер карты, телефон СБП или полные банковские реквизиты"
                  rows={3}
                />
              </div>
              <div>
                <Label>Дополнительно</Label>
                <Textarea
                  value={editProfile.notes}
                  onChange={e => setEditProfile(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Любые уточнения по выплатам"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <Button className="w-full" onClick={onSave} disabled={savingProfile || !editProfile.name}>
            {savingProfile ? 'Сохраняем...' : 'Сохранить профиль'}
          </Button>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
