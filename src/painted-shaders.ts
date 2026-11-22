export const vertex = `
varying vec2 vUv;
void main() { vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }
`;

const noise = `
float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p) { vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
`;

export const terrainFragment = `
uniform sampler2D painting;
uniform sampler2D flowMap;
uniform float time;
varying vec2 vUv;
${noise}
float water(vec3 c) { return smoothstep(.025,.12,c.b-c.r)*smoothstep(.02,.16,c.g-c.r); }
void main() {
  vec4 original=texture2D(painting,vUv);
  float mask=water(original.rgb);
  vec2 flow=texture2D(flowMap,vUv).rg*2.-1.;
  // Two staggered advected copies; the resetting copy has zero weight.
  float phase0=fract(time*.055),phase1=fract(time*.055+.5);
  float blend=abs(phase0*2.-1.);
  vec2 offset0=-flow*(phase0-.5)*.009;
  vec2 offset1=-flow*(phase1-.5)*.009;
  // Elliptical pond: rotate samples around its centre in image-correct space.
  vec2 pond=vUv-vec2(.756,.802);
  vec2 metric=pond*vec2(5504./3072.,1.);
  if(length(metric)<.053){
    float a0=-(phase0-.5)*.11,a1=-(phase1-.5)*.11;
    offset0=(mat2(cos(a0),sin(a0),-sin(a0),cos(a0))*metric-metric)/vec2(5504./3072.,1.);
    offset1=(mat2(cos(a1),sin(a1),-sin(a1),cos(a1))*metric-metric)/vec2(5504./3072.,1.);
  }
  vec4 moved0=texture2D(painting,vUv+offset0);
  vec4 moved1=texture2D(painting,vUv+offset1);
  // Erode the mask so banks, foliage, shadows and railway never get pulled into water.
  float safe=mask*water(moved0.rgb)*water(moved1.rgb);
  safe*=water(texture2D(painting,vUv+vec2(.002,0)).rgb)*water(texture2D(painting,vUv-vec2(.002,0)).rgb);
  safe*=water(texture2D(painting,vUv+vec2(0,.002)).rgb)*water(texture2D(painting,vUv-vec2(0,.002)).rgb);
  vec3 col=mix(original.rgb,mix(moved0.rgb,moved1.rgb,blend),safe);
  gl_FragColor=vec4(col,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export const cloudFragment = `
uniform sampler2D image;
uniform float time;
uniform float phase;
uniform float shadow;
uniform float shape;
varying vec2 vUv;
${noise}
void main() {
  vec2 uv=vUv;
  // Two distinct silhouettes built from the existing painted cloud texture.
  if(shape>.5 && shape<1.5){ uv.x=.5+(uv.x-.5)*1.16;uv.y+=(uv.x-.5)*(uv.x-.5)*.38; }
  if(shape>1.5){ uv.x=1.-uv.x;uv.y+=(sin(uv.x*7.)*.055);uv.x+=sin(uv.y*5.)*.065; }
  uv+=vec2(noise(uv*9.+time*.025+phase),noise(uv*11.-time*.02+phase))*.007-.0035;
  vec4 c=texture2D(image,uv);
  if(shadow>.5) {
    float a=c.a*.2;
    a+=texture2D(image,uv+vec2(.045,0)).a*.15+texture2D(image,uv-vec2(.045,0)).a*.15;
    a+=texture2D(image,uv+vec2(0,.07)).a*.15+texture2D(image,uv-vec2(0,.07)).a*.15;
    a+=texture2D(image,uv+vec2(.09,0)).a*.05+texture2D(image,uv-vec2(.09,0)).a*.05;
    a+=texture2D(image,uv+vec2(0,.13)).a*.05+texture2D(image,uv-vec2(0,.13)).a*.05;
    gl_FragColor=vec4(.15,.30,.33,a*.12);
  } else {
    float edge=smoothstep(.08,.85,c.a);
    float grain=noise(uv*420.+vec2(time*.12,-time*.08));
    c.a*=mix(.78+grain*.22,1.,edge)*.89;
    gl_FragColor=c;
  }
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export const birdVertex = `
uniform float flap;
varying vec2 vUv;
void main() {
  vUv=uv; vec3 p=position;
  float wing=smoothstep(.08,.44,abs(p.x));
  p.x*=1.-wing*flap*.30;
  p.y+=wing*flap*.105;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}
`;
export const birdFragment = `
uniform sampler2D image; uniform float shadow; varying vec2 vUv;
void main() {
  vec4 c=texture2D(image,vUv);
  // Remove the low-alpha feather halo while retaining the painted silhouette.
  c.a=smoothstep(.55,.92,c.a);
  if(shadow>.5){
    float a=c.a*.16;
    a+=texture2D(image,vUv+vec2(.055,0)).a*.14+texture2D(image,vUv-vec2(.055,0)).a*.14;
    a+=texture2D(image,vUv+vec2(0,.055)).a*.14+texture2D(image,vUv-vec2(0,.055)).a*.14;
    a+=texture2D(image,vUv+vec2(.11,0)).a*.07+texture2D(image,vUv-vec2(.11,0)).a*.07;
    a+=texture2D(image,vUv+vec2(0,.11)).a*.07+texture2D(image,vUv-vec2(0,.11)).a*.07;
    gl_FragColor=vec4(.16,.31,.36,a*.17);
  }else gl_FragColor=vec4(c.rgb,c.a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export const paperFragment = `
uniform vec2 resolution; uniform float time; varying vec2 vUv;
${noise}
void main() {
  vec2 px=vUv*resolution;
  float edge=min(min(px.x-9.,resolution.x-px.x-9.),min(px.y-65.,resolution.y-px.y-72.));
  float broad=noise(px*.055)*8.+noise(px*.16+time*.035)*4.;
  float speckle=hash(floor(px*1.25)+floor(time*6.)*.011);
  float coverage=smoothstep(1.,17.,edge+broad+(speckle-.5)*13.);
  float paperGrain=hash(floor(px*1.4));
  vec3 paper=vec3(.956,.941,.902)+(paperGrain-.5)*.025;
  gl_FragColor=vec4(paper,1.-coverage);
}
`;
