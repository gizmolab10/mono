#!/bin/bash
# PostToolUse hook: check for jargon in console.log/comments (.ts) and prose (.md)
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_response.filePath // ""')
NEW=$(echo "$INPUT" | jq -r '.tool_input.new_string // .tool_input.content // ""')

# Only check .md files and console.log/comment lines in .ts files
if [[ "$FILE" == *.md ]]; then
  CHECK="$NEW"
elif [[ "$FILE" == *.ts ]]; then
  CHECK=$(echo "$NEW" | grep -E '(console\.log|^[[:space:]]*//)' || true)
else
  exit 0
fi

[ -z "$CHECK" ] && exit 0

if echo "$CHECK" | grep -qiE '(fi_key|occ_face|ep_key|clip_identity|edge_points|prev_clip_end|used_fi_keys|OccFaceRef|ClipInterval|EndpointID|ComputedEdgeSeg|TopologyInput|TopologyOutput|OccludingFace|VisibleClip|matched_by_face|fi_on_edge|fi_matched_edges|poly_edge_idx|occ_face_key|edge_full)'; then
  MATCH=$(echo "$CHECK" | grep -oiE '(fi_key|occ_face|ep_key|clip_identity|edge_points|prev_clip_end|used_fi_keys|OccFaceRef|ClipInterval|EndpointID|ComputedEdgeSeg|TopologyInput|TopologyOutput|OccludingFace|VisibleClip|matched_by_face|fi_on_edge|fi_matched_edges|poly_edge_idx|occ_face_key|edge_full)' | head -3 | tr '\n' ', ')
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUse\",\"additionalContext\":\"PLAIN ENGLISH VIOLATION: You just wrote jargon: ${MATCH}. Redo the edit using readable names and plain descriptions. Console logs must use SO names (ALPHA, BETA), edge labels (CG, F'G'), and short sentences. MD files must use plain English throughout.\"}}"
fi