OUTBOUND = [(9,3),(16,8),(20,12.3),(23,8.5),(27,3),(33,2)]
ROW_TO = """([x,z])=>new Promise((resolve,reject)=>{
          const start=performance.now(),held=new Set();
          function key(code,down){window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,bubbles:true}));}
          function frame(){
            const nav=window.__HUAYUE__.getNavigation(),dx=x-nav.x,dz=z-nav.z;
            const stop=Math.hypot(dx,dz)<.55, timeout=performance.now()-start>75000;
            const wanted=new Set();
            if(!stop && !timeout){
              if(Math.abs(dx)>.28)wanted.add(dx>0?'KeyD':'KeyA');
              if(Math.abs(dz)>.28)wanted.add(dz>0?'KeyS':'KeyW');
            }
            for(const k of held)if(!wanted.has(k)){key(k,false);held.delete(k);}
            for(const k of wanted)if(!held.has(k)){key(k,true);held.add(k);}
            if(timeout)reject(Error(JSON.stringify(nav)));else if(stop)resolve();else requestAnimationFrame(frame);
          }
          frame();
        })"""
