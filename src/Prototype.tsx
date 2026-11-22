import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MobileScroll } from './mobile/MobileScroll';
import { KeyboardTextarea, useKeyboard, useKeyboardInsets } from './mobile/Keyboard';
import { createPaintedWorld, type WorldController } from './painted-world';
import { VanaspatiReveal } from './VanaspatiReveal';

const collection = [
  { name: 'Mossy rock', image: '/assets/profile/mossy-rock.png', unlocked: true },
  { name: 'Green tree', image: '/assets/profile/green-tree.png', unlocked: true },
  { name: 'Fallen log', image: '/assets/profile/fallen-log.png', unlocked: false },
  { name: 'Soft grass', image: '/assets/profile/soft-grass.png', unlocked: false },
  { name: 'Mushrooms', image: '/assets/profile/mushroom.png', unlocked: false },
  { name: 'Grasshopper', image: '/assets/profile/grasshopper.png', unlocked: false },
];

function IslandScene() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0xffffff, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = null;
    const camera = new THREE.PerspectiveCamera(35, 1, .01, 100);
    camera.position.set(0, 1.85, 3.1);
    camera.lookAt(0, 0.27, 0);
    scene.add(new THREE.HemisphereLight(0xfffbf2, 0xb8c69c, 1.15));
    const sun = new THREE.DirectionalLight(0xfff0d3, 1.25);
    sun.position.set(-3, 6, 5);
    scene.add(sun);
    const model = new THREE.Group();
    model.scale.setScalar(1.2);
    scene.add(model);
    let disposed = false;
    const pastelMaps = new Map<any, any>();
    const pastelize = (source: any) => {
      const cached = pastelMaps.get(source);
      if (cached) return cached;
      const image = source.image as HTMLImageElement;
      const canvas = document.createElement('canvas');
      canvas.width = image.width; canvas.height = image.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const r = pixels.data[i], g = pixels.data[i + 1], b = pixels.data[i + 2];
        const green = g > r * 1.08;
        const grain = (Math.random() - .5) * 9;
        pixels.data[i] = Math.min(255, (green ? 165 + (g - 110) * .32 : 225 + (r - 145) * .16) + grain);
        pixels.data[i + 1] = Math.min(255, (green ? 200 + (g - 110) * .30 : 190 + (g - 105) * .18) + grain);
        pixels.data[i + 2] = Math.min(255, (green ? 100 + (b - 80) * .22 : 135 + (b - 75) * .16) + grain);
      }
      ctx.putImageData(pixels, 0, 0);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = source.flipY;
      texture.needsUpdate = true;
      pastelMaps.set(source, texture);
      return texture;
    };
    new GLTFLoader().loadAsync('/assets/island-test/island.glb').then(async (gltf: any) => {
      if (disposed) return;
      const atlas = await gltf.parser.getDependency('texture', 0);
      if (disposed) return;
      atlas.colorSpace = THREE.SRGBColorSpace;
      const pastelAtlas = pastelize(atlas);
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      gltf.scene.position.sub(center);
      gltf.scene.scale.setScalar(2.15 / Math.max(size.x, size.y, size.z));
      gltf.scene.traverse((object: any) => {
        if (!(object instanceof THREE.Mesh)) return;
        const mats = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of mats) {
          if (!(material instanceof THREE.MeshStandardMaterial)) continue;
          material.map = pastelAtlas;
          material.color.set(0xffffff);
          material.roughness = 1;
          material.metalness = 0;
          material.emissive.set(0xffe8ad);
          material.emissiveIntensity = .025;
          material.needsUpdate = true;
        }
      });
      model.add(gltf.scene);
      new GLTFLoader().loadAsync('/assets/island-test/tree.glb').then((treeAsset: any) => {
        if (disposed) return;
        const tree = treeAsset.scene;
        const treeBox = new THREE.Box3().setFromObject(tree);
        const treeSize = treeBox.getSize(new THREE.Vector3());
        const treeCenter = treeBox.getCenter(new THREE.Vector3());
        tree.position.sub(treeCenter);
        tree.scale.setScalar(0.92 / Math.max(treeSize.x, treeSize.y, treeSize.z));
        tree.position.y += 0.64;
        model.add(tree);
      }).catch((error: unknown) => console.error('Tree failed to load', error));
    }).catch((error: unknown) => console.error('Island test failed to load', error));
    const resize = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    let downX = 0, downAngle = 0, dragging = false, raf = 0;
    const canvas = renderer.domElement;
    canvas.style.touchAction = 'none';
    const start = (event: PointerEvent) => { dragging = true; downX = event.clientX; downAngle = model.rotation.y; canvas.setPointerCapture(event.pointerId); };
    const move = (event: PointerEvent) => { if (dragging) model.rotation.y = downAngle + (event.clientX - downX) * .012; };
    const end = () => { dragging = false; };
    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    const draw = () => { renderer.render(scene, camera); raf = requestAnimationFrame(draw); };
    draw();
    return () => { disposed = true; cancelAnimationFrame(raf); observer.disconnect(); canvas.removeEventListener('pointerdown', start); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', end); canvas.removeEventListener('pointercancel', end); pastelMaps.forEach(texture => texture.dispose()); renderer.dispose(); canvas.remove(); };
  }, []);
  return <div ref={host} className="kavu-island-scene" role="img" aria-label="Interactive island. Swipe horizontally to rotate it." />;
}

