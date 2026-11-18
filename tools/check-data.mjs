import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {FISH,LOCATIONS,SEASONS,eligibleFish,chooseFish,BAITS} from '../src/data.js';
assert.equal(FISH.length,36);
assert.equal(new Set(FISH.map(f=>f.id)).size,FISH.length);
for(const l of LOCATIONS){assert.equal(FISH.filter(f=>f.location===l.id).length,6);for(const s of SEASONS)for(const time of ['dawn','day','dusk','night']){const state={location:l.id,season:s,time,boat:true,bait:'grain',pity:0};assert.ok(eligibleFish(state).length,`${l.id}/${s}/${time} has no fish`);}}
for(const f of FISH){assert.ok([3,4,5,6].includes(f.stars));assert.ok(LOCATIONS.some(l=>l.id===f.location));assert.ok(f.seasons.length);const condition={location:f.location,season:f.seasons[0],time:f.time==='any'?'day':f.time,boat:true,bait:'grain',pity:0};assert.ok(eligibleFish(condition).includes(f),`${f.name} cannot be caught`);}
for(const bait of BAITS){for(const season of SEASONS){const s={location:'moon',season,time:'night',boat:true,bait:bait.id,pity:11};assert.equal(chooseFish(s,()=>.01).stars,6);}}
assert.ok(eligibleFish({location:'moon',season:'春',time:'night',boat:false}).length===0);
const counts=Object.fromEntries([3,4,5,6].map(n=>[n,FISH.filter(f=>f.stars===n).length]));
const header=['编号','鱼名','星级','水域','季节','时段','需要小船','交换花月币','观察酬金','图鉴短句'];
const csv=[header,...FISH.map(f=>[f.id,f.name,f.stars,LOCATIONS.find(l=>l.id===f.location).name,f.seasons.join('/'),f.time==='any'?'全天':f.time==='day'?'日间':f.time==='dusk'?'黄昏':'夜晚',f.boat?'是':'否',f.value,Math.round(f.value*.75),f.note])].map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
writeFileSync(new URL('../鱼谱与经济.csv',import.meta.url),'\uFEFF'+csv);
console.log(JSON.stringify({fish:FISH.length,locations:LOCATIONS.length,rarityCounts:counts,validated:'all location/season/time pools, each fish reachable, boat gating, 6-star guaranteed encounter after 11 eligible misses',catalog:'鱼谱与经济.csv'},null,2));

const {restoreClock,advanceClock,weatherOf}=await import('../src/almanac.js');
const clock={season:'冬',time:'night'};
restoreClock(clock);
clock.dayInSeason=5;
assert.ok(advanceClock(clock,90));
assert.deepEqual([clock.season,clock.dayInSeason,clock.time,weatherOf(clock)],['春',0,'dawn','晴']);
clock.clockHeld=true;
assert.equal(advanceClock(clock,360),false);
assert.equal(clock.phaseSeconds,0);
