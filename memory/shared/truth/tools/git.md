# Git Recipes

Common git operations for fixing mistakes.

## Move commit from wrong branch to correct branch

When you accidentally push to the wrong branch:

1. **Get the commit hash**
   ```bash
   git log <wrong-branch> -1 --oneline
   ```

2. **Cherry-pick onto correct branch**
   ```bash
   git checkout <correct-branch>
   git cherry-pick <commit-hash>
   git push origin <correct-branch>
   ```

3. **Remove from wrong branch**
   ```bash
   git checkout <wrong-branch>
   git reset --hard HEAD~1
   git push origin <wrong-branch> --force
   ```

**Note:** Force push rewrites history. If others pulled the branch, they'll need to reset their local copy.

**If you have uncommitted changes:** Stash first (`git stash`), then `git stash pop` after cherry-pick.
