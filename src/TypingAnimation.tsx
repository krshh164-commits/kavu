import { useEffect, useState } from 'react';

export function TypingAnimation({ text, onComplete }: { text: string; onComplete: () => void }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setCount(text.length); onComplete(); return; }
    const timer = window.setInterval(() => setCount(current => { const next = Math.min(current + 1, text.length); if (next === text.length) window.clearInterval(timer); return next; }), 38);
    return () => window.clearInterval(timer);
  }, [text]);
  useEffect(() => { if (count === text.length) onComplete(); }, [count, text.length]);
  return <h1 onClick={() => setCount(text.length)} aria-label={text}>{text.slice(0, count)}<span className="story-measure">{text.slice(count)}</span></h1>;
}
