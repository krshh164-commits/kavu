import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MobileScroll } from './mobile/MobileScroll';
import { BottomSheet } from './mobile/BottomSheet';
import { KeyboardTextarea, useKeyboard, useKeyboardInsets } from './mobile/Keyboard';
import { createPaintedWorld, type WorldController } from './painted-world';
import { VanaspatiReveal } from './VanaspatiReveal';
import { CarePage } from './CarePage';
import { AmbientMusic } from './AmbientMusic';

const collection = [
  { name: 'Rock', image: '/assets/profile/mossy-rock.png', unlocked: true },
  { name: 'Green tree', image: '/assets/profile/green-tree.png', unlocked: true },
  { name: 'Fallen log', image: '/assets/profile/fallen-log.png', unlocked: false },
  { name: 'Soft grass', image: '/assets/profile/soft-grass.png', unlocked: false },
  { name: 'Mushrooms', image: '/assets/profile/mushroom.png', unlocked: false },
  { name: 'Grasshopper', image: '/assets/profile/grasshopper.png', unlocked: false },
];

const kitItems = [
  { name: 'Rock', asset: 'rock', use: 'A little landscape to rest on the soil. Place it where your small world needs shape.' },
  { name: 'Pebbles', asset: 'pebbles', use: 'These make a drainage layer, giving extra water a place to settle below the soil.' },
  { name: 'Soil packet', asset: 'soil', use: 'A soft home for roots. Add it above the pebble layer and spread it gently.' },
  { name: 'Seed packet', asset: 'seeds', use: 'A tiny beginning. Plant the seeds in the soil, then give them time to grow.' },
  { name: 'Moss packet', asset: 'moss', use: 'A living green cover that helps the soil stay gently moist.' },
  { name: 'Growing tray', asset: 'tray', use: 'A tidy place to prepare and hold the layers while you build.' },
  { name: 'Magnifier', asset: 'magnifier', use: 'Look closely at leaves, moss and small changes without disturbing them.' },
  { name: 'Bottle stand', asset: 'bottle-stand', use: 'Keeps your small water bottle close while you prepare Kāvu.' },
] as const;

const buildSteps = [
  { instruction: 'Add the pebbles.', action: 'Add pebbles' },
  { instruction: 'Lay the mesh over them.', action: 'Lay the mesh' },
  { instruction: 'Make a bed of soil.', action: 'Add soil' },
  { instruction: 'Plant a few seeds.', action: 'Plant seeds' },
  { instruction: 'Tuck in the moss.', action: 'Add moss' },
  { instruction: 'Give it 50 ml of water.', action: 'Pour 50 ml' },
] as const;

