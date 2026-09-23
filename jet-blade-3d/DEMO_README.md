# Run Jet Blade 3D

No training, GPU, installation, or external JavaScript service is needed. The viewer uses WebGL and the saved public synthetic results included here.

From this repository:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Open **http://127.0.0.1:8080/**. Stop the server with Ctrl+C. Use an HTTP server rather than double-clicking `index.html`, because browsers restrict local JSON fetches.

## Presentation

The homepage now tells the wider research story in the style of the Main Jet proposal page. Six slides have tab, previous/next, arrow-key and fullscreen controls. The hero slider compares actual healthy and estimated meshes from the same camera. Chapters distinguish earlier localization, earlier learned displacement models, and the latest fitting diagnostic. The final future inspection record is explicitly a concept.

[PROJECT_OVERVIEW.html](PROJECT_OVERVIEW.html) is a two-page printable summary. The 68-case interactive experiment appears after the completed-work chapter.

## Controls

- Choose a type, example, and estimation method. All 68 examples remain available.
- Drag the blade to rotate; scroll/pinch to zoom. The two mesh panels share a camera.
- Keyboard on a canvas: arrow keys rotate; + / − zoom; Home resets.
- Compare **Estimated shape**, **Healthy reference**, and **Known answer**. The known answer is evaluation-only synthetic truth.
- The slider interpolates from the healthy mesh to the saved estimate, with no deformation amplification. It is not a sequence of new predictions.
- Open **Inspect the mesh information and measured result** to see the fitted position, depths, errors and downloadable arrays.
- **Download estimated mesh (.obj)** exports the actual healthy vertices plus the saved prediction, with all triangles. Blade and artificial closure faces are labeled as separate groups. The export always uses the selected estimate, even while the known-answer panel is visible. It does not export the display animation or amplify the dent.
- **Play walkthrough** runs five captioned steps over 60 seconds. Next step and Stop are available; leaving the tab stops the tour.

If WebGL is unavailable, the input images and numerical results remain usable. The PDF provides static evidence.

## Files

`index.html`, `assets/style.css`, `assets/app.js`: interface and saved-result replay.

`assets/viewer.js`: dependency-free WebGL mesh display, using full mesh coordinates.

`assets/data` and `assets/images`: actual saved public scientific outputs and source information. About 34 MB total; only the selected fields and images are fetched for interaction.

`scripts/export_evidence.py`: reproducible export from the original accepted research workspace; this is not required to run the included demo and does not retrain a model. See [SOURCE_DATA.md](SOURCE_DATA.md).

## Publishing on GitHub Pages

Use the repository’s **main** branch and **/(root)** folder in Settings → Pages → Deploy from a branch. No build pipeline or package dependencies are required. `.nojekyll` preserves the static files directly.

The public site is **https://afeefaaazam03.github.io/MyPortfolio/jet-blade-3d/**. It is published as its own folder by the portfolio’s existing static Pages workflow.
