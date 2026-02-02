# Sequence Breaker — Rule Pack Notes

This folder contains a lightweight pattern engine for Sequence Breaker. Rule packs are defined in `game.js` as generator functions that return:

```
{
  tiles: Array<Tile>,
  oddIndex: number,
  rule: string,
  oddExplanation: string
}
```

Each tile is a small object describing how to render the tile. The renderer in `game.js` handles four existing types:

- `number` → renders a numeric value
- `color` → renders a color tile using `tile.color`
- `shape` → renders a CSS shape using `tile.shape` (`circle`, `square`, `triangle`)
- `direction` → renders a rotating arrow using `tile.rotation`

## Adding a new rule pack

1. Add a generator function that matches the return shape above.
2. Register it in the `RULE_GENERATORS` map.
3. Add the rule key to the `rules` array in one or more mode configs.

### Example

```js
const generateSizeRound = (count) => {
  const sizes = [20, 24, 28, 32];
  const tiles = Array.from({ length: count }, (_, i) => ({
    type: "shape",
    shape: "circle",
    size: sizes[i % sizes.length]
  }));

  const oddIndex = Math.floor(Math.random() * count);
  tiles[oddIndex].size = sizes[(oddIndex + 2) % sizes.length];

  return {
    tiles,
    oddIndex,
    rule: "Circles grow by a steady size step.",
    oddExplanation: "The odd circle jumps to the wrong size."
  };
};
```

If you add new render rules, update the tile renderer inside `renderTiles()` to support the new tile properties.
