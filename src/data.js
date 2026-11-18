export const SEASONS = ['春','夏','秋','冬'];
export const TIMES = {dawn:'清晨',day:'日间',dusk:'黄昏',night:'夜晚'};
export const LOCATIONS = [
 {id:'reed',name:'芦眠浅湾',en:'REEDWATER',x:27,y:61,color:'#88b7a1',tag:'初次相遇的地方',description:'风穿过芦苇，木码头晒得暖暖的。岸边与小船都能垂钓。',boat:false},
 {id:'sakura',name:'落樱溪',en:'PETAL CREEK',x:40,y:30,color:'#d6a4b0',tag:'顺着花瓣往上游',description:'溪水带来落花。春天的黄昏，水下也会有一场花开。',boat:false},
 {id:'falls',name:'萤瀑林',en:'FIREFLY FALLS',x:67,y:27,color:'#83a798',tag:'夜色里有另一条河',description:'瀑布脚下住着喜欢急流的小鱼，晚上有萤光陪你。',boat:false},
 {id:'snow',name:'霜镜湖',en:'FROSTMIRROR',x:80,y:51,color:'#9eb7cb',tag:'冬天也值得出门',description:'雪松围着不结冰的泉眼，白气和雪花都慢慢往上飘。',boat:false},
 {id:'tide',name:'琥珀潮汐',en:'AMBER TIDE',x:62,y:76,color:'#c5b28c',tag:'把船划到海风里',description:'有贝壳的沙洲与安静的潮池。小船能载你去更深的水。',boat:false},
 {id:'moon',name:'月心浮岛',en:'MOONHEART',x:51,y:51,color:'#afa6c5',tag:'只有小船能抵达',description:'在湖心停桨，点起一盏灯。星光会一点一点沉进水里。',boat:true}
];
export const BAITS = [
 {id:'grain',name:'谷香团',price:20,amount:5,description:'麦粒与米香。所有鱼都吃的安心选择。',color:'#c1a56c'},
 {id:'petal',name:'花露饵',price:45,amount:5,description:'温柔的花香，提高四星、五星来访权重。',color:'#d3a0ad'},
 {id:'star',name:'星萤饵',price:80,amount:5,description:'在水下泛起微光，更容易遇见稀有鱼。',color:'#afa2c9'}
];
export const RODS = [
 {id:'willow',name:'柳枝小竿',price:0,description:'随身的第一根鱼竿，所有鱼种都可以尝试。',bonus:0,color:'#9d9873'},
 {id:'reed',name:'芦歌鱼竿',price:350,description:'收线更稳，鱼挣扎时也不容易失去节奏。',bonus:.09,color:'#7da48b'},
 {id:'moon',name:'花月鱼竿',price:980,description:'温柔的韧性，更宽的舒适张力区间。',bonus:.19,color:'#b0a0bc'},
 {id:'starlake',name:'星湖长竿',price:2200,description:'陪你抵达远处。收线速度再提高一点。',bonus:.3,color:'#bca575'}
];
// 36 original fish: six habitats, each with two 3★, two 4★, one 5★ and one 6★.
const rows = [
 ['reed','麦穗小鲫',3,'春夏秋冬','any',false,22,'#c3a27b','小小一只，也很认真地生活。'],
 ['reed','青苇鲦',3,'春夏秋','day',false,26,'#7dada1','把自己藏成一片细细的苇叶。'],
 ['reed','奶油花鳅',4,'春秋','dusk',false,58,'#ddc58f','像刚出炉的奶油面包。'],
 ['reed','雨铃鲤',4,'夏秋','any',false,65,'#8bacc5','尾鳍摆起来，像风铃轻轻响。'],
 ['reed','晚霞绢鱼',5,'夏秋','dusk',true,180,'#db9d9a','肚子里好像装着一小片晚霞。'],
 ['reed','苇梦长须',6,'春','night',true,460,'#b3b89b','芦苇睡着以后，它才慢慢醒来。'],
 ['sakura','桃腮溪鱼',3,'春夏','day',false,24,'#d2a9a1','两颊红红的，是不是也有点害羞？'],
 ['sakura','石纹圆鲃',3,'春夏秋冬','any',false,25,'#9ca18f','爱躲在圆圆的石头旁边。'],
 ['sakura','花笺鲤',4,'春秋','day',false,62,'#d9b9b1','每一片鳞都像一封没寄出的信。'],
 ['sakura','落瓣游鳉',4,'春夏','dusk',false,66,'#b8a1c0','顺着花瓣找它，通常不会迷路。'],
 ['sakura','樱雪蝶尾',5,'春','dusk',false,190,'#e6bdcd','尾巴是水里轻轻展开的一场春雪。'],
 ['sakura','春信白龙',6,'春','night',true,510,'#d7c7e5','它不是龙，只是把春天带来得很郑重。'],
 ['falls','苔点溪鲈',3,'春夏秋冬','day',false,28,'#8ba795','绿绿的小斑点，是森林送的外衣。'],
 ['falls','银线急游',3,'春夏秋冬','any',false,30,'#b7c9c8','像一道没有声音的小闪电。'],
 ['falls','瀑沫飞鱼',4,'夏秋','day',false,70,'#9fb8ce','偶尔跃出水面，看一眼自己的天空。'],
 ['falls','灯笼玻璃鳉',4,'夏','night',false,72,'#c4cb92','连小小的鱼，也有自己的灯。'],
 ['falls','萤河缎尾',5,'夏秋','night',true,195,'#a8c8a5','它经过的地方，会亮起一条小路。'],
 ['falls','千灯幽鳐',6,'夏','night',true,560,'#a4b8ca','一千盏萤灯，替森林保管一个秘密。'],
 ['snow','雪团圆鲫',3,'秋冬','day',false,28,'#c9d8d5','圆滚滚的，看起来特别怕冷。'],
 ['snow','松针细鳟',3,'春夏秋冬','any',false,30,'#94aeaa','游得很轻，像松针落在水面上。'],
 ['snow','冰糖透明鱼',4,'冬','day',false,68,'#bdd6df','透亮的身子，藏着一点点冬日阳光。'],
 ['snow','霜纹银鲑',4,'秋冬','dusk',false,75,'#aabdd0','霜纹不是冻住，是冬天写下的字。'],
 ['snow','极光纱鳍',5,'冬','night',true,220,'#b2bbd9','它把极光剪成了轻轻的鱼鳍。'],
 ['snow','眠月冰鲸',6,'冬','night',true,600,'#c1cbe0','很小的鲸形鱼。遇见它，要轻声说你好。'],
 ['tide','沙糖小鲽',3,'春夏秋冬','day',false,26,'#cfbb8e','把自己埋进沙里，只留下好奇的眼睛。'],
 ['tide','贝壳银梭',3,'春夏秋冬','any',false,32,'#a2c5c4','喜欢追着海浪收集细碎的银光。'],
 ['tide','琥珀斑鲷',4,'夏秋','day',false,72,'#d6ad76','身上留下了日落时海水的颜色。'],
 ['tide','珊瑚绒鱼',4,'春夏','dusk',false,74,'#d59d9a','毛绒绒的样子，其实是柔软的鱼鳍。'],
 ['tide','潮歌月鳐',5,'夏秋','dusk',true,205,'#b4c4cc','潮声是它每天唱的晚安曲。'],
 ['tide','归潮星鲸',6,'秋','night',true,580,'#abb9cf','会在同一片星空下，再一次回到这里。'],
 ['moon','月芽小鲫',3,'春夏秋冬','any',true,30,'#d5ccaa','尾巴弯弯，是一枚还没长大的月亮。'],
 ['moon','云絮团鱼',3,'春夏秋冬','day',true,32,'#c5d5d0','像一朵掉进水里、还没学会下雨的云。'],
 ['moon','星屑玻璃鲤',4,'春夏秋冬','night',true,78,'#b5b1d1','星光沉到湖底以后，会不会变成鱼呢？'],
 ['moon','绸月双尾',4,'春秋','dusk',true,80,'#d0bbd7','两条尾巴，一条拨水，一条拨月亮。'],
 ['moon','花月灯鱼',5,'春夏秋冬','night',true,230,'#c8b5d7','它带着一盏谁也不必归还的小灯。'],
 ['moon','星眠月灵',6,'春夏秋冬','night',true,650,'#b5aad0','当你愿意安静等候，湖也会回应你。']
];
export const FISH = rows.map((r,i)=>({id:`fish-${String(i+1).padStart(2,'0')}`,location:r[0],name:r[1],stars:r[2],seasons:[...r[3]],time:r[4],boat:r[5],value:r[6],color:r[7],note:r[8],shape:i%5,length:[12+i*1.3,20+i*2.1]}));
export function eligibleFish(state){return FISH.filter(f=>f.location===state.location&&f.seasons.includes(state.season)&&(f.time==='any'||f.time===(state.time==='dawn'?'day':state.time))&&(!f.boat||state.boat));}
export function fishWeight(f,bait,pity=0){const base={3:65,4:27,5:7,6:1}[f.stars];const mult=bait==='star'?{3:.5,4:1.2,5:2.2,6:4}[f.stars]:bait==='petal'?{3:.7,4:1.5,5:1.6,6:1}[f.stars]:1;return base*mult*(f.stars===6?1+pity*.15:1);}
export function chooseFish(state,random=Math.random){const pool=eligibleFish(state);if(!pool.length)return null;const legendary=pool.find(f=>f.stars===6);if(legendary&&(state.pity||0)>=11)return legendary;let n=random()*pool.reduce((s,f)=>s+fishWeight(f,state.bait,state.pity),0);return pool.find(f=>(n-=fishWeight(f,state.bait,state.pity))<0)||pool.at(-1);}
export const ACHIEVEMENTS=[
 {id:'first',name:'第一声扑通',hint:'钓到第一条鱼',reward:30,test:s=>Object.keys(s.book).length>=1},
 {id:'collector',name:'口袋里的河流',hint:'记录 6 种不同的鱼',reward:100,test:s=>Object.keys(s.book).length>=6},
 {id:'traveler',name:'顺着水去旅行',hint:'探访全部 6 处水域',reward:80,test:s=>s.visited.length>=6},
 {id:'seasons',name:'四季都记得你',hint:'在每个季节钓到鱼',reward:120,test:s=>s.caughtSeasons.length>=4},
 {id:'legend',name:'月亮的回信',hint:'记录一条六星鱼',reward:150,test:s=>FISH.some(f=>f.stars===6&&s.book[f.id])},
 {id:'complete',name:'把四季收进册子',hint:'记录全部 36 种鱼',reward:600,test:s=>Object.keys(s.book).length===FISH.length}
];
