@echo off
title Z-Anatomy 3D Model Exporter
echo.
echo ============================================
echo   Z-Anatomy 3D Model Exporter
echo ============================================
echo.

REM Write the Python script to a temp file
set PYFILE=%~dp0_export_temp.py
(
echo import bpy, os
echo OUTPUT_DIR = os.path.join^(os.path.dirname^(os.path.abspath^('__file__'^)^)^, 'glb_exports'^)
echo os.makedirs^(OUTPUT_DIR, exist_ok=True^)
echo def deselect_all^(^): bpy.ops.object.select_all^(action='DESELECT'^)
echo def safe_name^(n^): return "".join^(c if c.isalnum^(^) or c in '-_' else '_' for c in n^)
echo def export_obj^(obj, path^):
echo     os.makedirs^(os.path.dirname^(path^), exist_ok=True^)
echo     deselect_all^(^)
echo     obj.select_set^(True^)
echo     bpy.context.view_layer.objects.active = obj
echo     bpy.ops.export_scene.gltf^(filepath=path, use_selection=True, export_format='GLB', export_apply=True^)
echo     obj.select_set^(False^)
echo mesh_objects = [o for o in bpy.data.objects if o.type == 'MESH']
echo print^(f'Found {len^(mesh_objects^)} meshes'^)
echo exported = 0
echo for obj in mesh_objects:
echo     col = obj.users_collection[0].name if obj.users_collection else 'Uncategorized'
echo     path = os.path.join^(OUTPUT_DIR, safe_name^(col^), safe_name^(obj.name^) + '.glb'^)
echo     if os.path.exists^(path^): print^(f'  SKIP: {obj.name}'^); continue
echo     try:
echo         export_obj^(obj, path^)
echo         print^(f'  OK: {obj.name}'^)
echo         exported += 1
echo     except Exception as e: print^(f'  FAIL: {obj.name} - {e}'^)
echo print^(f'Done: {exported} exported. Files in glb_exports folder.'^)
) > "%PYFILE%"

REM Auto-find Blender
set BLENDER=
for /d %%i in ("C:\Program Files\Blender Foundation\Blender *") do set BLENDER=%%i\blender.exe
if not exist "%BLENDER%" (
    for /d %%i in ("C:\Program Files (x86)\Blender Foundation\Blender *") do set BLENDER=%%i\blender.exe
)

if not exist "%BLENDER%" (
    echo ERROR: Blender not found!
    echo.
    echo Please install Blender from: https://www.blender.org/download/
    echo Then run this file again.
    echo.
    del "%PYFILE%" 2>nul
    pause
    exit /b
)

echo Found Blender: %BLENDER%
echo.

if not exist "%~dp0Startup.blend" (
    echo ERROR: Startup.blend not found in same folder as this file!
    echo.
    echo Make sure Startup.blend is in: %~dp0
    echo.
    del "%PYFILE%" 2>nul
    pause
    exit /b
)

echo Starting export... this takes 10-30 minutes.
echo Do NOT close this window.
echo.

"%BLENDER%" --background "%~dp0Startup.blend" --python "%PYFILE%"

del "%PYFILE%" 2>nul

echo.
echo ============================================
echo   DONE! Zip the 'glb_exports' folder and
echo   upload it to the Replit chat.
echo ============================================
echo.
pause
