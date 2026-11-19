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
    assert page.evaluate("['.topbar','#castBtn'].every(s=>getComputedStyle(document.querySelector(s)).opacity==='1')")
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
        half=(49**2+34**2)**.5*.53
        assert abs(u-(.5+(x-8.5)/(2*half))*100)<.002 and abs(v-(.5+(z-1)/(2*half))*100)<.002,sample
        assert (east if axis=='x' else south)*sign>.95,sample
    assert page.evaluate("firstChart===document.querySelector('#minimapBase canvas')")
    page.click('#boatBtn')
    page.wait_for_selector('#minimapMarker.ashore')
    page.click('#minimap')
    page.click('[data-location="falls"]')
    assert page.locator('#placeBubble').is_visible()
    assert page.evaluate("window.__HUAYUE__.getState().location==='reed'")
    assert page.get_by_role('button',name='传送',exact=True).is_disabled()
    page.get_by_role('button',name='搭渡船').click()
    assert page.evaluate("firstChart!==document.querySelector('#minimapBase canvas')")
    page.click('#minimap')
    page.click('[data-location="reed"]')
    page.get_by_role('button',name='传送',exact=True).click()
    assert page.evaluate("firstChart===document.querySelector('#minimapBase canvas')")
    page.click('#boatBtn')
    page.keyboard.down('KeyD')
    page.wait_for_function('window.__HUAYUE__.getNavigation().x>2.6')
    page.keyboard.up('KeyD')
    page.wait_for_selector('#boatBtn',state='hidden')
    assert page.locator('#waypoint').is_hidden()
    page.wait_for_function('!window.__HUAYUE__.getNavigation().sailing')
    page.click('#minimap')
    pos=page.evaluate('window.__HUAYUE__.getNavigation().x')
    page.keyboard.press('ArrowRight')
    assert page.evaluate('window.__HUAYUE__.getNavigation().x')==pos
    page.click('#returnDockBtn')
    assert abs(page.evaluate('window.__HUAYUE__.getNavigation().x')-.25)<.01
    page.click('[data-open="bag"]')
    page.click('[data-tab="rod"]')
    page.click('[data-equip="willow"]')
    page.click('[data-open="bag"]')
    page.click('[data-tab="bait"]')
    assert page.locator('[data-equip="star"]').is_disabled()
    page.click('[data-equip="grain"]')
    page.mouse.move(55,55)
    page.screenshot(path=out/'19-lakeside-hud.png')
    page.set_viewport_size({'width':390,'height':844})
    cdp=page.context.new_cdp_session(page)
    def touch(event,points):
        cdp.send('Input.dispatchTouchEvent',{'type':event,'touchPoints':[dict(x=x,y=y) for x,y in points]})
    page.tap('#minimap')
    field=page.locator('.atlas-field')
    for kind,name,x,y in [('chest','宝箱',35,65),('fish','鱼',95,240),('monster','怪物',285,95)]:
        field.tap(position={'x':x,'y':y})
        page.get_by_role('button',name=name,exact=True).tap()
        assert page.locator(f'[data-marker="{kind}"]').is_visible()
    page.tap('[data-location="snow"]')
    assert page.get_by_role('button',name='传送',exact=True).is_disabled()
    page.keyboard.press('Escape')
    assert page.locator('#panel').is_visible() and page.locator('#placeBubble').is_hidden()
    page.tap('[data-location="snow"]')
    page.screenshot(path=out/'23-mobile-map.png')
    page.tap('[data-marker="fish"]')
    page.get_by_label('标记备注').fill('黄昏再来 <鱼>')
    marks=page.evaluate('window.__HUAYUE__.getState().markers')
    page.reload()
    page.wait_for_function('window.__HUAYUE__?.ready')
    page.tap('#minimap')
    assert page.evaluate('window.__HUAYUE__.getState().markers')==marks
    assert page.locator('.atlas-marker').count()==3
    page.tap('[data-marker="fish"]')
    assert page.get_by_label('标记备注').input_value()=='黄昏再来 <鱼>'
    page.get_by_role('button',name='移除标记').tap()
    assert page.locator('.atlas-marker').count()==2
    page.tap('[data-location="falls"]')
    assert page.get_by_role('button',name='传送',exact=True).is_enabled()
    page.tap('#closePanel')
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
    page.wait_for_function("window.__HUAYUE__.getPhase()==='wait'")
    assert page.locator('[data-open="bait"]').is_disabled()
    page.tap('#castBtn')
    page.tap('[data-open="bait"]')
    page.tap('[data-equip="grain"]')
    page.tap('#castBtn')
    page.wait_for_function("window.__HUAYUE__.getPhase()==='bite'")
    assert page.locator('#castLabel').inner_text()=='鱼上钩了 · 收线'
    assert not errors,errors
    result={'checks':['dial tap and hold','idle fade and wake','automatic dawn and spring rollover','direct keyboard departure','menu pauses sailing','return to dock','gear selection','four north-up bearings and positions','cached maps and shore marker','persistent minimap during idle','touch joystick drag and release','casting after sailing','first visit locks teleport','three persistent hand-drawn markers','marker removal and unlocked revisit'],'consoleErrors':errors}
    (out/'sailing-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False))
    browser.close()
