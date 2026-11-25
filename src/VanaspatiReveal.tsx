import { useEffect, useRef, useState } from 'react';
import { useRive } from '@rive-app/react-canvas';
import { TypingAnimation } from './TypingAnimation';
import { useKavuSensors } from './useKavuSensors';
import './vanaspati-reveal.css';

type Photo = { id: number; url: string };
export function VanaspatiReveal({ note, marker, photos, onBack, onClose }: { note: string; marker: { x: number; y: number } | null; photos: Photo[]; onBack: () => void; onClose: () => void }) {
  const [clue, setClue] = useState(0);
  const [typed, setTyped] = useState(false);
  const [visible, setVisible] = useState(true);
  const [readingsOpen, setReadingsOpen] = useState(false);
  const sensors = useKavuSensors();
  const reduced = useRef(matchMedia('(prefers-reduced-motion: reduce)').matches);
  const { rive, RiveComponent } = useRive({ src: '/assets/sobo.riv', artboard: 'SOBO-Motion-V01', stateMachine: 'State Machine', autoplay: true });
  const lines = ['Oh, there’s the tiny leaf!', 'Now I have another clue from this week’s readings.', 'I’m growing a little more each week…', 'My soil might need a bit more moisture. Could you give me a little extra water this week', 'and see how I’m doing at our next checkup?'];
  const message = lines[clue];
  const move = (next: number) => { if (next < 0) return onBack(); if (next > 4) return onClose(); if (reduced.current) { setTyped(false); return setClue(next); } setVisible(false); setTimeout(() => { setTyped(false); setClue(next); setVisible(true); }, 280); };
  const canUseUsb = typeof navigator !== 'undefined' && !!(navigator as any).serial?.requestPort;
  const canUseBluetooth = typeof navigator !== 'undefined' && !!(navigator as any).bluetooth?.requestDevice;
  const displayed = (value: number) => sensors.hasReading ? value : 0;
  const sensorStatus = sensors.status === 'connected' ? sensors.hasReading ? `LIVE · ${sensors.transport}` : `CONNECTED · WAITING FOR FIRST READING` : sensors.status === 'connecting' ? 'CONNECTING' : sensors.status === 'error' ? 'CONNECTION ISSUE' : 'NOT CONNECTED';
  return <div className="kavu-story">
    <button className="story-control back" aria-label="Back" onClick={() => move(clue - 1)}>‹</button><button className="story-control close" aria-label="Close observation" onClick={onClose}>×</button>
    <button className="story-character" type="button" aria-label="Greet Sobo" onClick={() => { rive?.stop('Hello'); rive?.play('Hello'); }}><RiveComponent /></button>
    <div className={`story-content${visible ? ' visible' : ''}`}>
      <TypingAnimation key={clue} text={message} onComplete={() => setTyped(true)} />
      {clue === 0 && <><div className="story-photo"><img src="/assets/journal/terrarium.png" alt="Earlier Kāvu photo" /><span className="story-marker" style={{ left: `${marker?.x ?? 52}%`, top: `${marker?.y ?? 75}%` }} /></div><p>I found the spot you marked. We can look here next week to see how it changes.</p></>}
      {clue === 1 && <><p className="story-inline-sensor-status">{sensors.status === 'connected' && sensors.hasReading ? 'Live readings from Kāvu' : 'Sensor not connected · readings show 0'}</p><div className="story-readings story-readings-live"><div><span>◕ &nbsp; Soil moisture</span><b>{displayed(sensors.readings.soilPercent)}%</b></div><div><span>♧ &nbsp; Temperature</span><b>{displayed(sensors.readings.temperatureC).toFixed(1)}°C</b></div><div><span>☼ &nbsp; Light</span><b>{displayed(sensors.readings.lightLux)} lx</b></div></div><button type="button" className="story-live-button" onClick={() => setReadingsOpen(true)}>See live readings <span aria-hidden="true">→</span></button></>}
      {clue === 4 && <p className="story-evidence">“{note.trim()}” · {photos.length} {photos.length === 1 ? 'photo' : 'photos'}</p>}
    </div>
    <button className="story-next" disabled={!typed || !visible} onClick={() => move(clue + 1)}>{clue === 4 ? 'Done' : 'Next'} <span>→</span></button>
    {readingsOpen && <div className="story-sensor-scrim" onClick={() => setReadingsOpen(false)}>
      <section className="story-sensor-sheet" role="dialog" aria-modal="true" aria-labelledby="story-sensor-title" onClick={event => event.stopPropagation()}>
        <button type="button" className="story-sensor-close" aria-label="Close sensor readings" onClick={() => setReadingsOpen(false)}>×</button>
        <p className="story-sensor-kicker">{sensorStatus}</p>
        <h2 id="story-sensor-title">Live sensor readings</h2>
        <p className="story-sensor-note">{sensors.error || (sensors.status === 'connected' && !sensors.hasReading ? 'Connected. Waiting for the first sensor reading.' : sensors.status === 'connected' ? 'Readings arrive directly from your Kāvu sensors.' : 'Choose USB on a laptop or Bluetooth on an Android phone. Readings stay at 0 until data arrives.')}</p>
        {sensors.status === 'connected' ? <button type="button" className="story-sensor-connect" onClick={() => void sensors.disconnect()}>Disconnect sensor</button> : <div className="story-sensor-connect-actions">
          {canUseUsb && <button type="button" disabled={sensors.status === 'connecting'} onClick={() => void sensors.connectUsb()}>Connect over USB</button>}
          {canUseBluetooth && <button type="button" disabled={sensors.status === 'connecting'} onClick={() => void sensors.connectBluetooth()}>Connect over Bluetooth</button>}
          {!canUseUsb && !canUseBluetooth && <p className="story-sensor-unsupported">This browser cannot connect to sensors. Try Chrome or Edge on a laptop, or Chrome on Android over HTTPS.</p>}
        </div>}
        <div className="story-sensor-values" aria-live="polite">
          <div><span>Soil moisture</span><strong>{displayed(sensors.readings.soilPercent)}<small>%</small></strong></div>
          <div><span>Temperature</span><strong>{displayed(sensors.readings.temperatureC).toFixed(1)}<small>°C</small></strong></div>
          <div><span>Humidity</span><strong>{displayed(sensors.readings.humidityPercent).toFixed(1)}<small>%</small></strong></div>
          <div><span>Light</span><strong>{displayed(sensors.readings.lightLux).toFixed(1)}<small> lx</small></strong></div>
          <div><span>Pressure</span><strong>{displayed(sensors.readings.pressureHpa).toFixed(1)}<small> hPa</small></strong></div>
        </div>
      </section>
    </div>}
  </div>;
}
