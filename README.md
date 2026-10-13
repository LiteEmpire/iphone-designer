# phoneLab — iPhone Designer

A colorful, browser-based 3D phone concept configurator built with HTML, CSS, JavaScript, and [Three.js](https://threejs.org/). Made to be hosted on GitHub Pages.

## Features

- Interactive 3D phone preview with pointer-drag rotation and scroll zoom
- Front and back view controls
- Multiple iPhone-inspired model presets, from older generations to newer ones
- Color swatches and a custom color picker
- Matte, glossy, and metal finishes
- Optional clear case and star sticker
- Save, load, and delete designs using browser local storage
- Export the 3D preview as a PNG
- Responsive layout for desktop and mobile screens

## Publish with GitHub Pages

1. Push the project files to the root of your GitHub repository.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Choose branch **main** and folder **/(root)**, then click **Save**.
5. Wait for deployment and open the URL shown in the Pages section. For a repository named `iphone-designer`, it will usually be `https://YOUR-USERNAME.github.io/iphone-designer/`.

## Run locally

Open `index.html` with a local static web server (recommended for ES modules), such as the VS Code Live Server extension. An internet connection is needed for the Three.js CDN and Google Fonts.

## Notes

- The device geometry is a procedural concept model. Model names select size/camera presets; they are not exact official CAD replicas.
- Designs are saved only in the current browser on the current device. There is no account or cloud sync.
- PNG export captures the 3D canvas.
- This is an independent fan-made concept and is not affiliated with, endorsed by, or sponsored by Apple. iPhone is a trademark of Apple Inc.
