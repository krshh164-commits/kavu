import { useState } from 'react';
import { MobileScroll } from './mobile/MobileScroll';
import { TextAnimate } from './TextAnimate';
import './care.css';

type CareItem = { plant: 'Jade plant' | 'Moss'; title: string; reason: string; action: string; check: string; image: string; photoNote?: string; credit?: string };

const items: CareItem[] = [
  { plant: 'Jade plant', title: 'Wrinkled leaves', reason: 'Soil may be too dry.', action: 'Check whether the soil is nearly dry before watering.', check: 'Feel the soil below the surface. Notice whether the leaf feels thin or firm.', image: '/assets/care/jade.jpg', photoNote: 'Jade leaf reference photo' },
  { plant: 'Jade plant', title: 'Soft, mushy leaves', reason: 'Too much water or poor drainage could be involved.', action: 'Pause watering and check for trapped water.', check: 'Gently feel a leaf and look for water sitting at the bottom of the terrarium.', image: '/assets/care/jade.jpg', photoNote: 'Jade leaf reference photo' },
  { plant: 'Jade plant', title: 'Yellow leaves', reason: 'Often excess water; sometimes feeding stress.', action: 'Check moisture below the surface.', check: 'Look at more than one leaf and feel the soil below its top layer.', image: '/assets/care/jade.jpg', photoNote: 'Jade leaf reference photo' },
  { plant: 'Jade plant', title: 'Brown patches', reason: 'Could be sun stress or a moisture problem.', action: 'Check recent light and watering changes.', check: 'Notice which side of the plant has patches and whether its light changed recently.', image: '/assets/care/jade.jpg', photoNote: 'Jade leaf reference photo' },
  { plant: 'Jade plant', title: 'White fuzz', reason: 'Could be mealybugs or mildew.', action: 'Look closely at the leaf and improve airflow.', check: 'Look under leaves and along stems. Is the white patch cottony or powdery?', image: '/assets/care/jade.jpg', photoNote: 'Jade leaf reference photo' },
  { plant: 'Moss', title: 'Brown, dry patches', reason: 'Moss may be drying or getting direct sun.', action: 'Feel it; mist lightly if dry and move out of direct sun.', check: 'Touch the brown area gently. Notice whether it feels crisp and whether sunlight lands on it.', image: '/assets/care/moss-brown.jpg', photoNote: 'Moss reference photo' },
  { plant: 'Moss', title: 'White fuzz or musty smell', reason: 'Could be mould from excess moisture.', action: 'Check drainage and allow gentle ventilation.', check: 'Look for standing water, condensation and fuzzy growth near the moss or glass.', image: '/assets/care/moss-mold.jpg', photoNote: 'Terrarium mould reference photo' },
  { plant: 'Moss', title: 'Green algae', reason: 'Often too much water together with too much light.', action: 'Reduce excess moisture and direct light.', check: 'Look for a slick green film on the glass, stones or soil rather than moss leaves.', image: '/assets/care/moss-algae.jpg', photoNote: 'Green algae reference photo' },
];

export function CarePage() {
  const [filter, setFilter] = useState<'Jade plant' | 'Moss'>('Jade plant');
  const [selected, setSelected] = useState<CareItem | null>(null);
  return <section className="kavu-care" aria-label="Care field guide">
    <MobileScroll className="kavu-care-scroll">
      {selected ? <div className="kavu-care-detail">
        <button type="button" className="kavu-care-back" onClick={() => setSelected(null)} aria-label="Back to care signs">← <span>All signs</span></button>
        <div className="kavu-care-detail-photo"><img src={selected.image} alt={selected.photoNote || selected.title} /></div>
        <p className="kavu-care-eyebrow">{selected.plant} · Field guide</p>
        <TextAnimate as="h1">{selected.title}</TextAnimate>
        <p className="kavu-care-photo-note">Reference photo. Compare the sign with your own Kāvu; a photo alone cannot tell us the cause. <a href={selected.image === '/assets/care/jade.jpg' ? 'https://commons.wikimedia.org/wiki/File:Jade_Plant,_Crassula_ovata_IMG_2844.jpg' : selected.image === '/assets/care/moss-brown.jpg' ? 'https://commons.wikimedia.org/wiki/File:(Sphagnum_close-up_in_Kohala,_United_States)_-_DPLA_-_4e551104b0b96ae5d2d3f851fb791478.jpg' : selected.image === '/assets/care/moss-mold.jpg' ? 'https://commons.wikimedia.org/wiki/File:Mold_fungi_on_glass.jpg' : 'https://commons.wikimedia.org/wiki/File:Green_algaes.jpg'} target="_blank" rel="noopener noreferrer">Photo credit ↗</a></p>
        <div className="kavu-care-detail-block"><h2>What it could mean</h2><p>{selected.reason}</p></div>
        <div className="kavu-care-detail-block"><h2>What to check</h2><p>{selected.check}</p></div>
        <div className="kavu-care-detail-block"><h2>A gentle next step</h2><p>{selected.action}</p></div>
      </div> : <div className="kavu-care-list">
        <p className="kavu-care-eyebrow">A LITTLE FIELD GUIDE</p>
        <TextAnimate as="h1">What is your Kāvu showing you?</TextAnimate>
        <p className="kavu-care-intro">Look closely at a sign, then check what might be happening.</p>
        <div className="kavu-care-filters" role="group" aria-label="Choose a plant">
          {(['Jade plant', 'Moss'] as const).map(name => <button key={name} type="button" className={filter === name ? 'is-active' : ''} aria-pressed={filter === name} onClick={() => setFilter(name)}>{name}</button>)}
        </div>
        <div className="kavu-care-cards">{items.filter(item => item.plant === filter).map(item => <button type="button" className="kavu-care-card" key={item.title} onClick={() => setSelected(item)}>
          <span className="kavu-care-card-photo"><img src={item.image} alt="" /></span>
          <span className="kavu-care-card-copy"><strong>{item.title}</strong><span>{item.reason}</span><small>{item.action}</small></span><span className="kavu-care-card-arrow" aria-hidden="true">↗</span>
        </button>)}</div>
        <p className="kavu-care-note">These photos are references. The same sign may have different causes.</p>
      </div>}
    </MobileScroll>
  </section>;
}
