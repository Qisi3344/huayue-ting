import {SEASONS,TIMES,LOCATIONS,BAITS,RODS,FISH,ACHIEVEMENTS,eligibleFish,chooseFish} from './data.js';
import {otherLanding} from './navigation.js';
import {drawFish} from './fish-art.js';
const $=s=>document.querySelector(s);
const KEY='huayue-cove-save-v1';
const fresh=()=>({version:1,coins:160,season:'春',time:'day',location:'reed',boat:true,boatOwned:false,bait:'grain',baits:{grain:12,petal:0,star:0},rod:'willow',rods:['willow'],book:{},visited:['reed'],caughtSeasons:[],achievements:[],pity:0});
let state=fresh();
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved?.version===1){state={...fresh(),...saved};state.coins=Math.max(0,Number(state.coins)||0);state.baits={...fresh().baits,...saved.baits};state.book=saved.book&&typeof saved.book==='object'?saved.book:{};state.rods=Array.isArray(saved.rods)?saved.rods.filter(id=>RODS.some(r=>r.id===id)):['willow'];state.rods=[...new Set(['willow',...state.rods])];if(!SEASONS.includes(state.season))state.season='春';if(!TIMES[state.time])state.time='day';if(!LOCATIONS.some(l=>l.id===state.location))state.location='reed';if(!BAITS.some(b=>b.id===state.bait))state.bait='grain';if(!state.rods.includes(state.rod))state.rod='willow';for(const k of ['visited','caughtSeasons','achievements'])if(!Array.isArray(state[k]))state[k]=[];}}catch{}
let world=null,phase='idle',held=false,reel=0,tension=.4,fish=null,reelStart=0,lastTick=0,waitTimer=null,toastTimer=null,panelKind='map',bookFilter='all',settled=false,audio=null;
let sailing=false;
const paddleKeys=new Set();
const panel=$('#panel');const content=$('#panelContent');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{toast('这次浏览器没有保存空间，先陪小狼玩一会儿吧。');}renderHUD();}
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,4000);}
function loc(){return LOCATIONS.find(l=>l.id===state.location);}
function stars(n){return '★'.repeat(n);}
function renderHUD(){
 $('#coins').textContent=state.coins;$('#bookCount').textContent=`${Object.keys(state.book).length} / ${FISH.length}`;
 $('#locationName').textContent=loc().name;$('#locationTag').textContent=loc().tag;
 document.querySelectorAll('[data-season]').forEach(b=>{const yes=b.dataset.season===state.season;b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',String(yes));});
 $('#timeBtn').textContent=`${TIMES[state.time]} · ${state.season==='冬'?'轻雪':'晴'}`;
 $('#rodInfo').textContent=RODS.find(r=>r.id===state.rod).name;
 $('#baitInfo').textContent=`${BAITS.find(b=>b.id===state.bait).name} × ${state.baits[state.bait]}`;
 $('#boatLabel').textContent=state.boat?'靠岸休息':state.boatOwned?'划船出发':'借舟出发';
 $('#boatNotice').textContent=state.boat?(state.boatOwned?'你的木舟，随时等你出发。':'借来的小木舟，今天也载你去远一点。'):'靠在木码头，听一会儿风。';
 $('#sailLabel').textContent=sailing?'停桨垂钓':'划船走走';$('#sailBtn').disabled=!state.boat;$('#sailingControls').hidden=!state.boat;$('#sailingControls .sail-pad').hidden=!sailing;$('#sailingHint').hidden=!sailing;$('#game').classList.toggle('is-sailing',sailing);
}
function setPhase(next){phase=next;world?.setFishing(next);$('#reelPanel').hidden=next!=='reeling';$('#castBtn').disabled=next==='waiting'||next==='caught';$('#castBtn').setAttribute('aria-label',next==='reeling'?'按住收线，松开缓一缓':'抛一竿');const labels={idle:'抛一竿',waiting:'等鱼来',bite:'鱼上钩了 · 收线',reeling:'按住收线',caught:'把相遇记下来'};$('#castLabel').textContent=labels[next];}
function idle(message='找个舒服的位置，甩出今天的第一竿。'){clearTimeout(waitTimer);held=false;fish=null;world?.setSeason(state.season);setPhase('idle');$('#fishingMessage').textContent=message;}
function busy(){if(phase!=='idle'){toast('先把这一竿好好收回来吧。');return true;}return false;}
function seasonChange(value){if(busy())return;state.season=value;world?.setSeason(value);save();toast(`翻到${value}天，水下也换了一群新朋友。`);}
function timeChange(){if(busy())return;const ts=Object.keys(TIMES);state.time=ts[(ts.indexOf(state.time)+1)%3];world?.setTime(state.time);save();toast(`现在是${TIMES[state.time]}。有些鱼只会在这样的光里出现。`);}
function boatChange(){if(busy())return;if(loc().boat&&state.boat){toast('湖心没有码头，先在地图上选一处岸边。');return;}stopSailing();world?.returnDock();state.boat=!state.boat;world?.setBoat(state.boat);save();toast(state.boat?'推开小船，沿着水去看看。':'靠岸了。木码头还是暖暖的。');}
const waypointHud=$('#waypoint');
const waypointArrow=waypointHud.querySelector('.waypoint-arrow');
const waypointDistance=$('#waypointDistance');
function trackDestination(id){
 world?.trackLanding(id);
 waypointHud.hidden=!id;
 if(id){
  $('#waypointName').textContent=LOCATIONS.find(l=>l.id===id).name;
  waypointDistance.textContent='';
 }
}
function showBearing(angle,distance){
 waypointArrow.style.transform='rotate('+angle+'rad)';
 const label=distance+' m';
 if(waypointDistance.textContent!==label)waypointDistance.textContent=label;
}
$('#cancelWaypoint').onclick=()=>trackDestination(null);
function arrive(id){
 if(!sailing || id!==otherLanding(state.location)) return;
 stopSailing();
 state.location=id;
 world.setLocation(id,true);
 if(!state.visited.includes(id)) state.visited.push(id);
 awardAchievements();
 save();
 $('#fishingMessage').textContent='到了'+loc().name+'，小船已停稳，可以抛竿了。';
 toast('抵达'+loc().name);
}
function travel(id){
 if(busy())return;
 if(id===otherLanding(state.location)){
  if(!world)return;
  if(!state.boat){state.boat=true;world.setBoat(true);save();}
  if(panel.open)panel.close();
  if(!sailing)toggleSailing();
  trackDestination(id);
  return;
 }
 const next=LOCATIONS.find(l=>l.id===id);if(!next)return;stopSailing();state.location=id;if(next.boat)state.boat=true;if(!state.visited.includes(id))state.visited.push(id);world?.setLocation(id);world?.setBoat(state.boat);awardAchievements();save();panel.close();toast(`到了${next.name}。${next.tag}。`);}
function stopSailing(){trackDestination(null);sailing=false;paddleKeys.clear();world?.setSailing(false);world?.setPaddle(0,0);renderHUD();}
function toggleSailing(){if(busy()||!state.boat||!world)return;if(sailing){stopSailing();$('#fishingMessage').textContent='停好小船了，就在喜欢的水边抛一竿。';}else{sailing=true;paddleKeys.clear();world.setSailing(true);renderHUD();$('#fishingMessage').textContent='';}}
function updatePaddles(){if(!sailing||panel.open||$('#catchDialog').open){world?.setPaddle(0,0);return;}const x=Number(paddleKeys.has('KeyD')||paddleKeys.has('ArrowRight'))-Number(paddleKeys.has('KeyA')||paddleKeys.has('ArrowLeft'));const z=Number(paddleKeys.has('KeyS')||paddleKeys.has('ArrowDown'))-Number(paddleKeys.has('KeyW')||paddleKeys.has('ArrowUp'));world?.setPaddle(x,z);}
function awardAchievements(){const newOnes=ACHIEVEMENTS.filter(a=>!state.achievements.includes(a.id)&&a.test(state));for(const a of newOnes){state.achievements.push(a.id);state.coins+=a.reward;}if(newOnes.length)setTimeout(()=>toast(`新印章：${newOnes.map(a=>a.name).join('、')} · +${newOnes.reduce((s,a)=>s+a.reward,0)} 花月币`),500);}
function cast(){
 if(panel.open||$('#catchDialog').open)return;
 if(phase==='bite'){beginReel();return;}
 if(phase!=='idle')return;
 if(sailing){stopSailing();toast('收起船桨，轻轻把鱼竿放进水里。');}
 if(!state.baits[state.bait]){toast('鱼饵用完了，去渔具铺补一点，或换一种随身的饵。');openPanel('shop');return;}
 fish=chooseFish(state);if(!fish){toast('这会儿的水下很安静。换个时段、季节，或者划船去看看吧。');return;}
 setPhase('waiting');$('#fishingMessage').textContent='浮漂轻轻晃，风也替你等了一会儿。';
 waitTimer=setTimeout(()=>{setPhase('bite');$('#fishingMessage').textContent='扑通——有小家伙来访！不着急，点一下开始收线。';chime();},2000+Math.random()*1400);
}
function beginReel(){if(phase!=='bite')return;setPhase('reeling');reel=0;tension=.4;reelStart=performance.now();lastTick=reelStart;$('#fishingMessage').textContent='按住收线，松开降张力。让小竖线留在绿色里。';requestAnimationFrame(reelTick);}
function reelTick(now){if(phase!=='reeling')return;const dt=Math.min(.06,(now-lastTick)/1000);lastTick=now;const rod=RODS.find(r=>r.id===state.rod);tension=Math.max(.03,Math.min(.97,tension+dt*(held?.29:-.19)+Math.sin((now-reelStart)/670)*dt*.06));const safe=tension>=.22-rod.bonus*.25&&tension<=.72+rod.bonus*.25;reel=Math.max(0,reel+dt*(safe?.16+rod.bonus*.09:-.018));$('#tensionMarker').style.left=`${tension*100}%`;$('#safeZone').style.left=`${(.22-rod.bonus*.25)*100}%`;$('#safeZone').style.width=`${(.5+rod.bonus*.5)*100}%`;$('#reelProgress').style.width=`${Math.min(1,reel)*100}%`;$('#reelPercent').textContent=`${Math.round(Math.min(1,reel)*100)}%`;if(reel>=1){finishCatch();return;}requestAnimationFrame(reelTick);}
function finishCatch(){held=false;setPhase('caught');world?.setCatchQuality(fish.stars);const isNew=!state.book[fish.id];const length=Number((fish.length[0]+Math.random()*(fish.length[1]-fish.length[0])).toFixed(1));fish={...fish,caughtLength:length,isNew};settled=false;$('#catchEyebrow').textContent=isNew?'初次相遇 · 鱼笺将新增一页':'老朋友，也值得好好打个招呼';$('#catchName').textContent=fish.name;$('#catchStars').textContent=stars(fish.stars);$('#catchDetail').textContent=`${length} cm · ${state.season} · ${TIMES[state.time]} · ${loc().name}`;$('#catchNote').textContent=fish.note;$('#releaseValue').textContent=`观察酬金 +${Math.round(fish.value*.75)} 花月币${isNew?' · 初遇另加 35':''}`;$('#sellValue').textContent=`交换 +${fish.value} 花月币${isNew?' · 初遇另加 35':''}`;drawFish($('#catchArt'),fish);$('#catchDialog').showModal();chime(true);}
function settleCatch(release){if(settled||!fish)return;settled=true;const old=state.book[fish.id];state.baits[state.bait]=Math.max(0,state.baits[state.bait]-1);state.book[fish.id]={count:(old?.count||0)+1,maxLength:Math.max(old?.maxLength||0,fish.caughtLength),firstSeason:old?.firstSeason||state.season,firstLocation:old?.firstLocation||state.location,note:old?.note||''};state.coins+=(release?Math.round(fish.value*.75):fish.value)+(fish.isNew?35:0);if(!state.caughtSeasons.includes(state.season))state.caughtSeasons.push(state.season);if(eligibleFish(state).some(f=>f.stars===6))state.pity=fish.stars===6?0:(state.pity||0)+1;awardAchievements();save();$('#catchDialog').close();idle(release?'记下这次相遇。小鱼摇摇尾巴，回到湖里了。':'鱼篓里又多了一位朋友，继续去逛逛吧。');}
function heading(title,sub,en,chapter=''){return `<div class="panel-heading"><div><p class="eyebrow">${en}</p><h2>${title}</h2><p>${sub}</p></div><span class="chapter">${chapter}</span></div>`;}
function openPanel(kind){if(busy())return;paddleKeys.clear();world?.setPaused(true);panelKind=kind;renderPanel();if(!panel.open)panel.showModal();}
function renderPanel(){if(panelKind==='map')renderMap();else if(panelKind==='shop')renderShop();else if(panelKind==='achievements')renderAchievements();else renderBook();}
function renderMap(){content.innerHTML=heading('顺着水，去旅行','不用赶路。每一处水，都有自己的四季。','THE WATERS OF HUAYUE','01 — 06')+`<div class="map-sheet"><div class="world-map"><div class="map-water"></div><div class="map-stream"></div><div class="map-mountain"></div><div class="map-trees">♧ ♧<br>♧ ♧ ♧<br>♧ ♧</div><span class="map-name">花 月 水 系</span>${LOCATIONS.map(l=>`<button class="map-pin ${l.id===state.location?'current':''}" data-location="${l.id}" style="left:${l.x}%;top:${l.y}%" aria-label="前往${l.name}"><i></i><span>${l.name}${l.id===otherLanding(state.location)?" · 划船":""}</span></button>`).join('')}</div><aside class="map-legend"><p class="eyebrow">YOU ARE HERE</p><h3>${loc().name}</h3><p>${loc().description}</p><small>本水域记录 ${FISH.filter(f=>f.location===state.location&&state.book[f.id]).length} / 6<br>适合现在来访的鱼 ${eligibleFish(state).length} 种<br>月心浮岛需要乘船</small><button class="primary" id="mapReturn">就在这里坐一会儿</button></aside></div><p class="map-footer">浅湾与落樱溪之间可以借舟往返。选标有「划船」的地点即可追踪对岸码头；其他地点可直接前往。</p>`;content.querySelectorAll('[data-location]').forEach(b=>b.onclick=()=>travel(b.dataset.location));$('#mapReturn').onclick=()=>panel.close();}
function renderBook(){const list=FISH.filter(f=>bookFilter==='all'||(bookFilter==='caught'?Boolean(state.book[f.id]):f.stars===Number(bookFilter)));content.innerHTML=heading('小狼的四季鱼笺','钓到过的每一条，都替你留下一页。放归也算相遇。','A POCKETFUL OF ENCOUNTERS','FIELD NOTES')+`<div class="book-toolbar">${[['all','全部鱼笺'],['caught','已经遇见'],['3','3 星'],['4','4 星'],['5','5 星'],['6','6 星']].map(([id,label])=>`<button class="filter ${bookFilter===id?'active':''}" data-filter="${id}">${label}</button>`).join('')}<span class="book-total">已记录 ${Object.keys(state.book).length} / ${FISH.length}</span></div><div class="fish-grid">${list.map(f=>`<button class="fish-card ${state.book[f.id]?'known':'unknown'}" data-fish="${f.id}" aria-label="${f.name}${state.book[f.id]?'，已记录':'，尚未记录'}"><canvas data-art="${f.id}" aria-hidden="true"></canvas><h3>${state.book[f.id]?f.name:'未寄来的鱼笺'}</h3><div class="stars">${stars(f.stars)}</div><p>${LOCATIONS.find(l=>l.id===f.location).name} · ${f.seasons.join(' / ')}</p></button>`).join('')}</div>${!list.length?'<p class="empty-state">册子里还空着。去抛出第一竿，它就会开始写故事。</p>':''}<div class="book-bottom"><span>未见的鱼也会留下线索，不用盲目等候。</span><button id="viewAchievements" class="secondary">看看成就印章 →</button></div>`;content.querySelectorAll('[data-art]').forEach(c=>{const f=FISH.find(x=>x.id===c.dataset.art);drawFish(c,f,Boolean(state.book[f.id]));});content.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{bookFilter=b.dataset.filter;renderBook();});content.querySelectorAll('[data-fish]').forEach(b=>b.onclick=()=>renderFish(b.dataset.fish));$('#viewAchievements').onclick=()=>{panelKind='achievements';renderAchievements();};}
function renderFish(id){const f=FISH.find(x=>x.id===id),record=state.book[id];content.innerHTML=heading(record?f.name:'给未来的一张鱼笺','找到对的水与季节，相遇会更容易一些。','A LETTER FROM THE WATER',stars(f.stars))+`<div class="fish-detail"><canvas id="detailArt" aria-label="鱼类图鉴插画"></canvas><div><h3>${record?f.name:'还没有遇见它'}</h3><p>${record?esc(f.note):'这一页先空着，留给某一次出门。'}</p><p>出现水域：${LOCATIONS.find(l=>l.id===f.location).name}<br>季节：${f.seasons.join('、')}<br>时段：${f.time==='any'?'整天':TIMES[f.time]}${f.boat?' · 需要乘船':''}<br>${record?`相遇 ${record.count} 次 · 最大 ${record.maxLength} cm<br>初遇：${record.firstSeason}天，${LOCATIONS.find(l=>l.id===record.firstLocation)?.name||''}`:'任意鱼竿都可尝试；鱼饵只改变来访权重。'}</p>${record?'<label for="fishMemory">写一句只属于这次相遇的话</label><textarea id="fishMemory" maxlength="180" placeholder="那天风很轻，小船停在花瓣旁。"></textarea><button id="saveMemory" class="secondary" style="margin-top:10px">夹进册子里</button>':''}</div></div><div class="book-bottom"><button id="backBook" class="secondary">← 回到鱼笺册</button><button id="goHabitat" class="primary">去这片水看看</button></div>`;drawFish($('#detailArt'),f,Boolean(record));if(record){$('#fishMemory').value=record.note;$('#saveMemory').onclick=()=>{state.book[id].note=$('#fishMemory').value;save();toast('这句话已经夹进鱼笺里了。');};}$('#backBook').onclick=renderBook;$('#goHabitat').onclick=()=>travel(f.location);}
function renderAchievements(){content.innerHTML=heading('把旅途盖成小印章','慢一点也没关系。没有期限，也没有连续登录的任务。','LITTLE THINGS WORTH REMEMBERING',`${state.achievements.length} / ${ACHIEVEMENTS.length}`)+`<div class="achievements">${ACHIEVEMENTS.map((a,i)=>`<div class="achievement ${state.achievements.includes(a.id)?'done':''}"><span class="achievement-seal">${state.achievements.includes(a.id)?'✦':String(i+1).padStart(2,'0')}</span><div><h3>${a.name}</h3><p>${a.hint}<br>奖励 ${a.reward} 花月币</p></div><small>${state.achievements.includes(a.id)?'已盖章':'慢慢来'}</small></div>`).join('')}</div><div class="book-bottom"><button id="backBook" class="secondary">← 回到鱼笺册</button><span>达成时自动记下并领取奖励</span></div>`;$('#backBook').onclick=()=>{panelKind='book';renderBook();};}
function renderShop(){content.innerHTML=heading('苇婆婆的渔具铺','花月币只在游戏里流转。买一包饵，再带一点好心情。','REEDS & LITTLE THINGS',`${state.coins} 花月币`)+`<h3 class="shop-section-title">给水下的小点心</h3>${BAITS.map(b=>`<div class="shop-row"><i class="shop-dot" style="--item:${b.color}"></i><h3>${b.name}<small>随身 ${state.baits[b.id]} 份</small></h3><p>${b.description}</p><button class="shop-buy" data-buy-bait="${b.id}" ${state.coins<b.price?'disabled':''}>${b.price} 币 / ${b.amount} 份</button></div>`).join('')}<h3 class="shop-section-title">会陪你很久的鱼竿</h3>${RODS.map(r=>`<div class="shop-row"><i class="shop-dot" style="--item:${r.color}"></i><h3>${r.name}<small>${state.rod===r.id?'正在使用':state.rods.includes(r.id)?'已经拥有':'还在橱窗里'}</small></h3><p>${r.description}</p><button class="shop-buy" data-buy-rod="${r.id}" ${state.rod===r.id||(!state.rods.includes(r.id)&&state.coins<r.price)?'disabled':''}>${state.rod===r.id?'已装备':state.rods.includes(r.id)?'换上这根':`${r.price} 花月币`}</button></div>`).join('')}<h3 class="shop-section-title">一叶小舟</h3><div class="shop-row"><i class="shop-dot" style="--item:#bc9876"></i><h3>苇叶小木舟<small>${state.boatOwned?'写上了你的名字':'店里备有体验借舟'}</small></h3><p>没有燃油，不用修理。带你去岸边够不到的月光里。</p><button id="buyBoat" class="shop-buy" ${state.boatOwned||state.coins<480?'disabled':''}>${state.boatOwned?'你的船':'480 花月币'}</button></div><p class="shop-note">没有真实货币入口。初始赠送 12 份谷香团；每日便民补给可免费领取 5 份，避免空饵卡住旅程。</p><button id="supplyBtn" class="secondary">领一份便民补给（5 份谷香团）</button>`;content.querySelectorAll('[data-buy-bait]').forEach(b=>b.onclick=()=>buyBait(b.dataset.buyBait));content.querySelectorAll('[data-buy-rod]').forEach(b=>b.onclick=()=>buyRod(b.dataset.buyRod));$('#buyBoat').onclick=()=>{if(state.boatOwned||state.coins<480)return;state.coins-=480;state.boatOwned=true;save();renderShop();toast('苇婆婆把船绳递给你：这下，它有名字的主人啦。');};$('#supplyBtn').onclick=()=>{const today=new Date().toLocaleDateString('en-CA');if(state.supplyDay===today){toast('今天的补给已经放进背包，明天再来坐坐。');return;}state.supplyDay=today;state.baits.grain+=5;save();renderShop();toast('5 份谷香团已经装进背包。');};}
function buyBait(id){const b=BAITS.find(x=>x.id===id);if(!b||state.coins<b.price)return;state.coins-=b.price;state.baits[id]+=b.amount;state.bait=id;save();renderShop();toast(`${b.name}装好了，去水边试一试。`);}
function buyRod(id){const r=RODS.find(x=>x.id===id);if(!r)return;if(!state.rods.includes(id)){if(state.coins<r.price)return;state.coins-=r.price;state.rods.push(id);}state.rod=id;save();renderShop();toast(`换上${r.name}，下一竿会更稳一些。`);}
function cycleBait(){if(busy())return;const has=BAITS.filter(b=>state.baits[b.id]>0);if(!has.length){openPanel('shop');return;}state.bait=has[(has.findIndex(b=>b.id===state.bait)+1)%has.length].id;save();toast(`换成了${BAITS.find(b=>b.id===state.bait).name}。`);}
function chime(caught=false){if(!audio)return;const now=audio.ctx.currentTime;for(const [i,freq]of(caught?[523,659,784]:[659,880]).entries()){const o=audio.ctx.createOscillator(),g=audio.ctx.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0,now+i*.1);g.gain.linearRampToValueAtTime(.035,now+i*.1+.025);g.gain.exponentialRampToValueAtTime(.0001,now+i*.1+.7);o.connect(g).connect(audio.ctx.destination);o.start(now+i*.1);o.stop(now+i*.1+.8);}}
async function toggleAudio(){if(audio){await audio.ctx.close();audio=null;$('#soundLabel').textContent='关';$('#soundBtn').setAttribute('aria-pressed','false');$('#soundBtn').setAttribute('aria-label','开启湖畔环境音');return;}try{const ctx=new(window.AudioContext||window.webkitAudioContext)();await ctx.resume();const buffer=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate);const data=buffer.getChannelData(0);let v=0;for(let i=0;i<data.length;i++){v=(v+.02*(Math.random()*2-1))/1.02;data[i]=v*3;}const src=ctx.createBufferSource();src.buffer=buffer;src.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=780;const g=ctx.createGain();g.gain.value=.11;src.connect(filter).connect(g).connect(ctx.destination);src.start();audio={ctx};$('#soundLabel').textContent='开';$('#soundBtn').setAttribute('aria-pressed','true');$('#soundBtn').setAttribute('aria-label','关闭湖畔环境音');chime();}catch{toast('浏览器这次没有打开声音，安静的湖边也很好。');}}
$('#castBtn').addEventListener('pointerdown',e=>{if(phase==='bite'){beginReel();held=true;}else if(phase==='reeling'){held=true;}else cast();$('#castBtn').setPointerCapture?.(e.pointerId);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('#castBtn').addEventListener(event,()=>held=false);
window.addEventListener('blur',()=>{held=false;paddleKeys.clear();world?.setPaddle(0,0);});
window.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA/.test(e.target.tagName))return;const movement=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight'];if(sailing&&movement.includes(e.code)){e.preventDefault();if(!panel.open&&!$('#catchDialog').open){paddleKeys.add(e.code);updatePaddles();}return;}if(e.code==='Space'){if(panel.open||$('#catchDialog').open)return;e.preventDefault();if(e.repeat)return;if(phase==='bite')beginReel();else if(phase==='idle')cast();held=phase==='reeling';}if(!panel.open&&!$('#catchDialog').open){if(e.code==='KeyM')openPanel('map');if(e.code==='KeyB')openPanel('book');if(e.code==='KeyS')openPanel('shop');}});
window.addEventListener('keyup',e=>{if(e.code==='Space')held=false;paddleKeys.delete(e.code);updatePaddles();});
panel.addEventListener('close',()=>{if(panel.open)return;world?.setPaused(false);updatePaddles();});
$('#sailBtn').onclick=toggleSailing;
$('#returnDockBtn').onclick=()=>{if(busy())return;stopSailing();world?.returnDock();$('#fishingMessage').textContent='回到'+loc().name+'的码头了，可以抛竿或再出发。';toast('已经回到小码头，慢慢来。');};
for(const button of document.querySelectorAll('[data-paddle]')){const codes={up:'KeyW',left:'KeyA',down:'KeyS',right:'KeyD'};button.addEventListener('pointerdown',e=>{e.preventDefault();paddleKeys.add(codes[button.dataset.paddle]);updatePaddles();button.setPointerCapture(e.pointerId);});for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>{paddleKeys.delete(codes[button.dataset.paddle]);updatePaddles();});}
document.querySelectorAll('[data-season]').forEach(b=>b.onclick=()=>seasonChange(b.dataset.season));
document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openPanel(b.dataset.open));
$('#timeBtn').onclick=timeChange;$('#boatBtn').onclick=boatChange;$('#rodInfo').onclick=()=>openPanel('shop');$('#baitInfo').onclick=cycleBait;$('#baitCycle').onclick=cycleBait;$('#walletBtn').onclick=()=>openPanel('shop');$('#closePanel').onclick=()=>panel.close();$('#closeNote').onclick=()=>$('#welcomeNote').remove();$('#releaseBtn').onclick=()=>settleCatch(true);$('#sellBtn').onclick=()=>settleCatch(false);$('#soundBtn').onclick=toggleAudio;$('#catchDialog').addEventListener('cancel',e=>e.preventDefault());panel.addEventListener('click',e=>{if(e.target===panel){const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)panel.close();}});
renderHUD();
window.render_game_to_text=()=>JSON.stringify({coordinates:'world x east, z south; origin at lake center',ready:window.__HUAYUE__?.ready??false,phase,location:state.location,season:state.season,time:state.time,coins:state.coins,boat:state.boat,sailing,navigation:world?.getNavigation()??null,bait:{id:state.bait,count:state.baits[state.bait]},rod:state.rod,recordedFish:Object.keys(state.book),fish:fish?{id:fish.id,name:fish.name,stars:fish.stars}:null,reel:phase==='reeling'?{progress:reel,tension}:null});
window.__HUAYUE__={getState:()=>JSON.parse(JSON.stringify(state)),getPhase:()=>phase,getNavigation:()=>world?.getNavigation(),ready:false};
try{const {createWorld}=await import('./scene.js');world=await createWorld($('#world'),{onArrival:arrive,onBearing:showBearing});world.setSeason(state.season);world.setTime(state.time);world.setLocation(state.location);world.setBoat(state.boat);world.setFishing('idle');$('#loading')?.remove();window.__HUAYUE__.ready=true;}catch(e){console.error(e);$('#loading').innerHTML='湖面暂时没有展开<span>请用项目里的「启动花月汀.cmd」打开，或确认浏览器支持 WebGL。</span>';$('#loading').style.zIndex=0;}
