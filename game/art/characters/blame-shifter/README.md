# Reference avatar replacement

The user-supplied avatar guides the swept black hair, rectangular sunglasses with star reflections, stern mouth, black short-sleeve shirt, blue pants and neckband earphones. The character keeps the existing `blame_shifter` identity, affinity and dialogue rules.

- `concept.png`: AI-generated design turnaround; this is concept art, not a screenshot of the mesh.
- `portrait-render.png`: actual 3D model render used to create the in-game portrait.
- `in-game-preview.png`: actual game screenshot.
- `rig-hammer-preview.png`: actual mesh with its hammer reaction running.
- `asset.json`: model metrics and embedded animation names.
- Runtime mesh: `game/public/models/blame_shifter_rigged.glb` (52 bones, normalized skin weights, 8 animation clips, PBR materials, about 1 MB).
- Runtime portrait: `game/public/portraits/blame_shifter.jpg`.

Rebuild: `node game/scripts/build-cool-coworker.mjs`. The generator uses the packaged skeleton's joint names and builds the replacement geometry, skin binding, materials and clips. It updates the model manifest and asset report. The mesh has no texture dependency; the web loader preserves its skin instead of flattening its geometry. The WeChat build packages the same mesh.

Local 3D inspection: run `npm --prefix game run dev`, then open `/character-preview.html`; buttons play the bone animation clips. `/character-preview.html?portrait` provides a portrait framing. The ordinary Vite release does not add this inspection page as an entry point.