function ExploreWorld() {
  const host = useRef<HTMLDivElement>(null);
  const world = useRef<WorldController | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [explored, setExplored] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const controller = createPaintedWorld(host.current, {
      onReady: () => setReady(true),
      onError: () => setFailed(true),
      onExplore: () => setExplored(true),
      paused: false,
    });
    world.current = controller;
    return () => { controller.dispose(); world.current = null; };
  }, []);
  return (
    <section className="kavu-explore" aria-label="Explore islands">
      <div ref={host} className="kavu-explore-world" />
      <header className="kavu-explore-header"><h1>Explore</h1><p>Visit the world around Kāvu</p></header>
      {!ready && <p className="kavu-explore-status" role="status">{failed ? 'The islands could not load.' : 'Finding the islands…'}</p>}
      {ready && !explored && <p className="kavu-explore-hint">Drag to explore · Pinch to zoom</p>}
      <div className="kavu-explore-controls">
        <button type="button" aria-label="Reset view" title="Reset view" onClick={() => world.current?.reset()}>
          <img src="/assets/explore/gps-fix.svg" alt="" draggable="false" />
        </button>
      </div>
    </section>
  );
}

type ObservationPhoto = { id: number; url: string };

function ObservationFlow({ step, onStepChange, onClose }: { step: number; onStepChange: (step: number) => void; onClose: () => void }) {
  const keyboard = useKeyboard();
  const keyboardInsets = useKeyboardInsets();
  const flowRoot = useRef<HTMLElement>(null);
  const [note, setNote] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [speechMessage, setSpeechMessage] = useState('');
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);
  const [photos, setPhotos] = useState<ObservationPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraMessage, setCameraMessage] = useState('');
  const [revealed, setRevealed] = useState(false);
  const recognition = useRef<any>(null);
  const stream = useRef<MediaStream | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const photoUrls = useRef<string[]>([]);
  const retakeTarget = useRef<number | null>(null);
  const nextPhotoId = useRef(1);
  const activePhoto = photos.find(photo => photo.id === selectedPhoto) ?? photos[photos.length - 1];
  const noticed = note.trim().toLowerCase();
  const assessment = /fuzz|mold|mould/.test(noticed)
    ? 'Fuzzy growth can have several causes. Ask a grown-up to look closely before changing care.'
    : /yellow|brown/.test(noticed)
      ? 'A changing leaf can have several causes. Check the light and soil with a grown-up before changing care.'
      : /droop|wilt/.test(noticed)
        ? 'Drooping can happen for more than one reason. Feel the soil and look at the light before adding water.'
        : /new|leaf|sprout|grow/.test(noticed)
          ? 'That may be a little sign of growth. Keep watching it, and check the soil before changing care.'
          : 'You found something worth watching. Compare it next week, and check the soil before changing care.';
  const restoreScreenPosition = () => { flowRoot.current?.scrollTo(0, 0); flowRoot.current?.parentElement?.scrollTo(0, 0); flowRoot.current?.closest('.device-screen')?.scrollTo(0, 0); };
  useLayoutEffect(restoreScreenPosition, [step, photos.length, keyboardInsets.isKeyboardVisible]);
  const stopCamera = () => { stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; setCameraOpen(false); };
  useEffect(() => () => { recognition.current?.stop(); stream.current?.getTracks().forEach(track => track.stop()); photoUrls.current.forEach(url => URL.revokeObjectURL(url)); keyboard.hide(); }, []);
  useEffect(() => { if (step !== 2) { stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; setCameraOpen(false); setPreviewOpen(false); } }, [step]);
  useEffect(() => { if (step !== 4) return; setRevealed(false); const timer = window.setTimeout(() => setRevealed(true), 2600); return () => window.clearTimeout(timer); }, [step]);

  const startSpeech = () => {
    if (speaking) { recognition.current?.stop(); return; }
    const SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setSpeechMessage('Speaking is unavailable here. You can type your observation instead.'); return; }
    try {
      const listener = new SpeechRecognition();
      listener.lang = 'en-US'; listener.interimResults = false; listener.continuous = false;
      listener.onresult = (event: any) => { const words = event.results?.[0]?.[0]?.transcript?.trim(); if (words) setNote(current => [current.trim(), words].filter(Boolean).join(' ')); };
      listener.onerror = () => setSpeechMessage('I couldn’t hear that. Try again or type your observation.');
      listener.onend = () => setSpeaking(false);
      recognition.current = listener;
      listener.start(); setSpeaking(true); setSpeechMessage('Listening…');
    } catch { setSpeechMessage('Speaking is unavailable here. You can type your observation instead.'); }
  };
  const addPhoto = (url: string) => {
    photoUrls.current.push(url);
    const id = nextPhotoId.current++;
    setPhotos(current => current.length < 4 ? [...current, { id, url }] : current);
    setSelectedPhoto(id);
  };
  const replacePhoto = (id: number, url: string) => {
    const previous = photos.find(photo => photo.id === id);
    if (!previous) { addPhoto(url); return; }
    URL.revokeObjectURL(previous.url);
    photoUrls.current = photoUrls.current.filter(item => item !== previous.url);
    photoUrls.current.push(url);
    setPhotos(current => current.map(photo => photo.id === id ? { id, url } : photo));
    setSelectedPhoto(id);
  };
  const openCamera = async () => {
    if (photos.length >= 4 && retakeTarget.current === null) return;
    setCameraMessage('');
    if (!navigator.mediaDevices?.getUserMedia) { setCameraMessage('Camera unavailable. Choose a photo instead.'); return; }
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      stream.current = nextStream; setCameraOpen(true);
      requestAnimationFrame(() => { if (video.current) { video.current.srcObject = nextStream; void video.current.play(); } });
    } catch { setCameraMessage('Camera unavailable. Choose a photo instead.'); }
  };
  useEffect(() => { if (step === 2) void openCamera(); }, [step]);
  const capture = () => {
    const source = video.current;
    if (!source?.videoWidth || (photos.length >= 4 && retakeTarget.current === null)) return;
    const replacing = retakeTarget.current;
    retakeTarget.current = null;
    const frame = document.createElement('canvas');
    const scale = Math.min(1, 1200 / source.videoWidth);
    frame.width = Math.round(source.videoWidth * scale); frame.height = Math.round(source.videoHeight * scale);
    frame.getContext('2d')?.drawImage(source, 0, 0, frame.width, frame.height);
    frame.toBlob(blob => { if (blob) { const url = URL.createObjectURL(blob); if (replacing !== null) replacePhoto(replacing, url); else addPhoto(url); } }, 'image/jpeg', .85);
  };
  const choosePhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter(file => file.type.startsWith('image/'));
    if (retakeTarget.current !== null && files[0]) { replacePhoto(retakeTarget.current, URL.createObjectURL(files[0])); retakeTarget.current = null; }
    else files.slice(0, 4 - photos.length).forEach(file => addPhoto(URL.createObjectURL(file)));
    event.target.value = '';
    requestAnimationFrame(restoreScreenPosition);
  };
  const deletePhoto = () => {
    if (!activePhoto) return;
    URL.revokeObjectURL(activePhoto.url);
    photoUrls.current = photoUrls.current.filter(url => url !== activePhoto.url);
    setPhotos(current => current.filter(photo => photo.id !== activePhoto.id));
    setSelectedPhoto(null);
    setPreviewOpen(false);
  };
  const deleteLatestPhoto = () => {
    const latest = photos[photos.length - 1];
    if (!latest) return;
    URL.revokeObjectURL(latest.url);
    photoUrls.current = photoUrls.current.filter(url => url !== latest.url);
    setPhotos(current => current.filter(photo => photo.id !== latest.id));
    setSelectedPhoto(null);
  };
  const setMarkerFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMarker({ x: Math.max(4, Math.min(96, (event.clientX - rect.left) / rect.width * 100)), y: Math.max(4, Math.min(96, (event.clientY - rect.top) / rect.height * 100)) });
  };
  const leaveText = () => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); keyboard.hide(); restoreScreenPosition(); };
  const goBack = () => { leaveText(); if (step === 1) onClose(); else onStepChange(step - 1); };
  const continueFlow = () => { leaveText(); if (step < 4) onStepChange(step + 1); };

  return <section ref={flowRoot} className={`kavu-observation${step === 4 ? ' is-analyzing' : ''}`} aria-label="Weekly observation">
    {step < 4 ? <>
      <header className="kavu-observation-header">
        <button type="button" aria-label="Back" onClick={goBack}>‹</button>
        <span>Weekly observation</span>
        <button type="button" aria-label="Close observation" onClick={() => { leaveText(); onClose(); }}>×</button>
      </header>
      <div className="kavu-observation-progress" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step} aria-label={`Step ${step} of 4`}><span style={{ width: `${step * 25}%` }} /></div>
      <MobileScroll className="kavu-observation-scroll">
        <div className="kavu-observation-content">
          <p className="kavu-observation-eyebrow">{step} / 4 · {['', 'OBSERVE', 'CAPTURE', 'MARK'][step]}</p>
          {step === 1 && <>
            <h1>What did you notice?</h1>
            <p className="kavu-observation-subtitle">Look at your Kāvu. Tell me anything that feels different.</p>
            <div className="kavu-observation-note-row"><label className="kavu-observation-note-label" htmlFor="kavu-observation-note">Your observation</label>{keyboardInsets.isKeyboardVisible && <button type="button" onClick={leaveText}>Done</button>}</div>
            <KeyboardTextarea id="kavu-observation-note" className="kavu-observation-note" value={note} onChange={event => setNote(event.target.value)} onBlur={() => keyboard.hide()} placeholder="I noticed a tiny new leaf…" rows={5} />
            <button type="button" className={`kavu-mic${speaking ? ' is-listening' : ''}`} aria-label={speaking ? 'Stop speaking' : 'Speak your observation'} onClick={startSpeech}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.7"/><path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v4m-3 0h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg></button>
            <p className="kavu-mic-caption">{speaking ? 'Tap to stop' : 'Tap to speak'}</p>
            {speechMessage && <p className="kavu-observation-message" role="status">{speechMessage}</p>}
          </>}
          {step === 3 && <>
            <h1>Show me where</h1>
            <p className="kavu-observation-subtitle">Tap the part you noticed. You can move the yellow marker.</p>
            <div className="kavu-mark-photo" role="img" aria-label="Captured Kāvu photo. Tap or drag to mark a change." onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); setMarkerFromPointer(event); }} onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) setMarkerFromPointer(event); }} onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}>
              <img src={activePhoto?.url ?? '/assets/journal/terrarium.png'} alt="" draggable="false" />
              <span className="kavu-sample-tag">{activePhoto ? 'Your photo' : 'Sample photo'}</span>
              {marker && <span className="kavu-change-marker" style={{ left: `${marker.x}%`, top: `${marker.y}%` }} />}
            </div>
            <div className="kavu-mark-gallery"><p>Taken {photos.length} {photos.length === 1 ? 'photo' : 'photos'}</p><div className="kavu-mark-thumbnails" aria-label="Taken photos">{photos.map((photo, index) => <button type="button" key={photo.id} className={activePhoto?.id === photo.id ? 'is-selected' : ''} aria-label={`Show photo ${index + 1} for marking`} aria-pressed={activePhoto?.id === photo.id} onClick={() => { setSelectedPhoto(photo.id); setMarker(null); }}><img src={photo.url} alt="" draggable="false" /></button>)}</div></div>
            <p className="kavu-mark-helper">{marker ? 'You can move the dot again.' : 'Move the dot over the change you noticed.'}</p>
            <button className="kavu-skip-mark" type="button" onClick={continueFlow}>Skip marking</button>
          </>}
          {step === 2 && <>
            <h1>Take a few photos</h1>
            <p className="kavu-observation-subtitle">Start with a straight-on view. One clear photo is enough.</p>
            <div className="kavu-camera-frame">
              <span className="kavu-camera-count">{photos.length} / 4 photos</span>
              <span className="kavu-camera-angle">{['Front', 'Top', 'Left', 'Right'][Math.min(photos.length, 3)]}</span>
              {cameraOpen ? <video ref={video} autoPlay playsInline muted aria-label="Camera preview" /> : <div className="kavu-camera-empty"><img src="/assets/journal/terrarium.png" alt="Sample terrarium composition guide" /><span>Place your Kāvu in the frame</span></div>}
              <button type="button" className="kavu-shutter" aria-label={cameraOpen ? 'Take photo' : 'Open camera to take photo'} disabled={photos.length >= 4 && retakeTarget.current === null} onClick={() => { if (cameraOpen) capture(); else { retakeTarget.current = null; void openCamera(); } }} />
              {photos.length > 0 && <div className="kavu-camera-last-photo"><button type="button" className="kavu-camera-thumbnail" aria-label="Preview latest photo" onClick={() => { setSelectedPhoto(photos[photos.length - 1].id); setPreviewOpen(true); }}><img src={photos[photos.length - 1].url} alt="" /></button><button type="button" className="kavu-camera-remove" aria-label="Remove latest photo" onClick={deleteLatestPhoto}>×</button></div>}
            </div>
            {cameraMessage && <p className="kavu-observation-message" role="status">{cameraMessage} <button type="button" className="kavu-camera-fallback" onClick={() => fileInput.current?.click()}>Choose photo</button></p>}
            <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={choosePhotos} aria-label="Choose Kāvu photos" />
            {photos.length > 0 && <div className="kavu-photo-strip" aria-label="Captured photos">{photos.map((photo, index) => <button type="button" key={photo.id} className={activePhoto?.id === photo.id ? 'is-selected' : ''} aria-label={`Preview photo ${index + 1}`} onClick={() => { setSelectedPhoto(photo.id); setPreviewOpen(true); }}><img src={photo.url} alt="" draggable="false" /></button>)}</div>}
          </>}
        </div>
      </MobileScroll>
      {!keyboardInsets.isKeyboardVisible && <div className="kavu-observation-action"><button type="button" disabled={step === 1 ? !note.trim() : step === 2 ? photos.length === 0 : !marker} onClick={continueFlow}>Continue <span aria-hidden="true">→</span></button></div>}
      {previewOpen && activePhoto && <div className="kavu-photo-preview" role="dialog" aria-modal="true" aria-label="Photo preview"><button type="button" className="kavu-photo-preview-close" aria-label="Close photo preview" onClick={() => setPreviewOpen(false)}>×</button><img src={activePhoto.url} alt="Captured Kāvu" /><div><button type="button" onClick={() => { retakeTarget.current = activePhoto.id; setPreviewOpen(false); if (!cameraOpen) void openCamera(); }}>Retake</button><button type="button" onClick={() => { retakeTarget.current = activePhoto.id; setPreviewOpen(false); fileInput.current?.click(); }}>Choose replacement</button><button type="button" onClick={deletePhoto}>Delete</button></div></div>}
    </> : <>
      {!revealed && <button type="button" className="kavu-analysis-back" aria-label="Back to marking" onClick={goBack}>‹</button>}
      {!revealed && <button type="button" className="kavu-analysis-close" aria-label="Close observation" onClick={onClose}>×</button>}
      {!revealed ? <div className="kavu-analysis-center" role="status"><p className="kavu-analysis-eyebrow">4 / 4 · ANALYZE</p><div className="kavu-analysis-orb" aria-hidden="true"><span>✦</span></div><h1>Looking closely<br />at your Kāvu…</h1><p>Bringing your photos and what you noticed together.</p></div> : <VanaspatiReveal note={note} marker={marker} photos={photos} onBack={goBack} onClose={onClose} />}
    </>}
  </section>;
}

