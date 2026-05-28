import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';

const TESTS_URL = 'https://functions.poehali.dev/27e0dd10-7f74-4b7f-8c57-1dbc05cafa17';

interface Question {
  id: number;
  text: string;
  options: string[];
}

interface TestData {
  id: number;
  title: string;
  difficulty: string;
  questions_count: number;
  questions: Question[];
  vacancy_title: string;
  department: string;
  salary_display: string;
  company_name: string;
  company_logo: string | null;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Лёгкий',
  medium: 'Средний',
  hard: 'Сложный',
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

export default function VacancyTest() {
  const { token } = useParams<{ token: string }>();

  const [step, setStep] = useState<'info' | 'test' | 'done'>('info');
  const [test, setTest] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState<{ score: number; total_questions: number; percentage: number } | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${TESTS_URL}?action=public&token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setTest(d);
      })
      .catch(() => setError('Ошибка загрузки теста'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleStart = () => {
    if (!name.trim()) return;
    setStep('test');
    setCurrentQ(0);
  };

  const handleSelect = (qId: number, idx: number) => {
    setAnswers(prev => ({ ...prev, [qId]: idx }));
  };

  const handleSubmit = async () => {
    if (!test) return;
    setSubmitting(true);
    const answersArr = Object.entries(answers).map(([qId, idx]) => ({
      question_id: Number(qId),
      selected_index: idx,
    }));
    try {
      const r = await fetch(`${TESTS_URL}?action=submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, candidate_name: name, candidate_email: email, candidate_phone: phone, answers: answersArr }),
      });
      const data = await r.json();
      setResult(data);
      setStep('done');
    } catch {
      setError('Ошибка отправки');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Загружаем тест...</p>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Icon name="AlertCircle" size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-semibold">Тест не найден</h2>
          <p className="text-muted-foreground">{error || 'Ссылка недействительна или тест был деактивирован'}</p>
        </div>
      </div>
    );
  }

  const questions = test.questions || [];
  const answered = Object.keys(answers).length;
  const progress = questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Шапка */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {test.company_logo && (
              <img src={test.company_logo} alt={test.company_name} className="w-10 h-10 rounded-lg object-contain border" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{test.company_name}</p>
              <h1 className="font-semibold text-sm sm:text-base truncate">{test.vacancy_title}</h1>
              {test.department && <p className="text-xs text-muted-foreground">{test.department}</p>}
            </div>
            <Badge className={`text-xs shrink-0 ${DIFFICULTY_COLOR[test.difficulty] || ''}`}>
              {DIFFICULTY_LABEL[test.difficulty] || test.difficulty}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Шаг 1 — Ввод данных */}
        {step === 'info' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Icon name="ClipboardList" size={28} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-bold">Тест на вакансию</h2>
              <p className="text-muted-foreground text-sm">
                {questions.length} вопросов · {DIFFICULTY_LABEL[test.difficulty] || test.difficulty} уровень
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">ФИО <span className="text-red-500">*</span></Label>
                <Input id="name" placeholder="Иванов Иван Иванович" value={name} onChange={e => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="phone">Номер телефона <span className="text-red-500">*</span></Label>
                <Input id="phone" placeholder="+7 (999) 999-99-99" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email">Email <span className="text-muted-foreground text-xs">(по желанию)</span></Label>
                <Input id="email" type="email" placeholder="example@mail.ru" value={email} onChange={e => setEmail(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 space-y-1">
              <p className="font-medium flex items-center gap-1.5"><Icon name="Info" size={14} /> Как проходит тест</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                <li>Выберите один ответ на каждый вопрос</li>
                <li>Можно вернуться и изменить ответ</li>
                <li>После отправки результат нельзя изменить</li>
              </ul>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleStart}
              disabled={!name.trim() || !phone.trim()}
            >
              Начать тест
              <Icon name="ArrowRight" size={16} className="ml-2" />
            </Button>
          </div>
        )}

        {/* Шаг 2 — Вопросы */}
        {step === 'test' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Отвечено: {answered} из {questions.length}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="space-y-3">
              {questions.map((q, qi) => (
                <div
                  key={q.id}
                  className={`bg-white rounded-2xl shadow-sm border p-5 space-y-3 transition-all ${answers[q.id] !== undefined ? 'border-blue-200' : ''}`}
                >
                  <p className="font-medium text-sm sm:text-base">
                    <span className="text-muted-foreground mr-2">{qi + 1}.</span>{q.text}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <button
                        key={oi}
                        onClick={() => handleSelect(q.id, oi)}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all
                          ${answers[q.id] === oi
                            ? 'bg-blue-50 border-blue-400 font-medium text-blue-800'
                            : 'hover:bg-slate-50 border-slate-200'
                          }`}
                      >
                        <span className="font-semibold mr-2 text-muted-foreground">
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-3">
              {answered < questions.length && (
                <p className="text-sm text-amber-600 flex items-center gap-1.5">
                  <Icon name="AlertCircle" size={14} />
                  Не отвечено на {questions.length - answered} {questions.length - answered === 1 ? 'вопрос' : 'вопроса'}
                </p>
              )}
              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={submitting || answered < questions.length}
              >
                {submitting ? 'Отправляем...' : 'Завершить и отправить тест'}
                <Icon name="Send" size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Шаг 3 — Результат */}
        {step === 'done' && result && (
          <div className="bg-white rounded-2xl shadow-sm border p-8 text-center space-y-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${result.percentage >= 70 ? 'bg-green-100' : result.percentage >= 40 ? 'bg-yellow-100' : 'bg-red-100'}`}>
              <Icon
                name={result.percentage >= 70 ? 'Trophy' : result.percentage >= 40 ? 'ThumbsUp' : 'RefreshCw'}
                size={36}
                className={result.percentage >= 70 ? 'text-green-600' : result.percentage >= 40 ? 'text-yellow-600' : 'text-red-500'}
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Тест завершён!</h2>
              <p className="text-muted-foreground">Ваш результат</p>
              <div className="text-5xl font-bold text-blue-600">{result.percentage}%</div>
              <p className="text-muted-foreground text-sm">
                Правильных ответов: {result.score} из {result.total_questions}
              </p>
            </div>
            <p className="text-sm text-muted-foreground bg-slate-50 rounded-xl p-4">
              Спасибо, {name}! Ваши ответы переданы работодателю. Ожидайте обратной связи.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
