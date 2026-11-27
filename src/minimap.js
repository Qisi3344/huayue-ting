import {bridgeX,bankZ} from './data.js';
import {chartPoint,worldPoint,waterDepth} from './waterways.js';
// North is -Z and east is +X. Both extents are square so heading and distance
// have the same scale on either axis, even on a portrait screen.
const resolution=384;

// Rasterize once per chart. The same distance field outlines every inlet and islet.
function paintWater(width,height,fromPixel,paper){
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(width,height);
 for(let j=0;j<height;j++)for(let i=0;i<width;i++){
  const {x,z}=fromPixel(i+.5,j+.5),d=waterDepth(x,z),k=(j*width+i)*4;
  if(paper && d<-.9)continue;
  const t=Math.max(0,Math.min(1,d/6)),grain=2*Math.sin(x*1.7+z*.4);
  const c=d<-.65?[179,188,151]:d<-.15?[213,209,172]:d<.27?[110,148,131]:[173-t*46+grain,204-t*30+grain,181-t*17+grain];
  pixels.data[k]=c[0];pixels.data[k+1]=c[1];pixels.data[k+2]=c[2];pixels.data[k+3]=255;
 }
 ctx.putImageData(pixels,0,0);return canvas;
}
function paintBase(bounds,{trees,docks}){
 const scale=resolution/(bounds.xmax-bounds.xmin);
 const canvas=paintWater(resolution,resolution,(i,j)=>({x:bounds.xmin+i/scale,z:bounds.zmin+j/scale}),false);
 const ctx=canvas.getContext('2d');
 ctx.setTransform(scale,0,0,scale,-bounds.xmin*scale,-bounds.zmin*scale);
 function oval(x,z,rx,rz,fill){
  ctx.beginPath();ctx.ellipse(x,z,rx,rz,0,0,2*Math.PI);ctx.fillStyle=fill;ctx.fill();
 }
 ctx.fillStyle='#8d8070';ctx.fillRect(bridgeX-.6,bankZ(bridgeX,1),1.2,bankZ(bridgeX,2)-bankZ(bridgeX,1));
 for(const {g,type} of trees){
  const {x,z}=g.position,r=g.scale.x;
  oval(x,z,r*.86,r*.79,type==='flower'?'#cfafa7':'#779978');
  oval(x-r*.18,z-r*.2,r*.56,r*.48,type==='flower'?'#dfc1b5':'#91ae85');
 }
 for(const dock of docks){
  ctx.save();ctx.translate(dock.position.x,dock.position.z);ctx.rotate(-dock.rotation.y);
  ctx.fillStyle='#776951';ctx.fillRect(-3.02,-.85,4.2,1.7);
  ctx.fillStyle='#e1c998';
  for(let i=0;i<9;i++)ctx.fillRect(-2.96+.46*i,-.76,.38,1.52);
  ctx.restore();
 }
 return canvas;
}

