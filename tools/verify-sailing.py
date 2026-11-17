import asyncio,os,json,math
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.path.join(os.environ['LOCALAPPDATA'],'Google/Chrome/Application/chrome.exe'),headless=True,args=['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=await browser.new_page(viewport={'width':1440,'height':960})
  await page.goto('http://127.0.0.1:4173/',wait_until='networkidle');await page.wait_for_function('window.__HUAYUE__?.ready===true')
  assert await page.locator('#sailBtn').count()==1,'缺少真正的划船按钮：仍然只能乘坐静止的小舟'
  await page.locator('#sailBtn').click()
  start=await page.evaluate('window.__HUAYUE__.getNavigation()')
  assert start['sailing']
  await page.keyboard.down('KeyD');await page.wait_for_timeout(1600);await page.keyboard.up('KeyD')
  end=await page.evaluate('window.__HUAYUE__.getNavigation()')
  distance=math.hypot(end['x']-start['x'],end['z']-start['z'])
  assert distance>.4,f'划船输入没有让船移动，距离为 {distance}'
  await page.locator('#sailBtn').click()
  assert not (await page.evaluate('window.__HUAYUE__.getNavigation()'))['sailing']
  pos=await page.evaluate('window.__HUAYUE__.getNavigation()')
  await page.keyboard.down('KeyD');await page.wait_for_timeout(400);await page.keyboard.up('KeyD')
  still=await page.evaluate('window.__HUAYUE__.getNavigation()')
  assert math.hypot(still['x']-pos['x'],still['z']-pos['z'])<.02
  await page.locator('#returnDockBtn').click()
  returned=await page.evaluate('window.__HUAYUE__.getNavigation()')
  assert abs(returned['x']-.25)<.02 and abs(returned['z']-1.6)<.02
  await page.locator('#sailBtn').click();await page.locator('[data-open="map"]').click()
  pos=await page.evaluate('window.__HUAYUE__.getNavigation()')
  await page.keyboard.down('KeyD');await page.wait_for_timeout(400);await page.keyboard.up('KeyD')
  paused=await page.evaluate('window.__HUAYUE__.getNavigation()')
  assert math.hypot(paused['x']-pos['x'],paused['z']-pos['z'])<.02
  await page.locator('#closePanel').click();await page.locator('#sailBtn').click()
  await page.set_viewport_size({'width':390,'height':844});await page.locator('#sailBtn').click()
  assert await page.locator('.sail-pad').is_visible()
  pos=await page.evaluate('window.__HUAYUE__.getNavigation()')
  b=await page.locator('[data-paddle="right"]').bounding_box();await page.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2);await page.mouse.down();await page.wait_for_timeout(1000);await page.mouse.up()
  mobile=await page.evaluate('window.__HUAYUE__.getNavigation()')
  assert math.hypot(mobile['x']-pos['x'],mobile['z']-pos['z'])>.2
  await page.screenshot(path=str(ROOT/'verification/10-sailing-mobile.png'))
  await page.set_viewport_size({'width':1440,'height':960});await page.screenshot(path=str(ROOT/'verification/11-sailing.png'))
  await page.set_viewport_size({'width':1280,'height':720})
  await page.locator('#sailBtn').click()
  assert not (await page.evaluate('window.__HUAYUE__.getNavigation()'))['sailing']
  await page.locator('#sailBtn').click()
  assert (await page.evaluate('window.__HUAYUE__.getNavigation()'))['sailing']
  assert await page.evaluate('''()=>{const a=document.querySelector('.sailing-controls').getBoundingClientRect(),b=document.querySelector('.world-controls').getBoundingClientRect();return a.bottom<=b.top||a.top>=b.bottom||a.right<=b.left||a.left>=b.right;}'''), 'Sailing controls overlap season controls'
  await page.screenshot(path=str(ROOT/'verification/12-sailing-laptop.png'))
  result={'checks':['keyboard moves boat','stop anchors boat','stationary inputs ignored','return to dock','menus pause movement','touch-sized paddle controls move boat','laptop sailing button unobstructed at 1280x720'],'keyboardDistance':round(distance,3),'mobileDistance':round(math.hypot(mobile['x']-pos['x'],mobile['z']-pos['z']),3)}
  (ROOT/'verification/sailing-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result,ensure_ascii=False,indent=2));await browser.close()
asyncio.run(main())
