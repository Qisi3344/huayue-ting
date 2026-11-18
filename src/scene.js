import {batchRigidMeshes} from './boat.js';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {createNavigation, landings, otherLanding} from './navigation.js';

import {createLake, waterline} from './lake.js';
import {createLakeFocus} from './lake-focus.js';

export async function createWorld(container,options={}) {
 const scene=new THREE.Scene();
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0xd6e8d6);
 renderer.domElement.setAttribute('aria-label','紫瞳小灰狼坐在小木船上钓鱼的真实三维场景');container.append(renderer.domElement);
 const camera=new THREE.OrthographicCamera(-12,12,8,-8,.1,170);let orbit=.49,zoom=1,targetZoom=1;
 const target=new THREE.Vector3(0,.8,0);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const gradient=new THREE.DataTexture(new Uint8Array([105,178,245]),3,1,THREE.RedFormat);gradient.minFilter=THREE.NearestFilter;gradient.magFilter=THREE.NearestFilter;gradient.needsUpdate=true;
 const mat=(color,extra={})=>new THREE.MeshToonMaterial({color,gradientMap:gradient,...extra});
 const ink=new THREE.MeshBasicMaterial({color:0x48544e,side:THREE.BackSide});
 function mesh(geometry,material,parent=scene,outline=false){const m=new THREE.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);if(outline){const o=new THREE.Mesh(geometry,ink);o.scale.setScalar(1.025);o.castShadow=false;m.add(o);}return m;}
 function ball(parent,x,y,z,sx,sy,sz,material,outline=false){const m=mesh(new THREE.SphereGeometry(1,20,14),material,parent,outline);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;}
 function box(parent,x,y,z,sx,sy,sz,material,outline=false){const m=mesh(new THREE.BoxGeometry(sx,sy,sz),material,parent,outline);m.position.set(x,y,z);return m;}
 function rodBetween(parent,a,b,r,material){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);const m=mesh(new THREE.CylinderGeometry(r*.8,r,av.distanceTo(bv),8),material,parent);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...b).sub(new THREE.Vector3(...a)).normalize());return m;}
 const ambient=new THREE.HemisphereLight(0xfffde4,0xa4b5a5,2.3);scene.add(ambient);
 const sun=new THREE.DirectionalLight(0xffeed0,3.2);sun.position.set(-10,19,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-18;sun.shadow.normalBias=.035;sun.shadow.bias=-.0002;scene.add(sun);
 const rim=new THREE.DirectionalLight(0xd5e3ec,.75);rim.position.set(9,6,-9);scene.add(rim);
 const groundMat=mat(0xc4d5a4);const bankMat=mat(0xa3b897);const leafMat=mat(0x9ab781);const darkLeaf=mat(0x769c78);const flowerMat=mat(0xeac5c5);const trunkMat=mat(0x8f8972);const rockMat=mat(0xb2c2b2);const hillMat=mat(0xaac4a9);const farHillMat=mat(0xbdcdb3);const wood=mat(0xba9a73);const woodLight=mat(0xd6b68c);const woodDark=mat(0x927755);const cream=mat(0xeae5d5);const waterLine=new THREE.MeshBasicMaterial({color:0xc5e3d1,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false});
 const shore=new THREE.Group();scene.add(shore);
 const banks=[];
 function bank(group,x,y,z,rx,ry,rz,material,waterEdge=false){
  ball(group,x,y,z,rx,ry,rz,material);
  if(waterEdge) banks.push(waterline(x,y,z,rx,ry,rz));
 }
 bank(shore,-7,-.54,-3,6.2,1.08,5.8,bankMat);bank(shore,-7,-.1,-3,6.15,.5,5.7,groundMat,true);
 bank(shore,-13,-.4,5,5.8,.9,4,bankMat);bank(shore,-13,-.1,5,5.7,.35,3.9,groundMat,true);
 for(let i=0;i<8;i++){ball(scene,-22+i*6,-1,-20-(i%3)*4,7,4+(i%3)*1.8,5,i%2?hillMat:farHillMat);}
 const dock=new THREE.Group();scene.add(dock);dock.position.set(-3.2,.19,1.2);
 for(let i=0;i<9;i++){box(dock,-2.8+i*.47,0,0,.43,.15,1.7,i%2?wood:woodLight);}
 for(const x of [-2.7,.9])for(const z of [-.7,.7]){rodBetween(dock,[x,-.7,z],[x,.28,z],.09,woodDark);ball(dock,x,.29,z,.1,.05,.1,woodLight);}
 const trees=[],decorations=new THREE.Group();scene.add(decorations);
 function tree(x,z,size=1,type='leaf'){
  const g=new THREE.Group();g.position.set(x,.08,z);g.scale.setScalar(size);decorations.add(g);
  rodBetween(g,[0,0,0],[.07,2.9,0],.17,trunkMat);rodBetween(g,[.02,1.8,0],[.9,2.5,.05],.08,trunkMat);rodBetween(g,[0,1.7,0],[-.8,2.45,.05],.09,trunkMat);
  const crowns=[];
  if(type==='pine'){for(let k=0;k<3;k++){const p=mesh(new THREE.ConeGeometry(1.3-k*.25,1.75,7),leafMat,g);p.position.set(0,2.05+k*.65,0);crowns.push(p);}}
  else for(const [x1,y1,z1,r]of [[0,3,0,1.2],[-.8,2.8,.1,.9],[.8,2.95,-.15,1],[.1,3.5,-.1,.95]])crowns.push(ball(g,x1,y1,z1,r,r*.8,r,type==='flower'?flowerMat:leafMat));
  trees.push({g,crowns,type});return g;
 }
 tree(-5.1,-1.7,1.35,'flower');tree(-8,-4,1.6);tree(-4.2,-6.5,1.4);tree(-10,-.5,1.45);tree(-10.7,-7,1.8);tree(6,-10,1.25,'pine');tree(9,-12,1.4,'pine');
 for(const [x,z,s]of [[-3,-2,.6],[-2.5,-3,.4],[-4,3,.45],[-8,2,.8],[6,-6,.5],[7,-7,.4],[1,-9,.9]]){const rock=ball(decorations,x,.03,z,s,s*.55,s*.75,rockMat);rock.rotation.y=x;}
 const reeds=new THREE.Group();decorations.add(reeds);
 let seed=77;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 for(let i=0;i<42;i++){const x=-4.6-rand()*6.3,z=-.7+rand()*6;for(let j=0;j<3;j++){const h=.5+rand()*.8;rodBetween(reeds,[x,.03,z],[x+(rand()-.5)*.3,h,z],.018,darkLeaf);if(j===0)ball(reeds,x,h,z,.045,.16,.045,trunkMat);}}
 const creek = new THREE.Group();
 scene.add(creek);
 const landing = landings.sakura;
 ball(creek,landing.x+1,-.48,-6,5.2,1,4.8,bankMat);
 bank(creek,landing.x+1,-.14,-6,5.1,.58,4.7,groundMat,true);
 for(const [dx,dz,size] of [[-1,-5,1.3],[1,-6,1.55],[3,-4.8,1.2]]) {
  creek.add(tree(landing.x+dx,dz,size,'flower'));
 }
 batchRigidMeshes(dock);
 const pier = dock.clone();
 pier.position.set(landing.x,.19,-2.9);
 pier.rotation.y=Math.PI/2;
 creek.add(pier);
 const lake=createLake(scene,renderer,banks);
 const focus=createLakeFocus(renderer);
 const pads=[];
 for(let i=0;i<21;i++){const x=-1.8+rand()*11,z=-6+rand()*12;if(x<1&&z>0&&z<4)continue;const pad=mesh(new THREE.CircleGeometry(.18+rand()*.23,16,.15,Math.PI*1.87),leafMat,decorations);pad.rotation.x=-Math.PI/2;pad.rotation.z=rand()*6.28;pad.position.set(x,-.095,z);pad.castShadow=false;pads.push(pad);if(i%4===0){for(let p=0;p<5;p++){const a=p*Math.PI*2/5;const f=ball(decorations,x+Math.cos(a)*.09,.025,z+Math.sin(a)*.09,.095,.06,.06,flowerMat);f.rotation.y=-a;}ball(decorations,x,.08,z,.04,.04,.04,cream);}}
 const rippleObjects=[];
 function ripple(x,z,r,opacity=.6){const m=mesh(new THREE.RingGeometry(r,r+.012,64),waterLine.clone());m.rotation.x=-Math.PI/2;m.position.set(x,-.08,z);m.material.opacity=opacity;m.castShadow=false;m.receiveShadow=false;rippleObjects.push({m,base:r,phase:rand()*6});return m;}
 const grassFlowers=[];
 for(let i=0;i<38;i++){const x=-3.5-rand()*6.8,z=-4.8+rand()*6.2;if((x+7)**2+(z+3)**2>25)continue;const g=new THREE.Group();g.position.set(x,.35,z);decorations.add(g);rodBetween(g,[0,0,0],[0,.16,0],.012,darkLeaf);for(let p=0;p<5;p++){const a=p*6.28/5;ball(g,Math.cos(a)*.055,.17,Math.sin(a)*.055,.05,.03,.05,flowerMat);}grassFlowers.push(g);}
 const boatFrame=new THREE.Group();scene.add(boatFrame);
 const boat=new THREE.Group();boatFrame.add(boat);boat.position.y=.02;
 const hullShape=new THREE.Shape();hullShape.moveTo(-.8,-1.25);hullShape.quadraticCurveTo(-1.05,-.2,-.8,.95);hullShape.quadraticCurveTo(-.2,1.7,0,1.8);hullShape.quadraticCurveTo(.25,1.7,.8,.95);hullShape.quadraticCurveTo(1.05,-.2,.8,-1.25);hullShape.quadraticCurveTo(0,-1.7,-.8,-1.25);
 const hull=mesh(new THREE.ExtrudeGeometry(hullShape,{depth:.4,bevelEnabled:true,bevelSize:.09,bevelThickness:.1,bevelSegments:2,steps:1}),wood,boat,true);hull.rotation.set(-Math.PI/2,0,Math.PI);hull.position.y=-.11;
 const deck=mesh(new THREE.ShapeGeometry(hullShape,24),woodLight,boat);deck.rotation.set(-Math.PI/2,0,Math.PI);deck.position.y=.4;deck.scale.set(.91,.91,.91);
 for(let i=0;i<7;i++)box(boat,0,.415,-1.1+i*.38,1.28,.035,.015,woodDark);
 box(boat,0,.61,-.45,1.6,.12,.36,woodDark,true);box(boat,0,.6,.55,1.6,.12,.27,woodDark,true);
 rodBetween(boat,[-.6,.62,-.9],[-1.8,.18,1.25],.038,woodDark);const paddle=ball(boat,-1.77,.18,1.28,.14,.045,.4,wood);paddle.rotation.y=-.5;
 const wolfRoot=new THREE.Group();scene.add(wolfRoot);wolfRoot.position.set(.25,.59,1.45);wolfRoot.rotation.y=.34;
 const fur=mat(0x939fa5),furDark=mat(0x7c8a95),white=mat(0xe9e7de),insideEar=mat(0xc6abb7),cloak=mat(0x7c9c84),purple=mat(0x8b66b2),pupil=new THREE.MeshBasicMaterial({color:0x37364d}),glint=new THREE.MeshBasicMaterial({color:0xfffced}),leather=mat(0xb2936d);
 const body=new THREE.Group();wolfRoot.add(body);
 ball(body,0,.72,0,.46,.63,.37,cloak,true);const cape=mesh(new THREE.ConeGeometry(.63,.9,16,1,true),cloak,body);cape.position.set(0,.81,-.05);cape.rotation.x=-.09;
 ball(body,-.26,.14,.37,.19,.18,.32,furDark,true);ball(body,.26,.14,.37,.19,.18,.32,furDark,true);
 ball(body,-.43,.8,.24,.17,.35,.18,fur);const paw=ball(body,.46,.86,.4,.19,.2,.2,fur,true);
 const tailRoot=new THREE.Group();body.add(tailRoot);tailRoot.position.set(.3,.42,-.27);tailRoot.rotation.z=-.3;
 ball(tailRoot,.4,.16,-.42,.3,.3,.52,furDark,true);const tail=ball(tailRoot,.65,.3,-.75,.33,.33,.59,fur,true);tail.rotation.z=-.3;ball(tailRoot,.68,.4,-1.05,.29,.29,.36,white);
 const head=new THREE.Group();body.add(head);head.position.set(0,1.62,.05);
 ball(head,0,0,0,.68,.61,.55,fur,true);
 for(const side of [-1,1]){
  const ear=new THREE.Group();ear.position.set(side*.43,.46,-.02);ear.rotation.z=-side*.21;head.add(ear);const outer=mesh(new THREE.ConeGeometry(.27,.83,4),fur,ear,true);outer.scale.z=.61;outer.position.y=.23;outer.rotation.y=Math.PI/4;const inner=mesh(new THREE.ConeGeometry(.17,.57,3),insideEar,ear);inner.scale.z=.22;inner.position.set(0,.25,.1);inner.rotation.y=Math.PI;
  ball(head,side*.5,-.18,.23,.28,.25,.28,white);
  const eyeWhite=ball(head,side*.27,.02,.48,.205,.225,.07,white);eyeWhite.rotation.y=side*.17;
  ball(head,side*.27,.025,.544,.133,.165,.034,purple);ball(head,side*.27,.035,.568,.067,.115,.019,pupil);
  ball(head,side*.27-.035,.095,.586,.035,.041,.016,glint);ball(head,side*.27+.042,-.032,.584,.017,.021,.01,glint);
  const brow=ball(head,side*.26,.25,.43,.19,.055,.05,furDark);brow.rotation.z=-side*.09;
  const lash=rodBetween(head,[side*.43,.1,.52],[side*.49,.16,.5],.017,furDark);
  ball(head,side*.48,-.21,.48,.09,.032,.018,insideEar);
  for(let k=0;k<2;k++){const tuft=mesh(new THREE.ConeGeometry(.15,.32,4),fur,head);tuft.position.set(side*(.56+k*.05),-.15-k*.12,.08);tuft.rotation.z=-side*(1.05+k*.14);}
 }
 ball(head,0,-.23,.49,.32,.21,.25,white);const nose=ball(head,0,-.11,.72,.105,.072,.066,pupil);nose.rotation.z=Math.PI;
 const smileCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.12,-.29,.692),new THREE.Vector3(0,-.33,.716),new THREE.Vector3(.12,-.29,.692)]);mesh(new THREE.TubeGeometry(smileCurve,12,.012,5,false),pupil,head);
 for(const side of [-1,1]){const tuft=mesh(new THREE.ConeGeometry(.13,.33,5),fur,head);tuft.position.set(side*.16,.55,.12);tuft.rotation.z=-side*.4;}
 ball(body,0,1.13,.39,.065,.065,.04,leather);rodBetween(body,[-.31,1.18,.31],[.4,.4,.42],.025,leather);box(body,.47,.44,.22,.34,.31,.19,leather,true);box(body,.47,.54,.33,.35,.1,.04,woodLight);
 const basket=new THREE.Group();boat.add(basket);basket.position.set(-.42,.66,-.93);const basketMesh=mesh(new THREE.CylinderGeometry(.25,.21,.34,12),leather,basket);basketMesh.position.y=.12;for(let i=0;i<3;i++){const ring=mesh(new THREE.TorusGeometry(.23+i*.008,.014,4,20),woodDark,basket);ring.rotation.x=Math.PI/2;ring.position.y=.02+i*.12;}
 const fishingGear=new THREE.Group();wolfRoot.add(fishingGear);const rodTip=new THREE.Vector3(2.1,2.35,1.1);const rod=rodBetween(fishingGear,[.45,.86,.48],[rodTip.x,rodTip.y,rodTip.z],.025,woodDark);rodBetween(fishingGear,[.45,.86,.48],[.72,1.1,.57],.04,leather);
 const bobber=new THREE.Group();scene.add(bobber);bobber.position.set(3.4,0,3.5);ball(bobber,0,.04,0,.07,.13,.07,cream);ball(bobber,0,.13,0,.06,.055,.06,mat(0xc88477));rodBetween(bobber,[0,.1,0],[0,.29,0],.012,woodDark);const bobberRipple=ripple(3.4,3.5,.28,.8);
 const lineGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);const line=new THREE.Line(lineGeometry,new THREE.LineBasicMaterial({color:0xe9ecd6,transparent:true,opacity:.9}));scene.add(line);
 const lanternGroup=new THREE.Group();boat.add(lanternGroup);lanternGroup.position.set(.35,.68,1.15);const lampMat=new THREE.MeshBasicMaterial({color:0xffdf91});box(lanternGroup,0,.17,0,.21,.29,.2,lampMat);for(const x of [-.12,.12])for(const z of [-.11,.11])rodBetween(lanternGroup,[x,0,z],[x,.34,z],.015,woodDark);box(lanternGroup,0,.35,0,.29,.05,.27,woodDark);const lampLight=new THREE.PointLight(0xffd585,0,6,1.5);lampLight.position.set(0,.5,0);lanternGroup.add(lampLight);
 batchRigidMeshes(boat,paddle);
 const particles=[];const particleMat=new THREE.MeshBasicMaterial({color:0xf2d8ce,side:THREE.DoubleSide,transparent:true,opacity:.8});
 for(let i=0;i<28;i++){const p=mesh(new THREE.PlaneGeometry(.08+rand()*.07,.06),particleMat,scene);p.position.set((rand()-.5)*22,1+rand()*7,(rand()-.5)*20);p.rotation.set(rand()*3,rand()*3,rand()*3);p.castShadow=false;particles.push({p,x:p.position.x,y:p.position.y,z:p.position.z,speed:.2+rand()*.4});}
 const fallsGroup=new THREE.Group();scene.add(fallsGroup);fallsGroup.visible=false;ball(fallsGroup,5.5,1,-7,1.6,2.7,1.3,rockMat);const fallsMat=new THREE.MeshBasicMaterial({color:0xc9e8df,transparent:true,opacity:.68});box(fallsGroup,5.35,1.9,-5.8,.8,3.4,.08,fallsMat);const fallsRipple=ripple(5.3,-5,1.2);
 const palettes={
  '春':{water:0x9bcbbf,ground:0xc4d7a5,leaves:0xa2bd86,flowers:0xe9bfc8,sky:0xe0edcf,hills:0xb8cba9,particle:0xf1d2ce},
  '夏':{water:0x83bfb3,ground:0xb7d093,leaves:0x80a874,flowers:0xe4bfa7,sky:0xd4e9d1,hills:0x9bbca0,particle:0xdbe5b9},
  '秋':{water:0xa7c6b4,ground:0xd9c294,leaves:0xd4a471,flowers:0xd9ab82,sky:0xefe3bf,hills:0xbec49c,particle:0xe2b382},
  '冬':{water:0xabc9cc,ground:0xe0e7df,leaves:0xa4b9b0,flowers:0xe5e6df,sky:0xe4eae2,hills:0xc3d1cb,particle:0xf6f5e8}
 };
 const navigation=createNavigation();navigation.setSailing(false);
 let modelHead=null,modelTail=null;
 try{
  const mobile=matchMedia('(max-width:650px), (pointer:coarse)').matches;
  const loader=new GLTFLoader();
  const full='assets/wolf-girl.glb';
  const gltf=mobile ? await loader.loadAsync('assets/wolf-girl-mobile.glb').catch(()=>loader.loadAsync(full)) : await loader.loadAsync(full);
  gltf.scene.traverse(o=>{if(!o.isMesh)return;const original=o.material;const color=original?.color||new THREE.Color(0x939fa5);const unlit=/Pupil|Glint|Iris/.test(original?.name||'');o.material=unlit?new THREE.MeshBasicMaterial({color}):mat(color.clone());o.castShadow=true;o.receiveShadow=true;});
  body.visible=false;wolfRoot.add(gltf.scene);modelHead=gltf.scene.getObjectByName('Head_Pivot');modelTail=gltf.scene.getObjectByName('Tail_Pivot');container.dataset.characterModel='blender-glb';
 }catch(error){console.warn('Blender character unavailable; using the original procedural blockout.',error.message);container.dataset.characterModel='procedural-fallback';}
 // Only nearby subjects contribute to the cached water reflection.
 for(const subject of [ambient,sun,rim,dock,pier,boat,wolfRoot]){
  subject.traverse(object=>object.layers.enable(1));
 }
 let season='春',time='day',location='reed',onBoat=true,phase='idle',disposed=false,frames=0,raf=0;
 let weather='晴',blend=null;
 scene.background=new THREE.Color();scene.fog=new THREE.Fog(0xffffff,27,69);
 const colors=[scene.background,lake.tint,groundMat.color,bankMat.color,leafMat.color,darkLeaf.color,flowerMat.color,hillMat.color,farHillMat.color,particleMat.color,ambient.color,sun.color];
 const scalars=[[sun,'intensity'],[ambient,'intensity'],[lampLight,'intensity'],[scene.fog,'near'],[scene.fog,'far']];
 function snapshot(){return {colors:colors.map(c=>c.clone()),values:scalars.map(([obj,key])=>obj[key]),sun:sun.position.clone()};}
 function blendFrame(f){
  const {from,to}=blend;
  for(let i=0;i<colors.length;i++)colors[i].lerpColors(from.colors[i],to.colors[i],f);
  scalars.forEach(([obj,key],i)=>obj[key]=THREE.MathUtils.lerp(from.values[i],to.values[i],f));
  sun.position.lerpVectors(from.sun,to.sun,f);
  scene.fog.color.copy(scene.background);lake.environment(scene.background,sun.color,creek.visible,false);
 }
 function applyEnvironment(transition=false){const from=transition?snapshot():null;blend=null;const p=palettes[season];lake.tint.setHex(p.water);groundMat.color.setHex(p.ground);bankMat.color.setHex(season==='冬'?0xc4d4cb:0xa1b58e);leafMat.color.setHex(p.leaves);darkLeaf.color.setHex(p.leaves).multiplyScalar(.8);flowerMat.color.setHex(p.flowers);hillMat.color.setHex(p.hills);farHillMat.color.setHex(p.sky).lerp(new THREE.Color(p.hills),.45);particleMat.color.setHex(p.particle);let sky=p.sky;if(location==='tide'){lake.tint.setHex(season==='冬'?0xb5cecb:0x9fcac3);groundMat.color.setHex(0xdfcda6);}if(location==='moon'&&time==='night')lake.tint.setHex(0x738c9f);if(location==='snow'){groundMat.color.setHex(0xe2e8df);leafMat.color.setHex(0xbacbc2);}if(location==='sakura')trees[0].g.scale.setScalar(1.55);else trees[0].g.scale.setScalar(1.35);fallsRipple.visible=fallsGroup.visible=location==='falls';
  const night=time==='night',dusk=time==='dusk';if(night){sky=0x697e85;lake.tint.multiplyScalar(.59);leafMat.color.multiplyScalar(.72);ambient.intensity=1.15;ambient.color.setHex(0xc0c9e7);sun.color.setHex(0xbcc9e9);sun.intensity=1.45;sun.position.set(-8,14,4);lampLight.intensity=3.2;particleMat.color.setHex(0xf0e4a5);}else{ambient.intensity=dusk?1.9:2.3;ambient.color.setHex(dusk?0xf6ddc0:0xfffde4);sun.color.setHex(dusk?0xf2cc9c:0xffeed0);sun.intensity=dusk?2.7:3.2;sun.position.set(dusk?-17:-10,dusk?11:19,10);lampLight.intensity=dusk?.6:0;if(dusk){sky=0xe7cdb8;lake.tint.lerp(new THREE.Color(0xd4c2a5),.2);}}if(time==='dawn'){sky=0xe6d9ce;sun.color.setHex(0xffd4ac);ambient.intensity=1.75;sun.intensity=2.2;sun.position.set(13,9,7);lake.tint.lerp(new THREE.Color(0xc7c3b4),.22);}
  scene.background.setHex(sky);scene.fog.near=27;scene.fog.far=69;
  if(weather==='薄雾'||weather==='细雨'){scene.background.lerp(new THREE.Color(0xb9c5bf),.26);scene.fog.near=weather==='薄雾'?10:20;scene.fog.far=weather==='薄雾'?38:55;sun.intensity*=.82;}
  scene.fog.color.copy(scene.background);renderer.setClearColor(scene.background);lake.environment(scene.background,sun.color,creek.visible);
  if(from){blend={from,to:snapshot(),start:performance.now()};blendFrame(0);}
 }
 function setClimate(s,t,w,immediate=false){season=s;time=t;weather=w;applyEnvironment(!immediate);}
 function setLocation(id,keepPosition=false){
  location=id;
  navigation.setHarbor(id);
  if(!keepPosition){navigation.reset();lake.resetWake();}
  creek.visible=Boolean(otherLanding(id));
  const key=creek.visible?'route':id==='falls'?'falls':'local';
  options.minimap?.setArea(key,{
   banks:creek.visible?banks:banks.slice(0,2),
   trees:trees.filter(({g})=>g.parent!==creek||creek.visible),
   docks:creek.visible?[dock,pier]:[dock],falls:id==='falls'
  });
  applyEnvironment();
 }
 function setBoat(value){
  onBoat=Boolean(value);navigation.setOnBoat(onBoat);
  if(!onBoat){navigation.reset();lake.resetWake();}
  boatFrame.visible=onBoat;
  (onBoat?boat:scene).add(wolfRoot);
  (onBoat?boatFrame:scene).add(bobber,bobberRipple);
  if(onBoat){
   wolfRoot.position.set(0,.57,-.15);wolfRoot.rotation.set(0,.34,0);
   bobber.position.set(3.15,0,1.9);
  }else{
   const atCreek=location==='sakura';
   wolfRoot.position.set(atCreek?landing.x:-2.15,.37,atCreek?-2.3:1.15);wolfRoot.rotation.set(0,.6,0);
   bobber.position.set(atCreek?landing.x+2:.5,0,atCreek?1:3);
  }
  bobberRipple.position.set(bobber.position.x,-.08,bobber.position.z);
  lake.invalidate();
 }
 function setSailing(value){lake.invalidate();navigation.setSailing(value);fishingGear.visible=!value;bobber.visible=!value;bobberRipple.visible=!value;line.visible=!value;}
 function setPaddle(x,z){navigation.setInput(x,z);}
 function setPaused(value){navigation.setPaused(value);}
 function returnDock(){navigation.reset();lake.resetWake();setSailing(false);}
 function getNavigation(){return navigation.snapshot();}
 let waypoint=null;
 function trackLanding(id){waypoint=landings[id] || null;}
 function setFishing(value){if(phase!==value)lake.invalidate();phase=value;}
 function setCatchQuality(stars){particleMat.color.setHex(stars>=5?0xf8e4a9:palettes[season].particle);}
 function resize(){const w=container.clientWidth||1440,h=container.clientHeight||960;const ratio=Math.min(devicePixelRatio,w<=650?1.25:1.75);renderer.setPixelRatio(ratio);renderer.setSize(w,h);focus.resize(w,h,ratio);lake.resize(w,h);const view=h>w?14:15.5;camera.left=-view*w/h/2;camera.right=view*w/h/2;camera.top=view/2;camera.bottom=-view/2;camera.updateProjectionMatrix();}
 const observer=new ResizeObserver(resize);observer.observe(container);resize();applyEnvironment();
 let dragging=false,startX=0,startOrbit=0;const canvas=renderer.domElement;
 const down=e=>{dragging=true;startX=e.clientX;startOrbit=orbit;canvas.setPointerCapture(e.pointerId);};const move=e=>{if(dragging)orbit=THREE.MathUtils.clamp(startOrbit-(e.clientX-startX)*.003,.12,.94);};const up=()=>{dragging=false;};const wheel=e=>{e.preventDefault();targetZoom=THREE.MathUtils.clamp(targetZoom-e.deltaY*.0006,.8,1.4);};
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('wheel',wheel,{passive:false});
 const tipWorld=new THREE.Vector3(),floatWorld=new THREE.Vector3();const clock=new THREE.Clock();let lastWorldTime=0;
 function animate(){if(disposed)return;const t=clock.getElapsedTime(),motion=reduced?0:1;const dt=Math.min(.1,t-lastWorldTime);lastWorldTime=t;const nav=navigation.step(dt);
  if(blend){const f=Math.min(1,(performance.now()-blend.start)/4000);blendFrame(f*f*(3-2*f));if(f===1){blend=null;lake.invalidate();}}
  options.minimap?.update(onBoat?nav.x:wolfRoot.position.x,onBoat?nav.z:wolfRoot.position.z,nav.heading,onBoat);
  if(navigation.reachedDestination()) options.onArrival?.(otherLanding(location));
  frames++;zoom+=(targetZoom-zoom)*.08;camera.zoom=zoom;camera.updateProjectionMatrix();target.x+=((onBoat?nav.x-.25:location==='sakura'?landing.x:0)-target.x)*.07;target.z+=((onBoat?nav.z-1.6:0)*.7-target.z)*.07;const angle=orbit;camera.position.set(target.x+Math.sin(angle)*21,12.8,target.z+Math.cos(angle)*21);camera.lookAt(target);
  if(waypoint && nav.sailing && !nav.paused){
   const dx=waypoint.x-nav.x, dz=waypoint.z-nav.z;
   const right=dx*Math.cos(angle)-dz*Math.sin(angle);
   const up=-(dx*Math.sin(angle)+dz*Math.cos(angle))*Math.sin(Math.atan2(camera.position.y-target.y,21));
   options.onBearing?.(Math.atan2(right,up),Math.ceil(Math.hypot(dx,dz)));
  }
  if(onBoat){boatFrame.position.set(nav.x,0,nav.z);boatFrame.rotation.y=nav.heading;boat.position.y=.02+Math.sin(t*1.1)*.035*motion;boat.rotation.z=Math.sin(t*.9)*.012*motion;paddle.rotation.z=nav.sailing&&nav.speed>.1?Math.sin(t*5)*.2:0;}
  head.rotation.z=Math.sin(t*.6)*.025*motion;tailRoot.rotation.y=Math.sin(t*1.4)*.075*motion;if(modelHead)modelHead.rotation.z=Math.sin(t*.6)*.025*motion;if(modelTail)modelTail.rotation.y=Math.sin(t*1.4)*.075*motion;
  for(const r of rippleObjects){const s=1+Math.sin(t*.6+r.phase)*.08*motion;r.m.scale.setScalar(s);}
  bobber.position.y=(phase==='bite'?Math.sin(t*13)*.12:Math.sin(t*1.4)*.025)*motion+(phase==='caught'?.5:0);fishingGear.rotation.z=phase==='reeling'?-.04+Math.sin(t*4)*.025:phase==='caught'?-.21:0;
  for(const {p,x,y,z,speed}of particles){const rain=weather==='细雨',snow=weather==='轻雪';p.visible=rain||snow||season!=='夏'||time==='night'||location==='sakura';if(!motion)continue;p.scale.set(rain?.25:1,rain?3:1,1);p.position.x=x+Math.sin(t*.16+z)*.8;p.position.y=rain||snow?THREE.MathUtils.euclideanModulo(y-t*speed*(rain?6:1),7):y+Math.sin(t*speed)*.4;p.rotation.z=rain?-.2:t*.13+z;}
  scene.updateMatrixWorld();tipWorld.copy(rodTip).applyMatrix4(fishingGear.matrixWorld);const positions=lineGeometry.attributes.position;positions.setXYZ(0,tipWorld.x,tipWorld.y,tipWorld.z);floatWorld.set(0,.13,0).applyMatrix4(bobber.matrixWorld);positions.setXYZ(1,floatWorld.x,floatWorld.y,floatWorld.z);positions.needsUpdate=true;lineGeometry.computeBoundingSphere();lake.update(dt,t,nav,motion);lake.capture(t,camera,target,nav,Boolean(blend));focus.render(scene,camera);if(frames%30===0)container.dataset.renderFrames=String(frames);raf=requestAnimationFrame(animate);
 }
 animate();container.dataset.sceneReady='true';options.onReady?.();
 return{ready:true,setClimate,setLocation,setBoat,setFishing,setCatchQuality,setSailing,setPaddle,setPaused,returnDock,getNavigation,trackLanding,dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('wheel',wheel);scene.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});lake.dispose();focus.dispose();gradient.dispose();renderer.dispose();canvas.remove();}};
}
