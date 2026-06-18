# Sprite & habitat art prompts (for a specialized art AI)

These prompts are written so another AI produces **inline SVGs that drop straight into Timelog's pet system** with no reformatting. The hard part isn't the drawing — it's the *exact technical contract* below. Paste the **Format Contract** once, then one **Species Prompt** per critter. Habitat backdrop prompts are at the end.

When art comes back, plug it in with the **How to install** steps at the very bottom.

---

## Format Contract (paste this first, every time)

> Output **one self-contained inline SVG** and nothing else. Hard requirements:
>
> 1. Root element exactly: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" data-mood="idle" role="img" aria-label="<NAME> pet sprite">`. **No `width`/`height` attributes** (it scales to a 24–44px box).
> 2. **Forbidden** (they are stripped by a sanitizer and will break): `<script>`, `<style>`, `<image>`, `<foreignObject>`, `<a>`, `<iframe>`, any `on*` handler, any `href`/`xlink:href`, `<animate>`, external URLs, CSS classes for styling. Use only `<path>`, `<rect>`, `<circle>`, `<ellipse>`, `<polygon>`, `<g>`.
> 3. **Colors — use ONLY these three channels, never hardcoded hex:**
>    - Main body / head / limbs: `fill="currentColor"` (or `stroke="currentColor"`).
>    - Secondary accent (inner ears, cheeks, belly patch, sparkles, hearts): `fill="var(--pet-accent)"`.
>    - Eyes, mouth, brows, face strokes: `var(--pet-eye)` (fill or stroke).
>    This is mandatory — the app recolors sprites by overriding these three, so any literal hex makes the critter un-recolorable.
> 4. **Required structure**, in this order inside the root:
>    ```
>    <g id="tail"><path class="tail" .../></g>      (omit if the animal has no tail)
>    <g id="legs"><rect class="leg-back" .../><rect class="leg-front" .../></g>
>    <g id="body"> ... main body + head ... </g>
>    <g id="ears"> ... </g>                          (optional)
>    <g id="face"> ...the 8 mood layers (below)... </g>
>    ```
>    The classes `tail`, `leg-front`, `leg-back` are animated (wag/step) when the pet moves, so put the swinging/stepping parts there. For legless critters (fish, butterfly, bee), give `class="leg-front"`/`class="leg-back"` to fins/lower wings and `class="tail"` to a back fin/streamer so they still wiggle.
> 5. **Inside `<g id="face">` provide EXACTLY 8 mood layers**, each:
>    `<g class="mood m-<MOOD>" data-mood="<MOOD>"> ...expression... </g>`
>    for these 8 moods in order: `idle, focused, happy, celebrate, sleep, confused, tired, love`. Only one shows at a time. Each draws just the eyes/mouth/expression (the body stays put). Mood guide:
>    - **idle** — neutral round dot eyes.
>    - **focused** — narrowed/determined eyes (angled brows), small pupils.
>    - **happy** — `^ ^` eyes + a small smile.
>    - **celebrate** — star/sparkle eyes (`var(--pet-accent)`) + 1–2 sparkles floating near the head.
>    - **sleep** — closed downward-curve eyes + two/three "z" marks (`var(--pet-eye)`) rising to the upper-right.
>    - **confused** — one dot eye + one squiggle eye + a "?" near the head.
>    - **tired** — half-lidded eyes + small bags/lines under them.
>    - **love** — two heart eyes (`var(--pet-accent)`) + a content smile.
> 6. Keep all art within ~x:4–60, y:4–60. Put the **eyes near x≈26–40, y≈22–26** if possible — accessory overlays (glasses) and the perch look best when faces sit there.
> 7. Style: simple, rounded, friendly, flat — readable at 24px. Match a clean modern mascot look (think the reference cat below). Few clean paths, no gradients, no filters, no fine detail that disappears when tiny.

**Reference (the canonical, correct format):** the existing `src/renderer/src/assets/pets/cat.svg` in this repo follows the contract exactly — tell the art AI to mirror its structure. (Open it and paste it in as a worked example for best results.)

---

## Species roster (one prompt each)

Drawing direction only — append each to the Format Contract above. Target habitats match the Zoo grouping.

