import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

function EmployeeRegister() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const companyId = searchParams.get('company');
  const token = searchParams.get('token');

  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    position: '',
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadCompanyInfo = async () => {
      if (!companyId || !token) {
        alert('Неверная ссылка для регистрации');
        navigate('/');
        return;
      }

      try {
        const response = await fetch(`https://functions.poehali.dev/30d9dba4-a499-4866-8ccc-ea7addf62b16/?resource=company&company_id=${companyId}`);
        if (response.ok) {
          const data = await response.json();
          setCompanyName(data.name);
        } else {
          alert('Компания не найдена');
          navigate('/');
        }
      } catch (error) {
        console.error('Ошибка загрузки данных компании:', error);
        alert('Не удалось загрузить данные компании');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanyInfo();
  }, [companyId, token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.position || !formData.email || !formData.password) {
      alert('Заполните все поля');
      return;
    }

    if (formData.password.length < 8) {
      alert('Пароль должен быть минимум 8 символов');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('https://functions.poehali.dev/acbe95f3-fa47-4ba2-bd00-aba68c67fafa', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_employee',
          company_id: companyId,
          invite_token: token,
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          position: formData.position
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userRole', 'employee');
        alert('Регистрация успешна! Добро пожаловать в команду.');
        navigate('/');
      } else {
        alert(data.error || 'Ошибка регистрации');
      }
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      alert('Не удалось зарегистрироваться');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="text-center">
          <Icon name="Loader2" className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Icon name="Rocket" className="text-primary" size={32} />
            <span className="text-2xl font-bold">iHUNT</span>
          </div>
          <CardTitle className="text-2xl">Регистрация сотрудника</CardTitle>
          <CardDescription>
            Вы регистрируетесь как сотрудник компании <strong>{companyName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Имя *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Иван"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Фамилия *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Иванов"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Должность *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Менеджер по продажам"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ivan@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Минимум 8 символов"
                required
                minLength={8}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Icon name="Loader2" className="mr-2 animate-spin" size={18} />
                  Регистрация...
                </>
              ) : (
                <>
                  <Icon name="UserPlus" className="mr-2" size={18} />
                  Зарегистрироваться
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Нажимая кнопку, вы соглашаетесь с условиями использования платформы
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default EmployeeRegister;
