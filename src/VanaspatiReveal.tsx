import { useEffect, useRef, useState } from 'react';
import { useRive } from '@rive-app/react-canvas';
import './vanaspati-reveal.css';

type Photo = { id: number; url: string };
export function VanaspatiReveal({ note, marker, photos, onBack, onClose }: { note: string; marker: { x: number; y: number } | null; photos: Photo[]; onBack: () => void; onClose: () => void }) {
  const [clue, setClue] = useState(0);
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(true);
  const reduced = useRef(matchMedia('(prefers-reduced-motion: reduce)').matches);
  const { rive, RiveComponent } = useRive({ src: '/assets/sobo.riv', artboard: 'SOBO-Motion-V01', stateMachine: 'State Machine', autoplay: true });
  const lines = ['Oh, there’s the tiny leaf!', 'Now I have another clue from this week’s readings.', 'I’m growing a little more each week…', 'My soil might need a bit more moisture. Could you give me a little extra water this week', 'and see how I’m doing at our next checkup?'];
  const message = lines[clue];
  useEffect(() => { setCount(reduced.current ? message.length : 0); if (reduced.current) return; const id = setInterval(() => setCount(n => { if (n + 1 >= message.length) clearInterval(id); return Math.min(n + 1, message.length); }), 38); return () => clearInterval(id); }, [clue, message]);
  const move = (next: number) => { if (next < 0) return onBack(); if (next > 4) return onClose(); if (reduced.current) return setClue(next); setVisible(false); setTimeout(() => { setClue(next); setVisible(true); }, 280); };
  return <div className="kavu-story">
    <button className="story-control back" aria-label="Back" onClick={() => move(clue - 1)}>‹</button><button className="story-control close" aria-label="Close observation" onClick={onClose}>×</button>
    <button className="story-character" type="button" aria-label="Greet Sobo" onClick={() => { rive?.stop('Hello'); rive?.play('Hello'); }}><RiveComponent /></button>
    <div className={`story-content${visible ? ' visible' : ''}`}>
      <h1 onClick={() => setCount(message.length)} aria-label={message}>{message.slice(0, count)}<span className="story-measure">{message.slice(count)}</span></h1>
      {clue === 0 && <><div className="story-photo"><img src="/assets/journal/terrarium.png" alt="Earlier Kāvu photo" /><span className="story-marker" style={{ left: `${marker?.x ?? 52}%`, top: `${marker?.y ?? 75}%` }} /></div><p>I found the spot you marked. We can look here next week to see how it changes.</p></>}
      {clue === 1 && <div className="story-readings"><div><span>◕ &nbsp; Soil moisture</span><b className="attention">Needs attention</b></div><div><span>♧ &nbsp; Temperature</span><b className="calm">Calm</b></div><div><span>☼ &nbsp; Sunlight</span><b className="good">Good</b></div></div>}
      {clue === 4 && <p className="story-evidence">“{note.trim()}” · {photos.length} {photos.length === 1 ? 'photo' : 'photos'} · weekly sensor conditions</p>}
    </div>
    <button className="story-next" disabled={count < message.length || !visible} onClick={() => move(clue + 1)}>{clue === 4 ? 'Done' : 'Next'} <span>→</span></button>
  </div>;
}
