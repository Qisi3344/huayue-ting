"""Capture the sailing and casting compositions through the normal map and rod controls."""
import os
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
from playwright.sync_api import sync_playwright

out=Path(__file__).resolve().parents[1]/'verification'
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=str(Path(os.environ['LOCALAPPDATA'])/'Google/Chrome/Application/chrome.exe'),
                               args=['--use-angle='+os.environ.get('HUAYUE_ANGLE','swiftshader'),'--enable-unsafe-swiftshader'])
    page=browser.new_page(viewport={'width':960,'height':600})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    page.goto(os.environ.get('HUAYUE_URL','http://127.0.0.1:4173/'))
    page.wait_for_function('window.__HUAYUE__?.ready')
    for site,hour in [('falls','dusk'),('snow','day'),('tide','dusk'),('moon','night')]:
        page.locator('#dial').press('ArrowDown')
        page.locator(f'#panel [data-time="{hour}"]').click()
        page.click('#closePanel')
        page.click('#minimap')
        page.locator(f'[data-location="{site}"]').click()
        page.get_by_role('button',name='搭渡船',exact=True).click()
        page.wait_for_timeout(4150)
        assert page.evaluate('window.__HUAYUE__.getState().location')==site
        page.screenshot(path=out/f'reach-{site}.png')
        if site=='moon':
            page.set_viewport_size({'width':390,'height':844})
            page.wait_for_timeout(350)
            page.screenshot(path=out/'reach-moon-portrait.png')
        page.click('#castBtn')
        page.wait_for_function("window.__HUAYUE__.getPhase()==='wait'")
        page.wait_for_timeout(400)
        if site in ('snow','moon'):page.screenshot(path=out/f'cast-{site}.png')
        page.locator('#castBtn').press('Space')
        assert page.evaluate("window.__HUAYUE__.getPhase()==='idle'")
        if site=='snow':
            page.click('#boatBtn')
            assert not page.evaluate('window.__HUAYUE__.getState().boat')
            page.click('#castBtn')
            page.wait_for_function("window.__HUAYUE__.getPhase()==='wait'")
            page.locator('#castBtn').press('Space')
            page.click('#boatBtn')
    assert not errors,errors
    browser.close()
    print('Four waters, waiting and retrieving, and portrait view passed.')

sheet=Image.new('RGB',(1120,766),(239,236,222))
draw=ImageDraw.Draw(sheet)
font=ImageFont.truetype(str(Path(os.environ['WINDIR'])/'Fonts/msyh.ttc'),21)
for i,(site,label) in enumerate([('falls','萤瀑林'),('snow','霜镜湖'),('tide','琥珀潮汐'),('moon','月心浮岛')]):
    x,y=(i%2)*560,(i//2)*383
    with Image.open(out/f'reach-{site}.png') as frame:
        sheet.paste(frame.convert('RGB').resize((560,350),Image.Resampling.LANCZOS),(x,y))
    draw.text((x+14,y+352),label,font=font,fill=(65,75,63))
sheet.save(out/'four-waters.jpg',quality=88,optimize=True)
