# Main Jet: saved image-to-known-mesh localization

Open [index.html](index.html) to switch between all four original worked examples.
The first case matches the earlier presentation: its point hits the known nick,
but the predicted damage region has only **20% IoU** with the reference region.

This is a replay of a completed synthetic experiment. A learned image detector
produced scores, masks and a peak pixel. A fixed mapping associates that pixel
with a triangle and barycentric weights on a **supplied mesh**. It is not a mesh
inferred from RGB, new inference, or real-blade validation.

## Files and conventions

| File | Contents |
|---|---|
| `meshes/intact.npz` | 29,989 vertices; 59,974 triangles; intact known reference |
| `meshes/damaged.npz` | 30,148 vertices; 60,292 triangles; known synthetic nick |
| `mapping/*.npz` | Exact saved sparse pixel-to-triangle correspondence arrays |
| `mapping/cameras.json` | Known effective camera intrinsics and world-to-camera matrices |
| `evidence.json` | Original four saved results, coordinates, weights, source hashes |
| `mesh_manifest.json` | Public archive hashes, array shapes and types |
| `MAIN_JET_VISUAL_EVIDENCE.pdf` | 21 September report snapshot; public link destinations updated |

The mesh archives contain `vertices`, `triangles` and `triangle_component`.
`triangle_component == 1` marks the artificial collar/cap, excluded from damage
labels. Coordinates are normalized by the original source Y extent; there is
no verified millimetre conversion. These earlier nick meshes are different
from the newer dent-based shape-estimation demonstration.

Sparse correspondence records use zero-based `pixel_index = y * width + x`.
The effective camera projects to the pixel center `[x + 0.5, y + 0.5]`.
For a mapped pixel, the three barycentric weights combine the three vertices
of its known triangle. Target A uses the **intact reference**, where missing
material used to be. Target B uses the **remaining damaged surface**.

## Reproduce the geometry checks

Download this directory, install NumPy if needed, and run:

```sh
python verify_mapping.py
```

The script checks all bundled mesh/correspondence hashes, rebuilds the three
mapped points from the exact mesh arrays and saved barycentric weights,
reprojects them using the known cameras, and verifies that the background
point stays unmapped. It performs no training or inference. The bundled
geometry/mapping downloads total approximately 6.33 MB.

A successful geometry check does not validate the image detector: example 2
has a valid mapped point that misses the damage. Example 3 has neither an image
alarm nor a surface mapping. The figures' explanatory crops use known reference
labels and are not detector inputs.

Source geometry and derived assets: **Safran / PLAID Rotor37**, pinned revision
`bac06c0caa7254120eecc6711a5fb85c58dfbdbc`, **CC BY-SA 4.0**.
See [ATTRIBUTION.md](ATTRIBUTION.md).
