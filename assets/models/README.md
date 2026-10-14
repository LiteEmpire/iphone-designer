# Real 3D model assets

This folder is reserved for optimized, model-specific **GLB** meshes loaded by the Three.js viewer.

## First candidate: iPhone 15 Pro

A community model page lists an iPhone 15 Pro mesh as downloadable under Creative Commons Attribution (CC BY):

- Model page: https://sketchfab.com/3d-models/iphone-15-pro-9e045e469d514fea9dda2ccd161f5fa3
- Creator shown on the page: Sketcher (@jnanbr07)
- Listed license: Creative Commons Attribution

Before adding it, verify the current license and download terms on the model page. Keep the creator attribution and license notice with the asset. Do not assume the model is manufacturer CAD or dimensionally exact just because it looks detailed.

## Required handoff

1. Download the model from its source page.
2. Export or convert it to a self-contained `.glb` file if the source provides another format.
3. Name the file `iphone-15-pro.glb` and place it in this folder.
4. Include the source URL, creator, license name, and any required attribution in the project's asset credits.
5. Keep the model's geometry and materials intact for the first integration pass; do not strip textures or rename parts until its scene hierarchy has been inspected.

## Acceptance checks before calling it accurate

- Verify the creator's license allows the intended use and redistribution in this public repository.
- Check dimensions against Apple's published iPhone 15 Pro specifications: 146.6 × 70.6 × 8.25 mm.
- Inspect front, back, all four sides, camera rings, LiDAR/flash, buttons, mute/action switch, USB-C opening, speaker/microphone holes, screen, and corner radii.
- Check model origin, orientation, scale, material names, embedded textures, and polygon count.
- Compare against multiple reliable reference views. A good-looking model alone is not proof of manufacturing accuracy.

## Scope

The existing procedural preview remains the fallback until a downloaded asset is added and validated. No model file is included yet.