### Forest
- **Deer** (`id: deer`) — a small fawn: slender body on four thin `leg` rects, a short tail, two short antler nubs in `ears`, big gentle eyes, optional accent spots on the body via `var(--pet-accent)`. Soft, doe-eyed.
- **Owl** (`id: owl`) — a round, plump body (mostly head), two big forward eyes, a small triangular beak in `var(--pet-eye)`, two ear-tufts in `ears`, small `leg` talons, folded wings hinted on the body sides with `var(--pet-accent)`. No real tail (omit `tail`); give the wing tips `leg` classes.
- **Hedgehog** (`id: hedgehog`) — a low rounded body with a spiky upper back (a row of short triangles in `currentColor`), a little pointed snout, tiny `leg` feet, small round eyes, a soft pale belly in `var(--pet-accent)`.

### Ocean
- **Fish** (`id: fish`) — a teardrop body, a back **tail fin** with `class="tail"`, two side fins with `class="leg-front"`/`leg-back`, one big eye-pair on the head, gill curve + belly in `var(--pet-accent)`. Cute, rounded, not menacing.
- **Crab** (`id: crab`) — a wide oval shell body, two raised claws, several little legs along the bottom (use `leg-front`/`leg-back` on the front pair so they tap), two eyes on short stalks, accent claw tips / shell spots in `var(--pet-accent)`.
- **Turtle** (`id: turtle`) — a domed shell (with an accent shell-pattern in `var(--pet-accent)`), a small head poking forward, four stubby `leg` flippers, a tiny tail. Wholesome and slow.

### Sky
- **Butterfly** (`id: butterfly`) — a small body with two large wings; put the **lower wings** on `leg-front`/`leg-back` classes (so they flutter), upper wings on the body, wing patterns in `var(--pet-accent)`, tiny antennae, small eyes. Mostly wings.
- **Bee** (`id: bee`) — a round striped body (`currentColor` body + `var(--pet-accent)` stripes), two little wings (give them `leg` classes to buzz), tiny legs, big friendly eyes, small antennae.

> Want the full ~8–12 set in one go? Tell the art AI: *"Produce all of the above as separate SVGs, each independently following the Format Contract, sharing a consistent flat mascot style and identical 8-mood face conventions."*

---

## Species roster — the remaining habitats (to make them inhabitable)

These habitats have **scenes but no critters yet** (they show "coming soon" in the Zoo). Produce 2–3 species each, same Format Contract + 8 moods. Note the **`locomotion`** for each — `walk` (default, omit), `swim`, or `fly` — it drives behaviour on the panel/diorama (swimmers drift the whole tank, fliers favour the upper band and land on perches). After art lands, add each to `src/shared/species.ts` with its `locomotion`.

### Jungle
- **Monkey** (`id: monkey`, walk) — long-limbed, a curling `tail`, big round eyes, a pale face/belly in `var(--pet-accent)`, grabby `leg` hands. Playful.
- **Parrot** (`id: parrot`, **fly**) — plump bird, a hooked `var(--pet-eye)` beak, big folded wings on the body, two tail streamers as `tail`, `leg`-class wingtips so they flap, bright accent wing/cheek patches.
- **Snake** (`id: snake`, walk) — a coiled stacked body (no legs; give the head-end taper `leg-front` and the tail-tip `tail` so it sways), small eyes, a tiny forked tongue in `var(--pet-eye)`, accent belly scales.

### Grassland
- **Lion cub** (`id: lion`, walk) — round cub, a little mane hint in `var(--pet-accent)`, four `leg` paws, a tufted `tail`, warm round eyes.
- **Zebra** (`id: zebra`, walk) — pony body on four thin `leg`s, a short mane + `tail`, bold `var(--pet-accent)` stripes, gentle eyes.
- **Meerkat** (`id: meerkat`, walk) — upright slender body, little arms held to chest, a long `tail`, big alert eyes, a pale belly in `var(--pet-accent)`.

### Desert
- **Lizard** (`id: lizard`, walk) — low long body, splayed `leg` feet, a long `tail`, side eyes, accent dorsal markings.
- **Fennec fox** (`id: fennec`, walk) — small sandy fox with **oversized ears** in `ears`, a fluffy `tail`, big dark eyes, pale accent muzzle/belly.
- **Camel** (`id: camel`, walk) — tall body with one hump, long neck + small head, four thin `leg`s, sleepy lidded eyes, accent saddle blanket.

