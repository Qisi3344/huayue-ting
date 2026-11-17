import {spawn} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
const url='http://127.0.0.1:4173/';
async function isReady(){try{const response=await fetch(url,{signal:AbortSignal.timeout(1000)});return response.ok&&(await response.text()).includes('小狼的四季鱼笺');}catch{return false;}}
if(!await isReady())await import('./serve.mjs');
let ready=false;for(let i=0;i<16;i++){if(await isReady()){ready=true;break;}await pause(150);}
if(!ready)throw new Error('本地服务没有启动，请检查端口 4173。');
console.log('花月汀已准备好。保持这个窗口打开即可游玩。');
if(process.platform==='win32'){const browser=spawn('explorer.exe',[url],{stdio:'ignore'});browser.on('error',()=>console.log(`请手动打开 ${url}`));}
else console.log(`请用浏览器打开 ${url}`);
