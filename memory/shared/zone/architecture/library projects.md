# organization of libraries

To make my projects easier to begin and share UX features and improvements, I want to introduce libraries. currently `core` is in use

- [ ] core
    - [ ] panel
        - [ ] filter tree
            - [ ] ws
            - [ ] ov
            - [ ] mu
        - [ ] gallery
            - [ ] lv
            - [ ] mj
- [ ] create mj (gallery of girls) -> mj.jonathansand.me
- [ ] [[incorporating a project]]

## true library encapsulation

Proposal, 10 September 2026 — each project imports only the one it sits under in the chain above, and nothing further up. Two places in the code differ from that today: gallery imports core directly, not panel, and lv and mj import both gallery and core, each through its own bridge.

**What changes, in order.**

1. **panel's bridge grows.** panel's `Core.ts` takes on every line gallery and gallery's hosts need from core: the sizes, the colors, Preferences, the hits manager and its Point, the hamburger, the section and separator, the stack, the tooltip, debug. A bridge is then also what a library offers onward.
2. **gallery imports panel.** Its bridge to core, `Core.ts`, becomes a bridge to panel, `Panel.ts`, one line per thing, and every gallery file that imported `../common/Core` imports `../common/Panel`. gallery's tsconfig and vite config name the `panel` alias.
3. **lv and mj import gallery alone.** Each deletes its `Core.ts`, and its `Gallery.ts` carries every line it needs, core's things included, from gallery's bridge. Every file that imported `../ts/common/Core` imports `../ts/common/Gallery`. mj's `Main.ts` takes core's stylesheet through gallery's, by an import at the top of Gallery.css.
4. **The alias tests narrow.** Each host proves that only `Gallery.ts` and `Main.ts` name an alias, and that the alias is gallery's.

**Built so far, 10 September 2026.** gallery imports panel for its page, through `Panel.ts`, and lv carries the panel alias for its build. gallery still imports core directly for everything else, and lv and mj still import core for theirs.

**What cannot change.** An alias is read by the build, not by a file, and a host's build compiles the whole chain. So every host's tsconfig and vite config carry all three aliases, `core`, `panel` and `gallery`, while its code names only gallery. The encapsulation is in the code, and [libraries](libraries.md) says so in its first rule.

**Not in this proposal.** gallery's page becoming panel's three parts, the controls row, the details column and the operation view, in place of the page gallery draws today, the sidebar, the md file and the status line. And mj taking its four panel files through gallery rather than holding them. Both wait on the Importing proposal in [incorporating a project](incorporating%20a%20project.md).

**Success criteria.** No file under lv's or mj's `src` names `core/` or `panel/`. No file under gallery's `src` names `core/`. Every check, test and build passes, and lv and mj draw exactly as today.

**Cost.** panel's bridge, about twenty lines. gallery, one file renamed and about twelve import lines. lv and mj, one file deleted and about fifteen lines in the other bridge each, ten imports re-pointed, two aliases added to two configs each. Two alias tests rewritten. One line in libraries.md.
