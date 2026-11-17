from pathlib import Path
import json,zipfile,re
root=Path(__file__).resolve().parents[1]
# Package project-relative artifacts only. Exclude author-side fetching and QA
# scripts that mention local toolchain locations; the playable game is portable.
files=[p for p in root.rglob('*') if p.is_file() and not any(part in {'.git','node_modules','__pycache__','.venv','.tools'} for part in p.relative_to(root).parts) and not (p.parent.name=='tools' and p.name in {'prepare.py','research.py','cite-evidence.py','package.py'}) and not (p.parent.name=='research' and p.name=='nilo-readme.txt')]
patterns={
 'windows_home':re.compile(r'C:[/\\]+Users[/\\]+5(?:[/\\]|\b)',re.I),
 'private_domain':re.compile(r'(?:[a-z0-9-]+\.)*(?:taildc412c\.ts\.net|ts\.net)\b',re.I),
 'private_machine':re.compile(r'desktop-rh89p0e',re.I),
 'credential':re.compile(r'(?:sk-[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|Authorization\s*[:=]\s*[\"\']?(?:Basic|Bearer)\s+[A-Za-z0-9+/=_-]{10,})',re.I),
}
leaks=[]
for p in files:
 if p.suffix.lower() in {'.png','.jpg','.zip','.webp'}:continue
 try:text=p.read_text(encoding='utf-8-sig')
 except UnicodeError:continue
 for name,pattern in patterns.items():
  if pattern.search(text):leaks.append({'file':str(p.relative_to(root)),'kind':name})
if leaks:raise RuntimeError(json.dumps(leaks,ensure_ascii=False))
report={'version':json.loads((root/'package.json').read_text(encoding='utf-8'))['version'],'includedFiles':len(files),'privacyScan':'passed','privatePathDomainAccountCredentialMatches':0,'runtime':'Node.js; run 启动花月汀.cmd or npm start','externalRuntimeDependencies':'none; Three.js vendored locally','notes':'Package contains concept game, design document, fish catalog, screenshots and source evidence. Local author QA scripts excluded.'}
report_file=root/'verification/package-report.json';report_file.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');files.append(report_file) if report_file not in files else None
out=root.parent/'花月汀-可玩概念原型.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=7) as z:
 for p in files:z.write(p,Path('花月汀')/p.relative_to(root))
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
 assert '花月汀/index.html' in z.namelist()
 assert '花月汀/src/scene.js' in z.namelist()
 assert '花月汀/vendor/three.module.js' in z.namelist()
 assert '花月汀/assets/wolf-girl.glb' in z.namelist()
 assert '花月汀/assets/wolf-girl.blend' in z.namelist()
 assert b'render_game_to_text' in z.read('花月汀/src/main.js')
 print(json.dumps({'zip':str(out),'entries':len(z.namelist()),'bytes':out.stat().st_size,'privacyMatches':0,'archiveIntegrity':'passed'},ensure_ascii=False,indent=2))