### Wetland
- **Frog** (`id: frog`, walk) — wide squat body, two big domed eyes on top, folded back `leg`s for hops, a pale throat in `var(--pet-accent)`. No tail.
- **Duck** (`id: duck`, **swim**) — rounded body, a small `var(--pet-accent)` bill, a perky `tail`, little webbed `leg` feet, a wing hint on the side.
- **Heron** (`id: heron`, **fly**) — slim tall bird, long neck in an S, a spear `var(--pet-eye)` beak, long folded wings (`leg` wingtips), thin trailing legs as `tail`.

### Swamp
- **Toad** (`id: toad`, walk) — lumpy wide body, hooded eyes, stubby `leg`s, warty texture via small accent bumps. No tail.
- **Gator** (`id: gator`, **swim**) — long low body + snout, ridged back (a row of small triangles), a thick swishing `tail`, side eyes on top, short `leg`s, accent belly.
- **Dragonfly** (`id: dragonfly`, **fly**) — slender body, **four long wings** (lower pair on `leg` classes to beat), huge compound eyes in `var(--pet-accent)`, a thin tail.

### Mountain
- **Goat** (`id: goat`, walk) — sturdy body, two curved `var(--pet-accent)` horns in `ears`, a little beard, four `leg`s, a short `tail`, calm eyes.
- **Eagle** (`id: eagle`, **fly**) — broad bird, a hooked `var(--pet-eye)` beak, big spread-able wings (`leg` wingtips), a fanned `tail`, fierce brows, accent head/talons.
- **Ram** (`id: ram`, walk) — woolly rounded body (curly `currentColor` fleece), two big spiral horns in `ears`, four `leg`s, a tiny `tail`.

### Cave
- **Bat** (`id: bat`, **fly**) — small fuzzy body, two big membrane wings (lower edges on `leg` classes to flap), tall `ears`, tiny fangs, big eyes; hangs/flies. Omit tail.
- **Mole** (`id: mole`, walk) — round velvety body, big digging `leg` claws up front, a tiny pink snout in `var(--pet-accent)`, squinty eyes, a stub `tail`.
- **Glowbug** (`id: glowbug`, walk) — a rounded beetle/grub with a **glowing accent belly** in `var(--pet-accent)`, six little legs (front pair as `leg`), short antennae, big friendly eyes.

### Volcano
- **Salamander** (`id: salamander`, walk) — sleek low body, a long `tail`, four `leg`s, glowing accent spots/stripes in `var(--pet-accent)`, bright eyes.
- **Lava slug** (`id: lavaslug`, walk) — a rounded gastropod, a glowing accent underside, two eye-stalks, a cracked-rock back texture; slow. Tail = trailing foot.
- **Phoenix** (`id: phoenix`, **fly**) — a graceful bird wreathed in flame-shaped feathers, big spread wings (`leg` wingtips), a long flame `tail`, accent fiery crest, warm eyes.

### Tundra
- **Penguin** (`id: penguin`, walk) — upright body, a pale `var(--pet-accent)` belly, little flipper arms (`leg` classes to waddle), webbed feet, a small beak, round eyes. No tail.
- **Seal** (`id: seal`, **swim**) — smooth torpedo body, front flippers (`leg`/`tail` for the rear), big dark eyes, whiskers, a pale accent belly.
- **Arctic fox** (`id: arcticfox`, walk) — fluffy white fox, a big bushy `tail`, small `ears`, dark nose/eyes, faint accent shading.

### City
- **Pigeon** (`id: pigeon`, **fly**) — plump city bird, an iridescent accent neck patch, folded wings (`leg` wingtips), a fanned `tail`, little eyes, small beak.
- **Raccoon** (`id: raccoon`, walk) — round body, a **masked face** (accent mask + ringed `tail`), nimble `leg` paws, big curious eyes.
- **Rat** (`id: rat`, walk) — small body, a long thin `tail`, round `ears`, a pointy snout with whiskers, a pale accent belly.

---

## Habitat scene prompts ("zoo sheets" — the diorama behind the critters)

These are the habitat **environments** — a coral reef, a forest creek, a savanna under a wide sky. They render behind the live critters on the panel and inside each Zoo diorama. **Environment only — do NOT draw animals or creatures in the scene.** The app now renders live, animated critters on top (they roam, swim, fly, and perch), so baked-in silhouettes clash and look flat next to them. *(The v1 scenes had static animal blobs — those have been stripped.)*

