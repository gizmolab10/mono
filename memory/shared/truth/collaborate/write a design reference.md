# Write a design reference

The first step — analyze the file. If it is NOT fully implemented, STOP.

A design reference is a truth: the current design of one concept, as it is today, for a reader who builds against it. Rules for rewriting a file into one.

1. The first line says what the thing is and what it is for, present tense.
2. Every sentence states what holds today. A date, a decided, a built, a waits for go, a proof, a risk and a road not taken all go: decisions.md and the logs hold them.
3. Steps, checkboxes and questions go. What a step built is said as the design. What is not decided is not in the file: it goes to `zone/questions.md`.
4. Order: what it is, its parts, what each part does, where two parts meet. Where two pieces of code meet, say api and table the functions. Keep every table.
5. A part is named by what it does, in the code's own name. Every other term is plain, in a lexicon, or defined in the same write.
6. One concept per file. What belongs to another concept is a link, never a second telling.
7. A `Not:` line names what the concept is not, as the lexicon's entries do.
8. The voice guide's cutting pass, first person and one line per paragraph apply. The file's kind label follows its kind of truth.
