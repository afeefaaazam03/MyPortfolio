# What this demo does—and what remains research

## Actually implemented

- The current experiment fits two rendered inspection images using supplied healthy CAD and known camera/lighting settings.
- Saved fitted coefficients produce actual 3D displacement fields and changed mesh vertices.
- The viewer displays all 29,989 vertices and 59,974 triangles for each healthy reference, plus the saved displacements. No surface simplification or deformation exaggeration is used.
- The fitted marker comes from the prediction, never from the known answer. It is suppressed if no displacement exceeds the display threshold.
- All 68 cases are selectable; complete metrics retain four methods/controls, including unchanged CAD and appearance-only fitting.
- Known synthetic damaged shapes are used separately for evaluation. The source experiment froze predictions before reading evaluation truth and the five unused observed views.

## Restricted / rule-based choices

The latest method is a **nonlearned reference fit**, not a neural network. It has three candidate dent centers, a fixed dent profile/radius, known cameras and lighting, and at most one dent plus one color patch. The current image model is a linear approximation to rendered images.

Teal/orange is a display rule: displacement above **0.00001** in normalized blade-span coordinates. A colored patch is not a confidence map, and “no movement above threshold” is not a certified healthy finding. Selecting a center among three choices is a restricted localization test.

The slider is mesh interpolation; the walkthrough is scripted playback. Neither is a live inference process. There is no implemented uncertainty model, automatic request for another view, or safety decision.

## Simulated data

The source shapes are two public Rotor37 simulation geometries (IDs 9/10). Local damage and material changes were introduced synthetically; Blender produced the images. This is **not real inspection validation**.

The healthy geometry includes an artificial closure collar. It is labeled in the mesh data. No physical scale in millimeters has been verified. Source normalization and transformations are documented in the provenance export.

The “known answer” is a real synthetic evaluation mesh, not a predicted result. The final “planned output” section is a concept describing future capabilities, with no invented accuracy or confidence values.

## Why the research is unfinished

On mixed cases the newer shape-plus-color fit has **higher** mean local 3D error, despite improved image agreement. Most mixed cases worsen. All aggregate results and poor cases are retained.

Sources 9/10 were already exposed during development. This does not demonstrate generalization to unfamiliar blades. Reserved sources and official test payloads were not opened for this experiment.

The full result report describes exploratory threshold gates and mesh checks. These are not a certificate of physical validity or operational safety. Internal replay verifies saved numerical results; it does not establish real-world truth.

## What the proposed research would replace

The next planned experiment will render fitted meshes/materials directly to investigate the linear image approximation. Later work must improve geometry estimation, test locations and shapes outside the restricted family, handle camera/lighting uncertainty, and evaluate against independently measured 3D damage.

Reliable uncertainty, cross-image evidence summaries, and selecting another useful view belong to the intended future inspection workflow. They are not claimed as completed features here.
