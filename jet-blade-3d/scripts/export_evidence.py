#!/usr/bin/env python3
"""Export a checked, public-only saved experiment for the static Jet Blade 3D site.

Usage: python scripts/export_evidence.py --project /path/to/causal-closureguard
Requires numpy. No training, image generation, prediction or network access occurs.
The original research workspace is needed only to regenerate the public export.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
from pathlib import Path

import numpy as np

RUN = "experiments/blade_diagnostics/blade_joint_appearance_geometry_v1/20260923T121900Z-joint-reference"
RECEIPT = "external_independent_verification_v1_1.json"
RECEIPT_SHA = "66a70f582e05df0c5764f9c20d48e9cced27a175edd804b75177c79ed4c76c5a"
METHODS = ("joint", "geometry_only")
THRESHOLD = 1e-5
SOURCE_URL = "https://huggingface.co/datasets/PLAID-datasets/Rotor37"
SOURCE_REVISION = "bac06c0caa7254120eecc6711a5fb85c58dfbdbc"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True, type=Path)
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    project, output = args.project.resolve(), args.output.resolve()
    run = project / RUN
    receipt_bytes = (run / RECEIPT).read_bytes()
    assert sha(receipt_bytes) == RECEIPT_SHA, "Unaccepted independent receipt"
    receipt = json.loads(receipt_bytes)
    assert receipt["passed"] and receipt["source_ids"] == [9, 10]
    assert not receipt["reserved_sources_11_12_opened"]
    assert receipt["all_bound_files_unchanged"]
    pool = receipt["input_sha256s"]
    assets = []
    checked = {}

    def read_bound(binding):
        path = Path(binding["path"]).resolve()
        assert path.is_relative_to(project), "Input outside the accepted research project"
        assert pool.get(str(path)) == binding["sha256"], "Input absent from accepted verification"
        raw = path.read_bytes()
        assert sha(raw) == binding["sha256"], "Source changed since verification"
        checked[str(path)] = binding["sha256"]
        return raw

    def read_json(name):
        path = (run / name).resolve()
        return json.loads(read_bound({"path": str(path), "sha256": pool[str(path)]}))

    def arrays(binding):
        with np.load(io.BytesIO(read_bound(binding)), allow_pickle=False) as data:
            return {key: data[key] for key in data.files}

    def write_asset(relative, raw, role, source_hashes=()):
        dest = output / relative
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(raw)
        assets.append({"path": relative, "sha256": sha(raw), "bytes": len(raw),
                       "role": role, "source_sha256s": sorted(set(source_hashes))})
        return relative

    def write_json(relative, obj, role, source_hashes=()):
        raw = (json.dumps(obj, separators=(",", ":"), ensure_ascii=False, allow_nan=False) + "\n").encode()
        # Public artifacts must not leak workstation paths or account data.
        for private in (b"/home/", b"/tmp/", b"file://", b"ghp_", b"github_pat_", b"@"):
            assert private not in raw, f"Private path/account marker in {relative}"
        return write_asset(relative, raw, role, source_hashes)

    def field(relative, displacement, source_hashes):
        assert displacement.dtype == np.float64
        assert np.isfinite(displacement).all()
        indices = np.flatnonzero(np.any(displacement != 0, axis=1))
        obj = {"indices": indices.tolist(), "values": displacement[indices].reshape(-1).tolist(),
               "vertex_count": len(displacement), "units": "normalized_blade_span"}
        # Actual serialization roundtrip, including tiny values and zero locations.
        roundtrip = json.loads(json.dumps(obj, allow_nan=False))
        reconstructed = np.zeros_like(displacement)
        reconstructed[np.asarray(roundtrip["indices"], dtype=int)] = np.asarray(roundtrip["values"]).reshape(-1, 3)
        assert np.array_equal(reconstructed, displacement)
        return write_json(relative, obj, "actual sparse displacement; no threshold filtering", source_hashes)

    ledger = read_json("case_ledger.json")["cases"]
    refs = read_json("references.json")["references"]
    predictions = read_json("prediction_freeze.json")
    metric_rows = read_json("metrics.json")["records"]
    photo_rows = read_json("photo_metrics.json")["records"]
    frontiers = read_json("frontier.json")["records"]
    summary = read_json("summary.json")
    cameras = {r["view_id"]: r for r in read_json("geometry_configuration.json")["cameras"]}
    assert len(ledger) == 68 and len(metric_rows) == 272 and len(predictions["predictions"]) == 204
    assert {r["source_sample_id"] for r in ledger} == {9, 10}
    assert not predictions["truth_arrays_decoded"] and not predictions["unused_observation_rgb_decoded"]
    pred_map = {(r["case_id"], r["method"]): r for r in predictions["predictions"]}
    metric_map = {(r["case_id"], r["method"]): r for r in metric_rows}
    photo_map = {}
    for row in photo_rows:
        photo_map.setdefault((row["case_id"], row["method"]), []).append(row)
    mesh_map, ref_catalog, source_notes = {}, [], []

    for reference in refs:
        rid, sid = reference["reference_id"], reference["source_sample_id"]
        assert sid in (9, 10)
        mesh = arrays(reference["healthy_mesh"])
        assert mesh["vertices"].dtype == np.float64
        V, F, C = mesh["vertices"], mesh["triangles"], mesh["triangle_component"]
        collar = np.unique(F[C != 0])
        payload = {"vertices": V.reshape(-1).tolist(), "triangles": F.reshape(-1).tolist(),
                   "triangle_component": C.tolist(), "collar_vertex_ids": collar.tolist(),
                   "vertex_count": len(V), "triangle_count": len(F),
                   "units": "normalized_blade_span", "source_id": sid}
        reconstructed = np.asarray(json.loads(json.dumps(payload))["vertices"]).reshape(-1, 3)
        assert np.array_equal(reconstructed, V), "Mesh export lost precision"
        mesh_url = write_json(f"assets/data/meshes/{rid}.json", payload,
                              "public healthy canonical mesh including labeled artificial closure",
                              [reference["healthy_mesh"]["sha256"]])
        centers = [{"id": k, "vertex_id": int(vid), "xyz": V[vid].tolist()}
                   for k, vid in enumerate(reference["centers"]["center_vertex_ids"])]
        healthy_case = next(c for c in ledger if c["source_sample_id"] == sid and c["kind"] == "healthy")
        healthy_views = [{"id": view, "url": f"assets/images/{healthy_case['case_id']}_{view}.png",
                          "angle_degrees": cameras[view]["angle_degrees"]} for view in ("v004", "v005")]
        ref_catalog.append({"id": rid, "source_id": sid, "mesh_url": mesh_url, "centers": centers,
                            "healthy_views": healthy_views, "vertex_count": len(V), "triangle_count": len(F),
                            "artificial_closure_triangles": int(np.count_nonzero(C)),
                            "bounds": [V.min(0).tolist(), V.max(0).tolist()]})
        mesh_map[rid] = (reference, mesh)
        context_path = Path(reference["healthy_mesh"]["path"]).parent.parent / "geometry_context.json"
        # Provenance is a narrowly scoped public geometry record, not industrial data.
        context_raw = context_path.read_bytes()
        context = json.loads(context_raw)
        assert context["source_sample_id"] == sid and context["source_license"] == "CC-BY-SA-4.0"
        assert context["source_family_id"] == "plaid_rotor37"
        assert context["files"]["rest_mesh"]["sha256"] == reference["healthy_mesh"]["sha256"]
        metadata_path = Path(context["files"]["source_metadata"]["path"])
        metadata_raw = metadata_path.read_bytes()
        assert sha(metadata_raw) == context["files"]["source_metadata"]["sha256"]
        metadata = json.loads(metadata_raw)
        assert metadata["id"] == "PLAID-datasets/Rotor37" and metadata["sha"] == SOURCE_REVISION
        assert metadata["private"] is False and metadata["gated"] is False
        assert metadata["cardData"]["license"] == "cc-by-sa-4.0"
        source_notes.append({"source_id": sid, "healthy_mesh_sha256": reference["healthy_mesh"]["sha256"],
                             "context_sha256": sha(context_raw), "public_metadata_sha256": sha(metadata_raw),
                             "normalization": context["normalization"], "license": context["source_license"]})

    case_catalog, flat_rows = [], []
    names = {"healthy": "Healthy blade", "dent": "Dent only", "appearance": "Color change only", "mixed": "Dent + color change"}
    for case in ledger:
        cid, rid, kind = case["case_id"], case["reference_id"], case["kind"]
        reference, mesh = mesh_map[rid]
        healthy = mesh["vertices"]
        truth = arrays(case["truth_mesh"])
        assert np.array_equal(truth["triangles"], mesh["triangles"])
        assert np.array_equal(truth["triangle_component"], mesh["triangle_component"])
        truth_field = truth["vertices"] - healthy
        assert np.array_equal(healthy + truth_field, truth["vertices"])
        truth_url = field(f"assets/data/fields/{cid}_truth.json", truth_field,
                          [case["truth_mesh"]["sha256"], reference["healthy_mesh"]["sha256"]])
        inputs = []
        for view in ("v004", "v005"):
            binding = case["views"][view]
            raw = read_bound(binding)
            assert raw.startswith(b"\x89PNG\r\n\x1a\n")
            # Preserve original bytes, permitting only inspected renderer metadata.
            offset = 8
            while offset < len(raw):
                length = int.from_bytes(raw[offset:offset + 4], "big")
                chunk = raw[offset + 4:offset + 8]
                payload = raw[offset + 8:offset + 8 + length]
                assert chunk not in (b"zTXt", b"iTXt"), "Unreviewed compressed text metadata"
                if chunk == b"eXIf":
                    # The inspected EXIF contains only X/Y resolution, 72/1.
                    assert sha(payload) == "bac3a1a58a16fd3148097ebe3f45648d02a89abcae7be4c8d625e0a926782b62"
                if chunk == b"tEXt":
                    key, value = (part.decode("utf-8") for part in payload.split(b"\0", 1))
                    fixed = {"File": "<untitled>", "Time": "00:00:00:01", "Frame": "001", "Camera": "Known camera",
                             "Scene": "Compact varied-position blade pairs", "cycles.ViewLayer.samples": "32"}
                    numeric = {"Date", "RenderTime", "Memory", "cycles.ViewLayer.total_time",
                               "cycles.ViewLayer.render_time", "cycles.ViewLayer.synchronization_time"}
                    assert (key in fixed and value == fixed[key]) or (key in numeric and re.fullmatch(r"[0-9/:. M]+", value))
                offset += 12 + length
            url = write_asset(f"assets/images/{cid}_{view}.png", raw, "unaltered actual synthetic RGB inference input", [binding["sha256"]])
            inputs.append({"id": view, "url": url, "angle_degrees": cameras[view]["angle_degrees"],
                           "width": 512, "height": 512, "sha256": binding["sha256"]})
        exported_methods = {}
        for method in ("joint", "geometry_only", "appearance_only", "zero"):
            record = metric_map[cid, method]
            pop, par = record["metrics"]["populations"], record["parameters"]
            area = next(a for a in record["area"] if a["threshold"] == THRESHOLD)
            if method in METHODS:
                prediction = pred_map[cid, method]
                data = arrays(prediction["prediction"])
                displacement = data["displacement"]
                assert np.array_equal(healthy + displacement, data["vertices"])
                url = field(f"assets/data/fields/{cid}_{method}.json", displacement,
                            [prediction["prediction"]["sha256"]])
                fit = prediction["fit"]
                marker = None
                if np.linalg.norm(displacement, axis=1).max() > THRESHOLD and fit["geometry_center"] is not None:
                    marker = int(reference["centers"]["center_vertex_ids"][fit["geometry_center"]])
                exported_methods[method] = {
                    "field_url": url, "depth": fit["depth"], "multiplier": fit["multiplier"],
                    "geometry_center": fit["geometry_center"], "appearance_center": fit["appearance_center"],
                    "marker_vertex_id": marker, "coefficients": fit["coefficients"],
                    "fit_image_mse": fit["chosen_mse"], "maximum_displacement": record["metrics"]["shape"]["maximum_displacement"],
                    "support_rms_error": pop["true_support"]["rms_vector_error"],
                    "local_rms_error": pop["true_changed_airfoil"]["rms_vector_error"],
                    "whole_blade_rms_error": pop["all_airfoil"]["rms_vector_error"],
                    "support_iou": record["metrics"]["support"]["iou"],
                    "eligible_area_recall": area["eligible_true_support_recall"],
                    "eligible_false_area_fraction": area["eligible_false_change_fraction"],
                    "geometry_center_correct": par["geometry_center_correct"],
                    "depth_absolute_error": par["depth_absolute_error"],
                    "numerically_tied_count": fit["numerically_tied_count"],
                    "materially_different_geometry": fit["materially_different_geometry"],
                    "calibrated_confidence": False, "physical_validity_established": False,
                }
            flat_rows.append({"case_id": cid, "source_id": case["source_sample_id"], "kind": kind, "method": method,
                "true_geometry_center": case["geometry_center"], "true_appearance_center": case["appearance_center"],
                "true_depth": case["depth"], "true_multiplier": case["multiplier"],
                "predicted_geometry_center": par["predicted_geometry_center"], "predicted_depth": par["predicted_depth"],
                "predicted_multiplier": par["predicted_multiplier"], "depth_absolute_error": par["depth_absolute_error"],
                "whole_blade_rms_error": pop["all_airfoil"]["rms_vector_error"], "support_rms_error": pop["true_support"]["rms_vector_error"],
                "local_rms_error": pop["true_changed_airfoil"]["rms_vector_error"],
                "support_iou": record["metrics"]["support"]["iou"], "display_threshold": THRESHOLD,
                "eligible_area_recall": area["eligible_true_support_recall"], "eligible_false_area_fraction": area["eligible_false_change_fraction"]})
        case_catalog.append({"id": cid, "reference_id": rid, "source_id": case["source_sample_id"],
            "kind": kind, "title": f"{names[kind]} · blade {case['source_sample_id']} · {cid}", "inputs": inputs,
            "truth": {"field_url": truth_url, "evaluation_only": True, "depth": case["depth"],
                "geometry_center": case["geometry_center"], "appearance_center": case["appearance_center"],
                "multiplier": case["multiplier"]}, "methods": exported_methods})

    def mean_error(kind, method, pop):
        return float(np.mean([metric_map[c["case_id"], method]["metrics"]["populations"][pop]["rms_vector_error"]
                              for c in ledger if c["kind"] == kind]))

    appearance_original = mean_error("appearance", "geometry_only", "all_airfoil")
    appearance_joint = mean_error("appearance", "joint", "all_airfoil")
    mixed_original = mean_error("mixed", "geometry_only", "true_support")
    mixed_joint = mean_error("mixed", "joint", "true_support")
    mixed_local_original = mean_error("mixed", "geometry_only", "true_changed_airfoil")
    mixed_local_joint = mean_error("mixed", "joint", "true_changed_airfoil")
    regressions = sum(metric_map[c["case_id"], "joint"]["metrics"]["populations"]["true_changed_airfoil"]["rms_vector_error"] >
                      metric_map[c["case_id"], "geometry_only"]["metrics"]["populations"]["true_changed_airfoil"]["rms_vector_error"]
                      for c in ledger if c["kind"] == "mixed")
    catalog = {"schema": "jet_blade_3d_saved_evidence_v1", "experiment_id": run.name,
        "scope": {"synthetic": True, "learned": False, "live_inference": False, "full_research_goal_achieved": False,
            "known_healthy_cad": True, "known_camera_and_lighting": True, "candidate_geometry_centers": 3,
            "fit_views": ["v004", "v005"], "observed_unused_views": 5, "source_ids": [9, 10],
            "independent_real_blades": 0, "previously_exposed_sources": True, "display_threshold": THRESHOLD,
            "units": "normalized_blade_span", "millimetres_per_unit": None,
            "field_meaning": "Estimated displacement of a supplied healthy mesh; color encodes displacement, not confidence"},
        "summary": {"cases": 68, "source_geometries": 2, "dent_cases": 18, "appearance_cases": 12, "mixed_cases": 36, "healthy_cases": 2,
            "new_renders": 350, "saved_predictions": 204, "metric_records": 272,
            "appearance_false_displacement_reduction_percent": 100 * (1 - appearance_joint / appearance_original),
            "appearance_mean_rms_geometry_only": appearance_original, "appearance_mean_rms_joint": appearance_joint,
            "mixed_support_error_increase_percent": 100 * (mixed_joint / mixed_original - 1),
            "mixed_local_error_increase_percent": 100 * (mixed_local_joint / mixed_local_original - 1),
            "mixed_mean_local_rms_geometry_only": mixed_local_original, "mixed_mean_local_rms_joint": mixed_local_joint,
            "local_rms_population": "Exactly changed airfoil vertices; ratios compare means of per-case RMS values",
            "mixed_mean_support_rms_geometry_only": mixed_original, "mixed_mean_support_rms_joint": mixed_joint,
            "mixed_worse_cases": int(regressions), "comparison": "joint versus geometry-only, same 2 input views",
            "exploratory_gate_by_method": summary["decision"],
            "gate_meaning": "Same-family exploratory threshold gate; does not establish real-world accuracy or reliable depth"},
        "references": ref_catalog, "cases": case_catalog,
        "casebook": [
            {"id": "dent", "label": "A dent: locate it on the 3D blade", "case_id": "c003"},
            {"id": "appearance", "label": "A color patch: avoid inventing a dent", "case_id": "c021"},
            {"id": "mixed", "label": "Both together: depth is still unreliable", "case_id": "c035"},
            {"id": "healthy", "label": "Healthy reference control", "case_id": "c000"}],
        "downloads": {"all_results": "assets/data/all_results.csv", "all_metrics": "assets/data/all_results.json",
            "frontier": "assets/data/frontier.json", "photo_metrics": "assets/data/photo_metrics.json",
            "verification": "assets/data/verification_summary.json", "sources": "SOURCE_DATA.md"}}
    write_json("assets/data/catalog.json", catalog, "all-case saved evidence catalog")
    write_json("assets/data/all_results.json", {"records": metric_rows}, "all 272 accepted metric rows, including controls and all thresholds")
    write_json("assets/data/photo_metrics.json", {"note": "Errors of approximate linear RGB predictions, not rerenders of estimated meshes", "records": photo_rows}, "all 1904 accepted per-view image error records")
    write_json("assets/data/frontier.json", {"records": frontiers}, "all 24 accepted method-threshold records")
    csv_buffer = io.StringIO(newline="")
    writer = csv.DictWriter(csv_buffer, fieldnames=list(flat_rows[0]))
    writer.writeheader()
    writer.writerows(flat_rows)
    write_asset("assets/data/all_results.csv", csv_buffer.getvalue().encode(), "all 272 flattened metrics; normalized units")
    verification = {"passed": True, "receipt_sha256": RECEIPT_SHA, "run_manifest_sha256": receipt["source_manifest_sha256"],
        "source_run": run.name, "independent_verification_completed_at": receipt["completed_at"],
        "exported_cases": 68, "exported_healthy_meshes": 2, "exported_prediction_fields": 136,
        "exported_truth_fields": 68, "unaltered_input_images": 136, "all_exported_arrays_exact_roundtrip": True,
        "all_source_bindings_authenticated": True, "source_ids": [9, 10], "reserved_sources_opened": False,
        "source_inputs_checked": len(checked), "private_machine_paths_removed": True,
        "image_metadata_check": "Allowlisted Blender text metadata and exact reviewed resolution-only EXIF; no paths, author or location fields", "viewer_is_saved_evidence_replay": True,
        "independent_verification_scope": "Saved arrays, numerical fitting, metrics and read boundaries; not real-world scientific validity",
        "verified_source_counts": {k: receipt[k] for k in ("new_rgb_verified", "prediction_fields_verified", "metric_records_verified", "photo_records_verified")}}
    write_json("assets/data/verification_summary.json", verification, "sanitized receipt summary; original receipt preserved in research workspace")
    write_json("assets/data/provenance.json", {"dataset": "PLAID-datasets/Rotor37", "url": SOURCE_URL,
        "revision": SOURCE_REVISION, "dataset_owner_as_recorded": "Safran", "public": True, "gated": False,
        "license": "CC-BY-SA-4.0", "sources": source_notes,
        "changes": ["Canonical surface normalization", "Labeled artificial closure collar", "Controlled synthetic dents and material patches", "Blender RGB rendering", "Estimated displacement from nonlearned fitting"]}, "public source provenance and normalization")
    manifest = {"schema": "jet_blade_3d_public_assets_v1", "source_receipt_sha256": RECEIPT_SHA,
                "assets": assets, "total_bytes": sum(a["bytes"] for a in assets), "files": len(assets),
                "license": "CC-BY-SA-4.0 for scientific mesh, image and field derivatives",
                "privacy": "Only allowlisted public Rotor37 sources 9/10 and generated synthetic results; no industrial inspection data"}
    (output / "assets/data/asset_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps({"passed": True, "cases": 68, "files": len(assets), "bytes": manifest["total_bytes"], "summary": catalog["summary"]}, indent=2))


if __name__ == "__main__":
    main()
