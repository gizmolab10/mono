# Dimension placement — current code flow

How `run_new_placement` in `src/lib/ts/render/Dimension_Placement.ts` turns a scene into a list of placed dimensions, paint by paint. Every box on the diagram maps to a real function in that file.

## High-level

```mermaid
flowchart TD
  Paint([paint]) --> Reach[compute_reachable_regions]
  Reach --> Pairs[compute_viable_pairs]
  Pairs --> Editing{is dim<br/>editor open?}
  Editing -- yes --> ReProj[re_project_persisted_list]
  Editing -- no --> Viab[compute_viability vs persisted]
  Viab --> Skip{skip search?}
  Skip -- yes, all<br/>persisted viable --> ReProj
  Skip -- no, partial<br/>or drift safety --> Cold[Cold search]
  Cold --> Greedy[greedy_seed_for_regions]
  Greedy --> Retry[retry_pass]
  Retry --> Stoch[stochastic_finish]
  ReProj --> Build[Build no-viable list<br/>= expected − placed]
  Stoch --> Build
  Build --> Dedup[drop_duplicates rule 4]
  Dedup --> Drop[apply_drop_policy]
  Drop --> Polish[polish_pass<br/>re-pick surviving labels]
  Polish --> Persist[persistence.remember_all]
  Persist --> Log[log_dim_summary +<br/>per-paint traces]
  Log --> Result([placements + drop_report])
```

## Inside compute_viable_pairs

For every visible smart object, every axis allowed by the repeater filter, every silhouette edge along that axis, every adjacent-face direction.

```mermaid
flowchart TD
  Start([compute_viable_pairs]) --> Hull[compute_combined_hull<br/>+ per-part hulls]
  Hull --> LoopSO[for each smart object]
  LoopSO --> Vis{is_visible_for_dim?}
  Vis -- no --> NextSO[next SO]
  Vis -- yes --> Class[classify_so:<br/>regular / template /<br/>fireblock / clone]
  Class --> Elig{eligible?}
  Elig -- no --> NextSO
  Elig -- yes --> Occ[Build occluder list<br/>= other parts]
  Occ --> LoopAxis[for each allowed axis]
  LoopAxis --> Edges[silhouette_edges_along_axis]
  Edges --> LoopEdge[for each edge]
  LoopEdge --> ProjW{both endpoints<br/>projectable?}
  ProjW -- no --> CountProj[bump<br/>edges_projection_broken]
  ProjW -- yes --> Short{edge length<br/>≥ WITNESS_CLEARANCE_PX?}
  Short -- no --> CountShort[bump<br/>edges_too_short]
  Short -- yes --> Dirs[two_face_outward_directions:<br/>2 dirs, one per adjacent face,<br/>each tagged front/back]
  Dirs --> CamFilter[passes_camera_axis_filter:<br/>drop dirs within 30° of forward]
  CamFilter --> LoopDir[for each surviving direction]
  LoopDir --> Pair[compute_pair_ranges]
  Pair --> POK{ok?}
  POK -- yes --> Keep[append Viable_Pair]
  POK -- no --> CountDir[bump direction<br/>reject counter by reason]
  Keep --> NextDir[next direction]
  CountDir --> NextDir
  NextDir --> NextEdge[next edge]
  NextEdge --> NextAxis[next axis]
  NextAxis --> NextSO
```

## Inside compute_pair_ranges (one edge + one direction)

Returns `{ok: true, pair}` or `{ok: false, reason}`. Reasons feed the diagnostic counters.

```mermaid
flowchart TD
  Start([compute_pair_ranges]) --> ProjOff{project v1+dir, v2+dir<br/>both ok?}
  ProjOff -- no --> Fail1[reason:<br/>projection_degenerate]
  ProjOff -- yes --> WitMag{witness magnitudes<br/>non-degenerate?}
  WitMag -- no --> Fail1
  WitMag -- yes --> WitMin[exit_t = max over<br/>per-part hulls]
  WitMin --> MinCheck{witness_length_min<br/>≤ WITNESS_CAP_PX?}
  MinCheck -- no --> Fail2[reason:<br/>silhouette_too_far]
  MinCheck -- yes --> RangeCheck{witness_length_max<br/>≥ witness_length_min?}
  RangeCheck -- no --> Fail3[reason:<br/>witness_range_empty]
  RangeCheck -- yes --> Conv[witness_trapezoid_gap<br/>at the larger-angle corner]
  Conv --> ConvCheck{gap ≥<br/>WITNESS_CLEARANCE_PX?}
  ConvCheck -- no --> Fail4[reason:<br/>witnesses_converge]
  ConvCheck -- yes --> SlideCheck{slidable_max ><br/>slidable_min?}
  SlideCheck -- no --> Fail5[reason:<br/>slidable_range_empty]
  SlideCheck -- yes --> Ok[return Viable_Pair<br/>with is_front_facing flag]
```

