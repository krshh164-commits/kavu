const noise = `
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
`;
export const waterFragment = `
uniform sampler2D painting; uniform float time; varying vec2 vUv;
${noise}
void main(){
 vec2 uv=vUv;
 uv+=vec2(sin(uv.y*23.+time*.18),sin(uv.x*17.-time*.13))*.003;
 vec3 col=texture2D(painting,uv*vec2(3.5556,2.)).rgb;
 float waves=sin(vUv.y*92.+noise(vUv*8.)*6.-time*.32)*.004;
 col+=waves;
 gl_FragColor=vec4(col,1.);
 #include <colorspace_fragment>
}`;
export const grainFragment = `
uniform float time; varying vec2 vUv;
${noise}
float fleck(vec2 p,float frame){
 vec2 cell=floor(p), local=fract(p);
 vec2 key=cell+vec2(frame*19.7,frame*43.1);
 float chance=hash(key);
 vec2 center=vec2(.2+hash(key+17.)*.6,.2+hash(key+53.)*.6);
 float radius=.17+hash(key+91.)*.16;
 float soft=smoothstep(radius,radius*.18,length(local-center));
 return soft*step(.48,chance)*(.45+.55*chance);
}
void main(){
 vec2 p=vUv*vec2(180.,180.);
 float phase=time*7.;float frame=floor(phase);
 float blend=smoothstep(.12,.88,fract(phase));
 float pigment=mix(fleck(p,frame),fleck(p,frame+1.),blend);
 gl_FragColor=vec4(.12,.40,.62,pigment*.30);
 #include <colorspace_fragment>
}`;
export const islandFragment = `
uniform sampler2D image; varying vec2 vUv;
void main(){
 gl_FragColor=texture2D(image,vUv);
 #include <colorspace_fragment>
}`;
export const plantFragment = `
uniform sampler2D image; varying vec2 vUv;
void main(){
 gl_FragColor=texture2D(image,vUv);
 #include <colorspace_fragment>
}
`;
export const plantShadowFragment = `
uniform sampler2D image; uniform float shadowKind; varying vec2 vUv;
void main(){
 vec2 uv=(vUv-.5)*1.35+.5;
 float reach=shadowKind>1.5?.115:shadowKind>.5?.055:.09;
 vec2 p=uv-vec2(reach,-reach*.65);
 if(shadowKind>.5){
   p.x+=(uv.y-.5)*.14;
   p.y=.5+(p.y-.5)*1.12;
 }
 float a=texture2D(image,p).a*.2;
 a+=texture2D(image,p+vec2(.055,0)).a*.14+texture2D(image,p-vec2(.055,0)).a*.14;
 a+=texture2D(image,p+vec2(0,.055)).a*.14+texture2D(image,p-vec2(0,.055)).a*.14;
 a+=texture2D(image,p+vec2(.11,0)).a*.06+texture2D(image,p-vec2(.11,0)).a*.06;
 a+=texture2D(image,p+vec2(0,.11)).a*.06+texture2D(image,p-vec2(0,.11)).a*.06;
 float contact=texture2D(image,uv).a;
 float strength=shadowKind>1.5 ? a*.20+contact*.17 : shadowKind>.5 ? a*.26+contact*.24 : a*.28;
 gl_FragColor=vec4(.23,.28,.20,strength);
 #include <colorspace_fragment>
}`;
export const shorelineFragment = `
uniform sampler2D image; uniform float time; varying vec2 vUv;
${noise}
float shape(vec2 uv){return texture2D(image,uv).a;}
void main(){
 vec2 p=(vUv-.5)*1.14+.5;
 float center=shape(p);
 float near=0.;float far=0.;
 for(int i=0;i<12;i++){
  float a=float(i)*6.2831853/12.;vec2 d=vec2(cos(a),sin(a));
  near=max(near,shape(p+d*.014));
  far=max(far,shape(p+d*.044));
 }
 float outside=1.-smoothstep(.08,.58,center);
 float shallow=outside*far*.24;
 float broken=.55+.45*noise(p*65.+vec2(time*.035,0.));
 float ripple=outside*near*broken*(.045+.025*sin(p.x*54.+p.y*39.-time*.6));
 vec3 color=mix(vec3(.46,.76,.78),vec3(.82,.90,.78),smoothstep(.5,1.,broken));
 gl_FragColor=vec4(color,shallow+ripple);
 #include <colorspace_fragment>
}`;
