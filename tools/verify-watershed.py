"""Visit the four new harbors by water, fish, and sail the return inlet."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from creek_drive import OUTBOUND, ROW_TO

root=Path(__file__).resolve().parents[1]
url=os.environ.get("HUAYUE_URL","http://127.0.0.1:4173/")
legs={
    "sakura":[*OUTBOUND,(36,1.6)],
    "falls":[(42,5),(45,12),(46,19),(50,26.85)],
    "snow":[(48,33),(41,40),(31.86,49.47)],
    "tide":[(24,48),(16,44),(8,46),(-.07,42.1)],
    "moon":[(2,35),(9,29),(19.93,21.03)],
    "reed":[(12,22),(6,16.8),(4.4,8.6),(.25,1.6)],
}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=str(Path(os.environ["LOCALAPPDATA"])/"Google/Chrome/Application/chrome.exe"),args=["--use-angle="+os.environ.get("HUAYUE_ANGLE","swiftshader"),"--enable-unsafe-swiftshader"])
    page=browser.new_page(viewport={"width":800,"height":500})
    errors=[]
    page.on("pageerror",lambda e:errors.append(str(e)))
    page.on("console",lambda m:errors.append(m.text) if m.type=="error" else None)
    page.goto(url)
    page.wait_for_function("window.__HUAYUE__?.ready")
    for name,points in legs.items():
        for point in points: page.evaluate(ROW_TO,point)
        assert page.evaluate("window.__HUAYUE__.getState().location")==name
        assert page.evaluate("window.__HUAYUE__.getNavigation().nearDock")
        assert page.locator("#waypoint").is_hidden()
        if name in ("falls","snow","tide","moon"):
            page.click("#castBtn")
            page.wait_for_function("window.__HUAYUE__.getPhase()==='wait'")
            page.click("#castBtn")
            if name!="moon":
                page.click("#boatBtn")
                assert not page.evaluate("window.__HUAYUE__.getState().boat")
                page.click("#boatBtn")
            page.locator("#dial").press("ArrowDown")
            hour={"falls":"dusk","snow":"day","tide":"dusk","moon":"night"}[name]
            page.locator(f'#panel [data-time="{hour}"]').click()
            page.locator("#closePanel").click()
            page.reload()
            page.wait_for_function("window.__HUAYUE__?.ready")
            assert page.evaluate("window.__HUAYUE__.getState().location")==name
            page.wait_for_timeout(3700)
            page.screenshot(path=root/"verification"/("reach-"+name+".png"))
        print("Arrived by boat:",name,flush=True)
    assert len(page.evaluate("window.__HUAYUE__.getState().visited"))==6
    page.set_viewport_size({"width":390,"height":844})
    page.click("#minimap")
    page.locator('[data-location="moon"]').click()
    page.get_by_role("button",name="传送",exact=True).click()
    page.wait_for_timeout(3700)
    assert page.locator("#boatBtn").is_hidden()
    assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
    page.screenshot(path=root/"verification"/"reach-moon-portrait.png")
    assert not errors,errors
    browser.close()
