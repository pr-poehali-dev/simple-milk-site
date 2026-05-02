import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';

const NAV = [
  { id: 'home', label: 'Главная', icon: 'Home' },
  { id: 'tasks', label: 'Задания', icon: 'Sparkles' },
];

const HEROES = [
  { emoji: '🦊', name: 'Лисёнок Ру', color: 'bg-pop' },
  { emoji: '🐼', name: 'Панда Бо', color: 'bg-bubble' },
  { emoji: '🦄', name: 'Юни', color: 'bg-grape' },
  { emoji: '🐸', name: 'Квак', color: 'bg-grass' },
];

type Task = {
  id: string;
  title: string;
  emoji: string;
  color: string;
  reward: number;
  type: 'memory' | 'click' | 'quiz';
};

const TASKS: Task[] = [
  { id: 't1', title: 'Поймай звёзды', emoji: '⭐', color: 'bg-sun', reward: 50, type: 'click' },
  { id: 't2', title: 'Найди пары', emoji: '🧠', color: 'bg-candy', reward: 80, type: 'memory' },
  { id: 't3', title: 'Угадай животное', emoji: '🦁', color: 'bg-grass', reward: 30, type: 'quiz' },
];

function StarCatcher({ onWin }: { onWin: (pts: number) => void }) {
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(15);
  const [stars, setStars] = useState<{ id: number; x: number; y: number; e: string }[]>([]);
  const [running, setRunning] = useState(false);
  const idRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTime((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    const spawn = setInterval(() => {
      setStars((prev) => [
        ...prev,
        {
          id: ++idRef.current,
          x: Math.random() * 86 + 2,
          y: Math.random() * 70 + 8,
          e: ['⭐', '🌟', '✨', '💫'][Math.floor(Math.random() * 4)],
        },
      ]);
    }, 600);
    return () => clearInterval(spawn);
  }, [running]);

  useEffect(() => {
    if (time <= 0 && running) {
      setRunning(false);
      if (score > 0) onWin(score);
    }
  }, [time, running, score, onWin]);

  const start = () => {
    setScore(0);
    setTime(15);
    setStars([]);
    setRunning(true);
  };

  const catchStar = (id: number) => {
    setStars((s) => s.filter((x) => x.id !== id));
    setScore((sc) => sc + 10);
  };

  return (
    <div className="relative h-72 rounded-3xl bg-gradient-to-br from-bubble via-grape to-candy overflow-hidden border-4 border-foreground shadow-comic">
      <div className="absolute top-3 left-4 bg-white/95 px-4 py-1.5 rounded-full font-bold text-foreground border-2 border-foreground z-10">
        🏆 {score}
      </div>
      <div className="absolute top-3 right-4 bg-sun px-4 py-1.5 rounded-full font-bold text-foreground border-2 border-foreground z-10">
        ⏱ {time}s
      </div>
      {!running && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <button
            onClick={start}
            className="btn-press bg-sun text-foreground font-display text-2xl px-8 py-4 rounded-2xl border-4 border-foreground shadow-comic hover:scale-105 transition"
          >
            {time === 0 && score > 0 ? `Ещё раз! +${score}` : 'Поехали!'}
          </button>
        </div>
      )}
      {running &&
        stars.map((s) => (
          <button
            key={s.id}
            onClick={() => catchStar(s.id)}
            className="absolute text-4xl animate-pop-in hover:scale-125 transition"
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
          >
            {s.e}
          </button>
        ))}
    </div>
  );
}

