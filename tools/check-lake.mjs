import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createLake, waterline} from '../src/lake.js';

const scene = new THREE.Scene();
const bank = waterline(0, -.13, 0, 3, 1, 2);
assert.deepEqual(bank.toArray(), [0, 0, 3, 2]);
const lake = createLake(scene, {}, [bank, bank, bank]);
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
lake.dispose();
console.log('Lake shoreline, fish avoidance and wake lifecycle passed.');
