import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './mandrake-ar-preview.css';

type XRSystemLike = {
  isSessionSupported: (mode: string) => Promise<boolean>;
  requestSession: (mode: string, options: Record<string, unknown>) => Promise<any>;
};
type HitTestState = { source: any; referenceSpace: any; viewerSpace: any };

const modelUrl = '/assets/mandrake-spirit/scene.gltf';

export type MandrakeARHandle = { openCamera: () => void };
type MandrakeARProps = { embedded?: boolean; onOpen?: () => void; onClose?: () => void };

export const MandrakeARPreview = forwardRef<MandrakeARHandle, MandrakeARProps>(function MandrakeARPreview({ embedded = false, onOpen, onClose }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const xrSession = useRef<any>(null);
  const place = useRef<(() => void) | null>(null);
  const hitTest = useRef<HitTestState>({ source: null, referenceSpace: null, viewerSpace: null });
  const runtime = useRef<any>(null);
  const [status, setStatus] = useState('Loading Mandrake Spirit…');
  const [loaded, setLoaded] = useState(false);
  const [xrReady, setXrReady] = useState(false);
  const [arActive, setArActive] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState('');
  const [embeddedOpen, setEmbeddedOpen] = useState(!embedded);
  const isVisible = !embedded || embeddedOpen;

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    let disposed = false;
    let surfaceFound = false;
    let lastXRStatus = '';
    let previewModel: any = null;
    let placedModel: any = null;
    let characterMixer: any = null;
    const animationClock = new THREE.Clock();
    let rafRenderer: any = null;

    const scene = new THREE.Scene();
    const updateXRStatus = (value: string) => {
      if (lastXRStatus === value) return;
      lastXRStatus = value;
      setStatus(value);
    };
    const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 30);
    camera.position.set(0, 0.2, 1.35);
    const ambient = new THREE.HemisphereLight(0xfff5dc, 0x526d53, 2.3);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xfff4d6, 2.2);
    sun.position.set(-1, 2, 2);
    scene.add(sun);
    const previewGroup = new THREE.Group();
    scene.add(previewGroup);
    const anchorGroup = new THREE.Group();
    anchorGroup.visible = false;
    anchorGroup.matrixAutoUpdate = false;
    scene.add(anchorGroup);
    const placementOffset = new THREE.Group();
    placementOffset.position.z = -.16;
    anchorGroup.add(placementOffset);
    runtime.current = { renderer: null, previewGroup, anchorGroup, placementOffset, getPlacedModel: () => placedModel };
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 128;
    const shadowContext = shadowCanvas.getContext('2d');
    if (shadowContext) {
      const gradient = shadowContext.createRadialGradient(64, 64, 4, 64, 64, 62);
      gradient.addColorStop(0, 'rgba(32, 52, 37, .32)');
      gradient.addColorStop(.42, 'rgba(32, 52, 37, .17)');
      gradient.addColorStop(1, 'rgba(32, 52, 37, 0)');
      shadowContext.fillStyle = gradient;
      shadowContext.fillRect(0, 0, 128, 128);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
    const makeShadow = () => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(.24, .24), shadowMaterial);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = .002;
      return mesh;
    };
    previewGroup.add(makeShadow());
    placementOffset.add(makeShadow());

    // Keep the surface pose for placement while drawing no reticle.
    const surfacePose = new THREE.Group();
    surfacePose.matrixAutoUpdate = false;

    try {
      rafRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      rafRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
      rafRenderer.outputColorSpace = THREE.SRGBColorSpace;
      rafRenderer.toneMapping = THREE.ACESFilmicToneMapping;
      rafRenderer.toneMappingExposure = 1.12;
      rafRenderer.xr.enabled = true;
      rafRenderer.xr.setReferenceSpaceType('local-floor');
      rafRenderer.setClearColor(0x000000, 0);
      rafRenderer.domElement.className = 'mandrake-preview-canvas';
      (rafRenderer.domElement as any).__threeRenderer = rafRenderer;
      runtime.current.renderer = rafRenderer;
      root.appendChild(rafRenderer.domElement);
    } catch {
      setError('This browser could not start the 3D preview. Try a recent Android Chrome or desktop Chrome.');
      return;
    }

    const resize = () => {
      if (!rafRenderer || !host.current) return;
      const { clientWidth: width, clientHeight: height } = host.current;
      if (!width || !height) return;
      rafRenderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(root);
    const loader = new GLTFLoader();
    loader.load(modelUrl, (gltf: any) => {
      if (disposed) return;
      const source = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(source);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const safeHeight = Math.max(size.y, size.x, size.z, 0.001);
      const scale = 0.26 / safeHeight;
      source.scale.setScalar(scale);
      source.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
      source.traverse((node: any) => {
        const mesh = node;
        if (!mesh.isMesh) return;
        mesh.castShadow = false;
        mesh.frustumCulled = true;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material: any) => {
          if ('roughness' in material) material.roughness = Math.max(.72, material.roughness || 0);
        });
      });
      previewGroup.add(source);
      previewModel = previewGroup;
      placedModel = source;
      const idleClip = gltf.animations?.find((clip: any) => /idle/i.test(clip.name)) ?? gltf.animations?.[0];
      if (idleClip && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        characterMixer = new THREE.AnimationMixer(source);
        characterMixer.clipAction(idleClip).play();
      }
      setLoaded(true);
      setStatus('Ready to find a gentle spot.');
    }, undefined, () => setError('The Mandrake Spirit model could not be loaded.'));

    const xr = (navigator as Navigator & { xr?: XRSystemLike }).xr;
    if (!xr) setStatus('Preview ready · AR needs a supported phone browser.');
    else xr.isSessionSupported('immersive-ar').then((supported) => {
      if (!disposed) {
        setXrReady(supported);
        setStatus(supported ? 'Ready to find a gentle spot.' : 'Preview ready · AR is not supported on this device.');
      }
    }).catch(() => setStatus('Preview ready · AR support could not be checked.'));

    place.current = () => {
      if (!surfaceFound || !placedModel) return;
      anchorGroup.matrix.copy(surfacePose.matrix);
      previewGroup.remove(placedModel);
      placementOffset.add(placedModel);
      anchorGroup.visible = true;
      previewGroup.visible = false;
      setPlaced(true);
      setStatus('Spirit placed. Drag gently to adjust its spot.');
    };
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let dragging = false;
    let pointerId: number | null = null;
    let lastPointer = { x: 0, y: 0 };
    let touchPulseUntil = 0;
    const hitPlacedModel = (event: PointerEvent) => {
      if (!placedModel) return false;
      const rect = rafRenderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height * 2 - 1));
      raycaster.setFromCamera(pointer, rafRenderer.xr.isPresenting ? rafRenderer.xr.getCamera(camera) : camera);
      return raycaster.intersectObject(placedModel, true).length > 0;
    };
    const onPointer = (event: PointerEvent) => {
      if (!xrSession.current) return;
      event.preventDefault();
      if (anchorGroup.visible && hitPlacedModel(event)) {
        dragging = true;
        pointerId = event.pointerId;
        lastPointer = { x: event.clientX, y: event.clientY };
        touchPulseUntil = performance.now() + 220;
        rafRenderer.domElement.setPointerCapture(event.pointerId);
        setStatus('Drag gently to adjust the spirit.');
        return;
      }
      if (!anchorGroup.visible) place.current?.();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointerId) return;
      event.preventDefault();
      const scale = Math.min(.0008, .35 / Math.max(window.innerWidth, 1));
      placementOffset.position.x = THREE.MathUtils.clamp(placementOffset.position.x + (event.clientX - lastPointer.x) * scale, -.12, .12);
      placementOffset.position.z = THREE.MathUtils.clamp(placementOffset.position.z + (event.clientY - lastPointer.y) * scale, -.12, .12);
      lastPointer = { x: event.clientX, y: event.clientY };
    };
    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      dragging = false;
      pointerId = null;
    };
    rafRenderer.domElement.addEventListener('pointerdown', onPointer);
    rafRenderer.domElement.addEventListener('pointermove', onPointerMove);
    rafRenderer.domElement.addEventListener('pointerup', onPointerEnd);
    rafRenderer.domElement.addEventListener('pointercancel', onPointerEnd);

    rafRenderer.setAnimationLoop((_time: number, frame: any) => {
      if (frame && hitTest.current.source && hitTest.current.referenceSpace && hitTest.current.viewerSpace && !anchorGroup.visible) {
        const results = frame.getHitTestResults(hitTest.current.source);
        const hit = results[0];
        if (hit) {
          const pose = hit.getPose(hitTest.current.referenceSpace);
          if (pose) {
            surfacePose.matrix.fromArray(pose.transform.matrix);
            surfaceFound = true;
            updateXRStatus('A spot is ready. Tap to place Vanaspati.');
          }
        } else {
          surfaceFound = false;
          updateXRStatus('Move your phone slowly to find a surface.');
        }
      }
      if (placementOffset && touchPulseUntil > performance.now() && anchorGroup.visible && !dragging) {
        placementOffset.position.y = .014 * Math.sin((touchPulseUntil - performance.now()) / 220 * Math.PI);
      } else if (!dragging) placementOffset.position.y = 0;
      characterMixer?.update(Math.min(animationClock.getDelta(), .05));
      if (previewModel && !xrSession.current) previewGroup.rotation.y += 0.003;
      rafRenderer?.render(scene, camera);
    });

    return () => {
      disposed = true;
      observer.disconnect();
      rafRenderer?.domElement.removeEventListener('pointerdown', onPointer);
      rafRenderer?.domElement.removeEventListener('pointermove', onPointerMove);
      rafRenderer?.domElement.removeEventListener('pointerup', onPointerEnd);
      rafRenderer?.domElement.removeEventListener('pointercancel', onPointerEnd);
      rafRenderer?.setAnimationLoop(null);
      if (xrSession.current) void xrSession.current.end();
      rafRenderer?.dispose();
      rafRenderer?.domElement.remove();
      characterMixer?.stopAllAction();
      shadowTexture.dispose();
      shadowMaterial.dispose();
      place.current = null;
      runtime.current = null;
    };
  }, []);

  const startAR = async () => {
    const xr = (navigator as Navigator & { xr?: XRSystemLike }).xr;
    if (!xr) {
      setError('Spatial AR needs an ARCore-capable Android phone, Chrome, and a secure HTTPS preview. You can still inspect the 3D model here.');
      return;
    }
    setError('');
    setStatus('Opening camera and finding a surface…');
    try {
      const session = await xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['local-floor', 'dom-overlay'],
        domOverlay: { root: overlay.current },
      });
      xrSession.current = session;
      const webgl = runtime.current?.renderer;
      if (!webgl) throw new Error('3D preview is not ready.');
      await webgl.xr.setSession(session);
      const reference = await session.requestReferenceSpace('local-floor').catch(() => session.requestReferenceSpace('local'));
      const viewer = await session.requestReferenceSpace('viewer');
      const source = await session.requestHitTestSource({ space: viewer });
      hitTest.current = { referenceSpace: reference, viewerSpace: viewer, source };
      setArActive(true);
      setPlaced(false);
      setStatus('Move your phone slowly to find a surface.');
      session.addEventListener('end', () => {
        xrSession.current = null;
        hitTest.current.source?.cancel?.();
        hitTest.current = { source: null, referenceSpace: null, viewerSpace: null };
        const current = runtime.current;
        const model = current?.getPlacedModel();
        if (model && model.parent === current.placementOffset) {
          current.placementOffset.remove(model);
          current.previewGroup.add(model);
        }
        if (current) {
          current.anchorGroup.visible = false;
          current.previewGroup.visible = true;
        }
        setArActive(false);
        setPlaced(false);
        if (embedded) {
          setEmbeddedOpen(false);
          onClose?.();
        } else setStatus('AR preview ended.');
      }, { once: true });
    } catch (reason) {
      xrSession.current = null;
      setArActive(false);
      const message = reason instanceof Error ? reason.message : '';
      setError(message.includes('hit-test') ? 'This browser cannot use surface placement. Try Chrome on an ARCore-capable Android phone.' : `Could not start spatial AR${message ? `: ${message}` : '.'}`);
      setStatus('Preview ready.');
    }
  };

  const openCamera = () => {
    if (embedded) setEmbeddedOpen(true);
    if (embedded) onOpen?.();
    void startAR();
  };
  useImperativeHandle(ref, () => ({ openCamera }), [embedded, onOpen, xrReady]);

  const closePreview = () => {
    if (xrSession.current) void xrSession.current.end();
    else if (embedded) {
      setEmbeddedOpen(false);
      onClose?.();
    }
  };

  return <main className={`mandrake-ar-page${embedded ? ' is-embedded' : ''}${isVisible ? ' is-visible' : ''}${arActive ? ' is-camera-live' : ''}`} ref={overlay} aria-hidden={!isVisible}>
      <div className="mandrake-ar-model" ref={host} aria-label="Rotating 3D Mandrake Spirit preview" />
    <div className="mandrake-ar-top">
      <button type="button" aria-label="Close AR camera" onClick={closePreview}>←</button>
      <span>{embedded ? 'MEET VANASPATI' : 'AR PREVIEW'}</span>
    </div>
    <section className="mandrake-ar-panel">
      <p className="mandrake-ar-kicker">MEET THE MANDRAKE SPIRIT</p>
      <h1>{arActive ? 'Find a gentle spot.' : <>Find a place<br />for the little spirit.</>}</h1>
      <p className="mandrake-ar-status" role="status">{status}</p>
      {error && <p className="mandrake-ar-error" role="alert">{error}</p>}
      {arActive ? <button type="button" onClick={closePreview}>{placed ? 'Done' : 'Close camera'}</button> : <button type="button" onClick={openCamera} disabled={!loaded}>{xrReady ? 'Open spatial AR' : 'Try AR preview'}</button>}
      <small>“Mandrake Spirit” by <a href="https://sketchfab.com/tranb95" target="_blank" rel="noreferrer">tranb95</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a></small>
    </section>
  </main>;
});
