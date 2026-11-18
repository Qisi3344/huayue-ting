import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.path.join(os.environ['LOCALAPPDATA'],'Google/Chrome/Application/chrome.exe'),headless=True,args=['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=await browser.new_page(viewport={'width':1440,'height':960})
  await page.goto(os.environ.get('HUAYUE_URL','http://127.0.0.1:4173/'),wait_until='networkidle');await page.wait_for_function('window.__HUAYUE__?.ready===true')
  results=[]
  for season in ['春','夏','秋','冬']:
   await page.locator('#dial').press('ArrowDown')
   await page.get_by_role('button',name=season,exact=True).click();await page.locator('#closePanel').click();await page.wait_for_timeout(4100)
   results.append({'season':season,'screenshotBytes':len(await page.screenshot())})
  old=await page.locator('#world').get_attribute('data-render-frames')
  await page.wait_for_timeout(1500)
  new=await page.locator('#world').get_attribute('data-render-frames')
  js=await page.evaluate('''() => ({canvasCount:document.querySelectorAll('canvas').length,svgCount:document.querySelectorAll('svg').length,scene:document.querySelector('#world').dataset.sceneReady,scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,buttons:[...document.querySelectorAll('button')].map(b=>({id:b.id,text:b.textContent.trim(),rect:(()=>{let r=b.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()})).filter(b=>b.rect.w>0)})''')
  assert js['svgCount']==0 and js['scene']=='true';print(json.dumps({'seasonFrames':results,'framesBefore':old,'framesAfter':new,'dom':js},ensure_ascii=False,indent=2))
  await browser.close()
asyncio.run(main())
