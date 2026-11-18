from pathlib import Path
import json,re,struct
root=Path(__file__).resolve().parents[1]
assets=root/'assets'
pattern=re.compile(rb'C:[/\\]+Users[/\\]+5',re.I)
report=[]
for p in assets.iterdir():
    if p.is_file():report.append({'file':p.name,'bytes':p.stat().st_size,'localPathMatches':len(pattern.findall(p.read_bytes()))})
assert not any(item['localPathMatches'] for item in report), 'Asset metadata includes a local author path'
def inspect(name,required):
    data=(assets/name).read_bytes()
    length,kind=struct.unpack_from('<II',data,12)
    doc=json.loads(data[20:20+length])
    assert kind==0x4E4F534A
    assert set(required)<={node.get('name') for node in doc['nodes']}
    primitives=[pr for mesh in doc['meshes'] for pr in mesh['primitives']]
    assert not any(b.get('uri') for b in doc['buffers'])
    return {'nodes':len(doc['nodes']),'meshes':len(doc['meshes']),'materials':len(doc['materials']),
            'primitives':len(primitives),'triangles':sum(doc['accessors'][pr['indices']]['count']//3 for pr in primitives),'externalUris':[]}

pivots=['WolfGirl_Root','Head_Pivot','Tail_Pivot']
full=inspect('wolf-girl.glb',pivots+['Iris_L','Iris_R','Muzzle','Fluffy_Tail'])
mobile=inspect('wolf-girl-mobile.glb',pivots)
assert mobile['triangles']<full['triangles']*.55 and mobile['primitives']<full['primitives']
result={'assets':report,'glb':full,'mobile':mobile}
(root/'verification/model-integrity.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
