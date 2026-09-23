# Saved evidence format

All URLs in `catalog.json` are relative to the site root. No inference runs in the browser.

`catalog.json` contains `scope`, `summary`, `references` (two healthy meshes), and `cases` (all 68 cases). Each case has `id`, `reference_id`, `kind`, `title`, `inputs` (two original 512 × 512 RGB images), `truth` (evaluation only), and `methods` (`joint` and `geometry_only`). Each method includes its field URL, fitted depth and appearance multiplier, fitted center, optional marker vertex, and measured errors.

Shared mesh JSON: `vertices` is a flat array of XYZ coordinates; `triangles` contains flat zero-based triangle vertex IDs; `triangle_component` records the original triangle labels (0 = blade surface, nonzero = artificial closure); `collar_vertex_ids` marks every vertex touching artificial closure triangles. No faces are removed or simplified. Arrays use JSON numbers with float64 round-trip precision.

Sparse field JSON: `indices` contains zero-based vertex IDs; `values` contains corresponding flat XYZ displacement triples. Omitted vertices have exactly zero displacement. Every nonzero value, including values below the display threshold, is retained. The displayed mesh is healthy vertices plus this field. Ground-truth fields are known synthetic targets used only for evaluation.

Default highlight threshold is `1e-5` in normalized coordinates. Highlighting represents displacement magnitude, not probability. `marker_vertex_id` comes from the fitted geometry center and is null when no displacement exceeds the display threshold. It never uses the known target center. Marker location is that vertex in the selected output mesh.

Units are normalized source blade span; no millimetre conversion has been established. Scaling to fit a canvas is a uniform camera/display transform, not amplified deformation.

`all_results.json` / `.csv` preserve all 272 case–method metric rows (68 cases × four controls/methods), not only highlighted examples. `frontier.json` includes all 24 method–threshold rows. `photo_metrics.json` retains every saved per-view image error, explicitly from the approximate linear RGB model, not a Blender render of the estimated mesh.

`asset_manifest.json` gives SHA-256 hashes, sizes and roles for public assets. The accepted source receipt is identified by hash in `verification_summary.json`; source machine paths and process logs are intentionally excluded.
