"""Verify bundled known geometry; no training or model inference. Requires NumPy."""
from pathlib import Path
import hashlib
import json
import numpy as np

ROOT = Path(__file__).resolve().parent
manifest = json.loads((ROOT / "mesh_manifest.json").read_text())
evidence = json.loads((ROOT / "evidence.json").read_text())
cameras = json.loads((ROOT / "mapping/cameras.json").read_text())

for relative, record in manifest["files"].items():
    assert hashlib.sha256((ROOT / relative).read_bytes()).hexdigest() == record["sha256"], relative

for example, record in zip(evidence["examples"], cameras["examples"]):
    assert example["number"] == record["number"]
    mesh = np.load(ROOT / record["mesh"], allow_pickle=False)
    mapping = np.load(ROOT / record["correspondence"], allow_pickle=False)
    x, y = example["peak_xy"]
    index = np.flatnonzero(mapping["pixel_index"] == y * int(mapping["shape_hw"][1]) + x)
    if not example["mapping_available"]:
        assert len(index) == 0 and example["world_xyz"] is None
        print(f"Example {example['number']}: background remains unmapped.")
        continue
    assert len(index) == 1
    position = index[0]
    triangle_id = int(mapping["triangle_id"][position])
    assert triangle_id == example["triangle_id"]
    vertices = mesh["vertices"][mesh["triangles"][triangle_id]]
    weights = mapping["barycentric"][position].astype(float)
    point = (vertices * weights[:, None]).sum(axis=0)
    assert np.array_equal(vertices, np.asarray(example["triangle_vertices"]))
    assert np.array_equal(weights, np.asarray(example["barycentric"]))
    assert np.array_equal(point, np.asarray(example["world_xyz"]))
    camera_point = np.asarray(record["world_to_camera_cv"]) @ np.r_[point, 1.]
    q = np.asarray(record["K"]) @ camera_point[:3]
    residual = float(np.linalg.norm(q[:2] / q[2] - [x + .5, y + .5]))
    assert abs(residual - example["reprojection_error_pixels"]) < 1e-12
    print(f"Example {example['number']}: exact saved XYZ; reprojection residual {residual:.9g} pixels.")

print("PASS: known-geometry replay only; this is not real-world reconstruction validation.")
