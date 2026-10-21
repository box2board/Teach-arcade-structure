import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const html = await readFile(new URL("../public/search.html", import.meta.url), "utf8");
const normalize = html.match(/    function normalizeText\(s\)\{[\s\S]*?\n    \}/)?.[0];
const synonyms = html.match(/    const SYNONYMS = \{[\s\S]*?\n    \};/)?.[0];
const boosts = html.match(/    const TYPE_BOOST = \{[^\n]+/)?.[0];
const queryStops = html.match(/    const QUERY_STOP_WORDS = new Set\([\s\S]*?\n    \]\);/)?.[0];
const scoring = html.match(/    function expandQuery\(normQ\)\{[\s\S]*?(?=\n    function computeTypeCounts)/)?.[0];
assert.ok(normalize && synonyms && boosts && queryStops && scoring, "search ranking functions should be present");

const context = vm.createContext({});
vm.runInContext(`${normalize}\n${synonyms}\n${boosts}\n${queryStops}\n${scoring}\nglobalThis.api={normalizeText,expandQuery,scoreRecord};`, context);
const { normalizeText, expandQuery, scoreRecord } = context.api;
const record = ({ title, description = "", tags = [], subject = "", type = "game", url = "/game/" }) => ({
  title, description, tags, subject, type, url,
  _titleNorm: normalizeText(title), _descNorm: normalizeText(description),
  _urlNorm: normalizeText(url), _tagsNorm: normalizeText(tags.join(" ")),
  _subjectNorm: normalizeText(subject)
});
const query = text => {
  const norm = normalizeText(text);
  return { norm, ...expandQuery(norm) };
};

assert.equal(scoreRecord(record({ title: "Algebra City Run" }), query("holocaust")), 0,
  "unmatched records must not receive baseline relevance points");
assert.ok(scoreRecord(record({ title: "World War II Review Adventure" }), query("wwii")) > 0,
  "known whole-query aliases should find matching titles");
assert.equal(scoreRecord(record({ title: "Water Cycle" }), query("art")), 0,
  "tokens must match word boundaries rather than substrings");
assert.equal(scoreRecord(record({ title: "World War II" }), query("world algebra")), 0,
  "multiword queries must not return records matching only one term");
assert.equal(scoreRecord(record({ title: "Classroom Review Game" }), query("for")), 0,
  "stopword-only queries must not trigger generic description matches");
assert.ok(scoreRecord(record({ title: "Algebra Review Game", tags: ["keyword:linear equations"] }), query("algebra")) > 0,
  "new structured keyword metadata should participate in search");

const index = JSON.parse(await readFile(new URL("../public/search-index.json", import.meta.url), "utf8"));
const searchIndex = text => index
  .map(item => {
    const prepared = record({
      title: item.title,
      description: item.description,
      subject: item.subject,
      tags: item.tags || [],
      type: item.type,
      url: item.url
    });
    return { ...item, _score: scoreRecord(prepared, query(text)) };
  })
  .filter(item => item._score >= 145)
  .sort((a, b) => b._score - a._score);
const holocaustResults = searchIndex("holocaust");
assert.ok(holocaustResults.some(item => item.title.includes("Schindler")),
  "curated topic keywords should make relevant classroom materials discoverable");
assert.ok(holocaustResults.every(item => item.title.includes("Schindler")),
  "a specific historical term should not expand into unrelated WWII resources");
assert.equal(searchIndex("for").length, 0, "generic stopwords should not populate results");
console.log("PASS: search excludes unmatched items, respects word boundaries and multiword intent, and supports aliases and structured keywords.");
