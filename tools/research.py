import urllib.request, json, re, concurrent.futures
from pathlib import Path
from html import unescape
from html.parser import HTMLParser
root=Path(__file__).resolve().parents[1]/'research'
root.mkdir(exist_ok=True)
class Text(HTMLParser):
    def __init__(self):super().__init__();self.parts=[];self.skip=0
    def handle_starttag(self,t,a):
        if t in ['script','style']:self.skip+=1
    def handle_endtag(self,t):
        if t in ['script','style']:self.skip=max(0,self.skip-1)
        if t in ['p','div','h1','h2','br','li']:self.parts.append('\n')
    def handle_data(self,d):
        if not self.skip:self.parts.append(d)
refs=[('WEBFISHING','https://store.steampowered.com/api/appdetails?appids=3146520&l=english'),('DREDGE','https://www.dredge.game/'),('Moonglow Bay','https://moonglowbay.com/'),('Fishing Planet','https://fishingplanet.com/about/'),('Stardew Valley','https://www.stardewvalley.net/'),('Animal Crossing','https://animalcrossing.nintendo.com/new-horizons/')]
def fetch(item):
    name,url=item
    try:
        req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(req,timeout=28) as r:raw=r.read().decode('utf-8','replace');final=r.url
        if 'api/appdetails' in url:
            d=json.loads(raw)['3146520']['data'];raw=d.get('detailed_description','');title=d['name']
        else:
            match=re.search(r'<title[^>]*>(.*?)</title>',raw,re.S|re.I);title=unescape(match.group(1)) if match else name
        parser=Text();parser.feed(raw);text=unescape(''.join(parser.parts));text=re.sub('[ \t\r]+',' ',text);text=re.sub('\n\s*\n+','\n',text).strip()
        path=root/(re.sub('[^a-z]','-',name.lower())+'.txt');path.write_text(text,encoding='utf-8')
        return {'name':name,'title':title,'retrievalUrl':final,'text':text,'evidenceFile':path.name}
    except Exception as e:return {'name':name,'url':url,'error':str(e)}
results=list(concurrent.futures.ThreadPoolExecutor(max_workers=6).map(fetch,refs))
(root/'games.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
for r in results:
    print(json.dumps({**r,'text':r.get('text','')[:15000]},ensure_ascii=False))