function TrayScene({ completed, activeLayer, ready }: { completed: number; activeLayer: number; ready: boolean }) {
  const pouring = activeLayer === 6;
  const trayOutline = 'M49 161Q49 143 67 143H293Q311 143 311 161V264Q311 284 291 284H69Q49 284 49 264Z';
  const particles = [[73,159,4],[96,137,3],[122,157,3.5],[151,131,3],[183,151,4],[211,128,3],[238,151,3.5],[271,137,3],[292,160,4],[252,182,3]];
  return <svg className="kavu-tray-scene" data-active-layer={activeLayer} viewBox="0 0 360 360" role="img" aria-label={`Tray with ${completed} of 6 setup layers added`}>
    <defs>
      <clipPath id="kavu-tray-interior"><rect x="63" y="153" width="234" height="122" rx="12" /></clipPath>
      <linearGradient id="kavu-tray-side" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FFF8DC" /><stop offset=".52" stopColor="#F8E4BE" /><stop offset="1" stopColor="#E4BE91" /></linearGradient>
      <linearGradient id="kavu-tray-interior-color" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#FFF9E5" /><stop offset="1" stopColor="#F5E5BF" /></linearGradient>
      <linearGradient id="kavu-pebble-bed" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#E7DACC" /><stop offset="1" stopColor="#C4B7AA" /></linearGradient>
      <linearGradient id="kavu-soil" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#CEAB8B" /><stop offset=".56" stopColor="#B88970" /><stop offset="1" stopColor="#926E60" /></linearGradient>
      <linearGradient id="kavu-moss" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#C7DE96" /><stop offset=".48" stopColor="#9BC978" /><stop offset="1" stopColor="#6FA776" /></linearGradient>
      <linearGradient id="kavu-water" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#A4E6DB" stopOpacity=".7" /><stop offset="1" stopColor="#68C7C2" stopOpacity=".26" /></linearGradient>
      <filter id="kavu-tray-pigment" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".34" numOctaves="2" stitchTiles="stitch" /></filter>
      <filter id="kavu-tray-sticker-shadow" x="-20%" y="-25%" width="140%" height="160%"><feGaussianBlur stdDeviation="6" /></filter>
    </defs>
    {ready && <ellipse className="kavu-ready-aura" cx="180" cy="218" rx="148" ry="94" fill="#FFF1AE" opacity=".25" />}
    <g transform="translate(0 30) scale(1 .78)">
    <path d={trayOutline} transform="translate(0 9)" fill="#4D765F" opacity=".3" filter="url(#kavu-tray-sticker-shadow)" />
    <path d={trayOutline} fill="url(#kavu-tray-side)" stroke="#D5B789" strokeWidth="1.5" />
    <rect x="63" y="153" width="234" height="122" rx="12" fill="url(#kavu-tray-interior-color)" />
    <path d="M65 178H295V273H65Z" fill="#B89167" opacity=".07" />
    <g clipPath="url(#kavu-tray-interior)">
      {completed >= 1 && <g className="kavu-tray-layer kavu-tray-pebbles" aria-label="Drainage pebbles">
        <path d="M63 230H297V275H63Z" fill="url(#kavu-pebble-bed)" />
        <path d="M63 231Q180 227 297 231V237Q180 234 63 237Z" fill="#A89D95" opacity=".24" />
        {[[77,245,12,9],[99,256,15,10],[126,244,13,10],[151,257,15,9],[178,244,13,9],[204,256,15,10],[231,244,13,10],[257,255,15,10],[283,245,13,9],[86,271,14,9],[138,272,13,8],[192,270,15,9],[250,272,14,8]].map(([x,y,rx,ry], i) => <g key={i}><ellipse cx={x} cy={y+2} rx={rx} ry={ry} fill="#8E9185" opacity=".28" /><ellipse cx={x} cy={y} rx={rx} ry={ry} fill={i % 3 === 0 ? '#F4E8D5' : i % 3 === 1 ? '#C8C5B6' : '#E1D3C5'} /><path d={`M${x-rx*.55} ${y-ry*.14}Q${x} ${y-ry*.8} ${x+rx*.47} ${y-ry*.28}`} fill="none" stroke="#FFF8E8" strokeWidth="1.4" strokeLinecap="round" opacity=".72" /></g>)}
      </g>}
      {completed >= 2 && <g className="kavu-tray-layer kavu-tray-mesh" aria-label="Mesh over the pebbles">
        <path d="M63 228Q180 225 297 228V239Q180 235 63 239Z" fill="#FFF8E4" stroke="#C8C4AC" strokeWidth="1.2" opacity=".98" />
        <path d="M63 237Q180 234 297 237" fill="none" stroke="#7D8F73" strokeWidth="1.8" opacity=".52" />
        {Array.from({ length: 18 }, (_, i) => <path key={i} d={`M${65+i*14} 227l9 12M${65+i*14} 239l9-12`} stroke="#84977E" strokeWidth="1" opacity=".72" />)}
      </g>}
      {completed >= 3 && <g className="kavu-tray-layer kavu-tray-soil" aria-label="Soil above the mesh">
        <path d="M63 190Q103 186 143 190T222 189T297 190V229Q180 226 63 229Z" fill="url(#kavu-soil)" />
        <path d="M63 222Q180 220 297 222V230Q180 227 63 230Z" fill="#765F59" opacity=".19" />
        <path d="M71 195Q123 190 172 194T290 194" fill="none" stroke="#F2CBA5" strokeWidth="2" opacity=".72" />
        <path d="M78 207Q120 200 162 207M193 217Q235 208 282 213" fill="none" stroke="#DDB393" strokeWidth="4" opacity=".13" strokeLinecap="round" />
        <g fill="#F0CFAD" opacity=".55"><circle cx="99" cy="209" r="1.5"/><circle cx="137" cy="220" r="1.2"/><circle cx="209" cy="207" r="1.4"/><circle cx="261" cy="217" r="1.2"/><circle cx="179" cy="211" r=".9"/><circle cx="238" cy="200" r=".9"/></g>
      </g>}
      {completed >= 4 && <g className="kavu-tray-layer kavu-tray-seeds" aria-label="Three seeds planted in the soil">
        {[[137,209,-20],[181,205,16],[226,211,-10]].map(([x,y,angle], i) => <g key={i} transform={`rotate(${angle} ${x} ${y})`}><ellipse cx={x} cy={y+2} rx="7" ry="4.5" fill="#715C50" opacity=".32" /><ellipse cx={x} cy={y} rx="6.5" ry="4" fill="#F7DEA6" /><path d={`M${x-2.5} ${y-1}l3.5-1`} stroke="#FFF9DB" strokeWidth="1.3" strokeLinecap="round" opacity=".9" /></g>)}
      </g>}
      {completed >= 5 && <g className="kavu-tray-layer kavu-tray-moss" aria-label="Moss tucked over the soil">
        <path d="M64 189Q77 176 90 181Q102 174 116 183L120 196Q94 190 63 198Z M149 184Q161 173 171 181L169 197Q158 192 146 196Z M193 181Q205 172 216 181L213 197Q203 192 192 196Z M244 182Q258 172 273 181Q286 176 297 188V198Q270 191 241 197Z" fill="url(#kavu-moss)" />
        <path d="M64 194Q94 188 120 194M146 193Q158 190 169 193M192 193Q203 190 213 193M241 194Q270 189 297 194" fill="none" stroke="#568D66" strokeWidth="3" opacity=".24" />
        <path d="M72 185Q91 176 106 184M152 182Q161 177 168 183M195 182Q204 176 212 183M248 184Q266 176 285 185" fill="none" stroke="#E8F2B4" strokeWidth="2.6" strokeLinecap="round" opacity=".88" />
      </g>}
      {completed >= 6 && <g className="kavu-tray-water-settle"><path d="M65 192Q180 187 295 192V219Q180 216 65 219Z" fill="url(#kavu-water)" opacity=".4" /><path d="M74 191Q118 185 156 190M210 189Q250 185 288 192" fill="none" stroke="#D9FFF4" strokeWidth="2.2" strokeLinecap="round" opacity=".78" /></g>}
      <rect x="63" y="153" width="234" height="122" rx="12" filter="url(#kavu-tray-pigment)" opacity=".045" />
    </g>
    <path d="M53 163Q53 147 69 147H291Q307 147 307 163" fill="none" stroke="#FFF9DE" strokeWidth="6" strokeLinecap="round" opacity=".94" />
    <path d="M58 160Q80 154 107 157M252 157Q278 153 302 160" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity=".72" />
    <path d="M51 216V263Q51 282 69 282H291Q309 282 309 263V216" fill="none" stroke="#CBA87E" strokeWidth="2" opacity=".7" />
    <path d={trayOutline} fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinejoin="round" />
    {ready && <g className="kavu-ready-magic" aria-hidden="true">
      <path className="kavu-ready-shimmer" d="M65 148Q180 143 295 148" fill="none" stroke="#FFFDF1" strokeWidth="4" strokeLinecap="round" />
      {particles.map(([x,y,r], i) => <g key={i} className="kavu-ready-particle" style={{ animationDelay: `${i * .12}s` }}><circle cx={x} cy={y} r={r+4} fill={i % 3 === 0 ? '#FFF5CB' : '#E8FFAF'} opacity=".25" />{i % 4 === 0 ? <path d={`M${x} ${y-r-2}Q${x+1} ${y-1} ${x+r+2} ${y}Q${x+1} ${y+1} ${x} ${y+r+2}Q${x-1} ${y+1} ${x-r-2} ${y}Q${x-1} ${y-1} ${x} ${y-r-2}Z`} fill="#FFFCE9" /> : <circle cx={x} cy={y} r={r} fill={i % 3 === 0 ? '#FFF8D8' : '#E9FFB1'} />}</g>)}
    </g>}
    </g>
    {pouring && <g className="kavu-tray-pour" aria-label="100 ml squeeze bottle pouring 50 ml">
      <g transform="translate(242 52) scale(.78)"><g className="kavu-tray-bottle">
        <path d="M13 16H34V28Q41 32 41 42V91Q41 101 31 101H16Q6 101 6 91V42Q6 32 13 28Z" fill="#FBF4DC" stroke="#8EA795" strokeWidth="2" />
        <path className="kavu-tray-bottle-water" d="M10 37H37V90Q37 97 30 97H17Q10 97 10 90Z" fill="#91D9D1" opacity=".72" />
        <rect x="16" y="5" width="15" height="14" rx="3" fill="#EBDDB7" stroke="#8EA795" strokeWidth="1.5" />
        <path d="M23.5 5V-5H15" fill="none" stroke="#8EA795" strokeWidth="5" strokeLinejoin="round" /><path d="M23.5 5V-5H15" fill="none" stroke="#FFF9E4" strokeWidth="2.5" strokeLinejoin="round" />
        <text x="23.5" y="58" textAnchor="middle" fill="#3B6D47" fontSize="10" fontFamily="sans-serif">100 ml</text>
        <path d="M34 66h7" stroke="#3B6D47" strokeWidth="1.5" /><text x="13" y="79" fill="#3B6D47" fontSize="8" fontFamily="sans-serif">50</text>
      </g></g>
      <path className="kavu-tray-stream" d="M210 104Q206 128 192 150" fill="none" stroke="#80CFCE" strokeWidth="4" strokeLinecap="round" strokeDasharray="8 9" />
      <text className="kavu-tray-pour-label" x="297" y="128" textAnchor="middle" fill="#3B6D47" fontSize="12" fontFamily="sans-serif">50 ml</text>
    </g>}
  </svg>;
}

