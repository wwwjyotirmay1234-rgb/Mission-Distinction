@echo off
title Z-Anatomy 3D Model Exporter
echo.
echo ============================================
echo   Z-Anatomy 3D Model Exporter
echo ============================================
echo.

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
    pause
    exit /b
)

echo Found Blender: %BLENDER%
echo.

REM Check for Startup.blend
if not exist "%~dp0Startup.blend" (
    echo ERROR: Startup.blend not found!
    echo.
    echo Please put Startup.blend in the same folder as this file.
    echo.
    pause
    exit /b
)

echo Starting export... this will take 10-30 minutes.
echo A 'glb_exports' folder will appear when done.
echo Do NOT close this window.
echo.

"%BLENDER%" --background "%~dp0Startup.blend" --python "%~dp0export_z_anatomy.py"

echo.
echo ============================================
echo   DONE! Check the 'glb_exports' folder.
echo   Zip it and upload to Replit.
echo ============================================
echo.
pause
