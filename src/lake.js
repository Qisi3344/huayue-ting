import * as THREE from '../vendor/three.module.js';

import {LOCATIONS} from './data.js';
import {bounds,waterDepth,landings} from './waterways.js';

export const waterHeight = -.13;

export function createLake(scene, renderer) {
 const reflection = new THREE.WebGLRenderTarget(1, 1);
 const mirrors=[new THREE.OrthographicCamera(),new THREE.PerspectiveCamera()];
 for(const mirror of mirrors)mirror.layers.set(1);
 const look = new THREE.Vector3();
 // One cached depth field drives the water, collision and both charts.
 const size=256,samples=new Uint8Array(size*size*4),[left,right,top,bottom]=bounds;
 const palettes=LOCATIONS.map(({id,view})=>({...landings[id],shallow:new THREE.Color(view.water),deep:new THREE.Color(view.deep)}));
 const base=new THREE.Color(),shade=new THREE.Color();
 for(let j=0;j<size;j++)for(let i=0;i<size;i++){
  const x=left+i/(size-1)*(right-left),z=top+j/(size-1)*(bottom-top),d=waterDepth(x,z);
  const depth=THREE.MathUtils.smoothstep(d,-.25,5.8);
  base.setRGB(0,0,0);
  let total=0;
  for(const p of palettes){
   const distance=12+(x-p.x)**2+(z-p.z)**2,weight=1/(distance*distance);
   base.add(shade.lerpColors(p.shallow,p.deep,depth).multiplyScalar(weight));total+=weight;
  }
  base.multiplyScalar(1/total).convertLinearToSRGB();
  const k=(j*size+i)*4;
  samples[k]=Math.round(THREE.MathUtils.clamp((d+4)/16,0,1)*255);
  samples[k+1]=Math.round(base.r*255);samples[k+2]=Math.round(base.g*255);samples[k+3]=Math.round(base.b*255);
 }
 const riverTexture=new THREE.DataTexture(samples,size,size,THREE.RGBAFormat);
 riverTexture.minFilter=riverTexture.magFilter=THREE.LinearFilter;riverTexture.needsUpdate=true;
 const uniforms = {
  riverEdges:{value:riverTexture},
  limits:{value:new THREE.Vector4(...bounds)}, tint: {value: new THREE.Color()}, sky: {value: new THREE.Color()},
  dusk:{value:0},moonlight:{value:0},impact:{value:new THREE.Vector3(0,0,9)},
  moonLamp:{value:new THREE.Vector2(landings.moon.x+2.2,landings.moon.z+5.6)},
  tideBay:{value:new THREE.Vector2(landings.tide.x,landings.tide.z)},
  iceBank:{value:new THREE.Vector2(landings.snow.x,landings.snow.z+5.1)},
  lightTint: {value: new THREE.Color()}, clock: {value: 0},
  reflected: {value: reflection.texture},
  mirrorVP: {value: new THREE.Matrix4()}, reflectionTexel: {value: new THREE.Vector2()}
 };
 const material = new THREE.ShaderMaterial({
  uniforms, transparent: true,depthWrite:false,
  vertexShader: `
   uniform mat4 mirrorVP;
   varying vec3 world;
   varying vec4 reflectionUV;
   varying float fogDepth;
   void main() {
    world = (modelMatrix * vec4(position, 1.)).xyz;
    reflectionUV = mirrorVP * vec4(world, 1.);
    vec4 view = viewMatrix * vec4(world, 1.);
    fogDepth = -view.z;
    gl_Position = projectionMatrix * view;
   }`,
  fragmentShader: `
   uniform vec3 tint, sky, lightTint;
   uniform float clock,dusk,moonlight;
   uniform vec3 impact;
   uniform vec2 moonLamp,tideBay,iceBank;
   uniform vec4 limits;
   uniform sampler2D reflected,riverEdges;
   uniform vec2 reflectionTexel;
   varying vec3 world;
   varying vec4 reflectionUV;
   varying float fogDepth;
   float noise(vec2 p) {
    vec2 cell = floor(p), f = fract(p);
    f = f*f*(3.-2.*f);
    vec4 h = fract(sin(dot(cell,vec2(17.1,79.3))+vec4(0.,17.1,79.3,96.4))*4375.3);
    return mix(mix(h.x,h.y,f.x),mix(h.z,h.w,f.x),f.y);
   }
   void main() {
    vec2 p = world.xz;
    vec2 cell=clamp((p-limits.xz)/(limits.yw-limits.xz),0.,1.)*(255./256.)+.5/256.;
    vec4 field=texture2D(riverEdges,cell);
    float d=field.r*16.-4.;
    float drift = noise(p*vec2(.75,2.6)+vec2(clock*.12,-clock*.18));
    float ripple = noise(p*vec2(1.7,6.2)+vec2(-clock*.19,clock*.23));
    vec2 bend = vec2(drift-.5,ripple-.5);
    vec3 viewDir=normalize(cameraPosition-world);
    float grazing=pow(1.-clamp(viewDir.y,0.,1.),2.);
    vec3 color=pow(field.gba,vec3(2.2))*tint*(1.08-.28*smoothstep(3.,25.,fogDepth)+.075*(drift-.5));
    vec3 reflectedSky=reflect(-viewDir,normalize(vec3(bend.x*.09,1.,bend.y*.07)));
    vec2 cloudP=reflectedSky.xz/max(.06,reflectedSky.y)*1.3;
    float cloud=sin(cloudP.x*1.23)+cos(cloudP.y*1.7)+.45*sin(cloudP.x*3.+cloudP.y*2.)+.24*cos(cloudP.y*4.4);
    vec3 skyWash=sky*mix(vec3(1.07),vec3(.46,.72,1.03),smoothstep(-.04,.55,reflectedSky.y));
    skyWash=mix(skyWash,sky*vec3(1.36,1.28,1.15),.7*smoothstep(1.27,1.53,cloud));
    color=mix(color,skyWash,.075+.19*grazing);
    vec2 uv = reflectionUV.xy/reflectionUV.w*.5+.5+bend*vec2(.013,.022);
    vec4 refl = (2.*texture2D(reflected,uv) + texture2D(reflected,uv+reflectionTexel) + texture2D(reflected,uv-reflectionTexel))*.25;
    float reflectivity=.22+.28*grazing;
    color=color*(1.-reflectivity*refl.a)+reflectivity*refl.rgb;
    float bands=sin(p.y*12.+p.x*2.4+clock*1.7+3.8*drift)*.5+.5;
    float spark=smoothstep(.72,.94,.45*drift+.55*ripple)*smoothstep(.42,.9,bands);
    color+=lightTint*spark*(.14+.25*grazing);
    // Light ribbons originate at the landmarks and stretch towards the observer.
    vec2 axis=normalize(cameraPosition.xz-moonLamp+vec2(.001));
    vec2 delta=p-moonLamp;
    float along=dot(delta,axis),side=abs(delta.x*axis.y-delta.y*axis.x+bend.x*.55);
    float ribbon=exp(-side*side/(.24+.13*max(0.,along)))*smoothstep(-.4,1.4,along)*(1.-smoothstep(3.,12.,along));
    color+=vec3(.42,.57,.98)*ribbon*moonlight*(.13+.77*smoothstep(.62,.97,bands));
    float facing=pow(max(0.,dot(normalize(-viewDir.xz+vec2(.001)),normalize(vec2(-1.,.24)))),55.);
    float amber=1.-smoothstep(9.,21.,length(p-tideBay));
    float fleck=smoothstep(.72,.98,sin(p.x*10.+drift*8.+clock*1.55)*.5+.5)*smoothstep(.3,.75,.5*(ripple+drift));
    color+=vec3(1.,.54,.14)*dusk*amber*facing*(.055+.75*fleck);
    vec2 ice=p-iceBank;
    color+=vec3(.21,.66,.88)*exp(-dot(ice,ice)*.052)*smoothstep(.68,.93,sin(p.x*3.+drift*4.)*.5+.5)*(.16+.35*bands);
    float foam=(1.-smoothstep(.035,.16,abs(d-.08-bend.x*.17)))*(.42+.58*drift);
    float radius=length(p-impact.xy),wave=0.;
    for(int i=0;i<3;i++){
     float age=impact.z-float(i)*.15;
     wave+=step(0.,age)*(1.-smoothstep(.25,1.4,age))*(1.-smoothstep(.015,.065,abs(radius-(.12+1.1*age)+.018*(drift-.5))));
    }
    color=mix(color,lightTint,clamp(foam*.8+wave*(.32+.23*drift),0.,.9));
    color=mix(color,sky,smoothstep(22.,62.,fogDepth)*.82);
    gl_FragColor=vec4(color,.96);
    #include <colorspace_fragment>
   }`
 });
 const surface = new THREE.Mesh(new THREE.PlaneGeometry(200,200),material);
 surface.rotation.x = -Math.PI/2;
 surface.position.y = waterHeight;
 scene.add(surface);

 // Draw the submerged silhouettes over the water color, still depth-tested against banks and hull.
 const shape = new THREE.Shape();
 shape.moveTo(.49,0);
 shape.quadraticCurveTo(.22,.19,-.19,.065);
 shape.lineTo(-.42,.18); shape.lineTo(-.37,0); shape.lineTo(-.42,-.16);
 shape.lineTo(-.19,-.055); shape.quadraticCurveTo(.24,-.17,.49,0);
 const fishGeometry = new THREE.ShapeGeometry(shape,8);
 fishGeometry.rotateX(-Math.PI/2);
 const schools = [[2,4.4],[7,-2],[13,2.2],...Object.values(landings).slice(1).flatMap(p=>[[p.x-2.1,p.z+1.4],[p.x+1.7,p.z+1.9]])];
 const fish = schools.flatMap(([x,z],school)=>Array.from({length:3},(_,i)=>({
  homeX:x+i*.47,homeZ:z+i*.35,x:x+i*.47,z:z+i*.35,angle:0,phase:i*.87+school*1.4
 })));
 const fishMaterial = new THREE.MeshBasicMaterial({color:0x264754,transparent:true,opacity:.38,depthWrite:false});
 // Distort the submerged silhouette before the water blends over it.
 fishMaterial.onBeforeCompile = shader => {
  shader.uniforms.waterClock = uniforms.clock;
  shader.vertexShader = 'uniform float waterClock;\n' + shader.vertexShader.replace('#include <project_vertex>', `
   transformed.z+=.085*sin(waterClock*5.+instanceMatrix[3].x)*smoothstep(.04,.4,-transformed.x);
   #include <project_vertex>
   vec2 lakePos = (instanceMatrix * vec4(transformed,1.)).xz;
   vec2 offset = vec2(sin(lakePos.y*5.+waterClock*.7),cos(lakePos.x*4.-waterClock*.6))*.022;
   gl_Position.xy += vec2(projectionMatrix[0][0],projectionMatrix[1][1])*offset;
  `);
 };
 const shadows = new THREE.InstancedMesh(fishGeometry,fishMaterial,fish.length);
 shadows.frustumCulled=false;shadows.renderOrder=1;
 scene.add(shadows);
 const pose = new THREE.Object3D();

 // Short curved strokes already shed by the stern stay in world space as the boat turns.
 const vertices = [], indices = [];
 for(const side of [-1,1]) {
  const start=vertices.length/3;
  for(let i=0;i<=6;i++){
   const u=i/6, x=side*(.16+.66*u), z=-.45*u*u;
   vertices.push(x,0,z,x,0,z+.11*Math.sin(Math.PI*u));
   if(i) {const j=start+2*i;indices.push(j-2,j-1,j,j,j-1,j+1);}
  }
 }
 const stroke = new THREE.BufferGeometry();
 stroke.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3)); stroke.setIndex(indices);
 const wakes=Array.from({length:12},()=>{
  const m=new THREE.Mesh(stroke,new THREE.MeshBasicMaterial({color:0xe4f4df,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
  m.visible=false; m.renderOrder=2; scene.add(m);
  return {mesh:m,age:Infinity};
 });
 let cursor=0, elapsed=0, lastCapture=-Infinity;
 function resetWake(){for(const w of wakes){w.age=Infinity;w.mesh.visible=false;}elapsed=0;}
 function update(dt,t,nav,motion){
  uniforms.clock.value=t*motion;
  uniforms.impact.value.z+=dt;
  for(let i=0;i<fish.length;i++){
   const f=fish[i], a=t*.29*motion+f.phase;
   const dx=f.x-nav.x, dz=f.z-nav.z, range=Math.max(.01,Math.hypot(dx,dz));
   const flee=nav.onBoat && nav.speed>.15 ? Math.max(0,1-range/3)*2.8 : 0;
   const leader=fish[i-i%3];
   const followX=(leader.x-leader.homeX)*.55, followZ=(leader.z-leader.homeZ)*.55;
   const vx=(f.homeX+(i%3 ? followX : 0)+1.1*Math.sin(a)-f.x)*.85+dx/range*flee;
   const vz=(f.homeZ+(i%3 ? followZ : 0)+.65*Math.sin(a*1.2)-f.z)*.85+dz/range*flee;
   const nx=f.x+vx*dt*motion,nz=f.z+vz*dt*motion;
   if(waterDepth(nx,nz)>.15){f.x=nx;f.z=nz;}
   if(Math.abs(vx)+Math.abs(vz)>.035) {
    const turn=Math.atan2(-vz,vx)-f.angle;
    f.angle+=Math.atan2(Math.sin(turn),Math.cos(turn))*Math.min(1,dt*5)*motion;
   }
   pose.position.set(f.x,-.31-.04*(i%3),f.z);pose.rotation.y=f.angle;
   pose.scale.setScalar(.93+.15*(i%3));pose.updateMatrix();shadows.setMatrixAt(i,pose.matrix);
  }
  shadows.instanceMatrix.needsUpdate=true;
  if(nav.paused)return;
  elapsed+=dt;
  if(nav.sailing && nav.speed>.3 && elapsed>=.22 && motion){
   const w=wakes[cursor];cursor=(cursor+1)%wakes.length;elapsed=0;w.age=0;
   w.mesh.position.set(nav.x-nav.vx/nav.speed*1.62,waterHeight+.035,nav.z-nav.vz/nav.speed*1.62);
   w.mesh.rotation.y=nav.heading;w.mesh.visible=true;
  }
  for(const w of wakes){
   if(!w.mesh.visible)continue;
   w.age+=dt;const life=Math.min(1,w.age/2.65);
   w.mesh.scale.setScalar(.78+1.9*life);w.mesh.material.opacity=.76*(1-life)**2;
   w.mesh.visible=life<1;
  }
 }
 let compact=false, framesSinceCapture=Infinity;
 function resize(width,height){
  compact=width<=650;
  const scale=(compact?192:256)/Math.max(width,height);
  reflection.setSize(Math.max(1,Math.round(width*scale)),Math.max(1,Math.round(height*scale)));
  uniforms.reflectionTexel.value.set(.65/reflection.width,.65/reflection.height);lastCapture=-Infinity;
 }
 const lastEye=new THREE.Vector3(), lastTarget=new THREE.Vector3();
 let lastX=0,lastZ=0,lastYaw=0,lastZoom=0,dirty=true;
 function invalidate(){dirty=true;}
 function capture(t,camera,target,nav,lightingChanged){
  framesSinceCapture++;
  if(!dirty && Number.isFinite(lastCapture)){
   // Ignore subpixel idle bob and head/tail sway; ripples still animate each frame.
   const moved=Math.hypot(nav.x-lastX,nav.z-lastZ)>.024 || Math.abs(nav.heading-lastYaw)>.015;
   const viewChanged=camera.position.distanceToSquared(lastEye)>.0009 || target.distanceToSquared(lastTarget)>.0009 || Math.abs(camera.zoom-lastZoom)>.001;
   if(!moved && !viewChanged && !lightingChanged)return;
   if(t-lastCapture<(compact?1/4:1/8) || (compact && framesSinceCapture<2))return;
  }
  dirty=false;framesSinceCapture=0;lastCapture=t;
  lastEye.copy(camera.position);lastTarget.copy(target);lastZoom=camera.zoom;
  lastX=nav.x;lastZ=nav.z;lastYaw=nav.heading;
  const mirror=mirrors[Number(Boolean(camera.isPerspectiveCamera))];
  mirror.projectionMatrix.copy(camera.projectionMatrix);
  mirror.position.copy(camera.position);mirror.position.y=2*waterHeight-camera.position.y;
  look.copy(target);look.y=2*waterHeight-target.y;
  mirror.up.set(0,-1,0);mirror.lookAt(look);mirror.updateMatrixWorld();
  uniforms.mirrorVP.value.multiplyMatrices(mirror.projectionMatrix,mirror.matrixWorldInverse);
  const background=scene.background,alpha=renderer.getClearAlpha(),shadowsEnabled=renderer.shadowMap.autoUpdate;
  scene.background=null;renderer.setClearColor(0,0);renderer.shadowMap.autoUpdate=false;
  renderer.setRenderTarget(reflection);renderer.render(scene,mirror);renderer.setRenderTarget(null);
  scene.background=background;renderer.setClearColor(background,alpha);renderer.shadowMap.autoUpdate=shadowsEnabled;
 }
 return {dusk:uniforms.dusk,moonlight:uniforms.moonlight,
  splash(x,z){uniforms.impact.value.set(x,z,0);},clearSplash(){uniforms.impact.value.z=9;},tint:uniforms.tint.value,resize,update,capture,resetWake,invalidate,
  environment(sky,light,invalidate=true){uniforms.sky.value.copy(sky);uniforms.lightTint.value.copy(light);if(invalidate)lastCapture=-Infinity;},
  dispose(){riverTexture.dispose();reflection.dispose();}
 };
}
