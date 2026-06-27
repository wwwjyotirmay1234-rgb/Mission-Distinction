# Heart GLB Model

Place your heart anatomy GLB file here as:
  heart.glb

## Where to get it (free, 5 minutes):

### Option A — Fab.com / Sketchfab (recommended, highest quality)
1. Go to: https://fab.com/listings/heart-anatomy
   OR search: https://sketchfab.com/search?q=human+heart+anatomy&downloadable=true&sort_by=-likeCount
2. Filter: Free + Downloadable
3. Download as GLB
4. Rename to heart.glb and place here

### Option B — Anatomy by BodyParts3D (open license)
1. Go to: https://lifesciencedb.jp/bp3d/
2. Download heart OBJ files
3. Import into Blender → Export as GLB

### Option C — NIH 3D Print Exchange
1. Go to: https://3d.nih.gov/
2. Search "heart anatomy"
3. Download GLB/GLTF if available

## Required mesh naming for auto-classification:
The code auto-detects layer by mesh name. Ideal mesh names:
- right_atrium, left_atrium, right_ventricle, left_ventricle → organ layer
- coronary_artery, LAD, RCA, aorta, pulmonary_trunk, vena_cava → vessel layer
- cardiac_nerve, vagus_nerve → nerve layer

Any name works — the code classifies by keyword matching.

## File size recommendation:
- Raw GLB: up to ~50MB is fine
- Optimized (Draco compressed): ~3-10MB ideal
- Optimize at: https://gltf.report (drag & drop, click Optimize)
