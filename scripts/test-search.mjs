import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const html = await readFile(new URL("../public/search.html", import.meta.url), "utf8");
const normalize = html.match(/    function normalizeText\(s\)\{[\s\S]*?\n    \}/)?.[0];
const synonyms = html.match(/    const SYNONYMS = \{[\s\S]*?\n    \};/)?.[0];
const boosts = html.match(/    const TYPE_BOOST = \{[^\n]+/)?.[0];
const queryStops = html.match(/    const QUERY_STOP_WORDS = new Set\([\s\S]*?\n    \]\);/)?.[0];
const scoring = html.match(/    function expandQuery\(normQ\)\{[\s\S]*?(?=\n    function computeTypeCounts)/)?.[0];
const searchHelpers = html.match(/    function getResultFamilyKey\\(rec\\)\\{[\\s\\S]*?(?=\\n    \\/\\/ ---------- main ----------)/)?.[0];
assert.ok(normalize && synonyms && boosts && queryStops && scoring && searchHelpers, "search ranking functions should be present");

const context = vm.createContext({});
vm.runInContext(`${normalize}\n${synonyms}\n${boosts}\n${queryStops}\n${scoring}\n${searchHelpers}\nglobalThis.api={normalizeText,expandQuery,scoreRecord,dedupeSearchResults,pickBestMatches};`, context);
const { normalizeText, expandQuery, scoreRecord, dedupeSearchResults, pickBestMatches } = context.api;
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


const wwiQuery = query("World war i");
const trenchRun = record({
  title: "WWI Trench Run | World War I Review Game",
  description: "A World War I review game about trenches and the Treaty of Versailles.",
  tags: ["topic:world-war-i", "format:game"],
  type: "game",
  url: "/arcade-review-games/social-studies/wwi-trench-run/"
});
const trenchScore = scoreRecord(trenchRun, wwiQuery);
assert.ok(trenchScore >= 900, "a fully indexed Trench Run title should be a strong World War I match");
const rankedCandidates = [
  { ...record({ title: "World War I Topic", type: "topic", url: "/subjects/world-war-i/" }), _score: 1800 },
  { ...record({ title: "War Horse Guide", type: "resource", url: "/movie-guides/guides/war-horse/" }), _score: 1500 },
  { ...record({ title: "War Horse Interactive Guide", type: "resource", url: "/movie-guides/guides/war-horse/interactive/" }), _score: 1400 },
  { ...record({ title: trenchRun.title, type: "game", url: "/arcade-review-games/social-studies/wwi-trench-run/" }), _score: 1300 },
  { ...record({ title: trenchRun.title, type: "game", url: "/arcade-review-games/social-studies/wwi-trench-run-engine-v1/" }), _score: 1250 },
  { ...record({ title: "WWI Trench Run v2", type: "game", url: "/arcade-review-games/social-studies/wwi-trench-run-v2/" }), _score: 1200 },
  { ...record({ title: "Unrelated Game", type: "game" }), _score: 500 }
];
const deduped = dedupeSearchResults(rankedCandidates);
assert.equal(deduped.filter(item => item.type === "game" && item.title === trenchRun.title).length, 1,
  "duplicate Trench Run routes with the same title should collapse to one result");
assert.equal(deduped.filter(item => item.url.includes("/war-horse")).length, 1,
  "print/interactive/teacher resource routes should collapse to one family result");
const bestMatches = pickBestMatches(deduped, wwiQuery);
assert.ok(bestMatches.some(item => item.title === trenchRun.title),
  "a strong game should appear in broad World War I Best matches");
assert.ok(bestMatches.some(item => item.type === "resource" && item.title === "War Horse Guide"),
  "the strongest relevant resource should appear beside the topic and game result");
assert.equal(bestMatches.filter(item => item.type === "game").length, 1,
  "broad topic searches should not use multiple Best matches slots for the same content type");
assert.ok(!bestMatches.some(item => item.title === "Unrelated Game"),
  "a weak unrelated game must not be promoted into Best matches");
const gameIntentMatches = pickBestMatches(deduped, query("World war i game"));
assert.ok(gameIntentMatches.every(item => item.type === "game"),
  "explicit game searches should show multiple relevant games rather than type-diverse results");

console.log("PASS: search relevance, aliases, multiword intent, and strong game visibility are covered.");
