import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createLake, waterline} from '../src/lake.js';

const scene = new THREE.Scene();
const bank = waterline(0, -.13, 0, 3, 1, 2);
assert.deepEqual(bank.toArray(), [0, 0, 3, 2]);
let passes=0, reflectionSize;
const renderer={
 shadowMap:{autoUpdate:true}, getClearAlpha:()=>1, setClearColor(){},
 setRenderTarget(target){if(target)reflectionSize=[target.width,target.height];},
 render(){passes++;}
};
const lake = createLake(scene, renderer, [bank, bank, bank]);
const wakes = scene.children.filter(object => object.renderOrder === 1);
const fish = scene.children.find(object => object.isInstancedMesh);
const nav = {onBoat:true, sailing:true, speed:2, x:1.8, z:4.4, vx:2, vz:0, heading:Math.PI/2};
const pose = new THREE.Matrix4();
function fishX(){fish.getMatrixAt(0,pose);return pose.elements[12];}
lake.update(0,0,nav,1);
const start = fishX();
for(let step=1;step<=8;step++) lake.update(.05,step*.05,nav,1);
assert.ok(fishX()>start+.3, 'a nearby moving boat scatters the fish');
assert.ok(wakes.some(w=>w.visible && w.position.x<nav.x),'the wake starts behind the stern');
nav.sailing=false;nav.speed=0;
for(let step=0;step<30;step++) lake.update(.1,1+step*.1,nav,1);
assert.ok(wakes.every(w=>!w.visible),'all strokes fade once the boat stops');
const camera=new THREE.OrthographicCamera(-8,8,6,-6,.1,100);
camera.position.set(0,12,21);
const target=new THREE.Vector3();
lake.resize(960,720);
lake.capture(0,camera,target,nav,false);
for(let frame=1;frame<=120;frame++)lake.capture(frame/60,camera,target,nav,false);
assert.equal(passes,1,'an idle lake reuses the reflection');
assert.deepEqual(reflectionSize,[256,192]);
nav.heading+=.5;
lake.capture(3,camera,target,nav,false);
camera.zoom=1.2;camera.updateProjectionMatrix();
lake.capture(4,camera,target,nav,false);
lake.invalidate();lake.capture(5,camera,target,nav,false);
lake.resize(390,844);lake.capture(6,camera,target,nav,false);
assert.deepEqual(reflectionSize,[89,192]);
assert.equal(passes,5,'turning, zoom, scene changes and resize refresh the reflection');
lake.dispose();
console.log('Lake shoreline, fish avoidance and wake lifecycle passed.');
