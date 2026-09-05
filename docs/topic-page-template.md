# Standard topic pages

Use [`public/subjects/social-studies/world-history/ancient-egypt.html`](../public/subjects/social-studies/world-history/ancient-egypt.html) as the reference implementation. Topic pages are static HTML and use the shared rules in `public/assets/topic-page.css`; do not copy a legacy filter-only page without adapting it to this teacher-first order.

## Information required

Before creating a page, provide:

- topic name and URL slug;
- parent subject and, where applicable, its subject branch (for example, Social Studies → World History);
- a short, one-sentence teacher-facing hero description;
- verified existing resources, including their actual URL, type, behavior, and a short accurate description;
- a concise set of major concepts teachers can use; and
- two to four related **existing** topic pages.

Inspect every attached resource before describing it. Never invent cards, types, features, or coming-soon resources.

## Page and metadata checklist

1. Follow the parent subject’s established route convention. World History topic pages are flat `.html` files under `public/subjects/social-studies/world-history/`.
2. Add a unique title, meta description, self-referencing canonical URL, Open Graph fields, and Twitter card fields. Use the standard Teach Arcade social image unless a verified topic image exists.
3. Include exactly one descriptive `h1` in a compact `.topic-heading` hero. Use a short, readable description; the H1 must remain dominant and resources must stay near the top.
4. Load `/assets/styles.css` followed by `/assets/topic-page.css`. Use `standard-topic-page`, `topic-heading`, `topic-section`, and the shared card classes rather than adding page-local layout CSS.
5. Order content as: visual breadcrumbs; compact topic hero; featured existing Teach Arcade resources; concise teaching points; optional **Try This in Class**; related topics; parent-subject return link. Prioritize Teach Arcade resources over general informational text.
6. Render a resource section only when it contains at least one verified, existing Teach Arcade resource. Never show an empty container, placeholder card, “Coming Soon,” or “No resources yet” message.

## Relationships and breadcrumbs

- Build visual breadcrumbs using the site’s `.breadcrumbs` convention, starting at Home and including every real parent page. Mark the final topic with `aria-current="page"`.
- Add matching `BreadcrumbList` JSON-LD with absolute production URLs and sequential positions. Breadcrumb schema is required; add no other schema unless the page content genuinely supports it.
- Add the topic to the parent subject’s visible card/list and any real structured `ItemList` on that page.
- Add reciprocal links from featured resources when appropriate. Update `data/contentMappings.js` so indexed resources receive the topic slug, while retaining their subject assignments.
- Related-topic links are optional when no strong, live destinations exist. Keep the set small and descriptive.

## Optional sections

Teaching concepts, **Try This in Class**, additional resource groups, and related topics should appear only when they add real teacher value. Teaching cards should use short headings and generally one or two concise sentences containing only the most useful classroom context.

Use the optional **Try This in Class** section for one short, actionable way to extend a featured resource through discussion, reflection, or another instructional move. Mark it up as a `.topic-section.try-this-in-class` with an accessible heading; omit the entire section when there is no meaningful idea.

The H1/introduction, at least one verified resource, parent connection, metadata, visual/schema breadcrumbs, and subject discovery path are required for a complete indexable topic destination. If a particular resource category has no verified items, omit its heading and container completely.

## Sitemap, indexes, and validation

The build scans indexable HTML automatically: do not hand-edit `public/sitemap.xml`. `npm run build` regenerates the sitemap and synced content data. A standard subject-path page is also discovered by the search-index conventions; resource topic assignments come from `data/contentMappings.js` and the generated content index.

Run:

```bash
npm run build
npm run audit
```

Then verify the new route and every linked resource in a local static server at desktop and phone widths. Confirm one H1, a self-referencing canonical, unique title/description, valid JSON-LD, reciprocal resource links, parent-subject discovery, no broken links, and inclusion in `public/sitemap.xml` plus the applicable generated content/index files.
