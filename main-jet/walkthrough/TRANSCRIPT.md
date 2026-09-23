# Main Jet — watch how it works

132 seconds · English narration and captions · saved evidence followed by a labelled future concept

## 0:00 — Locate on the known mesh

We already mapped a saved image finding to a point on a known 3D blade mesh. The opening reuses the original four-panel illustration for the exposed nick in sample 0, target B, view 180 degrees. The saved peak is pixel `[347, 267]` (zero-based), mesh triangle `60247`, with coordinates `[-0.25066842209933426, 0.2757414250343295, -0.0040857418976678606]`. Coordinates are normalized source-Y units, not millimetres. The point lands on the known nick, but mask IoU is only **20%**. Locating one point correctly does not mean the whole damaged area was recovered.

The 3D association uses **supplied mesh and known camera/correspondence records**. The detector did not reconstruct the mesh from the photograph. The transparent surface in the figure provides context and is not an occlusion test. This is one curated saved example, not an aggregate success rate. The [full localization viewer](../localization/index.html) retains the corresponding miss, unmapped background point and intact-reference example, together with coordinates and evidence files.

## 0:18 — The current shape-estimation idea

Our current prototype estimates a blade’s 3D change from supplied healthy geometry and matching images. The input photographs are synthetic renders from public Rotor37 geometry. The output shown is the actual saved prediction from the earlier source-7 model. It is imperfect: blue highlights predicted movement, including movement outside the true damage.

This is a separate experiment from the opening localization example. The earlier question is where a saved image finding belongs on an already known mesh; the newer question is how a supplied healthy mesh should change.

## 0:30 — Actual inputs

The current 3D prototype needs three things: a healthy 3D blade, seven matching pairs of healthy/reference and inspection images, and known image-to-surface correspondence. The animation cycles through all seven original pairs. All seven contributed to the saved prediction; selecting a preview does not run a new single-view model.

## 0:48 — Actual output

Compare three surfaces: supplied healthy CAD, known synthetic change, and the model prediction. The damaged reference is an answer for checking, not an input to prediction. After the whole-blade view, the animation shows a local comparison crop selected using the known answer. This is an evaluation display, not learned localization. The coordinates and movement scale remain unchanged. Orange marks known change and blue marks predicted movement above a fixed threshold; neither colour is confidence.

## 1:06 — Already built

We have built controlled examples, trained small models and checked their outputs and failures. We also have a separate existing image model that marks suspected damage in real photographs. Its actual saved prediction is revealed by the wipe. That photo result did not come from the proposed 3D-assisted training. These are separate working components.

## 1:22 — Latest findings

A separate latest study checked eighteen synthetic dents on two new blade instances, plus two healthy states. Only three of eighteen cases for the new learned model, and four of eighteen for a simple fixed rule, passed every improvement check against the earlier model. These are case counts, not overall accuracy. Both methods improved shape error under normal matched inputs, but false changes and missed damage remain.

## 1:38 — Planned work

For the current 3D direction, improve where change is predicted, test untouched cases and eventually check independently measured real shapes. For the broader proposal, compare image-only training with training that adds 3D teaching information, using the same model and label budget. Evaluate on new, human-reviewed real photographs. That extra teaching benefit has not been demonstrated.

## 1:54 — Intended future output: illustration, not a model result

The last chapter switches explicitly from evidence to a **design illustration**. It shows how a possible future inspection report could connect a marked region on a blade, an estimated shape change, supporting image evidence and an insufficient-evidence state. It supplies no measured damage dimensions, learned confidence, invented experimental performance or safety decision.

Reliable shape recovery is unfinished. The separate 3D-assisted photo-inspection training benefit is also unproven. The concept is a proposed presentation of results if those research goals succeed, not a claim that the integrated system exists. [Open the separate final website section](../index.html#future-output).

## Explore the saved output

Use **Explore the 3D output**, drag to rotate or use arrow keys, and switch between the whole blade and the local comparison. Exploration opens the actual-output chapter at 0:56 and pauses narration. The healthy control has identical image inputs and zero movement by design. It does not establish healthy recognition under real repeat imaging. The three interactive meshes are saved evidence; the controls do not train a model or run inference.

The main downloadable MP4 adds synchronized, AI-generated English narration to this deterministic visual walkthrough. A caption-only silent version is also available. See [NARRATION.md](NARRATION.md) for the exact spoken script. The same data and labels are used in the browser and video. See the linked evidence and attribution for the distinction between learned predictions, fixed rules, simulated data, illustrative design and planned work.
