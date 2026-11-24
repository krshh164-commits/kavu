import { useEffect, useRef, useState } from 'react';
import './ambient-music.css';

export function AmbientMusic({ quiet }: { quiet: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const started = useRef(false);
  const enabledRef = useRef(true);
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem('kavu-ambient-muted') !== 'true'; } catch { return true; }
  });
  enabledRef.current = enabled;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0;
    const start = () => {
      if (!enabledRef.current || started.current || document.hidden) return;
      void audio.play().then(() => { started.current = true; }).catch(() => { /* Wait for the next user gesture. */ });
    };
    const onVisibility = () => {
      if (document.hidden) audio.pause();
      else if (enabledRef.current && started.current) void audio.play().catch(() => {});
    };
    window.addEventListener('pointerdown', start, { capture: true });
    window.addEventListener('keydown', start, { capture: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pointerdown', start, true);
      window.removeEventListener('keydown', start, true);
      document.removeEventListener('visibilitychange', onVisibility);
      audio.pause();
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !enabled) return;
    let frame = 0, timer = 0, target = .065, last = performance.now();
    const choose = () => {
      target = Math.random() < .42 ? .012 + Math.random() * .012 : .052 + Math.random() * .025;
      timer = window.setTimeout(choose, 11000 + Math.random() * 15000);
    };
    timer = window.setTimeout(choose, 12000);
    const animate = (now: number) => {
      const dt = Math.max(0, Math.min((now - last) / 1000, .1)); last = now;
      const desired = target * (quiet ? .25 : 1);
      audio.volume = Math.max(0, Math.min(1, audio.volume + (desired - audio.volume) * (1 - Math.exp(-dt / 2.8))));
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
  }, [enabled, quiet]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (enabled) { audio.pause(); audio.volume = 0; setEnabled(false); }
    else { audio.volume = 0; void audio.play().then(() => { started.current = true; }).catch(() => {}); setEnabled(true); }
    try { localStorage.setItem('kavu-ambient-muted', String(enabled)); } catch { /* The choice still applies for this session. */ }
  };

  return <>
    <audio ref={audioRef} src="/assets/audio/april-calm-ethereal-piano.mp3" preload="none" loop aria-hidden="true" />
    <button className="kavu-music-toggle" type="button" onClick={toggle} aria-label={enabled ? 'Mute ambient music' : 'Play ambient music'} aria-pressed={enabled} title={enabled ? 'Mute music' : 'Play music'}>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />{enabled ? <><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></> : <path d="m16 9 5 6m0-6-5 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />}</svg>
    </button>
  </>;
}
