import { useEffect, useRef } from 'react';

export function AmbientMusic({ quiet }: { quiet: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0;
    const start = () => {
      if (started.current || document.hidden) return;
      void audio.play().then(() => { started.current = true; }).catch(() => { /* Wait for the next user gesture. */ });
    };
    const onVisibility = () => {
      if (document.hidden) audio.pause();
      else if (started.current) void audio.play().catch(() => {});
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
    if (!audio) return;
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
  }, [quiet]);

  return <audio ref={audioRef} src="/assets/audio/april-calm-ethereal-piano.mp3" preload="none" loop aria-hidden="true" />;
}
