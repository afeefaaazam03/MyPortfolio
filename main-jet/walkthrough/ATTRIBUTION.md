# Public Rotor37 evidence and intended-output walkthrough

Source geometry: **Safran / PLAID Rotor37**, source instance 7, pinned revision
`bac06c0caa7254120eecc6711a5fb85c58dfbdbc`.

- Dataset: https://huggingface.co/datasets/PLAID-datasets/Rotor37
- Licence for Rotor37-derived images, coordinates and presentation figures:
  **CC BY-SA 4.0**, https://creativecommons.org/licenses/by-sa/4.0/
- Legal text: https://creativecommons.org/licenses/by-sa/4.0/legalcode

The source surface was normalized, given an artificial collar/closure, and
altered with a synthetic dent and compensating raised rim. These are controlled
synthetic examples, not measured physical blade damage. Safran/PLAID do not
endorse this presentation. Retain attribution, identify alterations and follow
share-alike terms when redistributing derivatives.

This update extracts unchanged float64 healthy, known-reference and saved
predicted coordinates and their canonical triangles from the accepted source-7
demonstration. All 14 PNGs are copied byte-for-byte. The healthy control has
identical healthy, reference and normal-input predicted coordinates. No source
geometry or prediction is modified. GPU display buffers use float32, as in the
accepted viewer. Camera movement, color and wireframe are presentation
operations. Coordinates and displacement use their actual scale (1×); units
are normalized source-Y extent, not millimetres.

The shown model is the earlier frozen XYZ residual predictor, arm `frozen`, from
accepted run `20260922T130214Z-2b27808237d2`. It is not the latest normal-constrained
model. It uses supplied healthy CAD, seven healthy/inspection image pairs and
known healthy image-to-surface correspondence. This page replays saved results:
no inference, fitting, new observation-image rendering, or live registration
occurs. Known damage supplies supervision for the separate training examples;
the displayed reference checks this already frozen prediction.

Orange marks known reference movement and blue marks predicted movement above
1e-5 normalized units. These are not confidence or safety labels. The local crop
is selected from the known dent reference for evaluation-only presentation,
then held fixed for the healthy comparison. Whole-mesh viewing and whole-airfoil
metrics preserve false changes elsewhere. Healthy zero output is architectural,
not learned proof of specificity.

No owner-supplied photographs, proprietary CAD, learned weights or machine-specific
paths are included in these added data assets. Public source identifiers and
selected-source hashes are recorded in `data.js`.

## Downloadable video and other imagery

The captioned MP4 is a deterministic recording of the browser walkthrough.
Its Rotor37-derived animated sequences retain the CC BY-SA 4.0 attribution
and terms above. A source-credit line is burned into every video frame.

The real-photo wipe in the completed-components chapter uses the already-public
AEBIS example 329 and its saved image-only-model prediction, byte-identical to
`../assets/aebis_329_input.png` and `../assets/aebis_329_prediction.png`. It is
not a result of geometry-assisted training. The photograph retains its original
source-specific terms; no blanket reuse licence for it is asserted here.
See [the site's existing sources and sharing notes](../SHARING_AND_ATTRIBUTION.html)
and [evidence notes](../PRESENTATION_EVIDENCE.html).

Original browser animation, captions and workflow diagrams are presentation
material; they do not change any scientific result. The opening localization
chapter and middle shape-prediction chapters contain actual saved evidence.
The final future-output chapter is a labelled vector design illustration, not a
learned output. No invented prediction, learned confidence or new model inference
was added to the experimental evidence.

## Earlier image-to-mesh localization

The opening uses the original `../localization/example_1.png` from the saved
Rotor37 sample-0 nick pilot, at the same pinned public source revision above.
Its four panels retain the original detector peak, mask overlay, known mesh
context and local 3D check. The saved target-B point at pixel `[347, 267]` maps
through supplied correspondence records onto triangle `60247` of the remaining
damaged mesh. The exact coordinates and full verification records are linked
from [the localization viewer](../localization/index.html). The point hits the
known exposed nick, while the mask has only 20% IoU. One point is not a complete
segmentation result. The point mapping does not mean that the detector inferred
the mesh or that real-world reconstruction accuracy has been established.

Sample-0 geometry was normalized and given an artificial nick. Those changes
and the rendered/derived figures retain the Rotor37 CC BY-SA 4.0 terms. The
source-0 localization example and source-7 displacement example are different
saved experiments; they are not combined into a new learned result.

## Intended future output illustration

The final chapter uses `../assets/future-output.svg`, an original diagram of a
possible inspection-report layout. It is explicitly labelled
**ILLUSTRATION — NOT A MODEL RESULT**. Its marked region and report elements
are conceptual. They are not new damage predictions, measured physical
geometry, a recovered mesh, confidence values or an achieved integrated system.
The future 3D shape output and separate proposed 3D-assisted image-training
benefit remain research goals. The corresponding website section is separate
from the actual saved evidence.

## English narration

Narration is AI-generated with **Piper 1.8.0** (Open Home Foundation, GPL-3.0)
and the stock `en_US-ljspeech-medium` voice. The individual voice card identifies
the LJ Speech dataset as public domain and states that the voice was trained
from scratch; the voice contributor is Bryce Beattie. The presentation uses a
generic synthetic English voice, not a recording of the project author.

- Engine and licence: https://github.com/OHF-Voice/piper1-gpl
- Voice card: https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/ljspeech/medium/MODEL_CARD
- Dataset provenance: https://keithito.com/LJ-Speech-Dataset/
- Voice model SHA-256: `6f52a751e2349abe7a76735eb09dc1875298c77ea2342ffd2fef79ff81b87f22`

Only generated narration is distributed here. No voice-model weights or speech
engine are bundled with the website. The narrated MP4 preserves the original
video stream and adds chapter-aligned audio; the silent version remains available.
