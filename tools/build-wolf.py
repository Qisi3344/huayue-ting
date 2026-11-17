"""Generate the original editable wolf-girl blockout in a fresh Blender.
Run: blender --background --factory-startup --python tools/build-wolf.py
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets';OUT.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.use_stamp_filename=False
scene.world.color=(.32,.39,.33)
scene.view_settings.view_transform='Standard'
try:scene.view_settings.look='Medium High Contrast'
except:pass

def linear(c):
    v=int(c.lstrip('#'),16);a=[(v>>16)&255,(v>>8)&255,v&255]
    return tuple((x/255/12.92 if x/255<=.04045 else ((x/255+.055)/1.055)**2.4) for x in a)

def material(name,color,glow=False):
    m=bpy.data.materials.new(name);m.diffuse_color=(*linear(color),1);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=m.diffuse_color;bs.inputs['Roughness'].default_value=.92
    if glow:bs.inputs['Emission Color'].default_value=m.diffuse_color;bs.inputs['Emission Strength'].default_value=.5
    return m
M={k:material(k,c,k in ['Eye_Glint']) for k,c in {'Fur_Grey':'#939fa8','Fur_Shadow':'#788795','Muzzle_Cream':'#ebe8dd','Inner_Ear':'#c5a4b6','Cloak_Sage':'#7b9d87','Cloak_Lining':'#bdccac','Violet_Iris':'#9368c1','Deep_Pupil':'#343249','Eye_Glint':'#fffbea','Satchel_Tan':'#b9946b','Brass_Button':'#c8b17c','Blush':'#d5adb3'}.items()}

def empty(name,parent=None,position=(0,0,0)):
    o=bpy.data.objects.new(name,None);scene.collection.objects.link(o);o.empty_display_type='PLAIN_AXES';o.parent=parent;o.location=(position[0],-position[2],position[1]);return o
root=empty('WolfGirl_Root')
head=empty('Head_Pivot',root,(0,1.64,.03));tail=empty('Tail_Pivot',root,(.28,.38,-.28))

def ellipsoid(name,pos,scale,mat,parent=root):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,radius=1)
    o=bpy.context.object;o.name=name;o.parent=parent;o.location=(pos[0],-pos[2],pos[1]);o.scale=(scale[0],scale[2],scale[1]);o.data.materials.append(M[mat]);
    for p in o.data.polygons:p.use_smooth=True
    return o

def solid(name,vertices,faces,mat,parent=root):
    data=bpy.data.meshes.new(name+'_Mesh');data.from_pydata([(x,-z,y) for x,y,z in vertices],[],faces);data.update();o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.parent=parent;data.materials.append(M[mat]);return o

def curve(name,points,r,mat,parent=root):
    data=bpy.data.curves.new(name+'_Curve','CURVE');data.dimensions='3D';data.bevel_depth=r;data.bevel_resolution=3;s=data.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
    for p,(x,y,z) in zip(s.bezier_points,points):p.co=(x,-z,y);p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.parent=parent;data.materials.append(M[mat]);return o

ellipsoid('Body_Seated',(0,.69,0),(.43,.57,.34),'Cloak_Sage')
# A flared, scalloped cloak silhouette with a narrow shoulder opening.
verts=[];count=32
for row,(height,rx,rz) in enumerate([(1.2,.29,.24),(.99,.46,.37),(.35,.61,.46)]):
    for i in range(count):
        a=i*2*math.pi/count;verts.append((math.cos(a)*rx,height+(.035*math.sin(a*5) if row==2 else 0),math.sin(a)*rz-.045))
faces=[]
for row in range(2):
    for i in range(count):j=(i+1)%count;faces.append((row*count+i,row*count+j,(row+1)*count+j,(row+1)*count+i))
cloak=solid('Travel_Cloak',verts,faces,'Cloak_Sage')
mod=cloak.modifiers.new('Cloth_Thickness','SOLIDIFY');mod.thickness=.025
bevel=cloak.modifiers.new('Soft_Hem','BEVEL');bevel.width=.025;bevel.segments=2
for side,label in [(-1,'L'),(1,'R')]:
    ellipsoid('Paw_Foot_'+label,(side*.27,.13,.36),(.18,.16,.3),'Fur_Shadow')
    ellipsoid('Sleeve_'+label,(side*.43,.78,.2),(.19,.3,.18),'Cloak_Sage')
    ellipsoid('Paw_Hand_'+label,(side*.45,.72 if side<0 else .88,.38),(.17,.18,.17),'Fur_Grey')
ellipsoid('Head_Base',(0,0,0),(.66,.59,.52),'Fur_Grey',head)
for side,label in [(-1,'L'),(1,'R')]:
    # Tapered ears with actual front and back surfaces, facing camera.
    cx=side*.43
    earVerts=[(cx-side*.25,.36,-.04),(cx+side*.24,.38,-.04),(cx+side*.12,1.04,-.06),(cx-side*.19,.39,.15),(cx+side*.2,.42,.15),(cx+side*.11,.99,.12)]
    solid('Ear_'+label,earVerts,[(0,2,1),(3,4,5),(0,1,4,3),(1,2,5,4),(2,0,3,5)],'Fur_Grey',head)
    solid('Ear_Inner_'+label,[(cx-side*.12,.48,.158),(cx+side*.13,.49,.158),(cx+side*.1,.88,.143)],[(0,1,2)],'Inner_Ear',head)
    ellipsoid('Cheek_'+label,(side*.46,-.18,.23),(.29,.24,.28),'Muzzle_Cream',head)
    for k in range(2):
        cx2=side*(.54+k*.02);cy=-.09-k*.13
        solid('Cheek_Tuft_'+label+str(k),[(cx2,cy+.1,.1),(cx2+side*.23,cy-.05,.09),(cx2,cy-.14,.21),(cx2,cy-.06,-.04)],[(0,1,2),(0,3,1),(1,3,2),(2,3,0)],'Fur_Grey',head)
    eye=side*.265
    ellipsoid('Eye_White_'+label,(eye,.025,.463),(.201,.219,.074),'Muzzle_Cream',head)
    ellipsoid('Iris_'+label,(eye,.032,.533),(.135,.162,.032),'Violet_Iris',head)
    ellipsoid('Pupil_'+label,(eye,.039,.558),(.067,.111,.02),'Deep_Pupil',head)
    ellipsoid('Eye_Glint_'+label,(eye-.035,.098,.576),(.035,.038,.012),'Eye_Glint',head)
    ellipsoid('Eye_Glint_Small_'+label,(eye+.043,-.025,.576),(.016,.02,.008),'Eye_Glint',head)
    curve('Lash_'+label,[(side*.41,.08,.521),(side*.46,.13,.5),(side*.49,.16,.47)],.014,'Deep_Pupil',head)
    curve('Brow_'+label,[(side*.1,.256,.441),(side*.26,.28,.447),(side*.4,.25,.409)],.024,'Fur_Shadow',head)
    ellipsoid('Blush_'+label,(side*.47,-.195,.472),(.085,.026,.01),'Blush',head)
ellipsoid('Muzzle',(0,-.225,.48),(.3,.192,.235),'Muzzle_Cream',head)
ellipsoid('Nose',(0,-.105,.699),(.094,.065,.063),'Deep_Pupil',head)
curve('Smile',[(-.105,-.285,.681),(0,-.318,.702),(.105,-.285,.681)],.011,'Deep_Pupil',head)
for i in range(3):
    x=-.21+i*.18
    solid('Forehead_Fluff_'+str(i),[(x-.13,.43,.18),(x+.13,.44,.17),(x+.06,.68-(i%2)*.04,.2),(x,.43,-.04)],[(0,1,2),(0,3,1),(1,3,2),(2,3,0)],'Fur_Grey',head)
# Curved tapered tail with a cream tip rather than disconnected balls.
centers=[(0,0,0,.19),(.28,.1,-.27,.27),(.48,.22,-.56,.32),(.55,.34,-.85,.28),(.52,.43,-1.12,.15),(.46,.48,-1.3,.025)]
tv=[];segments=14
for x,y,z,r in centers:
    for i in range(segments):a=i*2*math.pi/segments;tv.append((x+math.cos(a)*r,y+math.sin(a)*r,z))
tf=[]
for j in range(len(centers)-1):
    for i in range(segments):tf.append((j*segments+i,j*segments+(i+1)%segments,(j+1)*segments+(i+1)%segments,(j+1)*segments+i))
tailmesh=solid('Fluffy_Tail',tv,tf,'Fur_Grey',tail);tailmesh.data.materials.append(M['Muzzle_Cream'])
for p in tailmesh.data.polygons:p.use_smooth=True;p.material_index=1 if p.index>=segments*3 else 0
curve('Satchel_Strap',[(-.29,1.18,.3),(.03,.86,.39),(.41,.43,.36)],.024,'Satchel_Tan')
ellipsoid('Satchel',(.48,.42,.17),(.21,.19,.14),'Satchel_Tan')
ellipsoid('Satchel_Flap',(.48,.49,.29),(.21,.1,.035),'Brass_Button')
ellipsoid('Cloak_Button',(0,1.14,.37),(.06,.06,.035),'Brass_Button')
# Export the clean character only, with standard portable materials.
bpy.ops.object.select_all(action='DESELECT')
for o in list(scene.objects):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'wolf-girl.glb'),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False,export_extras=False)
# Named pose pivots remain editable and get a small idle cycle in the .blend.
scene.frame_start=1;scene.frame_end=80
for frame,angle in [(1,0),(20,.035),(40,0),(60,-.035),(80,0)]:
    head.rotation_euler.y=angle;head.keyframe_insert('rotation_euler',frame=frame)
    tail.rotation_euler.z=angle*2.5;tail.keyframe_insert('rotation_euler',frame=frame)
scene.frame_set(1)
# A soft studio environment for inspecting the editable blockout.
floorMat=material('Studio_Sage','#dce4cc')
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.045));floor=bpy.context.object;floor.name='Studio_Ground';floor.data.materials.append(floorMat)
for name,location,power,size in [('Key',(-3,-4,7),500,4),('Fill',(4,-2,4),260,5),('Rim',(1,4,5),450,3)]:
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.location=location;o.rotation_euler=(Vector((0,0,1.4))-o.location).to_track_quat('-Z','Y').to_euler()
camData=bpy.data.cameras.new('Character_Camera');cam=bpy.data.objects.new('Character_Camera',camData);scene.collection.objects.link(cam);cam.location=(4,-8,4);cam.rotation_euler=(Vector((0,0,1.35))-cam.location).to_track_quat('-Z','Y').to_euler();camData.type='ORTHO';camData.ortho_scale=4.6;scene.camera=cam
# Keep the asset self-contained; no files from other Blender scenes are loaded.
scene['asset_note']='Original editable wolf girl blockout; GLB materials are Toon-converted by the game. Not production rigged.'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'wolf-girl.blend'))
scene.render.filepath=str(OUT/'wolf-girl-preview.png');bpy.ops.render.render(write_still=True)
report={'blend':'wolf-girl.blend','glb':'wolf-girl.glb','preview':'wolf-girl-preview.png','meshObjects':sum(o.type=='MESH' for o in scene.objects),'materials':list(M),'blenderVersion':bpy.app.version_string,'rig':'named head/tail pivots, idle keyframes in blend; no weighted skin','authorship':'original procedural blockout'}
(OUT/'model-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False))
