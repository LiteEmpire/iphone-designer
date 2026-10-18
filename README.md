# Nova Studio — Horizon Designer

A browser-based concept editor for designing **Nova Horizon**, the first fictional smartphone from Nova. Built with HTML, CSS, and vanilla JavaScript, and designed for GitHub Pages.

## Features

- Add separate phone components: body, display, camera module, individual lenses, flash, Nova logo, side buttons, and custom details.
- Select and drag components around the canvas with a mouse or touch pointer.
- Rotate, move, resize, recolor, rename, duplicate, delete, and reorder each selected component.
- Enter exact X/Y positions and width/height values.
- Use a colour picker, hex input, and quick colour swatches.
- Toggle the canvas grid and switch between front/rear concept views.
- Save multiple concepts in browser local storage and reopen or delete them.
- Export the current design as an SVG file.
- Responsive layout for desktop, tablet, and mobile screens.

## Run locally

Open `index.html` in a modern browser, or use a local static server. No build step or API key is required.

## Publish with GitHub Pages

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch** if the repository is configured for branch deployment, or keep the existing GitHub Actions workflow if it deploys the static site.
3. For branch deployment, choose `main` and `/(root)`, then save.
4. Open the Pages URL shown by GitHub after deployment completes.

## Notes

- This is a fictional design playground, not a manufacturing CAD tool.
- Saved concepts stay in the current browser and are not synced across devices.
- Exported SVG files preserve the editable vector shapes.