export function createMinimap(base,marker){
 const cache=new Map();
 let bounds,lastX,lastZ,lastYaw,lastBoat;
 return {
  setArea(key,features){
   const [left,right,top,bottom]=features.bounds;
   const half=Math.hypot(right-left,bottom-top)*.53;
   const cx=(left+right)/2,cz=(top+bottom)/2;
   bounds={xmin:cx-half,xmax:cx+half,zmin:cz-half,zmax:cz+half};
   if(!cache.has(key))cache.set(key,paintBase(bounds,features));
   const canvas=cache.get(key);
   if(base.firstChild!==canvas)base.replaceChildren(canvas);
   lastX=undefined;
  },
  update(x,z,yaw,onBoat){
   if(!bounds)return;
   if(x!==lastX||z!==lastZ){
    marker.style.left=(x-bounds.xmin)/(bounds.xmax-bounds.xmin)*100+'%';
    marker.style.top=(z-bounds.zmin)/(bounds.zmax-bounds.zmin)*100+'%';
    lastX=x;lastZ=z;
   }
   if(yaw!==lastYaw){
    // CSS starts at north and turns clockwise; world yaw starts at south.
    marker.style.transform='translate(-50%, -50%) rotate('+(Math.PI-yaw)+'rad)';
    lastYaw=yaw;
   }
   if(onBoat!==lastBoat){marker.classList.toggle('ashore',!onBoat);lastBoat=onBoat;}
  }
 };
}
let atlasWater;
export function drawAtlas(canvas){
 const ctx=canvas.getContext('2d');
 canvas.width=1280;canvas.height=840;
 ctx.scale(12.8,8.4);
 atlasWater??=paintWater(600,400,(i,j)=>worldPoint(i/6,j/4),true);
 ctx.drawImage(atlasWater,0,0,100,100);
 const ends=[1,2].map(side=>chartPoint(bridgeX,bankZ(bridgeX,side)));
 ctx.beginPath();ctx.moveTo(ends[0].x,ends[0].y);ctx.lineTo(ends[1].x,ends[1].y);ctx.strokeStyle='#867962';ctx.lineWidth=.7;ctx.stroke();

 for(const [cx,cy,n] of [[13,35,18],[58,19,12],[74,14,9],[40,69,12],[81,68,11]]){
  for(let i=0;i<n;i++){
   const x=cx+Math.sin(i*2.4)*Math.sqrt(i)*1.7,y=cy+Math.cos(i*2.4)*Math.sqrt(i)*1.3;
   const w=worldPoint(x,y);if(waterDepth(w.x,w.z)>-2)continue;
   ctx.fillStyle=i%2?'#95a788':'#a6b495';ctx.beginPath();ctx.moveTo(x,y-1.9);ctx.lineTo(x+.6,y-.55);ctx.lineTo(x+.36,y-.61);ctx.lineTo(x+.94,y+.4);ctx.lineTo(x-.91,y+.4);ctx.lineTo(x-.38,y-.65);ctx.lineTo(x-.59,y-.56);ctx.closePath();ctx.fill();
   ctx.fillRect(x-.09,y+.4,.18,.36);
  }
 }
 ctx.strokeStyle='#a4a88e';ctx.lineWidth=.22;
 for(const [x,y,r] of [[76,29,3],[80,32,4.5],[85,30,2.8],[22,22,3],[25,23,2]]){
  ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x,y-r*1.5);ctx.lineTo(x+r,y);ctx.stroke();
 }
}

// Ink silhouettes share the atlas palette and remain legible above its scenery.
export const markerNames={chest:'宝箱',fish:'鱼',monster:'怪物'};
const markerArt={
 chest:['#caa773','M4 12 Q4 6 9 6 L18 6 Q21 7 21 12 V19 H4 Z','M4 12 H21 M9 7 V12 M17 7 V12 M11 12 V15 H14 V12'],
 fish:['#97b8a8','M3 12 Q8 3 16 9 L21 6 L20 17 L16 14 Q9 20 3 12 Z','M9 9 Q12 12 9 15 M6.7 11.2 l.3 .2'],
 monster:['#baa7ba','M4 16 Q3 12 6 9 L5 4 L10 7 Q13 6 15 7 L20 4 L19 10 Q22 15 18 18 Q12 22 6 18 Z','M8 12 l2 1 M16 12 l-2 1 M10 16 Q12 17.5 14 16']
};
export function paintMarker(canvas,type){
 const [fill,shape,details]=markerArt[type],ctx=canvas.getContext('2d');
 canvas.width=canvas.height=72;ctx.scale(3,3);
 ctx.lineJoin=ctx.lineCap='round';ctx.lineWidth=1.55;ctx.strokeStyle='#574a3c';ctx.fillStyle=fill;
 const outline=new Path2D(shape);ctx.fill(outline);ctx.stroke(outline);
 ctx.lineWidth=1.25;ctx.stroke(new Path2D(details));
}
