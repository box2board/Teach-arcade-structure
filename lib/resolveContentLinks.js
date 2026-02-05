const normalizeText = (value) =>
  value
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value) =>
  normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);

const unique = (values) => Array.from(new Set(values.filter(Boolean)));

const matchesMapping = (item, mapping) => {
  const match = mapping.match || {};
  if (match.id && item.id === match.id) return true;
  if (match.canonicalUrl && item.canonicalUrl === match.canonicalUrl) return true;
  if (match.titleEquals && item.title.toLowerCase() === match.titleEquals.toLowerCase()) {
    return true;
  }
  if (match.titleIncludes && item.title.toLowerCase().includes(match.titleIncludes.toLowerCase())) {
    return true;
  }
  return false;
};

const buildSlugPhrase = (slug) => slug.replace(/-/g, " ");

const buildExpandedKeywords = (slug, keywords) => {
  const expanded = new Set(keywords);
  const slugPhrase = buildSlugPhrase(slug);
  expanded.add(slugPhrase);
  if (slug === "world-war-i") expanded.add("wwi");
  if (slug === "world-war-ii") expanded.add("wwii");
  return Array.from(expanded);
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasPhraseMatch = (text, phrase) => {
  if (!phrase) return false;
  const regex = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "i");
  return regex.test(text);
};

const scoreCandidate = ({ itemText, itemTokens, canonicalUrl }, slug, keywords) => {
  let score = 0;
  const slugPhrase = buildSlugPhrase(slug);
  if (canonicalUrl.includes(slug)) score += 0.4;
  if (slugPhrase.includes(" ")) {
    if (hasPhraseMatch(itemText, slugPhrase)) score += 0.5;
  } else if (itemTokens.includes(slugPhrase)) {
    score += 0.5;
  }
  const keywordMatches = keywords.filter((keyword) => {
    if (!keyword) return false;
    if (keyword.includes(" ")) {
      return hasPhraseMatch(itemText, keyword);
    }
    return itemTokens.includes(keyword);
  });
  if (keywordMatches.length) score += Math.min(0.3, 0.1 * keywordMatches.length);
  return Math.min(score, 1);
};

const resolveMatches = (item, candidates, threshold) => {
  const itemText = normalizeText([item.title, item.blurb, ...(item.keywords || [])].join(" "));
  const itemTokens = unique(tokenize(itemText));
  const matches = candidates
    .map(([slug, keywords]) => ({
      slug,
      score: scoreCandidate(
        { itemText, itemTokens, canonicalUrl: item.canonicalUrl || "" },
        slug,
        buildExpandedKeywords(slug, keywords),
      ),
    }))
    .filter((candidate) => candidate.score >= threshold)
    .sort((a, b) => b.score - a.score);

  if (matches.length > 3) {
    return [];
  }
  return matches.map((candidate) => candidate.slug);
};

export const resolveContentLinks = ({
  contentItems,
  contentMappings,
  pageTextMap,
  topicSubjectMap = {},
  threshold = 0.7,
} = {}) => {
  const topicCandidates = Object.entries(pageTextMap || {})
    .filter(([key]) => key.startsWith("topics/"))
    .map(([key, keywords]) => [key.replace("topics/", ""), keywords]);
  const subjectCandidates = Object.entries(pageTextMap || {})
    .filter(([key]) => key.startsWith("subjects/"))
    .map(([key, keywords]) => [key.replace("subjects/", ""), keywords]);

  return contentItems.map((item) => {
    const resolved = {
      ...item,
      subjects: Array.isArray(item.subjects) ? [...item.subjects] : [],
      topics: Array.isArray(item.topics) ? [...item.topics] : [],
      keywords: Array.isArray(item.keywords) ? [...item.keywords] : [],
    };

    const mapping = (contentMappings || []).find((entry) => matchesMapping(item, entry));
    if (mapping) {
      resolved.subjects = unique([...(mapping.subjects || []), ...resolved.subjects]);
      resolved.topics = unique([...(mapping.topics || []), ...resolved.topics]);
      resolved.keywords = unique([...(mapping.keywords || []), ...resolved.keywords]);
      return resolved;
    }

    const topicMatches = resolveMatches(resolved, topicCandidates, threshold);
    const subjectMatches = resolveMatches(resolved, subjectCandidates, threshold);

    resolved.topics = unique([...resolved.topics, ...topicMatches]);
    resolved.subjects = unique([...resolved.subjects, ...subjectMatches]);

    if (resolved.topics.length) {
      const inferredSubjects = resolved.topics
        .map((topic) => topicSubjectMap[topic])
        .filter(Boolean);
      resolved.subjects = unique([...resolved.subjects, ...inferredSubjects]);
    }

    return resolved;
  });
};
