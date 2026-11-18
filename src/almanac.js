import {SEASONS,TIMES} from './data.js';

const phases=Object.keys(TIMES);
const phaseSeconds=90;
export function restoreClock(state){
 state.dayInSeason=Number.isInteger(state.dayInSeason)&&state.dayInSeason>=0&&state.dayInSeason<6?state.dayInSeason:0;
 state.phaseSeconds=Number.isFinite(state.phaseSeconds)&&state.phaseSeconds>=0&&state.phaseSeconds<phaseSeconds?state.phaseSeconds:0;
 state.clockHeld=state.clockHeld===true;
}
export function advanceClock(state,seconds){
 if(state.clockHeld || seconds<=0)return false;
 state.phaseSeconds+=seconds;
 const steps=Math.floor(state.phaseSeconds/phaseSeconds);
 if(!steps)return false;
 state.phaseSeconds%=phaseSeconds;
 const index=phases.indexOf(state.time)+steps;
 state.time=phases[index%4];
 const day=state.dayInSeason+Math.floor(index/4);
 state.season=SEASONS[(SEASONS.indexOf(state.season)+Math.floor(day/6))%4];
 state.dayInSeason=day%6;
 return true;
}
export function weatherOf(state){
 const pattern={春:['晴','薄雾','细雨'],夏:['晴','细雨','晴'],秋:['薄雾','晴','晴'],冬:['轻雪','晴','薄雾']};
 return pattern[state.season][state.dayInSeason%3];
}
