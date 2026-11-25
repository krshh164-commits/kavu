import { useEffect, useRef, useState } from 'react';
import { useRive } from '@rive-app/react-canvas';
import { TypingAnimation } from './TypingAnimation';
import './vanaspati-reveal.css';

type Photo = { id: number; url: string };
export function VanaspatiReveal({ note, marker, photos, onBack, onClose }: { note: string; marker: { x: number; y: number } | null; photos: Photo[]; onBack: () => void; onClose: () => void }) {
  const [clue, setClue] = useState(0);
  const [typed, setTyped] = useState(false);
  const [visible, setVisible] = useState(true);
  const [readingsOpen, setReadingsOpen] = useState(false);
  const [readingTick, setReadingTick] = useState(0);
  const reduced = useRef(matchMedia('(prefers-reduced-motion: reduce)').matches);
  const { rive, RiveComponent } = useRive({ src: '/assets/sobo.riv', artboard: 'SOBO-Motion-V01', stateMachine: 'State Machine', autoplay: true });
  const lines = ['Oh, there’s the tiny leaf!', 'Now I have another clue from this week’s readings.', 'I’m growing a little more each week…', 'My soil might need a bit more moisture. Could you give me a little extra water this week', 'and see how I’m doing at our next checkup?'];
  const message = lines[clue];
  useEffect(() => {
    if (!readingsOpen || reduced.current) return;
    const timer = window.setInterval(() => setReadingTick(tick => tick + 1), 1400);
    return () => window.clearInterval(timer);
  }, [readingsOpen]);
  const move = (next: number) => { if (next < 0) return onBack(); if (next > 4) return onClose(); if (reduced.current) { setTyped(false); return setClue(next); } setVisible(false); setTimeout(() => { setTyped(false); setClue(next); setVisible(true); }, 280); };
  return <div className="kavu-story">
    <button className="story-control back" aria-label="Back" onClick={() => move(clue - 1)}>‹</button><button className="story-control close" aria-label="Close observation" onClick={onClose}>×</button>
    <button className="story-character" type="button" aria-label="Greet Sobo" onClick={() => { rive?.stop('Hello'); rive?.play('Hello'); }}><RiveComponent /></button>
    <div className={`story-content${visible ? ' visible' : ''}`}>
      <TypingAnimation key={clue} text={message} onComplete={() => setTyped(true)} />
      {clue === 0 && <><div className="story-photo"><img src="/assets/journal/terrarium.png" alt="Earlier Kāvu photo" /><span className="story-marker" style={{ left: `${marker?.x ?? 52}%`, top: `${marker?.y ?? 75}%` }} /></div><p>I found the spot you marked. We can look here next week to see how it changes.</p></>}
      {clue === 1 && <><div className="story-readings"><div><span>◕ &nbsp; Soil moisture</span><b className="attention">Needs attention</b></div><div><span>♧ &nbsp; Temperature</span><b className="calm">Calm</b></div><div><span>☼ &nbsp; Sunlight</span><b className="good">Good</b></div></div><button type="button" className="story-live-button" onClick={() => setReadingsOpen(true)}>See live readings <span aria-hidden="true">→</span></button></>}
      {clue === 4 && <p className="story-evidence">“{note.trim()}” · {photos.length} {photos.length === 1 ? 'photo' : 'photos'} · weekly sensor conditions</p>}
    </div>
    <button className="story-next" disabled={!typed || !visible} onClick={() => move(clue + 1)}>{clue === 4 ? 'Done' : 'Next'} <span>→</span></button>
    {readingsOpen && <div className="story-sensor-scrim" onClick={() => setReadingsOpen(false)}>
      <section className="story-sensor-sheet" role="dialog" aria-modal="true" aria-labelledby="story-sensor-title" onClick={event => event.stopPropagation()}>
        <button type="button" className="story-sensor-close" aria-label="Close sensor readings" onClick={() => setReadingsOpen(false)}>×</button>
        <p className="story-sensor-kicker">DEMO PREVIEW · SIMULATED</p>
        <h2 id="story-sensor-title">Live sensor readings</h2>
        <p className="story-sensor-note">These sample values update gently. Real readings appear when a Kāvu sensor is connected.</p>
        <div className="story-sensor-values" aria-live="polite">
          <div><span>Soil moisture</span><strong>{42 + Math.round(Math.sin(readingTick * .55) * 2)}<small>%</small></strong></div>
          <div><span>Temperature</span><strong>{(22.2 + Math.sin(readingTick * .4) * .3).toFixed(1)}<small>°C</small></strong></div>
          <div><span>Light</span><strong>{Math.round(320 + Math.sin(readingTick * .32) * 24)}<small> lx</small></strong></div>
        </div>
      </section>
    </div>}
  </div>;
}
