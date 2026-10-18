# Science Lab integration

Science Lab lives at `/science-lab/` as a self-contained static activity collection. The approved student experience is imported from Site source commit `344509259910d62508f7dd7ff1635d12cb86f178`. No private Site settings or hosting manifest are imported. All equipment graphics and code are local; students do not need a ChatGPT account or access to the private prototype.

## Entry points

The homepage's existing Science tile leads to the Science hub, which now features Science Lab. The biology, life-science, chemistry, physics, physical-science, Earth/space, environmental-science, and STEM pages offer relevant direct lab links. Global navigation and the homepage tile layout stay as they are. The Science Lab library has links back to Teach Arcade and Science.

## Student investigations

| Route below `/science-lab/` | Guided investigation |
| --- | --- |
| `circuit-investigation.html` | Circuit design and repeated current measurements |
| `chemistry-investigation.html` | Unknown-acid titration |
| `biology-investigation.html` | Tissue osmosis |
| `earth-investigation.html` | Ground cover and captured sediment |
| `pendulum-investigation.html` | Pendulum length and period |
| `density-investigation.html` | Unknown-metal density |
| `rate-investigation.html` | Temperature and fixed-endpoint reaction time |

The library also retains ten quick explorations. Teacher guides, optional calculation/writing support, advanced circuit mode, and reports remain included. The existing resource-discovery build includes the seven guided investigations as simulations, without promoting teacher pages, advanced mode, or empty browser-local reports as separate student activities. The sitemap generator picks up indexable HTML automatically; the browser-local report page is explicitly `noindex,follow`.

## Saved work

Progress remains in `localStorage` in the same browser and origin. No teacher roster, central submission, or student accounts are introduced. Data saved on the private `chatgpt.site` prototype will not appear automatically on Teach Arcade or a Vercel preview because browser storage is origin-specific. Reports should be downloaded before changing devices/origins. Student names typed into printable reports are not persisted.

## Maintenance and checks

Maintain the integrated source under `public/science-lab/`. The models, controllers, shared item catalog, and writing/report helpers remain separate. The lab CSS does not load the site's global CSS, preserving the tested layout; subject entry cards use the separately scoped `assets/science-lab-entry.css`.

Run:

- `npm run test:science-lab` for model, interaction, navigation, report, metadata, and discovery checks.
- `npm run build` for the site's normal static build, content index, sitemap, and robots output.

The interaction suites use simulated DOMs. They do not verify real Safari/Chrome layout, touch behavior, or browser print pagination. Real-browser and classroom testing are still needed before treating those surfaces as verified. Synthetic/model data and scientific limitations stay explicitly identified in each lab.
