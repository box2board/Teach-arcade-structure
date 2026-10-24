# Teacher Tools: Soft Mint Flat Arcade tiles

All 17 navigation cards on `/tools/` use the approved Flat Arcade style and the same Soft Mint background, `#DDF3E6` (option B in the approved Spin the Wheel comparison).

Artwork uses bold navy outlines, simple centered blue/teal/gold objects, and restrained cel shading. Each tool has a distinct illustration generated separately with the built-in image generator and the approved comparison board as the style reference. Exact prompts and destinations are recorded in `teacher-tool-flat-prompts.json`.

The illustrations are transparent cutouts so `teacher-tool-tile-art.css` supplies exactly the same mint color to every card. Keep transparency when replacing or exporting an illustration. WebP exports live at `public/assets/images/tools/<id>-flat-{384,768}.webp`, in 384 × 256 and 768 × 512 sizes.

Card titles, descriptions, beta status, destination links, and section organization remain real HTML. Images have empty alt text because the enclosing link already has a visible tool title and description. Responsive source selection, reserved image dimensions, lazy loading, and a visible keyboard focus indicator keep the cards usable across screen sizes.