function MemoryGame({ onWin }: { onWin: (pts: number) => void }) {
  const emojis = ['🍭', '🎈', '🧸', '🎨', '🚀', '🦖'];
  const build = () =>
    [...emojis, ...emojis]
      .map((e) => ({ e, k: Math.random() }))
      .sort((a, b) => a.k - b.k)
      .map((x, i) => ({ id: i, e: x.e, open: false, done: false }));

  const initial = useMemo(build, []);
  const [cards, setCards] = useState(initial);
  const [picked, setPicked] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [reported, setReported] = useState(false);

  const flip = (id: number) => {
    if (picked.length === 2) return;
    if (cards[id].open || cards[id].done) return;
    const next = cards.map((c) => (c.id === id ? { ...c, open: true } : c));
    setCards(next);
    const newPicked = [...picked, id];
    setPicked(newPicked);
    if (newPicked.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newPicked;
      if (next[a].e === next[b].e) {
        setTimeout(() => {
          setCards((cs) => cs.map((c) => (c.id === a || c.id === b ? { ...c, done: true } : c)));
          setPicked([]);
        }, 400);
      } else {
        setTimeout(() => {
          setCards((cs) => cs.map((c) => (c.id === a || c.id === b ? { ...c, open: false } : c)));
          setPicked([]);
        }, 800);
      }
    }
  };

  const allDone = cards.every((c) => c.done);
  useEffect(() => {
    if (allDone && !reported) {
      setReported(true);
      onWin(Math.max(20, 80 - moves * 5));
    }
  }, [allDone, moves, reported, onWin]);

  const reset = () => {
    setCards(build());
    setPicked([]);
    setMoves(0);
    setReported(false);
  };

  return (
    <div className="rounded-3xl bg-white border-4 border-foreground shadow-comic p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="font-bold">Ходы: {moves}</span>
        <button
          onClick={reset}
          className="btn-press bg-candy text-white font-bold px-4 py-1.5 rounded-full border-2 border-foreground shadow-comic-sm"
        >
          ↻ Заново
        </button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => flip(c.id)}
            className={`aspect-square rounded-2xl border-4 border-foreground flex items-center justify-center text-3xl md:text-4xl font-bold transition-all ${
              c.done
                ? 'bg-grass scale-95 opacity-70'
                : c.open
                ? 'bg-sun'
                : 'bg-grape text-grape hover:scale-105'
            }`}
          >
            {c.open || c.done ? c.e : '?'}
          </button>
        ))}
      </div>
      {allDone && (
        <div className="mt-4 text-center font-display text-2xl text-candy">Ура! Все пары!</div>
      )}
    </div>
  );
}

const QUIZ = [
  { q: 'Кто живёт в Африке и любит бананы?', a: ['🐧 Пингвин', '🐒 Обезьянка', '🐻 Медведь'], r: 1 },
  { q: 'Кто ловит мышей и говорит "мяу"?', a: ['🐶 Собака', '🐱 Кошка', '🐮 Корова'], r: 1 },
  { q: 'Кто плавает в океане и пускает фонтан?', a: ['🐳 Кит', '🦒 Жираф', '🐔 Курица'], r: 0 },
];