export default function Prototype() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [observationOpen, setObservationOpen] = useState(false);
  const [observationStep, setObservationStep] = useState(1);
  return (
    <main className="kavu-home">
      <header className="kavu-header">
        <button className="kavu-header-control" type="button" aria-label="Open menu"><img src="/assets/home/menu-final.svg" alt="" /></button>
        <button className="kavu-header-control" type="button" aria-label="Profile" onClick={() => setProfileOpen(true)}><img className="kavu-avatar" src="/assets/home/profile-final.png" alt="" /></button>
      </header>
      <section className="kavu-main">
        <div className="kavu-greeting"><h1>Welcome back, Iva</h1><p>Day 45 with kavu</p></div>
        <div className="kavu-visual"><IslandScene /></div>
        <p className="kavu-assessment">Last week, Kavu was<br />calm and steady</p>
        <div className="kavu-flex-space" />
        <button type="button" className="kavu-start" onClick={() => { setJournalOpen(false); setExploreOpen(false); setObservationStep(1); setObservationOpen(true); }}><span className="kavu-start-label">Start observation</span><span className="kavu-arrow-pocket" aria-hidden="true"><img className="kavu-arrow" src="/assets/home/arrow-final.svg" alt="" /></span></button>
      </section>
      {journalOpen && (
        <section className="kavu-journal" aria-label="Journal sample entry">
          <header className="kavu-journal-header">
            <h1>Journal</h1>
            <span>Week 7</span>
          </header>
          <MobileScroll className="kavu-journal-scroll">
            <article className="kavu-diary-page">
              <div className="kavu-diary-content">
                <p className="kavu-diary-example">Sample entry</p>
                <h2>Week 7 with Kāvu</h2>
                <p className="kavu-diary-date">9–15 November · Day 43–49</p>
                <figure className="kavu-diary-photo">
                  <img src="/assets/journal/terrarium.png" alt="Sample photo of a lush terrarium in a glass jar" draggable="false" />
                  <figcaption>Sample terrarium photo</figcaption>
                </figure>
                <blockquote>“A tiny green leaf appeared beside the moss.”</blockquote>
                <section><h3>Three little changes</h3><p>A new leaf appeared. The moss spread a little farther across the soil. The glass looked clearer than it did last week.</p></section>
                <section><h3>What felt special</h3><p>“I almost missed the leaf. I saw it when I leaned closer.”</p></section>
                <section><h3>This week’s reflection</h3><p>Kāvu seemed calm and steady. The new growth was small, but it gave us something to look for next time.</p></section>
              </div>
            </article>
          </MobileScroll>
        </section>
      )}
      {exploreOpen && <ExploreWorld />}
      {observationOpen && <ObservationFlow step={observationStep} onStepChange={setObservationStep} onClose={() => { setObservationOpen(false); setObservationStep(1); }} />}
      {!profileOpen && !observationOpen && <footer className={`kavu-footer${journalOpen ? ' is-journal' : ''}${exploreOpen ? ' is-explore' : ''}`}>
        <nav className="kavu-nav" aria-label="Main navigation">
          <button type="button" className={`kavu-nav-item${journalOpen ? ' is-active' : ''}`} aria-current={journalOpen ? 'page' : undefined} onClick={() => { setObservationOpen(false); setExploreOpen(false); setJournalOpen(true); }}><span className="kavu-nav-icon kavu-nav-icon--journal" aria-hidden="true" /><span>Journal</span></button>
          <button type="button" className={`kavu-nav-item${!journalOpen && !exploreOpen ? ' is-active' : ''}`} aria-current={!journalOpen && !exploreOpen ? 'page' : undefined} onClick={() => { setObservationOpen(false); setJournalOpen(false); setExploreOpen(false); }}><span className="kavu-nav-icon kavu-nav-icon--home" aria-hidden="true" /><span>My kavu</span></button>
          <button type="button" className={`kavu-nav-item${exploreOpen ? ' is-active' : ''}`} aria-current={exploreOpen ? 'page' : undefined} onClick={() => { setObservationOpen(false); setJournalOpen(false); setExploreOpen(true); }}><span className="kavu-nav-icon kavu-nav-icon--explore" aria-hidden="true" /><span>Explore</span></button>
          <button type="button" className="kavu-nav-item"><span className="kavu-nav-icon kavu-nav-icon--care" aria-hidden="true" /><span>Care</span></button>
        </nav>
        <div className="kavu-safe-tint" aria-hidden="true" />
      </footer>}
      {profileOpen && (
        <section className="kavu-profile" aria-label="Kāvu profile">
          <header className="kavu-profile-header">
            <button className="kavu-profile-back" type="button" aria-label="Back to Kāvu" onClick={() => setProfileOpen(false)}><span aria-hidden="true">‹</span></button>
            <span>Profile</span>
            <span className="kavu-profile-header-spacer" aria-hidden="true" />
          </header>
          <MobileScroll className="kavu-profile-scroll">
            <div className="kavu-profile-intro">
              <img src="/assets/home/profile-final.png" alt="" />
              <h1>Kāvu & Iva</h1>
              <p>Growing together and learning together.</p>
            </div>
            <div className="kavu-profile-stats" aria-label="Time together">
              <div><strong>45</strong><span>days together</span></div>
              <div><strong>2</strong><span>weekly checkups</span></div>
            </div>
            <div className="kavu-collection-heading"><div><h2>Your collection</h2><p>Little things found along the way</p></div><span>2 of 6 found</span></div>
            <div className="kavu-collection-grid">
              {collection.map(item => (
                <article className={`kavu-asset-card${item.unlocked ? '' : ' is-locked'}${item.name === 'Green tree' ? ' is-tree' : ''}`} key={item.name}>
                  <div className="kavu-asset-art"><img src={item.image} alt="" draggable="false" /></div>
                  <div className="kavu-asset-info"><h3>{item.name}</h3>{item.unlocked ? <span className="kavu-found">Found</span> : <span className="kavu-unlock"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2M3.5 7h9v7h-9V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>10 weekly checkups to unlock</span>}</div>
                </article>
              ))}
            </div>
          </MobileScroll>
        </section>
      )}
    </main>
  );
}