function PlacementScene() {
  return <svg className="kavu-placement-art" viewBox="0 0 360 360" role="img" aria-label="Completed Kāvu tray resting on a wooden desk in gentle indirect daylight">
    <defs>
      <linearGradient id="placement-wood" x2=".8" y2="1"><stop stopColor="#FFF0D6" /><stop offset="1" stopColor="#DDBB9D" /></linearGradient>
      <linearGradient id="placement-tray" x2="0" y2="1"><stop stopColor="#FFF9DF" /><stop offset="1" stopColor="#EACCA3" /></linearGradient>
      <linearGradient id="placement-moss" x2=".8" y2="1"><stop stopColor="#D9EBAB" /><stop offset="1" stopColor="#80B884" /></linearGradient>
      <radialGradient id="placement-daylight"><stop stopColor="#FFFCE2" stopOpacity=".7" /><stop offset="1" stopColor="#FFFCE2" stopOpacity="0" /></radialGradient>
      <filter id="placement-sticker" x="-15%" y="-15%" width="130%" height="140%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="outline" />
        <feGaussianBlur in="outline" stdDeviation="5" result="blur" /><feOffset in="blur" dy="7" result="offset" />
        <feFlood floodColor="#456650" floodOpacity=".24" /><feComposite in2="offset" operator="in" result="shadow" />
        <feFlood floodColor="#FFFFFF" /><feComposite in2="outline" operator="in" result="white" />
        <feMerge><feMergeNode in="shadow" /><feMergeNode in="white" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <ellipse cx="139" cy="154" rx="164" ry="137" fill="url(#placement-daylight)" />
    <g filter="url(#placement-sticker)">
      <path d="M57 218H75L70 314Q64 320 58 314Z M285 218H302L300 314Q294 320 288 314Z" fill="#BE9C87" />
      <path d="M74 233H287V248H74Z" fill="#CCAC92" />
      <path d="M32 207 70 175H291L328 207V225Q180 239 32 225Z" fill="url(#placement-wood)" />
      <path d="M32 207Q180 220 328 207V218Q180 234 32 218Z" fill="#D9B69B" />
      <path d="M43 204Q180 215 318 204" fill="none" stroke="#FFF8E4" strokeWidth="3" strokeLinecap="round" />
      <path d="M60 193Q180 201 304 193M94 184Q179 189 275 184" fill="none" stroke="#C69F80" strokeWidth="1.5" opacity=".2" />
      <ellipse cx="181" cy="195" rx="98" ry="13" fill="#927F68" opacity=".16" />
      <path d="M88 148Q180 128 272 148L265 191Q180 214 95 191Z" fill="url(#placement-tray)" />
      <path d="M96 164Q180 185 264 164L260 188Q180 207 100 188Z" fill="#D8CBB6" />
      {[112,137,163,190,216,242].map((x,i) => <ellipse key={x} cx={x} cy={185 + Math.sin(i)*3} rx="10" ry="6" fill={i%2 ? '#F3E8D3' : '#B9BCAB'} />)}
      <path d="M96 173Q180 192 264 173" fill="none" stroke="#FFF6D8" strokeWidth="3" />
      <path d="M92 148Q180 129 268 148L264 171Q180 191 96 171Z" fill="#B98B70" />
      <ellipse cx="180" cy="149" rx="87" ry="23" fill="#D6AC89" />
      <path d="M95 149Q100 134 121 140Q137 125 153 139Q161 153 142 160Q113 165 95 149Z M171 137Q188 124 205 137Q226 129 235 145Q245 150 258 146Q269 156 250 162Q220 168 199 156Q173 157 171 137Z" fill="url(#placement-moss)" />
      <path d="M104 143Q123 132 142 141M183 138Q200 133 213 142M229 151l17 4" stroke="#F2F6C5" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".75" />
      <g fill="#F5DDA6"><ellipse cx="156" cy="150" rx="3" ry="2" /><ellipse cx="170" cy="153" rx="3" ry="2" /><ellipse cx="183" cy="155" rx="3" ry="2" /></g>
      <path d="M88 148Q88 124 180 124T272 148Q272 175 180 175T88 148Z M95 148Q95 131 180 131T265 148Q265 168 180 168T95 148Z" fill="#FFF1CF" fillRule="evenodd" />
      <path d="M91 145Q102 127 180 127Q252 127 269 145" fill="none" stroke="#FFFCEB" strokeWidth="2" />
      <path d="M105 194Q180 211 255 194" fill="none" stroke="#C4A583" strokeWidth="1.5" opacity=".5" />
    </g>
  </svg>;
}

