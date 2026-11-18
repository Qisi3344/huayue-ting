"""Build the mobile presentation mesh from the full Wolf GLB in a clean Blender process."""
from pathlib import Path
import bpy

assets = Path(__file__).resolve().parents[1] / 'assets'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(assets / 'wolf-girl.glb'))
for pivot in ('Head_Pivot', 'Tail_Pivot', 'WolfGirl_Root'):
    parts = [obj for obj in bpy.data.objects[pivot].children if obj.type == 'MESH']
    for obj in parts:
        bpy.context.view_layer.objects.active = obj
        if len(obj.data.polygons) > 80:
            modifier = obj.modifiers.new('Mobile silhouette', 'DECIMATE')
            modifier.ratio = .42
            bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in parts:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    if len(parts)>1:
        bpy.ops.object.join()
    bpy.context.view_layer.objects.active.name = pivot + '_Surface'
bpy.ops.export_scene.gltf(filepath=str(assets/'wolf-girl-mobile.glb'),export_format='GLB',
                          export_animations=False,export_cameras=False,export_lights=False)
