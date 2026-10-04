# Sources

Every religious text shown in Lahza is fetched by code from one of the platforms below and shown verbatim. No model writes, completes or corrects a verse, a hadith or a definition.

## Texts

| Source | What is taken | How it is used | Terms |
|---|---|---|---|
| [quranenc.com](https://quranenc.com) (Noble Qur'an Encyclopedia) | The Arabic text of the Qur'an in Uthmani script; the English translation of Rowwad Translation Center (`english_rwwad`); the Urdu translation of Muhammad Junagarhi (`urdu_junagarhi`) | Verse index for the factory's search (6236 verses), and the verses shown in journeys with their translation | One of the organiser's platforms; text and translations used as published, with the translation key and version stored beside each verse |
| [hadeethenc.com](https://hadeethenc.com) (Encyclopedia of Translated Prophetic Hadiths) | Hadith text, its grade and attribution as stated by the source, English and Urdu translations | A hadith is used only if the source grades it sahih and it has both translations | One of the organiser's platforms; used as published |
| [terminologyenc.com](https://terminologyenc.com) (Encyclopedia of Islamic Terms) | Definitions of terms in Arabic with English and Urdu translations | Supports definitions only, never rulings | One of the organiser's platforms; used as published |
| Organiser's MCP server (`mcp.islamiccontent.org`) | Hadith search | Finding hadith ids during the factory's research step; the text itself is fetched from hadeethenc.com | As provided for the challenge |

Each stored source keeps its URL, the date it was fetched and a SHA-256 hash of the Arabic text and translations (`content_hash`). `npm run check:factory:all` re-computes the hashes.

**Display notes.** Verses are shown in Amiri Quran; four Uthmani marks are mapped to their standard Unicode characters for display only (see `lib/text/uthmani.ts`); the stored text is unchanged. Footnote markers such as `[80]` in translations are hidden because the footnotes themselves are not shown.

## Fonts

| Font | Licence | Use |
|---|---|---|
| Amiri Quran | SIL Open Font License 1.1 (`app/fonts/OFL-AmiriQuran.txt`) | Verse text |
| IBM Plex Sans, IBM Plex Sans Arabic | SIL Open Font License 1.1 | Interface |

The King Fahd Complex Uthmanic font was not used because its licence does not clearly permit hosting it.

## Test data

| Data | Licence | Use |
|---|---|---|
| Qur'an QA 2023 shared task, Task A (AyaTEC v1.2) | CC BY-NC-ND 4.0 | Retrieval test only, as published. Not stored in this repository: the script downloads it when run. A machine-translated sample of its questions made for one experiment is not published either. |
| Umm al-Qura table 1446–1450, from the `hijri-converter` library | the library's own licence | Reference for the calendar check |
| Generated test sets (`content/eval`, `docs/pre-challenge/heavy-tests/data`) | Project's own, generated with `google/gemini-2.5-flash` | Guard, verifier and routing tests. Labelling errors by the generator are noted beside the results. |

## Models

Listed in the README. All are called through OpenRouter under its terms and each provider's terms; no model weights are distributed with this project.
