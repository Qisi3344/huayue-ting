from pathlib import Path
import json,re,struct
root=Path(__file__).resolve().parents[1]
assets=root/'assets'
pattern=re.compile(rb'C:[/\\]+Users[/\\]+5',re.I)
report=[]
for p in assets.iterdir():
    if p.is_file():report.append({'file':p.name,'bytes':p.stat().st_size,'localPathMatches':len(pattern.findall(p.read_bytes()))})
assert not any(item['localPathMatches'] for item in report), 'Asset metadata includes a local author path'
data=(assets/'wolf-girl.glb').read_bytes()
length,kind=struct.unpack_from('<II',data,12)
doc=json.loads(data[20:20+length])
assert kind==0x4E4F534A
names={node.get('name') for node in doc['nodes']}
for name in ['WolfGirl_Root','Head_Pivot','Tail_Pivot','Iris_L','Iris_R','Muzzle','Fluffy_Tail']:assert name in names,name
result={'assets':report,'glb':{'nodes':len(doc['nodes']),'meshes':len(doc['meshes']),'materials':len(doc['materials']),'triangles':sum(doc['accessors'][pr['indices']]['count']//3 for m in doc['meshes'] for pr in m['primitives']),'externalUris':[b.get('uri') for b in doc['buffers'] if b.get('uri')]}}
(root/'verification/model-integrity.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
