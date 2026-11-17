# Elementary Teach Arcade Originals

The collection adds 100 public sets and 2,000 questions. Each set has 20 questions, four choices per item and five correct keys in each answer position.

| Grade | Math | ELA | Science | Social Studies | Life Skills | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| K | 4 | 4 | 3 | 3 | 1 | 15 |
| 1 | 5 | 4 | 3 | 3 | 1 | 16 |
| 2 | 5 | 4 | 3 | 3 | 1 | 16 |
| 3 | 5 | 4 | 3 | 3 | 1 | 16 |
| 4 | 6 | 4 | 4 | 4 | 0 | 18 |
| 5 | 5 | 5 | 4 | 4 | 1 | 19 |
| **Total** | **30** | **25** | **20** | **20** | **5** | **100** |

The two K–1 Life Skills sets have primary grades K and 1. The two grades 2–3 sets have primary grades 2 and 3. The grades 4–5 set has primary grade 5. The grade-band filter finds these sets for planning across those grades.

## Where the collection lives

- [Catalog and metadata](../question-bank/elementary/manifest.json)
- [Canonical questions and answer keys](../question-bank/elementary)
- [Editable source items and metadata](../scripts/elementary-content)
- In a local or preview build, open `/teacher/sets/?view=originals&band=elementary`. Search accepts title, grade, topic, keywords and standards identifiers. Teachers can preview all 20 items and follow the existing game links.

## Integration and import

The repository already separates Teach Arcade Originals from teacher-owned Supabase sets. Originals use the shared file-backed Review Lab catalog. Teacher-created originals, copied drafts, saved community shortcuts, and visibility are managed through the existing teacher endpoints and row-level policies. The account editor can add and edit questions on a private copy. The current library has no cross-set merge control.

A bank keeps its existing schema version and adds optional catalog metadata. The stable set ID uses the `elementary--<subject>--<grade>--<topic>` namespace. Item IDs are unique within a set. The JSON `correctAnswer` is a zero-based index (A = 0, D = 3). The existing loader maps it to the game's `answer` field. New banks are explicitly labeled public, with Teach Arcade as creator. Only repository edits can change official files. When a teacher makes a copy, the existing create endpoint uses the signed-in owner and database defaults for a private draft.

There is no SQL seed, table, migration, policy change, or requirement to connect Supabase to build or browse Originals. The static publish step is the import. It overwrites files and rewrites the index deterministically using stable IDs and source hashes.

```sh
# Rebuild canonical JSON and hashes after changing the authored source items
python3 scripts/elementary-content/build.py
# Import canonical banks into the existing static catalog
node scripts/build-question-bank.mjs
node scripts/test-elementary-question-bank.mjs
node scripts/test-question-bank.mjs
node scripts/test-ela-question-bank.mjs
node --test scripts/test-teacher-sets.mjs
npm run build
```

The build ships 487 static file-based sets, including the 387 pre-existing files. The three legacy JavaScript banks also remain available. Game routing and multiplayer lobbies use their existing contracts.

## Ohio alignment and classroom use

Identifiers in the metadata indicate practice connections. A multiple-choice set does not measure an entire performance expectation, including the ability to plan investigations, produce writing, construct models, or carry out oral tasks. The English Language Arts references use Ohio's revised 2026 document. The department identifies 2026–27 as the ELA transition year and 2027–28 as the first implementation year. The Ohio 2026 social studies references use the official grade and numbered content statement. District implementation is anticipated in 2027–28.

| Requested placement | Alignment and classroom use |
| --- | --- |
| Kindergarten shapes and patterns | Shape properties connect to K.G.4. Repeating patterns are enrichment within this set. |
| K–1 letter, sound, rhyme, and word recognition | The prompts are text-based. Teachers can read the stimulus and options aloud for beginning sounds and rhyming so these work as listening tasks. |
| Grade 1 clocks and coins | Hours, half-hours, pennies, and dimes support Ohio 1.MD.3. The grade 2 set introduces nickels, quarters, coin collections and five-minute clock readings. |
| Grade 1 seasons | Grade 1 review of daily and seasonal observations introduced in Ohio kindergarten science. |
| Grade 2 life cycles and Earth’s surface | Life-cycle sequence and landform recognition are enrichment for the requested grade under Ohio's course organization. Grade 2 Ohio life science instead emphasizes organism-driven change and evidence of past life. Ohio 4.ESS.1 revisits landform identification with deeper expectations. |
| Grade 2 states of matter | Supports introductory observation of matter and its changes. It is practice, with freezing, melting, evaporation and condensation examples that can also support later grades. |
| Grade 3 forces, weather and climate, and ecosystems | Motion and climate have NGSS topic connections where verified. The Ohio grade 3 physical science scope includes matter and forms of energy. Ecosystem roles prepare for Ohio's more detailed grade 5 ecosystem and food-web work. |
| Grade 4 adaptations, electricity and magnetism | Adaptations include an NGSS structure/function connection. Simple circuits practice Ohio 4.PS.2. The magnetism items broaden that circuit set with enrichment. |
| Grade 5 matter and Earth’s systems | Tagged with relevant NGSS connections. Parts reinforce Ohio grade 4 matter conservation and Earth-surface work. |
| Grade 1 national holidays and grade 2 community types | Holidays are a civics enrichment set. Ohio 2026 addresses urban, suburban, and rural communities explicitly in grade 3, so the grade 2 community set can serve as an introduction. |
| Grade 5 Colonial America, American Revolution, U.S. Government Foundations and Westward Expansion | Kept at the requested reading and challenge level. Use as review or enrichment in Ohio grade 5, where the 2026 standards focus on the Western Hemisphere. Revolution and government foundations connect most directly to Ohio grades 4 and 8. Westward expansion, Manifest Destiny, and removal are most explicitly addressed in grade 8. |