function Quiz({ onWin }: { onWin: (pts: number) => void }) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const isRight = i === QUIZ[step].r;
    if (isRight) setCorrect((c) => c + 1);
    setTimeout(() => {
      if (step + 1 < QUIZ.length) {
        setStep(step + 1);
        setPicked(null);
      } else {
        setDone(true);
        onWin((correct + (isRight ? 1 : 0)) * 10);
      }
    }, 900);
  };

  const reset = () => {
    setStep(0);
    setPicked(null);
    setCorrect(0);
    setDone(false);
  };

  if (done) {
    return (
      <div className="rounded-3xl bg-white border-4 border-foreground shadow-comic p-6 text-center">
        <div className="text-6xl mb-3">🎉</div>
        <div className="font-display text-3xl text-grape mb-2">Готово!</div>
        <p className="text-lg mb-4">
          Правильных ответов: <b>{correct}</b> из {QUIZ.length}
        </p>
        <button
          onClick={reset}
          className="btn-press bg-bubble text-white font-bold px-6 py-2.5 rounded-full border-2 border-foreground shadow-comic-sm"
        >
          Сыграть ещё
        </button>
      </div>
    );
  }

  const item = QUIZ[step];
  return (
    <div className="rounded-3xl bg-white border-4 border-foreground shadow-comic p-6">
      <div className="text-sm font-bold text-grape mb-2">
        Вопрос {step + 1} / {QUIZ.length}
      </div>
      <h4 className="font-display text-2xl mb-5">{item.q}</h4>
      <div className="space-y-3">
        {item.a.map((a, i) => {
          const isPicked = picked === i;
          const isRight = picked !== null && i === item.r;
          const isWrong = isPicked && i !== item.r;
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              className={`w-full text-left px-5 py-3 rounded-2xl border-4 border-foreground font-bold text-lg transition ${
                isRight
                  ? 'bg-grass text-white'
                  : isWrong
                  ? 'bg-candy text-white'
                  : 'bg-sun hover:scale-[1.02]'
              }`}
            >
              {a}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const Index = () => {
  const [tab, setTab] = useState<'home' | 'tasks'>('home');
  const [coins, setCoins] = useState(0);
  const [activeGame, setActiveGame] = useState<Task['type'] | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const reward = (pts: number) => {
    setCoins((c) => c + pts);
    setToast(`+${pts} монеток!`);
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute top-10 left-6 text-6xl animate-float">☁️</div>
        <div className="absolute top-32 right-10 text-5xl animate-bounce-slow">🌈</div>
        <div className="absolute bottom-24 left-12 text-5xl animate-spin-slow">🌟</div>
        <div className="absolute bottom-10 right-20 text-6xl animate-float">🎈</div>
      </div>

      <header className="relative z-10 px-4 sm:px-8 py-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-candy border-4 border-foreground shadow-comic-sm flex items-center justify-center text-2xl animate-wiggle">
            🚀
          </div>
          <div className="min-w-0">
            <div className="font-display text-2xl sm:text-3xl leading-none text-foreground truncate">
              Игроленд
            </div>
            <div className="font-hand text-base sm:text-lg text-grape leading-none truncate">
              страна приключений
            </div>
          </div>
        </div>

        <nav className="hidden sm:flex items-center gap-1 bg-white border-4 border-foreground rounded-full p-1 shadow-comic-sm">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id as 'home' | 'tasks')}
              className={`px-5 py-2 rounded-full font-bold flex items-center gap-2 transition ${
                tab === n.id ? 'bg-foreground text-white' : 'hover:bg-sun/40'
              }`}
            >
              <Icon name={n.icon} size={18} />
              {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 bg-sun border-4 border-foreground rounded-full px-3 sm:px-4 py-1.5 shadow-comic-sm shrink-0">
          <span className="text-xl sm:text-2xl">🪙</span>
          <span className="font-black text-base sm:text-lg">{coins}</span>
        </div>
      </header>

      <div className="sm:hidden px-4 pb-2 flex gap-2">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setTab(n.id as 'home' | 'tasks')}
            className={`flex-1 px-4 py-2 rounded-full font-bold border-4 border-foreground ${
              tab === n.id ? 'bg-foreground text-white' : 'bg-white'
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>

      <main className="relative z-10 px-4 sm:px-8 pb-20 max-w-6xl mx-auto">
        {tab === 'home' && (
          <section className="animate-pop-in">
            <div className="relative mt-4 rounded-[2.5rem] bg-gradient-to-br from-sun via-pop to-candy border-4 border-foreground shadow-comic-lg p-6 sm:p-12 overflow-hidden">
              <div className="absolute -top-8 -right-8 text-9xl opacity-30 rotate-12 select-none">
                🎮
              </div>
              <div className="relative max-w-2xl">
                <div className="inline-block bg-white border-4 border-foreground rounded-full px-4 py-1 font-bold mb-4 shadow-comic-sm">
                  ✨ Новые задания каждый день
                </div>
                <h1 className="font-display text-5xl sm:text-7xl text-foreground leading-tight mb-4">
                  Привет, <span className="text-white text-stroke-dark">друг!</span>
                </h1>
                <p className="text-lg sm:text-2xl font-bold mb-6 text-foreground/90">
                  Здесь живут весёлые игры, добрые герои и крутые задания. Зарабатывай монетки и
                  становись чемпионом!
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setTab('tasks')}
                    className="btn-press bg-foreground text-white font-display text-2xl px-7 py-3 rounded-2xl border-4 border-foreground shadow-comic"
                  >
                    Играть!
                  </button>
                  <button className="btn-press bg-white text-foreground font-bold px-6 py-3 rounded-2xl border-4 border-foreground shadow-comic-sm">
                    Как играть?
                  </button>
                </div>
              </div>
            </div>

            <h2 className="font-display text-4xl mt-12 mb-5 text-foreground">Наши герои</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {HEROES.map((h, i) => (
                <div
                  key={h.name}
                  className={`${h.color} rounded-3xl border-4 border-foreground shadow-comic p-5 text-center hover:-translate-y-2 transition cursor-pointer`}
                >
                  <div
                    className="text-6xl mb-2 animate-bounce-slow"
                    style={{ animationDelay: `${i * 200}ms` }}
                  >
                    {h.emoji}
                  </div>
                  <div className="font-display text-xl text-white text-stroke-dark">{h.name}</div>
                </div>
              ))}
            </div>

            <div className="mt-12 grid md:grid-cols-3 gap-4">
              {[
                { e: '🎯', t: 'Меткость', d: 'Ловкость рук', c: 'bg-bubble' },
                { e: '🧩', t: 'Память', d: 'Найди все пары', c: 'bg-grape' },
                { e: '🎨', t: 'Знания', d: 'Угадай и побеждай', c: 'bg-pop' },
              ].map((x) => (
                <div
                  key={x.t}
                  className={`${x.c} rounded-3xl border-4 border-foreground shadow-comic p-6 text-white`}
                >
                  <div className="text-5xl mb-3">{x.e}</div>
                  <div className="font-display text-2xl text-stroke-dark mb-1">{x.t}</div>
                  <div className="font-bold">{x.d}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'tasks' && (
          <section className="animate-pop-in mt-4">
            <div className="bg-white border-4 border-foreground rounded-[2rem] p-5 sm:p-8 shadow-comic-lg">
              <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
                <div>
                  <h2 className="font-display text-4xl sm:text-5xl text-foreground">Задания</h2>
                  <p className="font-hand text-2xl text-grape">выбирай и играй прямо тут!</p>
                </div>
                <div className="bg-sun border-4 border-foreground rounded-2xl px-5 py-2 font-bold shadow-comic-sm">
                  🪙 Заработано: {coins}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {TASKS.map((t) => {
                  const active = activeGame === t.type;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveGame(active ? null : t.type)}
                      className={`text-left ${t.color} rounded-3xl border-4 border-foreground p-5 transition hover:-translate-y-1 ${
                        active ? 'shadow-comic-lg -translate-y-1' : 'shadow-comic'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="text-5xl">{t.emoji}</div>
                        <div className="bg-white border-2 border-foreground rounded-full px-3 py-0.5 font-bold text-sm">
                          +{t.reward} 🪙
                        </div>
                      </div>
                      <div className="font-display text-2xl mt-3 text-white text-stroke-dark">
                        {t.title}
                      </div>
                      <div className="mt-2 font-bold text-white/95">
                        {active ? 'Свернуть ▲' : 'Открыть ▼'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {activeGame === 'click' && <StarCatcher onWin={reward} />}
              {activeGame === 'memory' && <MemoryGame onWin={reward} />}
              {activeGame === 'quiz' && <Quiz onWin={reward} />}
              {!activeGame && (
                <div className="rounded-3xl border-4 border-dashed border-foreground p-10 text-center bg-muted">
                  <div className="text-6xl mb-3 animate-wiggle inline-block">👆</div>
                  <p className="font-display text-3xl text-foreground">Выбери задание сверху!</p>
                  <p className="font-hand text-2xl text-grape mt-1">
                    каждое — это маленькое приключение
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="relative z-10 text-center pb-8 font-hand text-2xl text-foreground/70">
        сделано с ❤️ для маленьких чемпионов
      </footer>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-grass text-white font-display text-2xl px-7 py-3 rounded-full border-4 border-foreground shadow-comic animate-pop-in z-50">
          {toast} 🎉
        </div>
      )}
    </div>
  );
};

export default Index;
