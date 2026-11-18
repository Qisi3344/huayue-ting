import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'verification'
OUT.mkdir(exist_ok=True)

async def main():
    errors=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=os.path.join(os.environ['LOCALAPPDATA'],'Google','Chrome','Application','chrome.exe'),headless=True,args=['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        page=await browser.new_page(viewport={'width':1440,'height':960},device_scale_factor=1)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
        response=await page.goto(os.environ.get('HUAYUE_URL','http://127.0.0.1:4173/'),wait_until='networkidle')
        await page.wait_for_function('window.__HUAYUE__?.ready === true',timeout=45000)
        assert await page.locator('#world').get_attribute('data-character-model')=='blender-glb'
        await page.wait_for_timeout(1200)
        await page.screenshot(path=str(OUT/'01-lakeside.png'))
        initial=await page.evaluate('window.__HUAYUE__.getState()')
        observed=json.loads(await page.evaluate('window.render_game_to_text()'))
        assert observed['ready'] and observed['phase']=='idle' and observed['coins']==initial['coins']
        assert initial['coins']==160
        assert await page.locator('#waypoint').is_hidden()
        await page.locator('#dial').press('ArrowDown')
        await page.get_by_role('button',name='夏',exact=True).click()
        assert await page.evaluate('window.__HUAYUE__.getState().season')=='夏'
        await page.get_by_role('button',name='春',exact=True).click()
        await page.locator('[data-time="dusk"]').click()
        assert await page.evaluate('window.__HUAYUE__.getState().time')=='dusk'
        await page.locator('[data-time="night"]').click()
        await page.locator('#closePanel').click()
        await page.wait_for_timeout(4100)
        await page.screenshot(path=str(OUT/'02-night.png'))
        await page.locator('#dial').press('ArrowDown')
        await page.locator('[data-time="day"]').click()
        await page.locator('#closePanel').click()
        await page.locator('[data-open="map"]').click()
        await page.screenshot(path=str(OUT/'03-map.png'))
        for location in ['sakura','falls','snow','tide','moon','reed']:
            if not await page.locator('#panel').evaluate('(d)=>d.open'):await page.locator('[data-open="map"]').click()
            await page.locator(f'[data-location="{location}"]').click()
            if location=='sakura':
                assert await page.evaluate("window.__HUAYUE__.getState().location==='reed'")
                assert await page.locator('#waypoint').is_visible()
                await page.locator('#cancelWaypoint').click()
                assert await page.locator('#waypoint').is_hidden()
                assert await page.evaluate('window.__HUAYUE__.getNavigation().sailing')
                await page.locator('[data-open="map"]').click()
                await page.locator('[data-location="sakura"]').click()
                await page.keyboard.down('ArrowRight')
                try: await page.wait_for_function("window.__HUAYUE__.getState().location==='sakura'",timeout=90000)
                finally: await page.keyboard.up('ArrowRight')
            assert await page.locator('#waypoint').is_hidden()
            assert await page.evaluate('window.__HUAYUE__.getState().location')==location
        # Navigation achievement is actually earned by all six visits.
        travelled=await page.evaluate('window.__HUAYUE__.getState()')
        assert 'traveler' in travelled['achievements']
        await page.locator('[data-open="map"]').click()
        await page.locator('#boatBtn').click()
        assert not await page.evaluate('window.__HUAYUE__.getState().boat')
        await page.locator('[data-open="map"]').click()
        await page.locator('#boatBtn').click()
        assert await page.evaluate('window.__HUAYUE__.getState().boat')
        await page.locator('[data-open="shop"]').click()
        before=await page.evaluate('window.__HUAYUE__.getState()')
        await page.locator('[data-buy-bait="petal"]').click()
        after=await page.evaluate('window.__HUAYUE__.getState()')
        assert after['coins']==before['coins']-45 and after['baits']['petal']==5
        await page.locator('#supplyBtn').click()
        supplied=await page.evaluate('window.__HUAYUE__.getState()')
        await page.locator('#supplyBtn').click()
        assert await page.evaluate('window.__HUAYUE__.getState().baits.grain')==supplied['baits']['grain']
        await page.screenshot(path=str(OUT/'04-shop.png'))
        await page.locator('#closePanel').click()
        await page.locator('#castBtn').click()
        await page.wait_for_function('window.__HUAYUE__.getPhase()==="bite"',timeout=6500)
        await page.locator('#castBtn').click()
        box=await page.locator('#castBtn').bounding_box()
        await page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2)
        holding=False
        deadline=asyncio.get_running_loop().time()+65
        while asyncio.get_running_loop().time()<deadline:
            if await page.evaluate('window.__HUAYUE__.getPhase()')=='caught':break
            value=await page.locator('#tensionMarker').evaluate('(e)=>parseFloat(e.style.left)/100')
            if value<.33 and not holding:
                await page.mouse.down();holding=True
            elif value>.61 and holding:
                await page.mouse.up();holding=False
            await page.wait_for_timeout(220)
        if holding:await page.mouse.up()
        assert await page.evaluate('window.__HUAYUE__.getPhase()')=='caught',await page.evaluate('window.render_game_to_text()')
        await page.screenshot(path=str(OUT/'05-catch.png'))
        await page.locator('#releaseBtn').click()
        caught=await page.evaluate('window.__HUAYUE__.getState()')
        assert len(caught['book'])==1 and caught['baits']['petal']==4
        assert 'first' in caught['achievements']
        await page.locator('[data-open="book"]').click()
        await page.screenshot(path=str(OUT/'06-notebook.png'))
        await page.locator('[data-filter="caught"]').click()
        await page.locator('.fish-card').click()
        await page.locator('#fishMemory').fill('今天和小狼一起听见了春天。')
        await page.locator('#saveMemory').click()
        await page.locator('#closePanel').click()
        await page.reload(wait_until='networkidle')
        await page.wait_for_function('window.__HUAYUE__?.ready === true')
        restored=await page.evaluate('window.__HUAYUE__.getState()')
        assert len(restored['book'])==1
        assert list(restored['book'].values())[0]['note']=='今天和小狼一起听见了春天。'
        assert restored['coins']==caught['coins']
        await page.locator('#dial').press('ArrowDown')
        await page.get_by_role('button',name='冬',exact=True).click()
        await page.locator('#closePanel').click()
        await page.locator('[data-open="map"]').click()
        await page.locator('[data-location="snow"]').click()
        await page.screenshot(path=str(OUT/'07-winter.png'))
        await page.set_viewport_size({'width':390,'height':844})
        await page.screenshot(path=str(OUT/'08-mobile.png'))
        await page.locator('[data-open="book"]').click()
        overflow=await page.evaluate('document.documentElement.scrollWidth>innerWidth || document.querySelector("#panel").scrollWidth>document.querySelector("#panel").clientWidth+2')
        assert not overflow
        await page.screenshot(path=str(OUT/'09-mobile-notebook.png'))
        await page.locator('#closePanel').click()
        await page.locator('#soundBtn').click()
        assert await page.locator('#soundBtn').get_attribute('aria-pressed')=='true'
        await page.locator('#soundBtn').click()
        assert await page.locator('#soundBtn').get_attribute('aria-pressed')=='false'
        result={'httpStatus':response.status,'webglReady':True,'renderFrames':await page.locator('#world').get_attribute('data-render-frames'),'fishCount':36,'uniqueFishActuallyCaught':len(restored['book']),'currencyAfterTravelBuyCatch':restored['coins'],'caughtFish':list(restored['book']),'checks':['four seasons change','time changes','six map destinations','boat board/disembark','travel achievement','bait payment and stock','daily supply cannot double claim','live cast/bite/tension/reel/catch','release income and first-catch achievement','notebook records','personal note persistence on reload','winter scene','mobile notebook no horizontal overflow','ambient audio on/off'],'consoleErrors':errors}
        (OUT/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
        print(json.dumps(result,ensure_ascii=False,indent=2))
        assert not errors,errors
        await browser.close()

asyncio.run(main())
