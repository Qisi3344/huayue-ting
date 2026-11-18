import * as THREE from '../vendor/three.module.js';

export const waterHeight = -.13;

// The horizontal intersection of the bank ellipsoids at the water level.
export function waterline(x, y, z, rx, ry, rz) {
 const scale = Math.sqrt(Math.max(0, 1 - ((waterHeight - y) / ry) ** 2));
 return new THREE.Vector4(x, z, rx * scale, rz * scale);
}

export function createLake(scene, renderer, banks) {
 const reflection = new THREE.WebGLRenderTarget(1, 1);
 const mirror = new THREE.OrthographicCamera();
 mirror.layers.set(1);
 const look = new THREE.Vector3();
 const uniforms = {
  tint: {value: new THREE.Color()}, sky: {value: new THREE.Color()},
  lightTint: {value: new THREE.Color()}, clock: {value: 0}, banks: {value: banks},
  creekVisible: {value: 1}, reflected: {value: reflection.texture},
  mirrorVP: {value: new THREE.Matrix4()}, reflectionTexel: {value: new THREE.Vector2()}
 };
 const material = new THREE.ShaderMaterial({
  uniforms, transparent: true,
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
   uniform float clock, creekVisible;
   uniform vec4 banks[3];
   uniform sampler2D reflected;
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
   float shore(vec2 p, vec4 b) {
    return (length((p-b.xy)/b.zw)-1.) * min(b.z,b.w);
   }
   void main() {
    vec2 p = world.xz;
    float d = min(shore(p,banks[0]),shore(p,banks[1]));
    if (creekVisible>.5) d = min(d,shore(p,banks[2]));
    float drift = noise(p*vec2(.75,2.6)+vec2(clock*.12,-clock*.18));
    float ripple = noise(p*vec2(1.7,6.2)+vec2(-clock*.19,clock*.23));
    vec2 bend = vec2(drift-.5,ripple-.5);
    float depth = smoothstep(-.1,7.8,d+bend.x*.3);
    vec3 shallow = tint*vec3(1.22,1.12,.93);
    vec3 deep = tint*vec3(.32,.71,.80);
    vec3 color = mix(shallow,deep,depth) * (.96+.08*drift);
    vec2 uv = reflectionUV.xy/reflectionUV.w*.5+.5+bend*vec2(.013,.022);
    vec4 refl = (2.*texture2D(reflected,uv) + texture2D(reflected,uv+reflectionTexel) + texture2D(reflected,uv-reflectionTexel))*.25;
    color = color*(1.-.44*refl.a)+.44*refl.rgb;
    float crest = smoothstep(.79,.92,.55*drift+.45*ripple);
    float foam = (1.-smoothstep(.035,.14,abs(d-.08-bend.x*.17))) * (.4+.6*drift);
    color = mix(color,lightTint,foam*.82+crest*.38);
    color = mix(color,sky,smoothstep(27.,69.,fogDepth));
    gl_FragColor = vec4(color,.84+.14*foam);
    #include <colorspace_fragment>
   }`
 });
 const surface = new THREE.Mesh(new THREE.PlaneGeometry(200,200),material);
 surface.rotation.x = -Math.PI/2;
 surface.position.y = waterHeight;
 scene.add(surface);

 // Fish render beneath the translucent surface. One shared mesh covers both harbors.
 const shape = new THREE.Shape();
 shape.moveTo(.49,0);
 shape.quadraticCurveTo(.22,.19,-.19,.065);
 shape.lineTo(-.42,.18); shape.lineTo(-.37,0); shape.lineTo(-.42,-.16);
 shape.lineTo(-.19,-.055); shape.quadraticCurveTo(.24,-.17,.49,0);
 const fishGeometry = new THREE.ShapeGeometry(shape,8);
 fishGeometry.rotateX(-Math.PI/2);
 const schools = [[2,4.4],[7,-2],[13,2.2],[17,-.35]];
 const fish = schools.flatMap(([x,z],school)=>Array.from({length:3},(_,i)=>({
  homeX:x+i*.47,homeZ:z+i*.35,x:x+i*.47,z:z+i*.35,angle:0,phase:i*.87+school*1.4
 })));
 const fishMaterial = new THREE.MeshBasicMaterial({color:0x244f50});
 // Distort the submerged silhouette before the water blends over it.
 fishMaterial.onBeforeCompile = shader => {
  shader.uniforms.waterClock = uniforms.clock;
  shader.vertexShader = 'uniform float waterClock;\n' + shader.vertexShader.replace('#include <project_vertex>', `
   #include <project_vertex>
   vec2 lakePos = (instanceMatrix * vec4(transformed,1.)).xz;
   vec2 offset = vec2(sin(lakePos.y*5.+waterClock*.7),cos(lakePos.x*4.-waterClock*.6))*.022;
   gl_Position.xy += vec2(projectionMatrix[0][0],projectionMatrix[1][1])*offset;
  `);
 };
 const shadows = new THREE.InstancedMesh(fishGeometry,fishMaterial,fish.length);
 shadows.frustumCulled=false;
 scene.add(shadows);
 const pose = new THREE.Object3D();

 // Short curved strokes already shed by the stern stay in world space as the boat turns.
 const vertices = [], indices = [];
 for(const side of [-1,1]) {
  const start=vertices.length/3;
  for(let i=0;i<=6;i++){
   const u=i/6, x=side*(.16+.66*u), z=-.45*u*u;
   vertices.push(x,0,z,x,0,z+.072*Math.sin(Math.PI*u));
   if(i) {const j=start+2*i;indices.push(j-2,j-1,j,j,j-1,j+1);}
  }
 }
 const stroke = new THREE.BufferGeometry();
 stroke.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3)); stroke.setIndex(indices);
 const wakes=Array.from({length:12},()=>{
  const m=new THREE.Mesh(stroke,new THREE.MeshBasicMaterial({color:0xe4f4df,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
  m.visible=false; m.renderOrder=1; scene.add(m);
  return {mesh:m,age:Infinity};
 });
 let cursor=0, elapsed=0, lastCapture=-Infinity;
 function resetWake(){for(const w of wakes){w.age=Infinity;w.mesh.visible=false;}elapsed=0;}
 function update(dt,t,nav,motion){
  uniforms.clock.value=t*motion;
  for(let i=0;i<fish.length;i++){
   const f=fish[i], a=t*.29*motion+f.phase;
   const dx=f.x-nav.x, dz=f.z-nav.z, range=Math.max(.01,Math.hypot(dx,dz));
   const flee=nav.onBoat && nav.speed>.15 ? Math.max(0,1-range/3)*2.8 : 0;
   const leader=fish[i-i%3];
   const followX=(leader.x-leader.homeX)*.55, followZ=(leader.z-leader.homeZ)*.55;
   const vx=(f.homeX+(i%3 ? followX : 0)+1.1*Math.sin(a)-f.x)*.85+dx/range*flee;
   const vz=(f.homeZ+(i%3 ? followZ : 0)+.65*Math.sin(a*1.2)-f.z)*.85+dz/range*flee;
   f.x+=vx*dt*motion;f.z+=vz*dt*motion;
   if(Math.abs(vx)+Math.abs(vz)>.035) {
    const turn=Math.atan2(-vz,vx)-f.angle;
    f.angle+=Math.atan2(Math.sin(turn),Math.cos(turn))*Math.min(1,dt*5)*motion;
   }
   pose.position.set(f.x,-.31-.04*(i%3),f.z);pose.rotation.y=f.angle;
   pose.scale.setScalar(.77+.1*(i%3));pose.updateMatrix();shadows.setMatrixAt(i,pose.matrix);
  }
  shadows.instanceMatrix.needsUpdate=true;
  if(nav.paused)return;
  elapsed+=dt;
  if(nav.sailing && nav.speed>.3 && elapsed>=.26 && motion){
   const w=wakes[cursor];cursor=(cursor+1)%wakes.length;elapsed=0;w.age=0;
   w.mesh.position.set(nav.x-nav.vx/nav.speed*1.35,waterHeight+.021,nav.z-nav.vz/nav.speed*1.35);
   w.mesh.rotation.y=nav.heading;w.mesh.visible=true;
  }
  for(const w of wakes){
   if(!w.mesh.visible)continue;
   w.age+=dt;const life=Math.min(1,w.age/2.3);
   w.mesh.scale.setScalar(.65+1.35*life);w.mesh.material.opacity=.62*(1-life)**2;
   w.mesh.visible=life<1;
  }
 }
 let compact=false, framesSinceCapture=Infinity;
 function resize(width,height){
  compact=width<=650;
  const scale=(compact?192:384)/Math.max(width,height);
  reflection.setSize(Math.max(1,Math.round(width*scale)),Math.max(1,Math.round(height*scale)));
  uniforms.reflectionTexel.value.set(.65/reflection.width,.65/reflection.height);lastCapture=-Infinity;
 }
 function capture(t,camera,target){
  framesSinceCapture++;
  if(Number.isFinite(lastCapture) && (framesSinceCapture<(compact?4:2) || t-lastCapture<(compact?.25:.125)))return;
  framesSinceCapture=0;
  lastCapture=t;
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
 return {tint:uniforms.tint.value,resize,update,capture,resetWake,
  environment(sky,light,creek){uniforms.sky.value.copy(sky);uniforms.lightTint.value.copy(light);uniforms.creekVisible.value=Number(creek);lastCapture=-Infinity;},
  dispose(){reflection.dispose();}
 };
}
