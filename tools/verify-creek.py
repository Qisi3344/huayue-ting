"""Drive the curved reach using the normal keyboard controls."""
import os
from pathlib import Path
from creek_drive import OUTBOUND, ROW_TO
from playwright.sync_api import sync_playwright

out = Path(__file__).resolve().parents[1] / 'verification'
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=str(Path(os.environ['LOCALAPPDATA']) / 'Google/Chrome/Application/chrome.exe'),
                                 args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    page = browser.new_page(viewport={'width':960, 'height':600})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)
    page.goto(os.environ.get('HUAYUE_URL','http://127.0.0.1:4173/'))
    page.wait_for_function('window.__HUAYUE__?.ready')
    page.screenshot(path=out/'25-bay-departure.png')

    def row_to(x,z):
        page.evaluate(ROW_TO,[x,z])

    for x,z in OUTBOUND:
        row_to(x,z)
        if x==27: page.screenshot(path=out/'26-creek-bend.png')
    assert page.evaluate("window.__HUAYUE__.getState().location==='sakura'")
    assert page.locator('#waypoint').is_hidden()
    page.click('#castBtn')
    page.wait_for_function("window.__HUAYUE__.getPhase()==='wait'")
    page.click('#castBtn')
    assert page.evaluate("window.__HUAYUE__.getPhase()==='idle'")
    for x,z in [(27,3),(23,9),(20,12.3),(15,8),(9,3),(.25,1.6)]:
        row_to(x,z)
    assert page.evaluate("window.__HUAYUE__.getState().location==='reed' && window.__HUAYUE__.getNavigation().nearDock")
    assert not errors,errors
    print('Free sailing from reeds through arch to fishing pool and back passed.')
    browser.close()