## Inside pick_best_placement (per part-axis greedy step)

Hard front-face preference: try all front-facing pairs first; fall back to back-facing only if no front-facing pair yields a viable candidate.

```mermaid
flowchart TD
  Start([pick_best_placement]) --> Split[Split region.pairs into<br/>front and back groups]
  Split --> Front[for each front pair]
  Front --> FrontCand[best_candidate_in_pair]
  FrontCand --> FrontKeep{keep if<br/>min_clearance better?}
  FrontKeep --> NextFront[next front pair]
  NextFront --> AnyFront{any front<br/>candidate found?}
  AnyFront -- yes --> ReturnFront([return front best])
  AnyFront -- no --> Back[for each back pair]
  Back --> BackCand[best_candidate_in_pair]
  BackCand --> BackKeep{keep if<br/>min_clearance better?}
  BackKeep --> NextBack[next back pair]
  NextBack --> AnyBack{any back<br/>candidate found?}
  AnyBack -- yes --> ReturnBack([return back best])
  AnyBack -- no --> ReturnNull([return null])
```

## Inside best_candidate_in_pair (one pair, 5x5 grid sample)

Walks a 5x5 grid of (witness_length, slidable_position) values within the pair's ranges. Skips forbidden zones around each witness anchor and any candidate whose label rectangle is inside the combined silhouette outline. Scores the rest and returns the highest-scoring candidate.

```mermaid
flowchart TD
  Start([best_candidate_in_pair]) --> Loop[5x5 grid sample of<br/>witness_length × slidable]
  Loop --> Forbid{slide in either<br/>forbidden zone?}
  Forbid -- yes --> Next[next sample]
  Forbid -- no --> Center[compute label center]
  Center --> Hull{label corners<br/>≥ SILHOUETTE_MARGIN_PX<br/>outside combined hull?}
  Hull -- no --> Next
  Hull -- yes --> Clear[min_distance_to_placed]
  Clear --> Score[score = clearance<br/>+ front-face bonus<br/>− witness-length penalty<br/>+ between-bonus<br/>− centering parabola]
  Score --> Best{better than<br/>current best?}
  Best -- yes --> Update[update best]
  Best -- no --> Next
  Update --> Next
  Next --> Done{all samples<br/>tried?}
  Done -- no --> Loop
  Done -- yes --> Return([return best or null])
```

## Inside apply_drop_policy

Three drop reasons, applied in order. The iterative third pass picks the label with the most conflicts each iteration.

```mermaid
flowchart TD
  Start([apply_drop_policy]) --> Stage1[Stage 1:<br/>add no_viable_pair_labels to dropped]
  Stage1 --> Stage2[Stage 2:<br/>drop any label whose rectangle<br/>extends past canvas edge]
  Stage2 --> Conflicts[find_conflicts_in_placement]
  Conflicts --> Loop{any conflicts<br/>remain?}
  Loop -- no --> Return([return drop_report])
  Loop -- yes --> Counts[count conflicts per label]
  Counts --> Pick[pick label with most conflicts<br/>tie-break: alphabetical ancestry]
  Pick --> Drop[drop that label]
  Drop --> Conflicts
```

## Persistence flow across paints

Each paint's placements feed the next paint's `compute_viability`.

```mermaid
flowchart TD
  Prev([previous paint's placements]) --> Remember[persistence.remember_all]
  Remember --> Stored[(persistence map)]
  Next([next paint]) --> Get[persistence.get_all]
  Stored --> Get
  Get --> Check[compute_viability per persisted label:<br/>strict / tolerance / fail]
  Check --> AllOK{all within<br/>tolerance?}
  AllOK -- yes --> Skip[skip_search:<br/>re-project all persisted]
  AllOK -- no --> Mark[mark labels as<br/>locked or free]
  Mark --> ColdRun[cold_run:<br/>greedy on free,<br/>locked stay put]
```
