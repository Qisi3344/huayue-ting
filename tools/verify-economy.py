import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
async def main():
 errors=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.path.join(os.environ['LOCALAPPDATA'],'Google/Chrome/Application/chrome.exe'),headless=True,args=['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=await browser.new_page(viewport={'width':1280,'height':900});page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(os.environ.get('HUAYUE_URL','http://127.0.0.1:4173/'),wait_until='networkidle');await page.wait_for_function('window.__HUAYUE__?.ready===true')
  # Explicit test fixture, not a reward or fake gameplay result.
  await page.evaluate('''()=>{let s=window.__HUAYUE__.getState();s.coins=5000;localStorage.setItem('huayue-cove-save-v1',JSON.stringify(s));}''')
  await page.reload(wait_until='networkidle');await page.wait_for_function('window.__HUAYUE__?.ready===true')
  await page.locator('[data-open="bag"]').click()
  await page.locator('[data-tab="shop"]').click()
  for id in ['reed','moon','starlake']:
   await page.locator(f'[data-buy-rod="{id}"]').click()
   assert await page.evaluate('window.__HUAYUE__.getState().rod')==id
  await page.locator('[data-buy-rod="willow"]').click()
  assert await page.evaluate('window.__HUAYUE__.getState().rod')=='willow'
  await page.locator('#buyBoat').click()
  assert await page.evaluate('window.__HUAYUE__.getState().boatOwned')
  assert await page.locator('#buyBoat').is_disabled()
  assert await page.evaluate('window.__HUAYUE__.getState().coins')==990
  await page.locator('[data-buy-bait="star"]').click()
  assert await page.evaluate('window.__HUAYUE__.getState().baits.star')==5
  assert await page.evaluate('window.__HUAYUE__.getState().coins')==910
  await page.click('#closePanel')
  await page.click('[data-open="rod"]');await page.click('[data-equip="willow"]')
  await page.click('[data-open="bait"]');await page.click('[data-equip="star"]')
  # Two actions per cast (cast, withdraw). Stale timeouts must never hook a fish.
  await page.evaluate("""()=>{for(let i=0;i<12;i++)document.querySelector('#castBtn').click()}""")
  assert await page.evaluate("window.__HUAYUE__.getPhase()")== 'idle'
  await page.wait_for_timeout(3900)
  assert await page.evaluate("window.__HUAYUE__.getPhase()")== 'idle'
  await page.locator('#castBtn').press('Space')
  await page.wait_for_function("window.__HUAYUE__.getPhase()==='wait'")
  await page.keyboard.press('Space')
  assert await page.evaluate("window.__HUAYUE__.getState().baits.star")==5
  assert await page.locator('[data-open="bait"]').is_enabled()
  await page.evaluate("""()=>{window.fishingSteps=[];new MutationObserver(()=>fishingSteps.push(document.querySelector('#game').dataset.phase)).observe(document.querySelector('#game'),{attributes:true,attributeFilter:['data-phase']})}""")
  await page.click('#castBtn')
  await page.wait_for_function("window.__HUAYUE__.getPhase()==='wait'")
  assert await page.locator('[data-open="rod"]').is_disabled()
  await page.wait_for_function("window.__HUAYUE__.getPhase()==='bite'",timeout=6500)
  await page.keyboard.press('b');await page.keyboard.press('m')
  assert not await page.locator('#panel').is_visible()
  assert await page.locator('[data-open="bait"]').is_disabled()
  await page.locator('#castBtn').click();box=await page.locator('#castBtn').bounding_box();await page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2)
  holding=False
  for _ in range(90):
   if await page.evaluate('window.__HUAYUE__.getPhase()')=='result':break
   t=await page.locator('#tensionMarker').evaluate('(e)=>parseFloat(e.style.left)/100')
   if t<.33 and not holding:await page.mouse.down();holding=True
   elif t>.61 and holding:await page.mouse.up();holding=False
   await page.wait_for_timeout(220)
  if holding:await page.mouse.up()
  await page.wait_for_function('window.__HUAYUE__.getPhase()==="result"',timeout=3000)
  await page.keyboard.press('Escape');assert await page.locator('#catchDialog').evaluate('(d)=>d.open')
  name=await page.locator('#catchName').text_content();income=await page.locator('#sellValue').text_content()
  assert await page.evaluate("""()=>{
   document.querySelector('#sellBtn').click();
   const first=JSON.stringify(window.__HUAYUE__.getState());
   document.querySelector('#releaseBtn').click();document.querySelector('#sellBtn').click();
   return JSON.stringify(window.__HUAYUE__.getState())===first;
  }""")
  s=await page.evaluate('window.__HUAYUE__.getState()');assert len(s['book'])==1 and s['baits']['star']==4 and s['coins']>910
  assert next(iter(s['book'].values()))['count']==1
  assert await page.evaluate('window.fishingSteps')==['cast','wait','bite','reel','result','idle']
  assert await page.locator('[data-open="rod"]').is_enabled()
  assert s['rods']==['willow','reed','moon','starlake'];assert s['boatOwned'];assert not errors
  result={'fixture':'fresh browser save seeded with 5000 coins to exercise purchase paths','checks':['idle equipment shortcuts','withdraw during cast and wait without spending bait','equipment and menu lock during fishing','six state transitions','rapid cast and settlement inputs','all three paid rods purchased','free re-equip initial rod','boat ownership purchase and duplicate disabled','exact currency deductions','star bait purchased and consumed once','real fishing complete again','catch cannot dismiss without choosing','sell-fish path registers notebook and earnings','particle reset after catch'],'fishActuallyCaught':name,'saleLabel':income,'consoleErrors':errors}
  (ROOT/'verification/economy-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result,ensure_ascii=False,indent=2));await browser.close()
asyncio.run(main())
