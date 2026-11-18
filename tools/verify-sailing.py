import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
out = root / 'verification'
url = os.environ.get('HUAYUE_URL', 'http://127.0.0.1:4173/')
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=str(Path(os.environ['LOCALAPPDATA'])/'Google/Chrome/Application/chrome.exe'),
                                 args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    page = browser.new_page(viewport={'width':1080,'height':720},has_touch=True)
    errors = []
    page.on('pageerror',lambda error: errors.append(str(error)))
    page.on('console',lambda msg: errors.append(msg.text) if msg.type=='error' else None)
    page.goto(url)
    page.wait_for_function('window.__HUAYUE__?.ready')
    page.locator('#dial').click()
    assert page.locator('#dialReadout').is_visible()
    page.locator('#dialReadout').wait_for(state='hidden')
    page.wait_for_function("document.querySelector('#game').classList.contains('idle-hud')")
    page.wait_for_function("getComputedStyle(document.querySelector('.side-nav')).opacity<.5")
    assert page.evaluate("['#minimap','.topbar','#castBtn'].every(s=>getComputedStyle(document.querySelector(s)).opacity==='1')")
    page.mouse.move(90,48)
    assert page.locator('#game.idle-hud').count()==0
    assert page.locator('.location-block').evaluate("e=>Number(getComputedStyle(e).opacity)")<.1
    rect = page.locator('#dial').bounding_box()
    page.mouse.move(rect['x']+24,rect['y']+24)
    page.mouse.down()
    page.wait_for_selector('[data-season="冬"]')
    page.mouse.up()
    page.click('[data-season="冬"]')
    page.click('[data-time="night"]')
    assert page.evaluate('window.__HUAYUE__.getState().clockHeld')
    page.click('#resumeClock')
    page.evaluate("""()=>{const s=window.__HUAYUE__.getState();Object.assign(s,{dayInSeason:5,phaseSeconds:89.6});localStorage.setItem('huayue-cove-save-v1',JSON.stringify(s));}""")
    page.reload()
    page.wait_for_function("window.__HUAYUE__?.ready && document.querySelector('#dial').dataset.time==='dawn'")
    assert page.evaluate("window.__HUAYUE__.getState().season==='春'")
    # Read the arrow as a CSS transform, independent of the camera orbit.
    page.evaluate("window.firstChart = document.querySelector('#minimapBase canvas')")
    for key,axis,sign in [('ArrowRight','x',1),('ArrowDown','z',1),('ArrowLeft','x',-1),('ArrowUp','z',-1)]:
        start=page.evaluate("window.__HUAYUE__.getNavigation()")
        page.keyboard.down(key)
        try:
            page.wait_for_function("([axis,start,sign])=>(window.__HUAYUE__.getNavigation()[axis]-start)*sign>.55",arg=[axis,start[axis],sign])
        finally: page.keyboard.up(key)
        sample=page.evaluate("""()=>{
          const el=document.querySelector('#minimapMarker'), n=window.__HUAYUE__.getNavigation();
          const m=new DOMMatrix(getComputedStyle(el).transform);
          return [parseFloat(el.style.left),parseFloat(el.style.top),-m.c,-m.d,n.x,n.z];
        }""")
        u,v,east,south,x,z=sample
        assert abs(u-(x+10)/34*100)<.002 and abs(v-(z+17)/34*100)<.002,sample
        assert (east if axis=='x' else south)*sign>.95,sample
    assert page.evaluate("firstChart===document.querySelector('#minimapBase canvas')")
    page.click('#minimap')
    page.click('#boatBtn')
    page.wait_for_selector('#minimapMarker.ashore')
    page.click('#minimap')
    page.click('[data-location="falls"]')
    assert page.evaluate("firstChart!==document.querySelector('#minimapBase canvas')")
    page.click('#minimap')
    page.click('[data-location="reed"]')
    assert page.evaluate("firstChart===document.querySelector('#minimapBase canvas')")
    page.click('#minimap')
    page.click('#boatBtn')
    page.keyboard.down('KeyD')
    page.wait_for_function('window.__HUAYUE__.getNavigation().x>1.1')
    page.keyboard.up('KeyD')
    assert page.locator('#waypoint').is_hidden()
    page.click('[data-open="map"]')
    pos=page.evaluate('window.__HUAYUE__.getNavigation().x')
    page.keyboard.press('ArrowRight')
    assert page.evaluate('window.__HUAYUE__.getNavigation().x')==pos
    page.click('#returnDockBtn')
    assert abs(page.evaluate('window.__HUAYUE__.getNavigation().x')-.25)<.01
    page.click('#rodInfo')
    page.click('[data-equip="willow"]')
    page.click('#baitInfo')
    assert page.locator('[data-equip="star"]').is_disabled()
    page.click('[data-equip="grain"]')
    page.mouse.move(55,55)
    page.screenshot(path=out/'19-lakeside-hud.png')
    page.set_viewport_size({'width':390,'height':844})
    cdp=page.context.new_cdp_session(page)
    def touch(event,points):
        cdp.send('Input.dispatchTouchEvent',{'type':event,'touchPoints':[dict(x=x,y=y) for x,y in points]})
    page.tap('#dial')
    assert page.locator('#dialReadout').is_visible()
    badge=page.locator('#dial').bounding_box()
    touch('touchStart',[(badge['x']+badge['width']/2,badge['y']+badge['height']/2)])
    page.wait_for_selector('#resumeClock')
    touch('touchEnd',[])
    page.tap('#resumeClock')
    touch('touchStart',[(60,580)])
    touch('touchMove',[(102,580)])
    assert page.locator('#joystick').is_visible()
    page.wait_for_function('window.__HUAYUE__.getNavigation().x>1')
    page.wait_for_timeout(4200)
    assert page.locator('#game.idle-hud').count()==0
    page.screenshot(path=out/'20-touch-sailing.png')
    touch('touchEnd',[])
    assert page.locator('#joystick').is_hidden()
    page.tap('#castBtn')
    page.wait_for_function("window.__HUAYUE__.getPhase()==='bite'")
    assert page.locator('#castLabel').inner_text()=='鱼上钩了 · 收线'
    assert not errors,errors
    result={'checks':['dial tap and hold','idle fade and wake','automatic dawn and spring rollover','direct keyboard departure','menu pauses sailing','return to dock','gear selection','four north-up bearings and positions','cached maps and shore marker','persistent minimap during idle','touch joystick drag and release','casting after sailing'],'consoleErrors':errors}
    (out/'sailing-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False))
    browser.close()
