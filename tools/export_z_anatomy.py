"""
Z-Anatomy GLB Bulk Exporter
Run with: blender --background --python export_z_anatomy.py

Drop this script in the same folder as Startup.blend, then run:
  blender --background Startup.blend --python export_z_anatomy.py

Outputs: ./glb_exports/<collection>/<object_name>.glb
"""

import bpy
import os
import sys

BLEND_FILE = "Startup.blend"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "glb_exports")

def deselect_all():
    bpy.ops.object.select_all(action='DESELECT')

def export_object_as_glb(obj, out_path):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    deselect_all()
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        use_selection=True,
        export_format='GLB',
        export_apply=True,        # apply modifiers
        export_materials='EXPORT',
        export_colors=True,
        export_normals=True,
        export_draco_mesh_compression_enable=False,
    )
    obj.select_set(False)

def safe_name(name):
    return "".join(c if c.isalnum() or c in "-_" else "_" for c in name)

def main():
    print(f"\n=== Z-Anatomy GLB Exporter ===")
    print(f"Output → {OUTPUT_DIR}\n")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Get all mesh objects
    mesh_objects = [o for o in bpy.data.objects if o.type == 'MESH']
    print(f"Found {len(mesh_objects)} mesh objects")

    exported = 0
    failed = 0

    for obj in mesh_objects:
        # Determine collection folder
        collection = obj.users_collection[0].name if obj.users_collection else "Uncategorized"
        folder = os.path.join(OUTPUT_DIR, safe_name(collection))
        filename = safe_name(obj.name) + ".glb"
        out_path = os.path.join(folder, filename)

        # Skip if already exported
        if os.path.exists(out_path):
            print(f"  SKIP (exists): {collection}/{filename}")
            continue

        try:
            export_object_as_glb(obj, out_path)
            size_kb = os.path.getsize(out_path) // 1024
            print(f"  OK ({size_kb}KB): {collection}/{filename}")
            exported += 1
        except Exception as e:
            print(f"  FAIL: {obj.name} — {e}")
            failed += 1

    print(f"\n=== Done: {exported} exported, {failed} failed ===")
    print(f"GLB files saved to: {OUTPUT_DIR}")

main()
