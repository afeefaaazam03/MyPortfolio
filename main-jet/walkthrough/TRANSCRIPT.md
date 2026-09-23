# Main Jet — watch how it works

96 seconds · captioned visual walkthrough · actual saved outputs

## 0:00 — The idea

Our current prototype estimates a blade’s 3D change from supplied healthy geometry and matching images. The input photographs are synthetic renders from public Rotor37 geometry. The output shown is the actual saved prediction from the earlier source-7 model. It is imperfect: blue highlights predicted movement, including movement outside the true damage.

## 0:12 — Actual inputs

The current 3D prototype needs three things: a healthy 3D blade, seven matching pairs of healthy/reference and inspection images, and known image-to-surface correspondence. The animation cycles through all seven original pairs. All seven contributed to the saved prediction; selecting a preview does not run a new single-view model.

## 0:30 — Actual output

Compare three surfaces: supplied healthy CAD, known synthetic change, and the model prediction. The damaged reference is an answer for checking, not an input to prediction. After the whole-blade view, the animation shows a local comparison crop selected using the known answer. This is an evaluation display, not learned localization. The coordinates and movement scale remain unchanged. Orange marks known change and blue marks predicted movement above a fixed threshold; neither colour is confidence.

## 0:48 — Already built

We have built controlled examples, trained small models and checked their outputs and failures. We also have a separate existing image model that marks suspected damage in real photographs. Its actual saved prediction is revealed by the wipe. That photo result did not come from the proposed 3D-assisted training. These are separate working components.

## 1:04 — Latest findings

A separate latest study checked eighteen synthetic dents on two new blade instances, plus two healthy states. Only three of eighteen cases for the new learned model, and four of eighteen for a simple fixed rule, passed every improvement check against the earlier model. These are case counts, not overall accuracy. Both methods improved shape error under normal matched inputs, but false changes and missed damage remain.

## 1:20 — Planned work

For the current 3D direction, improve where change is predicted, test untouched cases and eventually check independently measured real shapes. For the broader proposal, compare image-only training with training that adds 3D teaching information, using the same model and label budget. Evaluate on new, human-reviewed real photographs. That extra teaching benefit has not been demonstrated.

## Explore the saved output

Use **Explore the 3D output**, drag to rotate or use arrow keys, and switch between the whole blade and the local comparison. The healthy control has identical image inputs and zero movement by design. It does not establish healthy recognition under real repeat imaging. Every displayed mesh is saved evidence; the controls do not train a model or run inference.

The main downloadable MP4 adds synchronized, AI-generated English narration to this deterministic visual walkthrough. A caption-only silent version is also available. See NARRATION.md for the exact spoken script. The same data and labels are used in the browser and video. See the linked evidence and attribution for the distinction between learned predictions, fixed rules, simulated data and planned work.