> Output one inline SVG, `viewBox="0 0 320 480"`, `preserveAspectRatio="xMidYMid slice"`, **no width/height**. No `<script>/<style>/<image>/<text>`, no external refs. Hardcoded hex is fine (scenes aren't recolored).
>
> 1. **No animals/creatures** — environment only.
> 2. **Depth — 3–4 layers with atmospheric perspective:** far layer hazy & desaturated (low contrast), midground clearer, foreground darkest & most detailed. **Avoid flat horizontal colour bands** — overlap shapes, vary the edges, and use gradients *within* a layer, not single flat fills.
> 3. **Texture & light:** grass tufts, dappled light, soft shadows, subtle highlights. Render the **hero prop** (tree / reef head / rooftop / cone) in 2–3 tones, not a flat silhouette.
> 4. **Composition:** cropped two ways (tall panel strip + short wide Zoo band), so keep signature props in the **center/lower-middle** and keep a relatively open **lower band** as the floor. Moderate overall contrast so foreground critters pop.
> 5. **Perch surfaces:** wherever a critter should sit — a branch, rooftop, lily pad, cloud, ledge — make it a clear, roughly **horizontal surface**. We pin a perch zone to its coordinates in `habitat-perches.ts`; move a prop and the zone gets re-aligned to match.

All 14 habitats are **live, wired slots** (`id` in parens) with real art in the app today. To replace one: drop the new `<id>.svg` into `art/scenes/` and run `node scripts/gen-habitats.mjs`. Environment notes per habitat:

- **Home** (`home`) — cozy interior: a warm window with light spilling in, a rug, a plant shelf, soft lamp glow. Warm neutrals.
- **Forest** (`forest`) — a creek/river winding through layered ferns and trees, dappled light; a mossy log + a fern clump as perch props. Mossy greens.
- **Jungle** (`jungle`) — dense layered canopy, hanging vines, big leaves, light shafts, faint mist; a sturdy vine/branch + a leaf as perches. Deep greens.
- **Grassland** (`grassland`) — rolling savanna, tall grass tufts, a lone acacia (hero prop + perchable branch), a warm low sun, distant hazy hills. Golden-greens.
- **Desert** (`desert`) — rippled dunes in receding layers, a couple of cacti (perchable tops), a big pale sun, heat haze. Warm sand/terracotta.
- **Wetland** (`wetland`) — reeds and still water, lily pads (perches) on the surface, low mist, soft reflections. Muted teal-greens.
- **Mountain** (`mountain`) — layered snow-capped peaks receding into haze, a snowy ledge/ridge (perches), pine hints, crisp light. Cool slate-blues.
- **Tundra** (`tundra`) — a snowfield under aurora/pale sky, drifting snow, an ice shard + snow ridge (perches), long shadows. Icy whites/blues.
- **Ocean** (`ocean`) — a coral reef with kelp and light rays, a sandy floor, a coral head (perch); depth fading downward. Layered teals/blues.
- **City** (`city`) — a night skyline of layered buildings with lit windows, a moon, flat rooftops (perches), warm window glow. Cool charcoal-blues.
- **Swamp** (`swamp`) — murky still water, gnarled mossy trees, a fallen log + lily pads (perches), low mist, dim shafts. Dark greens/browns.
- **Cave** (`cave`) — stalactites/stalagmites, glowing crystal clusters (a perch), a faint underground pool with reflections. Dark slate/violet + cyan glow.
- **Volcano** (`volcano`) — a smoking cone with a glowing crater, lava runnels, scorched rock ledges (perches), drifting ember haze. Charcoal + orange/red glow.
- **Sky** (`sky`) — soft layered clouds (perchable), a dawn/dusk gradient, faint stars, airy depth. Lavender/peach.

(These plug into `src/shared/habitats.ts` via the generator — they then show on the panel **and** in every Zoo diorama automatically.)

> Want still more habitats (coral lagoon, space, candy-land…)? Each new one is a small code change on my side — just name them.

---

## Interactive & animated environment elements

The app already layers **motion and interaction over every scene in code**, so you don't have to animate the SVG itself:

- **Ambient particles** per biome — fireflies, bubbles, embers, snow, spores, dust, twinkles (`src/shared/habitat-ambient.ts`).
- **Day/night lighting** — a tint that shifts with the hour (see below).
- **Tap-to-interact** — tapping a Zoo scene sends a biome-tinted ripple from the touch point.

To go further with **scene-specific motion** (rolling waves, a churning whirlpool, pouring magma, an erupting burst), provide those parts as **separate, tagged `<g>` layers** inside the scene SVG so we can transform them in code — **don't** bake animation in with `<animate>` (it's stripped). Tag each group `data-fx="<name>"`. Requested per habitat:

- **Ocean** — `data-fx="waves"` (rolling swells across the surface), `data-fx="whirlpool"` (a spiral over the floor), `data-fx="rays"` (god-rays). Tap → splash.
- **Volcano** — `data-fx="lava"` (glowing runnels down the cone), `data-fx="erupt"` (a burst at the crater), `data-fx="smoke"` (plume). Tap → eruption sparks.
- **Wetland / Swamp** — `data-fx="ripples"` (rings on the water), `data-fx="reeds"` (swaying reeds). Tap → ripple.
- **Sky** — `data-fx="clouds"` (cloud-bank layers drifting at different speeds). Tap → cloud puff.
- **Tundra / Mountain** — `data-fx="aurora"` (ribbon overhead), `data-fx="snowdrift"` (gusts).
- **Grassland / Jungle** — `data-fx="grass"` / `data-fx="canopy"` (foreground that bends in a breeze).
- **City** — `data-fx="windows"` (a few windows flickering on/off), `data-fx="traffic"` (faint street glow).
- **Cave** — `data-fx="crystals"` (pulsing glow), `data-fx="drip"` (occasional drip + pool ring).

Each `data-fx` group should be self-contained and positioned where it belongs; we drive the motion (translate/scale/opacity loops) and tap reactions from code, keyed off the tag.

---

## Day / night

Scenes are lit by an adjustable time-of-day tint (`src/shared/daynight.ts`): deep blue at night, warm pink at dawn, clear by midday, orange→violet at dusk. It follows the real clock by default and is adjustable from the Zoo (a time slider with an **auto** toggle). So author scene art as a **neutral, daytime** environment — don't bake in a fixed sunset/night; the tint handles time of day. For intrinsically dark biomes (**city**, **cave**, **volcano**) keep the baked lighting subtle so the wash still reads.

---

## How to install returned art

**A species SVG** → save to `src/renderer/src/assets/pets/<id>.svg`, then in `src/renderer/src/pets/registry.ts`:
1. `import <id>Svg from '../assets/pets/<id>.svg?raw'`
2. add `<id>: <id>Svg` to the `SPECIES_SVG` map.

…and in `src/shared/species.ts` add a catalog entry:
```ts
{ id: '<id>', name: '<Name>',
  habitat: '<home|forest|jungle|grassland|desert|wetland|mountain|tundra|ocean|sky>',
  base: { body: '#hex', accent: '#hex', eye: '#14131a' }, weight: 8,
  locomotion: 'walk' /* | 'swim' | 'fly' — optional, defaults to 'walk' */ }
```
That's it — the variant engine, Zoo, and party rendering pick it up automatically (lower `weight` = rarer to roll). `locomotion` drives behaviour on the panel: `walk`ers stroll the floor, perch on the clock, and pause to forage; `swim`mers and `fly`ers drift in 2-D (fliers favour the upper band and can land on a perch).

**A habitat backdrop SVG** → drop the `<id>.svg` into the art folder and run `node scripts/gen-habitats.mjs` to regenerate `src/shared/habitats.ts`, or paste its markup into the matching `*_SCENE` constant there. (Update the `SRC` path at the top of the script to wherever the art lands.)

**Perchable props** → pets hop up and sit on scene props (branches, rooftops, lily pads, clouds…). These spots are *data*, not baked into the art: edit `src/shared/habitat-perches.ts` and add a `PerchZone` `{ x, y, w, h, on }` per prop, in the same 320×480 scene coordinates (the zone's **top edge** is where the feet land). `HabitatBackdrop` paints an invisible, pixel-aligned overlay and `PetLayer` discovers them by `[data-perch]` — so when you refresh a scene, nudge its perch zones to match the new prop positions.

Verify with `npm run typecheck && npm test` and eyeball via `npm run dev` (open the Zoo with the `zoo ✦` button, and the critter appears in its habitat section + can be set as a companion).
