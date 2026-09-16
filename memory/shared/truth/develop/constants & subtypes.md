# Constants & subtypes

## constants ladder

built 2026, August 8

The table above is history now. Every type below uses the same words, and the styling names match: `--font-tiny`, `--gap-tiny`, `--thick-small`.

| type➜  | thick | gap   | radius | font | size  | height | width | fw  | em  |
| ------ | ----- | ----- | ------ | ---- | ----- | ------ | ----- | --- | --- |
| micro  |       | 1.3   |        |      |       |        |       |     |     |
| faint  | 0.56  | 1.94  |        | 8.75 |       |        |       |     |     |
| tiny   |       | 3.89  | 10     | 10.4 |       | 2.19   | 50    |     | .03 |
| small  | 0.78  | 4.32  | 11.67  | 11.7 | 19.69 | 17.07  | 245   |     | 1.4 |
| normal | 1.11  | 7.78  | 17.5   | 13   | 21.88 | 21.88  | 300   | 550 | 2   |
| big    | 1.67  | 9.72  |        | 14   | 24.5  | 28.44  | 350   | 650 | 8   |
| fat    | 2.22  | 16.33 |        | 17.5 | 28    | 42     | 605.5 |     |     |
| huge   | 7.78  | 38.89 |        | 24.5 |       |        |       | 750 |     |

## prior constants

The names of subtypes of measurement types are completely inconsistent. They can easily be standardized, reducing the need to open the file of constants to make sure i am using the right one. The first column below are my proposed subtypes. The other columns are the names of subtypes, each column being a type.

| type➜  | sep   | thick  | gap     | corner | font    | size      | height   | width   | fw     | em       |
| ------ | ----- | ------ | ------- | ------ | ------- | --------- | -------- | ------- | ------ | -------- |
| micro  |       |        | micro   |        |         |           |          |         |        |          |
| faint  |       | faint  | details |        | credit  |           |          |         |        |          |
| tiny   | nrmal |        | tight   | banner | label   |           |          |         |        | tracking |
| small  | big   | mild   | small   | build  | control | svg       |          | details |        | small    |
| normal | huge  | normal | default | main   | base    | control   | control  | window  | normal | launch   |
| big    |       | bold   |         |        | banner  | hamburger | hideable | content | banner | big      |
| fat    |       | fat    | fat     |        | large   | button    | banner   | modal   |        |          |
| huge   |       |        | huge    |        | huge    |           |          |         | title  |          |