function KitOnboarding({ onComplete }: { onComplete: () => void }) {
  const keyboard = useKeyboard();
  const [screen, setScreen] = useState<'closed' | 'explore' | 'build' | 'ready' | 'place'>('closed');
  const [buildStep, setBuildStep] = useState(0);
  const [completedLayers, setCompletedLayers] = useState(0);
  const [selectedItem, setSelectedItem] = useState<(typeof kitItems)[number] | null>(null);

  useEffect(() => {
    if (screen === 'build') setCompletedLayers(count => Math.max(count, buildStep + 1));
  }, [screen, buildStep]);
  const visibleLayers = screen === 'build' ? Math.max(completedLayers, buildStep + 1) : completedLayers;

  const stepIndex = screen === 'closed' ? 0 : screen === 'explore' ? 1 : screen === 'ready' ? 8 : screen === 'place' ? 9 : buildStep + 2;
  const heading = screen === 'build' ? buildSteps[buildStep].instruction : screen === 'ready' ? 'Kāvu is ready' : screen === 'place' ? 'Find Kāvu a gentle spot.' : 'Everything your little world needs';
  const instruction = screen === 'closed' ? 'Let’s see what came inside your box.' : screen === 'explore' ? 'Tap each piece to see what it is for.' : screen === 'place' ? 'Keep it out of strong sunlight. We’ll learn how the light feels together.' : null;
  const advance = () => {
    keyboard.hide();
    if (screen === 'closed') setScreen('explore');
    else if (screen === 'explore') setScreen('build');
    else if (screen === 'build') {
      if (buildStep === 5) setScreen('ready');
      else setBuildStep(step => step + 1);
    }
    else if (screen === 'ready') setScreen('place');
    else onComplete();
  };
  const goBack = () => {
    keyboard.hide();
    if (screen === 'place') setScreen('ready');
    else if (screen === 'ready') { setBuildStep(5); setScreen('build'); }
    else if (screen === 'build' && buildStep > 0) setBuildStep(step => step - 1);
    else if (screen === 'build') setScreen('explore');
    else if (screen === 'explore') setScreen('closed');
  };

  return <section className={`kavu-kit kavu-kit--${screen}`} aria-label="Meet your kit">
    <nav className="kavu-kit-nav" aria-label="Onboarding navigation">
      <button type="button" className="kavu-kit-back" onClick={goBack} disabled={stepIndex === 0} aria-label="Previous step"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2Z" /></svg></button>
      <button type="button" className="kavu-kit-skip" onClick={() => { keyboard.hide(); onComplete(); }}>Skip</button>
    </nav>
    <div className="kavu-kit-copy">
      <h1 aria-live="polite">{heading}</h1>
      {instruction && <p className="kavu-kit-instruction">{instruction}</p>}
      <div className="kavu-kit-progress" role="progressbar" aria-label="Onboarding progress" aria-valuemin={1} aria-valuemax={10} aria-valuenow={stepIndex + 1} aria-valuetext={`Step ${stepIndex + 1} of 10`}>{Array.from({ length: 10 }, (_, index) => <span key={index} className={index < stepIndex ? 'is-complete' : index === stepIndex ? 'is-current' : ''} />)}</div>
    </div>

    {screen === 'closed' ? <button type="button" className="kavu-kit-box" aria-label="Open the Kāvu kit box" onClick={() => setScreen('explore')}>
      <img src="/assets/onboarding/box.svg" alt="Closed Kāvu kit box" draggable="false" />
    </button> : screen === 'explore' ? <div className="kavu-kit-grid" aria-label="Things inside the kit">
      {kitItems.map(item => <button type="button" className="kavu-kit-item" data-asset={item.asset} key={item.asset} onClick={() => setSelectedItem(item)} aria-label={`${item.name}: learn what it is for`}>
        <img src={`/assets/onboarding/${item.asset}.${item.asset === 'bottle-stand' ? 'png' : 'svg'}`} alt="" draggable="false" /><span>{item.name}</span>
      </button>)}
    </div> : screen === 'place' ? <div className="kavu-placement-scene"><PlacementScene /></div> : <button type="button" className="kavu-build-scene" onClick={advance} aria-label={screen === 'ready' ? 'Find a spot' : 'Continue'}><TrayScene key={screen === 'build' ? buildStep : screen} completed={visibleLayers} activeLayer={screen === 'build' ? buildStep + 1 : 0} ready={screen === 'ready'} /></button>}

    <button type="button" className="kavu-kit-continue" onClick={advance}>{screen === 'closed' ? 'Tap the box to open' : screen === 'explore' ? 'I’ve found everything' : screen === 'ready' ? 'Find a spot' : screen === 'place' ? 'Place Kāvu' : 'Continue'} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 10.59 5.41 16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8Z" /></svg></button>
    <BottomSheet open={selectedItem !== null} onOpenChange={open => { if (!open) setSelectedItem(null); }} title={selectedItem?.name ?? 'Kit item'} snap={0.44}>
      {selectedItem && <div className="kavu-kit-detail"><img src={`/assets/onboarding/${selectedItem.asset}.svg`} alt="" draggable="false" /><p>{selectedItem.use}</p></div>}
    </BottomSheet>
  </section>;
}

