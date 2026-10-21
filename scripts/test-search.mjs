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
assert.ok(scoreRecord(record({ title: "World War I", type: "topic" }), query("World war 1")) > 0,
  "Arabic and Roman numeral spellings should find the same World War I topic");
assert.ok(scoreRecord(record({ title: "World War I", type: "topic" }), query("ww1")) > 0,
  "WWI abbreviations should find the World War I topic");
assert.equal(scoreRecord(record({
  title: "War Horse Movie Guide",
  description: "A printable classroom movie guide.",
  subject: "World History"
}), query("World war i")), 0,
  "a multiword query must not be assembled from unrelated title and subject fields");
assert.equal(scoreRecord(record({ title: "Water Cycle" }), query("art")), 0,
  "tokens must match word boundaries rather than substrings");
assert.equal(scoreRecord(record({ title: "World War II" }), query("world algebra")), 0,
  "multiword queries must not return records matching only one term");
assert.equal(scoreRecord(record({ title: "Classroom Review Game" }), query("for")), 0,
  "stopword-only queries must not trigger generic description matches");
assert.ok(scoreRecord(record({ title: "Algebra Review Game", tags: ["keyword:linear equations"] }), query("algebra")) > 0,
  "new structured keyword metadata should participate in search");

console.log("PASS: search excludes unmatched items, respects word boundaries and multiword intent, and supports aliases and structured keywords.");
