# Main Jet localization evidence — attribution

Source geometry: **Safran / PLAID Rotor37, sample 0**.

- Dataset: <https://huggingface.co/datasets/PLAID-datasets/Rotor37>
- Pinned revision: `bac06c0caa7254120eecc6711a5fb85c58dfbdbc`
- Upstream declared license: **Creative Commons Attribution-ShareAlike 4.0**
- License: <https://creativecommons.org/licenses/by-sa/4.0/>
- Legal text: <https://creativecommons.org/licenses/by-sa/4.0/legalcode>

The project normalized the source surface, added an artificial collar/cap and a
sphere-cut nick, and rendered intact/damaged states with controlled cameras,
material and lighting. The figures add saved neural detector outputs, reference
mask comparisons and transparent mesh displays. The collar/cap was excluded
from inspection labels. These alterations are synthetic and do not represent
an authenticated manufactured blade. Safran/PLAID do not endorse this demo.

The Rotor37-derived meshes, correspondence/camera records, renders, figures and
their visual derivatives in this package are provided under **CC BY-SA 4.0**.
Retain this attribution, identify changes and apply the share-alike terms when
redistributing derivatives.

This 23 September 2026 web package preserves the four original figures, original
`evidence.json`, two supplied mesh archives and four correspondence archives
byte for byte. The 21 September evidence PDF retains every page-content stream
unchanged; only local-file link annotations were redirected to this public site. It adds a case selector and
mesh downloads. `mapping/cameras.json` contains only the required camera and
case fields extracted from the verified original record; `mesh_manifest.json`
records hashes and array schemas. No model checkpoint or private photograph is
bundled. The PDF is a historical report snapshot. Its local report links now point to
the public localization section; the evidence and attribution links point to
the bundled public copies. No local filesystem paths are published.

The supplied geometry and camera mapping were known before detector inference.
No mesh was inferred from the photograph in these examples. Reprojection checks
verify the saved mapping, not real-world reconstruction accuracy. The selected
examples illustrate a hit, a miss, an unmapped point and intact-reference
semantics; they are not an independent performance sample.
