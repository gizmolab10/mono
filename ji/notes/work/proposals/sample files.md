# Sample files — what a fair one is, and where to get one

Testing builds a file of every kind out of a handful of bytes. That is enough while nothing in ji looks inside a file. It stops being enough the day ji starts extracting words: a picture that is only the few bytes saying "I am a picture" has no writing on it to find, and a book with no chapters proves nothing about reading a book.

So: what does a fair sample of each kind have to hold, and where would one come from?

**Read the second half with suspicion.** Every place named below is from memory — I have opened none of them from here. Treat each as a lead to check, not a fact. The first half is not guesswork: what a sample must hold follows from what extracting words has to do.

## What a sample has to survive

Extracting words means three different jobs, and each asks for something different:

- **Stripping the styling to leave the words** — a web page, rich text, a drawing, a Word file, a book. A fair sample holds words *and* plenty that is not words: styling, a header and a footer, a table, a log (words in the file that were never meant to be shown). If the stripping only ever meets a plain paragraph, nothing proves it drops the rest.
- **Reading the pages** — a pdf. Several real pages, a heading and a paragraph, and one page whose words are a photograph of words rather than words. That last one is the case that quietly hands back nothing at all.
- **Reading writing off a picture, and turning speech into words** — pictures, clips, sound. Writing that can actually be read, or a sentence actually spoken. A blank picture and a silent clip both sail through and prove nothing.

Two more things hold for all of them. Each sample needs its **answer written down beside it** — the exact words it contains — so testing can compare rather than shrug. And each has to be **small**, since the whole set travels with the project and is read every time testing runs.

## What is each kind?

| Kind                         | What makes it valid                                                                                                   | Where one might come from                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| plain words, markdown        | a heading, a list, an accented letter                                                                                 | write one by hand                                                                   |
| tables (all eighteen kinds)  | two sheets under different names, a sum, an empty cell, a comma inside a quoted value                                 | make them here in Numbers and Excel; the two oldest kinds may have no source at all |
| web page, drawing, rich text | words wrapped in styling, plus a table and a log                                                                      | write one by hand                                                                   |
| Word files                   | a heading, a footnote, a table, a header and footer                                                                   | make them here, or the test samples kept by the Apache POI project                  |
| pdf                          | several pages, a heading, and one page of scanned words                                                               | the test samples kept by pdf.js, or the ones the PDF Association publishes          |
| pictures                     | one with legible writing on it, one plain, and the awkward pair — a see-through background, a photo lying on its side | the PngSuite set for the odd ones; make the written-on ones here                    |
| clips and sound              | a few seconds, one clearly spoken sentence, written down beside it                                                    | the test samples kept by FFmpeg; or say one sentence into a microphone here         |
| books                        | two chapters, a contents page, one word in italics                                                                    | the samples the W3C publishes; the Kindle kinds only by making them with Calibre    |

## The decision this forces

A real pdf with pages cannot be built out of a handful of bytes in the test code. At that point the samples stop being built and start being **files kept on disk beside the tests**. Three things come with that: the project grows (so keep every sample to a few tens of thousands of bytes), each file needs a line saying where it came from and what it may be used for, and testing has to read from disk instead of building.

What I'd do: one folder of samples, and beside it a small file naming each one's source, its terms of use, and the words it holds. The kinds that are nothing but words go on being built in the test code — no reason to keep a file on disk to hold one sentence.

## Future

None of this is worth building before extracting words exists. The note is here so that work can start without stopping to ask where a fair pdf comes from.

## Glossary

- **extracting words** — getting a file's words out of it, so the model can read them. Three jobs, named above.
- **pdf** — the page-faithful document kind, the one that looks the same everywhere and is usually read rather than edited.
- **markdown** — plain words with a few marks that mean "heading" or "list"; these notes are written in it.
- **rich text** — words with styling saved alongside them, in the older exchange kind most word processors can open.
- **log** — words carried inside a file that were never meant to be shown; a note from whoever wrote it.
- **Apache POI, pdf.js, FFmpeg** — long-running free projects that read Word files, pdfs, and clips. Each keeps a pile of files it tests itself against; those piles are the leads above.
- **PngSuite** — a well-known collection of small pictures built to break picture-readers, one oddity each.
- **W3C** — the body that writes the rules for web pages and for the common book kind, and publishes samples of them.
- **Calibre** — a free program for making and converting books; the only way I know to produce the Kindle kinds.
