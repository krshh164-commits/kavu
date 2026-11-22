import * as THREE from 'three';
import { vertex, cloudFragment, birdVertex, birdFragment, paperFragment } from './painted-shaders';
import { waterFragment, grainFragment, islandFragment, shorelineFragment, plantFragment, plantShadowFragment } from './pastel-shaders';

export type WorldController = { dispose: () => void; reset: () => void; setPaused: (paused: boolean) => void };
type Options = { onReady: () => void; onError: () => void; onExplore: () => void; paused: boolean };
type Flight = { mesh: any; shadow: any; start: any; direction: any; normal: any; age: number; duration: number; curve: number; phase: number };
const HEIGHT=5, WIDTH=5;
const ONE_TREE_ROCK_ISLAND={x:-1.45,y:-1.32};
const DEFAULT_VIEW_HEIGHT=1.88;

// Tangents traced against the user's exact canvas. UV origin is bottom left.
function createFlowMap() {
  const curve=new THREE.CatmullRomCurve3([
    [.005,1],[.04,.85],[.065,.73],[.12,.65],[.19,.64],[.28,.70],
    [.35,.70],[.41,.58],[.44,.40],[.47,.24],[.53,.19],
    [.62,.24],[.69,.24],[.76,.14],[.84,0],
  ].map(([x,y])=>new THREE.Vector3(x,y,0)));
  const samples=curve.getPoints(100);
  const data=new Float32Array(128*128*4);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++) {
    const uv=new THREE.Vector2(x/127,y/127); let best=Infinity, nearest=0;
    samples.forEach((p:any,i:number)=>{const d=(uv.x-p.x)**2+(uv.y-p.y)**2;if(d<best){best=d;nearest=i;}});
    const tangent=curve.getTangent(nearest/100);
    if(uv.distanceTo(new THREE.Vector2(.756,.802))<.065) tangent.set(-(uv.y-.802)/(WIDTH/HEIGHT), (uv.x-.756)*(WIDTH/HEIGHT),0).normalize();
    const i=(y*128+x)*4; data[i]=tangent.x*.5+.5;data[i+1]=tangent.y*.5+.5;data[i+2]=0;data[i+3]=1;
  }
  const tex=new THREE.DataTexture(data,128,128,THREE.RGBAFormat,THREE.FloatType);
  tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;tex.needsUpdate=true;return tex;
}

