# phoneLab — iPhone Designer

A colorful, browser-based 3D phone concept configurator built with HTML, CSS, JavaScript, and [Three.js](https://threejs.org/). Made to be hosted on GitHub Pages.

## Features

- Interactive 3D phone preview with pointer-drag rotation and scroll zoom
- Front and back view controls
- Model-specific body proportions and published height/width/depth dimensions for each listed preset
- Generation-specific front details, camera island shapes/layouts, and side-control placement
- Color swatches and a custom color picker
- Matte, glossy, and metal finishes
- Optional clear case and star sticker
- Save, load, and delete designs using browser local storage
- Export the 3D preview as a PNG
- Responsive layout for desktop and mobile screens

## Automated browser checks

Every push to `main` deploys the site to GitHub Pages and then runs Chromium smoke tests against the deployed URL. The tests check that the 3D canvas starts, model selection updates the preview, front/back controls work, accessories and saving work, and PNG export creates a download.

- Workflow: https://github.com/LiteEmpire/iphone-designer/actions
- The automated tests are useful regression checks; they do not replace visual inspection on real devices and browsers.

## Real 3D model assets

The current phone shapes are procedural approximations, not manufacturer CAD replicas. The project has an asset intake checklist in [assets/models/README.md](assets/models/README.md). A model-specific GLB must be obtained, its license and attribution verified, and its scale/geometry inspected before it can replace the approximation.

## Publish with GitHub Pages

1. Push the project files to the root of your GitHub repository.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Choose branch **main** and folder **/(root)**, then click **Save**.
5. Wait for deployment and open the URL shown in the Pages section. For a repository named `iphone-designer`, it will usually be `https://YOUR-USERNAME.github.io/iphone-designer/`.

## Run locally

Open `index.html` with a local static web server (recommended for ES modules), such as the VS Code Live Server extension. An internet connection is needed for the Three.js CDN and Google Fonts.

To run the browser tests locally, install Node.js, run `npm install`, then `npx playwright install chromium` and `npm run test:smoke`. Set `BASE_URL` to a deployed URL if you want to test the hosted version.

## Notes

- The procedural geometry uses model-specific dimensions and visual layouts informed by Apple's published comparison/specification pages. It is still an approximation, not an exact manufacturer CAD mesh; tiny details, exact curvature, materials, and camera dimensions may differ.
- Designs are saved only in the current browser on the current device. There is no account or cloud sync.
- PNG export captures the 3D canvas.
- This is an independent fan-made concept. It is not affiliated with, endorsed by, or sponsored by Apple. iPhone is a trademark of Apple Inc.