function IslandScene({ rockVisible }: { rockVisible: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const rockGroupRef = useRef<InstanceType<typeof THREE.Group> | null>(null);
  const rockVisibleRef = useRef(rockVisible);
  rockVisibleRef.current = rockVisible;
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
    type Placeable = { name: 'tree' | 'rock'; group: InstanceType<typeof THREE.Group>; art: InstanceType<typeof THREE.Group>; radius: number; restY: number; home: InstanceType<typeof THREE.Vector3> };
    const placeables: Placeable[] = [];
    let islandSurface: InstanceType<typeof THREE.Group> | null = null;
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
      islandSurface = gltf.scene;
      new GLTFLoader().loadAsync('/assets/island-test/tree.glb').then((treeAsset: any) => {
        if (disposed) return;
        const tree = treeAsset.scene;
        const treeBox = new THREE.Box3().setFromObject(tree);
        const treeSize = treeBox.getSize(new THREE.Vector3());
        const treeCenter = treeBox.getCenter(new THREE.Vector3());
        tree.position.sub(treeCenter);
        tree.scale.setScalar(0.92 / Math.max(treeSize.x, treeSize.y, treeSize.z));
        tree.position.y += 0.64;
        const treeGroup = new THREE.Group();
        const treeShadowCanvas = document.createElement('canvas');
        treeShadowCanvas.width = treeShadowCanvas.height = 96;
        const treeShadowContext = treeShadowCanvas.getContext('2d')!;
        const treeShadowGradient = treeShadowContext.createRadialGradient(48, 48, 5, 48, 48, 45);
        treeShadowGradient.addColorStop(0, 'rgba(45,67,41,.27)');
        treeShadowGradient.addColorStop(1, 'rgba(45,67,41,0)');
        treeShadowContext.fillStyle = treeShadowGradient;
        treeShadowContext.fillRect(0, 0, 96, 96);
        const treeShadowTexture = new THREE.CanvasTexture(treeShadowCanvas);
        pastelMaps.set(treeShadowTexture, treeShadowTexture);
        const treeShadow = new THREE.Mesh(new THREE.PlaneGeometry(.42, .32), new THREE.MeshBasicMaterial({ map: treeShadowTexture, transparent: true, depthWrite: false }));
        treeShadow.rotation.x = -Math.PI / 2;
        treeShadow.position.set(0, .145, 0);
        treeGroup.add(treeShadow);
        treeGroup.add(tree);
        model.add(treeGroup);
        placeables.push({ name: 'tree', group: treeGroup, art: tree, radius: .19, restY: tree.position.y, home: treeGroup.position.clone() });
        new GLTFLoader().loadAsync('/assets/home/low-poly-rock/scene.gltf').then((rockAsset: any) => {
          if (disposed) return;
          const rock = rockAsset.scene;
          rock.scale.setScalar(.075);
          rock.updateMatrixWorld(true);
          const rockBox = new THREE.Box3().setFromObject(rock);
          rock.position.sub(rockBox.getCenter(new THREE.Vector3()));
          rock.updateMatrixWorld(true);
          const groundedBox = new THREE.Box3().setFromObject(rock);
          rock.position.set(.42, .14 - groundedBox.min.y, .28);
          rock.traverse((object: any) => {
            if (!(object instanceof THREE.Mesh)) return;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            for (const material of materials) {
              if (!(material instanceof THREE.MeshStandardMaterial)) continue;
              if (material.map) material.map = pastelize(material.map);
              material.color.set(0xe5d8c5);
              material.roughness = 1;
              material.metalness = 0;
              material.emissive.set(0xffe8ad);
              material.emissiveIntensity = .025;
              material.normalScale?.setScalar(.35);
              material.needsUpdate = true;
            }
          });
          const shadowCanvas = document.createElement('canvas');
          shadowCanvas.width = shadowCanvas.height = 128;
          const shadowContext = shadowCanvas.getContext('2d')!;
          const gradient = shadowContext.createRadialGradient(64, 64, 8, 64, 64, 62);
          gradient.addColorStop(0, 'rgba(67,58,50,.34)');
          gradient.addColorStop(.55, 'rgba(87,75,63,.18)');
          gradient.addColorStop(1, 'rgba(87,75,63,0)');
          shadowContext.fillStyle = gradient;
          shadowContext.fillRect(0, 0, 128, 128);
          const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
          shadowTexture.colorSpace = THREE.SRGBColorSpace;
          pastelMaps.set(shadowTexture, shadowTexture);
          const shadow = new THREE.Mesh(new THREE.PlaneGeometry(.44, .34), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }));
          shadow.rotation.x = -Math.PI / 2;
          shadow.position.set(.42, .145, .28);
          const rockGroup = new THREE.Group();
          rockGroup.visible = rockVisibleRef.current;
          rock.position.x -= .42; rock.position.z -= .28;
          shadow.position.x -= .42; shadow.position.z -= .28;
          rockGroup.position.set(.42, 0, .28);
          rockGroup.add(shadow, rock);
          rockGroupRef.current = rockGroup;
          model.add(rockGroup);
          placeables.push({ name: 'rock', group: rockGroup, art: rock, radius: .13, restY: rock.position.y, home: rockGroup.position.clone() });
        }).catch((error: unknown) => console.error('Rock failed to load', error));
      }).catch((error: unknown) => console.error('Tree failed to load', error));
    }).catch((error: unknown) => console.error('Island test failed to load', error));
    const resize = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    let downX = 0, downY = 0, downAngle = 0, dragging = false, raf = 0;
    const canvas = renderer.domElement;
    canvas.style.touchAction = 'none';
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const toRay = (x: number, y: number) => { const rect = canvas.getBoundingClientRect(); pointer.set((x - rect.left) / rect.width * 2 - 1, -((y - rect.top) / rect.height * 2 - 1)); raycaster.setFromCamera(pointer, camera); };
    const pick = (x: number, y: number) => { toRay(x, y); return placeables.filter(item => item.group.visible).map(item => ({ item, hit: raycaster.intersectObject(item.art, true)[0] })).filter(candidate => candidate.hit).sort((a, b) => a.hit.distance - b.hit.distance)[0]?.item ?? null; };
    const surfaceAt = (x: number, z: number) => {
      if (!islandSurface) return false;
      const origin = model.localToWorld(new THREE.Vector3(x, 3, z));
      raycaster.set(origin, new THREE.Vector3(0, -1, 0));
      return raycaster.intersectObject(islandSurface, true).some((hit: any) => {
        if (!hit.face) return false;
        const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
        return normal.y > .48;
      });
    };
    const validPosition = (item: Placeable) => {
      const x = item.group.position.x, z = item.group.position.z, r = item.radius;
      const samples = [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].map(([dx, dz]) => surfaceAt(x + dx, z + dz));
      const clear = placeables.every(other => other === item || !other.group.visible || Math.hypot(x - other.group.position.x, z - other.group.position.z) >= r + other.radius + .035);
      return samples.every(Boolean) && clear;
    };
    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    let candidate: Placeable | null = null, picked: Placeable | null = null;
    let pointerId: number | null = null;
    let dragOrigin = new THREE.Vector3();
    const grabOffset = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -.18 * model.scale.y);
    let returning: { item: Placeable; from: InstanceType<typeof THREE.Vector3>; to: InstanceType<typeof THREE.Vector3>; start: number } | null = null;
    const clearHold = () => { if (holdTimer) clearTimeout(holdTimer); holdTimer = null; };
    const start = (event: PointerEvent) => {
      if (pointerId !== null) return;
      pointerId = event.pointerId; dragging = true; downX = event.clientX; downY = event.clientY; downAngle = model.rotation.y;
      candidate = pick(event.clientX, event.clientY); picked = null;
      if (candidate) holdTimer = setTimeout(() => { picked = candidate; candidate = null; if (picked) { dragOrigin.copy(picked.group.position); returning = null; toRay(downX, downY); const hit = new THREE.Vector3(); if (raycaster.ray.intersectPlane(dragPlane, hit)) { const local = model.worldToLocal(hit); grabOffset.set(local.x - picked.group.position.x, local.z - picked.group.position.z); } else grabOffset.set(0, 0); picked.art.position.y = picked.restY + .085; canvas.style.cursor = 'grabbing'; } }, 1000);
      canvas.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointerId) return;
      const distance = Math.hypot(event.clientX - downX, event.clientY - downY);
      if (candidate && distance > 8) { clearHold(); candidate = null; }
      if (picked) {
        toRay(event.clientX, event.clientY);
        const hit = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(dragPlane, hit)) { const local = model.worldToLocal(hit); picked.group.position.x = local.x - grabOffset.x; picked.group.position.z = local.z - grabOffset.y; }
      } else if (!candidate) model.rotation.y = downAngle + (event.clientX - downX) * .012;
    };
    const end = (event: PointerEvent, canceled = false) => {
      if (event.pointerId !== pointerId) return;
      clearHold(); candidate = null; dragging = false; pointerId = null; canvas.style.cursor = '';
      if (picked) {
        picked.art.position.y = picked.restY;
        const valid = !canceled && validPosition(picked);
        if (!valid) returning = { item: picked, from: picked.group.position.clone(), to: dragOrigin.clone(), start: performance.now() };
        picked = null;
      }
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    const cancel = (event: PointerEvent) => end(event, true);
    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', cancel);
    const draw = () => { if (returning) { const t = Math.min(1, (performance.now() - returning.start) / 240); returning.item.group.position.lerpVectors(returning.from, returning.to, 1 - Math.pow(1 - t, 3)); if (t === 1) returning = null; } renderer.render(scene, camera); raf = requestAnimationFrame(draw); };
    draw();
    return () => { disposed = true; clearHold(); rockGroupRef.current = null; cancelAnimationFrame(raf); observer.disconnect(); canvas.removeEventListener('pointerdown', start); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', end); canvas.removeEventListener('pointercancel', cancel); pastelMaps.forEach(texture => texture.dispose()); renderer.dispose(); canvas.remove(); };
  }, []);
  useEffect(() => { if (rockGroupRef.current) rockGroupRef.current.visible = rockVisible; }, [rockVisible]);
  return <div ref={host} className="kavu-island-scene" role="img" aria-label="Interactive island. Swipe to rotate it. Touch and hold the tree or rock for one second to move it." />;
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
              {cameraOpen ? <video ref={video} autoPlay playsInline muted aria-label="Camera preview" /> : <div className="kavu-camera-empty" aria-label="Camera preview"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 15h7l3-4h12l3 4h7a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V18a3 3 0 0 1 3-3Zm16 5a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z" /></svg><span>Camera preview</span></div>}
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
  const [kitOpen, setKitOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [rockAdded, setRockAdded] = useState(() => { try { return localStorage.getItem('kavu-home-rock') === 'added'; } catch { return false; } });
  const [rockPromptOpen, setRockPromptOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [careOpen, setCareOpen] = useState(false);
  const [observationOpen, setObservationOpen] = useState(false);
  const [observationStep, setObservationStep] = useState(1);
  const addRockToScene = () => {
    try { localStorage.setItem('kavu-home-rock', 'added'); } catch { /* Keep this session's choice if storage is unavailable. */ }
    setRockAdded(true);
    setRockPromptOpen(false);
    setProfileOpen(false);
  };
  return (
    <main className="kavu-home">
      <header className="kavu-header">
        <button className="kavu-header-control" type="button" aria-label="Open menu"><img src="/assets/home/menu-final.svg" alt="" /></button>
        <AmbientMusic quiet={observationOpen} />
        <button className="kavu-header-control" type="button" aria-label="Profile" onClick={() => setProfileOpen(true)}><img className="kavu-avatar" src="/assets/home/profile-final.png" alt="" /></button>
      </header>
      <section className="kavu-main">
        <div className="kavu-greeting"><h1>Welcome back, Iva</h1><p>Day 45 with kavu</p></div>
        <div className="kavu-visual"><IslandScene rockVisible={rockAdded} /></div>
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
      {careOpen && <CarePage />}
      {observationOpen && <ObservationFlow step={observationStep} onStepChange={setObservationStep} onClose={() => { setObservationOpen(false); setObservationStep(1); }} />}
      {!profileOpen && !observationOpen && <footer className={`kavu-footer${journalOpen ? ' is-journal' : ''}${exploreOpen ? ' is-explore' : ''}${careOpen ? ' is-care' : ''}`}>
        <nav className="kavu-nav" aria-label="Main navigation">
          <button type="button" className={`kavu-nav-item${journalOpen ? ' is-active' : ''}`} aria-current={journalOpen ? 'page' : undefined} onClick={() => { setObservationOpen(false); setExploreOpen(false); setCareOpen(false); setJournalOpen(true); }}><span className="kavu-nav-icon kavu-nav-icon--journal" aria-hidden="true" /><span>Journal</span></button>
          <button type="button" className={`kavu-nav-item${!journalOpen && !exploreOpen && !careOpen ? ' is-active' : ''}`} aria-current={!journalOpen && !exploreOpen && !careOpen ? 'page' : undefined} onClick={() => { setObservationOpen(false); setJournalOpen(false); setExploreOpen(false); setCareOpen(false); }}><span className="kavu-nav-icon kavu-nav-icon--home" aria-hidden="true" /><span>My kavu</span></button>
          <button type="button" className={`kavu-nav-item${exploreOpen ? ' is-active' : ''}`} aria-current={exploreOpen ? 'page' : undefined} onClick={() => { setObservationOpen(false); setJournalOpen(false); setCareOpen(false); setExploreOpen(true); }}><span className="kavu-nav-icon kavu-nav-icon--explore" aria-hidden="true" /><span>Explore</span></button>
          <button type="button" className={`kavu-nav-item${careOpen ? ' is-active' : ''}`} aria-current={careOpen ? 'page' : undefined} onClick={() => { setObservationOpen(false); setJournalOpen(false); setExploreOpen(false); setCareOpen(true); }}><span className="kavu-nav-icon kavu-nav-icon--care" aria-hidden="true" /><span>Care</span></button>
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
                <article className={`kavu-asset-card${item.unlocked ? '' : ' is-locked'}${item.name === 'Green tree' ? ' is-tree' : ''}${item.name === 'Rock' ? ' is-rock' : ''}`} key={item.name} role={item.name === 'Rock' ? 'button' : undefined} tabIndex={item.name === 'Rock' ? 0 : undefined} aria-haspopup={item.name === 'Rock' ? 'dialog' : undefined} onClick={item.name === 'Rock' ? () => setRockPromptOpen(true) : undefined} onKeyDown={item.name === 'Rock' ? event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setRockPromptOpen(true); } } : undefined}>
                  <div className="kavu-asset-art"><img src={item.image} alt="" draggable="false" /></div>
                  <div className="kavu-asset-info"><h3>{item.name}</h3>{item.name === 'Rock' && rockAdded ? <span className="kavu-found">On your island</span> : item.unlocked ? <span className="kavu-found">Found</span> : <span className="kavu-unlock"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2M3.5 7h9v7h-9V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>10 weekly checkups to unlock</span>}</div>
                </article>
              ))}
            </div>
          </MobileScroll>
          {rockPromptOpen && <div className="kavu-rock-dialog-backdrop" onClick={() => setRockPromptOpen(false)}>
            <section className="kavu-rock-dialog" role="dialog" aria-modal="true" aria-labelledby="kavu-rock-dialog-title" onClick={event => event.stopPropagation()}>
              <h2 id="kavu-rock-dialog-title">Add this rock to Kāvu’s island?</h2>
              <div className="kavu-rock-dialog-actions"><button type="button" onClick={() => setRockPromptOpen(false)}>Not now</button><button type="button" onClick={addRockToScene}>Add to scene</button></div>
            </section>
          </div>}
        </section>
      )}
      {kitOpen && <KitOnboarding onComplete={() => setKitOpen(false)} />}
    </main>
  );
}
