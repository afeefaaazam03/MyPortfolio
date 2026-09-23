# Where these examples come from

The healthy shapes come from the publicly released [PLAID Rotor37 dataset](https://huggingface.co/datasets/PLAID-datasets/Rotor37), revision `bac06c0caa7254120eecc6711a5fb85c58dfbdbc`. The dataset is attributed to PLAID-datasets and the Rotor37 dataset contributors; its recorded data owner is Safran. This is the public, ungated simulation dataset, not confidential industrial inspection data. The recorded license is [Creative Commons Attribution–ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

The current interactive fitting experiment uses **two source blade shapes: samples 9 and 10**. Their public surface coordinates were normalized, with a labeled artificial closure collar added for the controlled geometry experiment. We introduced known synthetic dents, color changes, or both, then rendered photographs in Blender. These are **68 controlled synthetic inspection cases, not 68 real damaged blade scans**.

The images shown in the demo are the exact saved 512 × 512 input PNGs. Each case has two fitted input views: 60° and 120°. The fitting experiment also supplies healthy CAD, known cameras and lighting, three possible dent centers, and a restricted dent shape. Five additional rendered observations were withheld until predictions were frozen. The website shows saved experimental outputs and performs no new model inference.

The current fitting comparison is **not a learned neural model**. It estimates a dent coefficient and, for the joint method, a separate appearance coefficient. Each output mesh is the supplied healthy mesh plus the actual saved vertex-displacement field. The optional known-damage mesh is synthetic ground truth for evaluation; it was not supplied to the prediction step. An output marker uses the fitted center, never the true center. The marker is suppressed when the field has no displacement above the display threshold.

The healthy mesh includes 29,989 vertices and 59,974 triangles per source. All vertices and triangles are retained. Triangle component `0` identifies the source blade surface; the 646 other triangles form the artificial closure and are labeled separately. No geometric simplification, coordinate rounding, hidden deformation amplification, or target-driven alignment is applied by the exporter. Every tiny nonzero saved displacement is retained. Coordinates use normalized source span; no validated conversion to millimetres has been established.

## What the measurements say

Compared with geometry-only fitting on the same two input views, joint appearance-and-geometry fitting reduces mean color-only whole-blade false-displacement RMS by **99.799%** over 12 color-only cases. However, mean local shape RMS increases **26.814%** across 36 dent-plus-color cases, worsening in **30/36**. Here local RMS uses exactly changed blade-surface vertices and the percentage compares means of per-case RMS values. This is useful diagnostic evidence, not a finished accurate reconstruction system.

All 68 cases are selectable, including controls and poor predictions. [All 272 metric records](assets/data/all_results.json), a [readable CSV](assets/data/all_results.csv), and [all 24 threshold comparisons](assets/data/frontier.json) retain the four methods/controls. Guided examples illustrate the results; aggregate claims use all 68 cases. `support_rms_error` is a separate metric using true displacement greater than `1e-5`; it must not be confused with the local RMS headline. Surface colors indicate displacement magnitude, not calibrated confidence.

The [saved image-error records](assets/data/photo_metrics.json) measure an approximate linear RGB prediction. They are **not** images produced by rerendering an estimated mesh in Blender. Better image agreement alone does not establish a more accurate physical shape.

## Provenance and reuse

The source experiment is `20260923T121900Z-joint-reference`. The independently accepted verification receipt has SHA-256:

```text
66a70f582e05df0c5764f9c20d48e9cced27a175edd804b75177c79ed4c76c5a
```

The [public verification summary](assets/data/verification_summary.json), [source normalization records](assets/data/provenance.json), and [asset hash manifest](assets/data/asset_manifest.json) document the exported evidence. The original research workspace retains the complete receipt; workstation paths and process logs are excluded from this public presentation. Verification checks saved computations and artifacts. It does not certify scientific generalization, physical safety, or real-world inspection accuracy.

The derivative scientific assets in `assets/data/meshes`, `assets/data/fields`, and `assets/images` are shared under **CC BY-SA 4.0**, with attribution to the public Rotor37 source and Jet Blade 3D for the normalization, synthetic changes, rendering and estimated outputs. Retain this attribution and identify further modifications when sharing derivatives. The dataset license does not imply endorsement by its contributors or recorded owner.

To regenerate from the original accepted research workspace, install NumPy and run:

```bash
python scripts/export_evidence.py --project /path/to/causal-closureguard
```

The export script authenticates source bindings against the accepted receipt, preserves exact PNG bytes, validates the PNG metadata against a narrow allowlist, and checks exact float64 roundtrips for meshes and sparse fields. The public repository can display its included saved assets without access to that workspace.

## Earlier evidence in the research-story chapter

Two unchanged figures from the existing public Main Jet presentation show earlier, separate experiments:

- `assets/presentation/earlier-localization.png`: public Rotor37 sample 0, normalized and synthetically nicked, with a saved learned image-detector point/mask and supplied camera-to-mesh mapping. The illustrated point hits the known nick, while the mask IoU is 20%. Original [localization evidence and attribution](https://afeefaaazam03.github.io/MyPortfolio/main-jet/localization/).
- `assets/presentation/earlier-learned-shape.png`: public Rotor37 source 7, earlier frozen XYZ displacement model (`20260922T130214Z-2b27808237d2`), using supplied healthy CAD, seven healthy/inspection pairs and known image-to-surface correspondence. The local crop is chosen from the known reference for evaluation only. Original [learned replay and attribution](https://afeefaaazam03.github.io/MyPortfolio/main-jet/walkthrough/). Orange is the known change; blue is the saved learned prediction.

Both figures retain source revision `bac06c0caa7254120eecc6711a5fb85c58dfbdbc` and CC BY-SA 4.0 attribution to Safran / PLAID Rotor37 and the project’s synthetic modifications and visualizations. Their source URLs and byte hashes are in `assets/presentation/earlier-evidence-provenance.json`. They are not extra cases in the current 68-case comparison. No real or owner-supplied photographs were copied.

The new c033 hero/mesh stills are deterministic WebGL views of the current healthy mesh plus the actual saved joint prediction. Full and local pairs share their respective camera and scale; local crops use camera zoom only, with no amplified deformation. Exact source/renderer hashes and settings are in `assets/presentation/c033-preview-provenance.json`. These are geometry displays, not directly rerendered photometric predictions. The final future-output schematic is a labeled interface concept, not a learned prediction.