### References

- [Ohio Learning Standards for Mathematics](https://education.ohio.gov/Topics/Learning-in-Ohio/Mathematics/Ohio-s-Learning-Standards-in-Mathematics)
- [Ohio Learning Standards for English Language Arts and implementation schedule](https://education.ohio.gov/Topics/Learning-in-Ohio/English-Language-Art/English-Language-Arts-Standards)
- [Ohio Learning Standards and Model Curriculum for Science](https://education.ohio.gov/Topics/Learning-in-Ohio/Science/Ohios-Learning-Standards-and-MC)
- [Ohio Learning Standards for Social Studies, 2018 and 2026 versions](https://education.ohio.gov/Topics/Learning-in-Ohio/Social-Studies/Ohio-s-Learning-Standards-for-Social-Studies)
- [NGSS performance expectations](https://www.nextgenscience.org/search-standards)
- [National Archives founding documents](https://www.archives.gov/founding-docs)
- [National Museum of the American Indian, Native Knowledge 360° Essential Understandings](https://americanindian.si.edu/nk360/about/essential-understandings)
- [Myaamia Center, Miami University and Miami Tribe of Oklahoma](https://miamioh.edu/centers-institutes/myaamia-center/)
- [National Park Service, Hopewell Earthworks](https://www.nps.gov/places/hopewell-earthworks.htm) and [Trail of Tears](https://www.nps.gov/trte/index.htm)
- [CDC hygiene guidance](https://www.cdc.gov/respiratory-viruses/prevention/hygiene.html)

## Validation and test results

- 100 banks and 2,000 questions passed structure, single-key, answer uniqueness, normalized duplicate prompt, source/static consistency, and metadata checks. The duplicate check includes the existing Originals as comparison data. The verification recalculates the 600 math keys using JavaScript arithmetic independently of the Python exact-fraction build. Where the question tests a definition, unit conversion, digit or shape fact, the source states the value or its derivation for review. Maximum prompt length was 237 characters and maximum choice length was 92.
- Content review addressed reading level, misleading wording, multiple plausible options, and mismatches with grade-level standards. A second independent classroom or editorial review has not occurred.
- The 100 sets resolve in all eight compatible Review Lab games. The common question deck and Category Clash board checks confirm correct-key remapping for shuffled choices. The existing teacher-set API tests use mocked requests and cover the create path for an independent private copy of an elementary Original.
- Chromium browser QA used the existing library and Category Clash. Grade 2 ELA was found by grade, subject, topic, difficulty, and keyword and showed all 20 previews with four choices each. Kindergarten Math Counting to 20, Grade 2 ELA Short Passages and Text Evidence, Grade 3 Science Pushes, Pulls, and Changes in Motion, Grade 4 Social Studies Native Nations, Places, and Living Cultures, and Grade 5 Math Multi-Step Problems with Decimals and Fractions each loaded a 20-item board. Three selections per set exercised correct and incorrect feedback and returning to the board. Six Grade 2 passage questions rendered with their choices without horizontal overflow at a 375 px content viewport.
- No live database access, teacher data edits, production merge, or production deployment was requested or performed. Staging verification with a teacher account should confirm authenticated copy, edit, and save before release. The linked browser preview validates the public workflow and game integration.

## Local review

Run `python3 -m http.server 8080 --directory public` and open `http://localhost:8080/teacher/sets/?view=originals&band=elementary`. Static hosting covers browsing, question previews, game launch, and gameplay. Teacher account actions require the existing API and Supabase configuration for a staging environment.
