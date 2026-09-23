(() => {
  'use strict';
  const examples = window.MJ_LOCALIZATION.examples;
  const $ = id => document.getElementById(id);
  const text = (id, value) => { $(id).textContent = value; };
  const labels = ['Correct point · incomplete mask', 'Mapped point · misses damage', 'Background · no mapped point', 'Missing material · intact reference'];
  const numeric = (value, digits = 9) => value == null ? 'Not applicable' : value.toFixed(digits);
  function show(index, updateHash = true) {
    const e = examples[index];
    $('case-select').value = String(index);
    text('status', labels[index]);
    $('status').className = 'badge' + (index === 1 ? ' miss' : index === 2 ? ' unmapped' : '');
    text('case-meta', `Example ${e.number} of 4 · Target ${e.head} · ${e.angle_degrees}°`);
    text('case-title', e.title);
    text('interpretation', e.interpretation);
    $('evidence-figure').src = e.figure;
    $('evidence-figure').alt = `Saved example ${e.number}: ${e.title}. Image, predicted versus reference mask, known mesh and local 3D check.`;
    $('figure-link').href = e.figure;
    $('full-figure').href = e.figure;
    text('alarm', e.image_alarm ? 'Flagged' : 'No alarm');
    text('iou', `${(e.mask_iou * 100).toFixed(2)}%`);
    text('peak-hit', e.peak_on_target ? 'Yes' : 'No');
    text('reference', e.reference);
    text('pixel', `[${e.peak_xy.join(', ')}]`);
    text('xyz', e.world_xyz ? e.world_xyz.map(v => numeric(v)).join(', ') : 'Unavailable — no surface mapping');
    text('triangle', e.triangle_id == null ? 'None' : String(e.triangle_id));
    text('mapping-status', e.mapping_available ? 'Mapped to known surface' : 'Unmapped');
    text('weights', e.barycentric ? e.barycentric.map(v => numeric(v)).join(', ') : 'None');
    text('residual', e.reprojection_error_pixels == null ? 'Not applicable' : `${e.reprojection_error_pixels.toExponential(7)} pixels`);
    text('distance', e.distance_to_sampled_target == null ? 'Undefined' : `${numeric(e.distance_to_sampled_target)} normalized units`);
    text('score', `${e.image_score.toFixed(6)} / ${e.image_threshold.toFixed(6)} (score is not a probability)`);
    text('case-id', `${e.id} · target ${e.head} · ${e.policy} thresholds`);
    const mappedId = e.head === 'A' ? e.id.replace('damaged', 'intact') : e.id;
    $('correspondence-link').href = `mapping/${mappedId}.npz`;
    if (updateHash && window.history.replaceState) window.history.replaceState(null, '', `#case-${e.number}`);
    window.MJ_LOCALIZATION_STATE = {number:e.number, mapping_available:e.mapping_available, triangle_id:e.triangle_id, world_xyz:e.world_xyz};
  }
  $('case-select').addEventListener('change', event => show(Number(event.target.value)));
  const fromHash = () => {
    const match = location.hash.match(/^#case-([1-4])$/);
    if (match) show(Number(match[1]) - 1, false);
  };
  window.addEventListener('hashchange', fromHash);
  show(0, false);
  fromHash();
})();
