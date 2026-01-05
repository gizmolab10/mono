#!/bin/bash

echo "=== Running Full Test Suite ==="
echo ""

echo "Phase 1: Testing fix-links tool..."
bash notes/tools/docs/test.sh
PHASE1_RESULT=$?

echo ""
echo "Phase 2: Testing merge-files tool..."
bash notes/tools/docs/test-merge.sh
PHASE2_RESULT=$?

echo ""
echo "=== Test Suite Results ==="
if [ $PHASE1_RESULT -eq 0 ] && [ $PHASE2_RESULT -eq 0 ]; then
  echo "✅ All tests PASSED"
  exit 0
else
  echo "❌ Some tests FAILED"
  [ $PHASE1_RESULT -ne 0 ] && echo "  - Phase 1 (fix-links) failed"
  [ $PHASE2_RESULT -ne 0 ] && echo "  - Phase 2 (merge-files) failed"
  exit 1
fi