export function createPaintedWorld(host:HTMLDivElement, options:Options):WorldController {
  let renderer:any;
  try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'}); }
  catch { options.onError();return {dispose(){},reset(){},setPaused(){}}; }
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.setClearColor('#f4f0e4');renderer.autoClear=false;
  const canvas=renderer.domElement as HTMLCanvasElement;
  canvas.tabIndex=0;canvas.setAttribute('role','application');
  canvas.setAttribute('aria-label','Painted landscape. Drag or use arrow keys to explore. Pinch or scroll to zoom.');
  host.appendChild(canvas);
  const scene=new THREE.Scene(), overlay=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-.5,.5,1,-1,.01,10);camera.position.z=5;
  const overlayCamera=new THREE.OrthographicCamera(-1,1,1,-1,.01,10);overlayCamera.position.z=1;
  const origin=new THREE.Vector2(ONE_TREE_ROCK_ISLAND.x,ONE_TREE_ROCK_ISLAND.y), target=origin.clone(), current=origin.clone(), velocity=new THREE.Vector2();
  let viewHeight=DEFAULT_VIEW_HEIGHT, zoomTarget=DEFAULT_VIEW_HEIGHT, aspect=.46, paused=options.paused, alive=true, loaded=false;
  let raf=0, last=performance.now(), elapsed=0, nextFlight=3, frames=0, lastStats=0;
  const textures:any[]=[], materials:any[]=[], geometries:any[]=[], clouds:any[]=[], flights:Flight[]=[];
  const flowMap=createFlowMap();textures.push(flowMap);
  const loader=new THREE.TextureLoader();
  const uniforms={painting:{value:null as any},flowMap:{value:flowMap},time:{value:0}};
  const paperUniforms={resolution:{value:new THREE.Vector2(393,852)},time:{value:0}};

  function plane(w:number,h:number,material:any,segments=1) {
    const g=new THREE.PlaneGeometry(w,h,segments,segments);geometries.push(g);materials.push(material);
    return new THREE.Mesh(g,material);
  }
  const paper=plane(2,2,new THREE.ShaderMaterial({uniforms:paperUniforms,vertexShader:vertex,fragmentShader:paperFragment,transparent:true,depthTest:false,depthWrite:false}));
  overlay.add(paper);
  const terrain=plane(WIDTH,HEIGHT,new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:waterFragment}));scene.add(terrain);
  const grain=plane(WIDTH,HEIGHT,new THREE.ShaderMaterial({uniforms:{time:uniforms.time},vertexShader:vertex,fragmentShader:grainFragment,transparent:true,depthWrite:false}));grain.position.z=.012;scene.add(grain);
  let birdTexture:any;
  const fetchTexture=async(path:string)=>{const texture=await loader.loadAsync(path);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());if(!alive){texture.dispose();return texture;}textures.push(texture);return texture;};
  Promise.all(['pastel-water.png','cloud.png','heron.png','island-1.png','island-2.png','island-3.png','plant-tree.png','plant-purple.png','prop-stone.png','prop-wood.png'].map(name=>fetchTexture('/assets/painted/'+name))).then(([ground,cloud,bird,island1,island2,island3,tree,purple,stone,wood])=>{
    if(!alive)return;
    const islands=[island1,island2,island3];
    ground.wrapS=ground.wrapT=THREE.MirroredRepeatWrapping;
    uniforms.painting.value=ground;birdTexture=bird;
    // Seven fixed islands leave broad channels of water for exploration.
    const locations=[
      {x:-.18,y:.42,size:.86,type:1},
      {x:.72,y:-.55,size:.76,type:2},
      {...ONE_TREE_ROCK_ISLAND,size:.78,type:0},
      {x:1.50,y:1.38,size:.82,type:1},
      {x:-1.52,y:1.36,size:.72,type:2},
      {x:1.48,y:-1.52,size:.72,type:0},
      {x:-.47,y:-.67,size:1.05,type:0},
    ];
    const addIsland=(x:number,y:number,size:number,index:number)=>{
      const image=islands[index%3];
      const height=size*image.image.height/image.image.width;
      const land=plane(size,height,new THREE.ShaderMaterial({uniforms:{image:{value:image}},vertexShader:vertex,fragmentShader:islandFragment,transparent:true,depthWrite:false}));
      const shore=plane(size*1.14,height*1.14,new THREE.ShaderMaterial({uniforms:{image:{value:image},time:uniforms.time},vertexShader:vertex,fragmentShader:shorelineFragment,transparent:true,depthWrite:false}));
      land.position.set(x,y,.12);land.renderOrder=2;
      shore.position.set(x,y,.025);shore.renderOrder=1;
      scene.add(shore,land);
    };
    locations.forEach((island)=>addIsland(island.x,island.y,island.size,island.type));
    const addPlant=(islandIndex:number,image:any,dx:number,dy:number,width:number,angle=0)=>{
      const island=locations[islandIndex];
      const height=width*image.image.height/image.image.width;
      if(image===tree){
        const landImage=islands[island.type];
        const landHeight=island.size*landImage.image.height/landImage.image.width;
        const baseX=dx+Math.sin(angle)*height*.30;
        const baseY=dy-Math.cos(angle)*height*.30;
        dx+=THREE.MathUtils.clamp(baseX,-island.size*.17,island.size*.17)-baseX;
        dy+=THREE.MathUtils.clamp(baseY,-landHeight*.15,landHeight*.15)-baseY;
      }
      const shadowKind=image===wood?2:image===stone?1:0;
      const shade=plane(width*1.35,height*1.35,new THREE.ShaderMaterial({uniforms:{image:{value:image},shadowKind:{value:shadowKind}},vertexShader:vertex,fragmentShader:plantShadowFragment,transparent:true,depthWrite:false}));
      const plant=plane(width,height,new THREE.ShaderMaterial({uniforms:{image:{value:image}},vertexShader:vertex,fragmentShader:plantFragment,transparent:true,depthWrite:false}));
      shade.position.set(island.x+dx,island.y+dy,.16);shade.renderOrder=3;shade.rotation.z=angle;
      plant.position.set(island.x+dx,island.y+dy,.22);plant.renderOrder=image===tree?5:4;plant.rotation.z=angle;
      scene.add(shade,plant);
    };
    // 0: feature; 1 and 3: mixed; 2 and 5: light; 4: empty; 6: five trees.
    addPlant(0,tree,-.20,.11,.23);
    addPlant(0,tree,.12,.07,.17,-.08);
    addPlant(0,purple,.18,.09,.065);
    addPlant(0,purple,-.02,-.11,.052);
    addPlant(0,stone,-.15,-.05,.12,.12);
    addPlant(0,wood,.06,-.03,.13,-.12);
    addPlant(1,tree,-.15,.09,.21);
    addPlant(1,tree,.20,.05,.15,.08);
    addPlant(1,purple,.03,-.09,.06);
    addPlant(1,wood,-.08,-.01,.11,-.15);
    addPlant(2,tree,-.11,.06,.19);
    addPlant(2,stone,.09,-.02,.11,.10);
    addPlant(3,tree,-.20,.10,.22);
    addPlant(3,purple,.13,.09,.065);
    addPlant(3,stone,-.08,-.03,.12);
    addPlant(3,wood,.08,-.01,.12,.16);
    addPlant(5,purple,-.10,.07,.068);
    addPlant(5,wood,.05,-.01,.11,-.12);
    addPlant(6,tree,-.27,.14,.21,-.06);
    addPlant(6,tree,.02,.18,.17,.07);
    addPlant(6,tree,.28,.07,.15,-.05);
    addPlant(6,tree,-.17,-.12,.18,.04);
    addPlant(6,tree,.15,-.16,.13,-.09);
    const cloudRatio=cloud.image.width/cloud.image.height;
    const positions=[[-.42,.68,.72],[.69,.18,.58],[-1.13,-.51,.76],[.92,-.72,.63],[-.1,-1.14,.62],[-.16,.27,.34],[.35,-.40,.27]];
    positions.forEach(([x,y,size],i)=>{
      const make=(shadow:number)=>plane(size,size/cloudRatio,new THREE.ShaderMaterial({uniforms:{image:{value:cloud},time:{value:0},phase:{value:i*4.7},shape:{value:i===5?1:i===6?2:0},shadow:{value:shadow}},vertexShader:vertex,fragmentShader:cloudFragment,transparent:true,depthWrite:false}));
      const mesh=make(0),shadow=make(1);
      mesh.position.set(x,y,.4);shadow.position.set(x+.065,y-.13,.05);shadow.scale.setScalar(1.16);
      if(i===5){mesh.scale.y=shadow.scale.y=1.35;mesh.rotation.z=shadow.rotation.z=.30;}
      if(i===6){mesh.scale.y=shadow.scale.y=.8;mesh.rotation.z=shadow.rotation.z=-.35;}
      mesh.renderOrder=6;shadow.renderOrder=3;
      scene.add(shadow,mesh);clouds.push({mesh,shadow,x,y,speed:i===5?-.004:i===6?.005:.007+i*.0013,size});
    });
    loaded=true;options.onReady();
  }).catch(()=>{if(alive)options.onError();});

  function spawnBird() {
    if(!birdTexture||flights.length>=3)return;
    const angle=Math.random()*Math.PI*2;
    const direction=new THREE.Vector2(Math.cos(angle),Math.sin(angle));
    const normal=new THREE.Vector2(-direction.y,direction.x);
    const radius=Math.hypot(viewHeight*aspect,viewHeight)*.58;
    const start=current.clone().addScaledVector(direction,-radius).addScaledVector(normal,(Math.random()-.5)*viewHeight*.40);
    const size=.105+Math.random()*.045;
    const make=(shadow:number)=>plane(size,size*(birdTexture.image.height/birdTexture.image.width),new THREE.ShaderMaterial({uniforms:{image:{value:birdTexture},shadow:{value:shadow},flap:{value:0}},vertexShader:birdVertex,fragmentShader:birdFragment,transparent:true,depthWrite:false}),20);
    const mesh=make(0),shadow=make(1);mesh.renderOrder=7;shadow.renderOrder=3;scene.add(shadow,mesh);
    mesh.rotation.z=shadow.rotation.z=angle-Math.PI/2;
    flights.push({mesh,shadow,start,direction:direction.multiplyScalar(radius*2.25),normal,age:0,duration:15+Math.random()*7,curve:(Math.random()-.5)*.18,phase:Math.random()*6});
  }
  const clampTarget=()=>{
    const maxX=Math.max(0,WIDTH/2-viewHeight*aspect/2+.015),maxY=Math.max(0,HEIGHT/2-viewHeight/2+.015);
    target.x=THREE.MathUtils.clamp(target.x,-maxX,maxX);target.y=THREE.MathUtils.clamp(target.y,-maxY,maxY);
  };
  function resize() {
    const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    aspect=w/h;renderer.setSize(w,h,false);paperUniforms.resolution.value.set(w,h);clampTarget();
  }
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  const pointers=new Map<number,{x:number;y:number}>();let pinch=0,hasExplored=false;
  function markExplored(){if(!hasExplored){hasExplored=true;options.onExplore();}}
  const down=(event:PointerEvent)=>{
    canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});velocity.set(0,0);host.classList.add('is-dragging');
    if(pointers.size===2){const a=[...pointers.values()];pinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);}
  };
  const move=(event:PointerEvent)=>{
    const prev=pointers.get(event.pointerId);if(!prev)return;
    const dx=event.clientX-prev.x,dy=event.clientY-prev.y;
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size===2){const p=[...pointers.values()];const d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(pinch>0)zoomTarget=THREE.MathUtils.clamp(zoomTarget*pinch/d,1.05,1.96);pinch=d;}
    else {const rect=canvas.getBoundingClientRect();const scale=viewHeight/rect.height;target.x-=dx*scale;target.y+=dy*scale;velocity.set(-dx*scale,dy*scale);}
    clampTarget();if(Math.abs(dx)+Math.abs(dy)>2)markExplored();
  };
  const up=(event:PointerEvent)=>{pointers.delete(event.pointerId);pinch=0;if(!pointers.size)host.classList.remove('is-dragging');if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);};
  const cancel=(event:PointerEvent)=>{velocity.set(0,0);up(event);};
  const wheel=(event:WheelEvent)=>{event.preventDefault();zoomTarget=THREE.MathUtils.clamp(zoomTarget+event.deltaY*.0013,1.05,1.96);markExplored();};
  const key=(event:KeyboardEvent)=>{const moves:Record<string,[number,number]>={ArrowLeft:[-.10,0],ArrowRight:[.10,0],ArrowUp:[0,.10],ArrowDown:[0,-.10]};if(moves[event.key]){event.preventDefault();const [x,y]=moves[event.key];target.add(new THREE.Vector2(x,y));clampTarget();markExplored();}if(event.key==='Home'){event.preventDefault();reset();}};
  function reset(){target.copy(origin);zoomTarget=DEFAULT_VIEW_HEIGHT;velocity.set(0,0);clampTarget();}
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('keydown',key);

  function render(now:number) {
    if(!alive)return;
    const dt=Math.min((now-last)/1000,.05);last=now;
    if(!document.hidden){
      const animDt=paused?0:dt;if(loaded)elapsed+=animDt;
      if(!pointers.size){target.addScaledVector(velocity,.35);velocity.multiplyScalar(Math.exp(-dt*9));}
      viewHeight=THREE.MathUtils.lerp(viewHeight,zoomTarget,1-Math.exp(-dt*10));clampTarget();
      current.lerp(target,1-Math.exp(-dt*(paused?30:14)));
      camera.left=-viewHeight*aspect/2;camera.right=-camera.left;camera.top=viewHeight/2;camera.bottom=-camera.top;camera.updateProjectionMatrix();
      camera.position.set(current.x,current.y,5);
      uniforms.time.value=elapsed;paperUniforms.time.value=elapsed;
      clouds.forEach(c=>{
        c.x+=animDt*c.speed;c.y+=animDt*c.speed*.29;
        if(c.x>2.2)c.x=-2.2;if(c.x< -2.2)c.x=2.2;if(c.y>1.35)c.y=-1.35;if(c.y< -1.35)c.y=1.35;
        c.mesh.position.set(c.x+current.x*.055,c.y+current.y*.055,.4);
        c.shadow.position.set(c.x+.065,c.y-.13,.05);
        c.mesh.material.uniforms.time.value=c.shadow.material.uniforms.time.value=elapsed;
      });
      if(loaded&&!paused&&elapsed>=nextFlight){spawnBird();if(Math.random()<.22)spawnBird();nextFlight=elapsed+8+Math.random()*12;}
      for(let i=flights.length-1;i>=0;i--){
        const b=flights[i];b.age+=animDt;const p=b.age/b.duration;
        const pos=b.start.clone().addScaledVector(b.direction,p).addScaledVector(b.normal,Math.sin(p*Math.PI*2)*b.curve);
        const heading=b.direction.clone().addScaledVector(b.normal,Math.cos(p*Math.PI*2)*b.curve*Math.PI*2);
        b.mesh.position.set(pos.x+current.x*.025,pos.y+current.y*.025,.25);b.shadow.position.set(pos.x+.035,pos.y-.085,.07);
        b.mesh.rotation.z=b.shadow.rotation.z=Math.atan2(heading.y,heading.x)-Math.PI/2;
        const glide=Math.sin(b.age*.7+b.phase)>.2;
        const flap=glide?.04:Math.sin(b.age*5.2+b.phase)*.8;
        b.mesh.material.uniforms.flap.value=b.shadow.material.uniforms.flap.value=flap;
        if(p>1){
          scene.remove(b.mesh,b.shadow);
          [b.mesh,b.shadow].forEach(mesh=>{
            mesh.geometry.dispose();mesh.material.dispose();
            geometries.splice(geometries.indexOf(mesh.geometry),1);
            materials.splice(materials.indexOf(mesh.material),1);
          });
          flights.splice(i,1);
        }
      }
      renderer.clear();if(loaded)renderer.render(scene,camera);renderer.clearDepth();renderer.render(overlay,overlayCamera);
      frames++;if(now-lastStats>1000){canvas.dataset.sceneTime=elapsed.toFixed(2);canvas.dataset.camera=`${current.x.toFixed(3)},${current.y.toFixed(3)},${viewHeight.toFixed(3)}`;canvas.dataset.birds=String(flights.length);canvas.dataset.frames=String(frames);lastStats=now;}
    }
    raf=requestAnimationFrame(render);
  }
  raf=requestAnimationFrame(render);
  return {reset,setPaused(value){paused=value;},dispose(){
    alive=false;cancelAnimationFrame(raf);observer.disconnect();
    canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('keydown',key);
    textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());renderer.dispose();canvas.remove();
  }};
}
