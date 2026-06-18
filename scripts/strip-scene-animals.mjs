import { readFileSync, writeFileSync } from 'node:fs'

// Remove the static "ambient animal" silhouettes baked into the v1 scene art.
// Live critters now roam/perch on the scenes, so these flat blobs are redundant
// and clash. Props (trees, logs, rooftops, lily pads, clouds) are kept.
const DIR = '/Users/anthonycontreras/Documents/Rosendin_Summer2026/Timelog/art/scenes'

const ANIMALS = {
  ocean: [
    '<ellipse cx="232" cy="250" rx="20" ry="13" fill="#0e3a4a"></ellipse><circle cx="252" cy="248" r="5" fill="#0e3a4a"></circle><ellipse cx="220" cy="262" rx="5" ry="3" fill="#0e3a4a"></ellipse><ellipse cx="244" cy="262" rx="5" ry="3" fill="#0e3a4a"></ellipse>'
  ],
  grassland: [
    '<ellipse cx="200" cy="320" rx="9.600000000000001" ry="4.800000000000001" fill="#6f5c30"></ellipse><circle cx="190.4" cy="316.8" r="3.2" fill="#6f5c30"></circle><rect x="190.4" y="320" width="2.4000000000000004" height="6.4" fill="#6f5c30"></rect><rect x="206.4" y="320" width="2.4000000000000004" height="6.4" fill="#6f5c30"></rect>',
    '<ellipse cx="230" cy="326" rx="8.399999999999999" ry="4.199999999999999" fill="#6f5c30"></ellipse><circle cx="221.6" cy="323.2" r="2.8" fill="#6f5c30"></circle><rect x="221.6" y="326" width="2.0999999999999996" height="5.6" fill="#6f5c30"></rect><rect x="235.6" y="326" width="2.0999999999999996" height="5.6" fill="#6f5c30"></rect>',
    '<ellipse cx="150" cy="316" rx="8.399999999999999" ry="4.199999999999999" fill="#6f5c30"></ellipse><circle cx="141.6" cy="313.2" r="2.8" fill="#6f5c30"></circle><rect x="141.6" y="316" width="2.0999999999999996" height="5.6" fill="#6f5c30"></rect><rect x="155.6" y="316" width="2.0999999999999996" height="5.6" fill="#6f5c30"></rect>'
  ],
  desert: [
    '<ellipse cx="150" cy="402" rx="14" ry="6" fill="#7a4e30"></ellipse><circle cx="162" cy="396" r="4" fill="#7a4e30"></circle><path d="M138,402 L120,398" stroke="#7a4e30" stroke-width="3" fill="none"></path><path d="M150,408 L146,418 M156,408 L160,418" stroke="#7a4e30" stroke-width="2.5" fill="none"></path>'
  ],
  wetland: [
    '<circle cx="180" cy="398" r="5" fill="#e8d6e0" opacity="0.9"></circle>',
    '<path d="M240,300 V250 Q240,238 248,236" stroke="#2f4038" stroke-width="3" fill="none"></path><circle cx="249" cy="233" r="5" fill="#2f4038"></circle><path d="M252,233 L266,231" stroke="#2f4038" stroke-width="2" fill="none"></path><ellipse cx="236" cy="300" rx="12" ry="7" fill="#2f4038"></ellipse><path d="M236,307 V338 M242,307 V338" stroke="#2f4038" stroke-width="2" fill="none"></path>'
  ],
  mountain: [
    '<ellipse cx="170" cy="352" rx="12" ry="6" fill="#2a3742"></ellipse><circle cx="160" cy="348" r="4" fill="#2a3742"></circle><rect x="162" y="354" width="2.5" height="9" fill="#2a3742"></rect><rect x="176" y="354" width="2.5" height="9" fill="#2a3742"></rect><path d="M158,346 Q154,342 156,338" stroke="#2a3742" stroke-width="2" fill="none"></path>'
  ],
  tundra: [
    '<ellipse cx="110" cy="356" rx="16" ry="12" fill="#3f5170"></ellipse><ellipse cx="110" cy="348" rx="12" ry="9" fill="#586a8a"></ellipse><circle cx="110" cy="344" r="3" fill="#2c3a54"></circle>'
  ],
  city: [
    '<ellipse cx="40" cy="316" rx="11" ry="5" fill="#0d1322"></ellipse><circle cx="48" cy="312" r="4" fill="#0d1322"></circle><rect x="34" y="316" width="2.4" height="7" fill="#0d1322"></rect><rect x="46" y="316" width="2.4" height="7" fill="#0d1322"></rect>'
  ],
  swamp: [
    '<circle cx="208" cy="400" r="5" fill="#e2d2c0" opacity="0.85"></circle>',
    '<circle cx="150" cy="356" r="2.6" fill="#b6f07a" opacity="0.95"></circle><circle cx="161" cy="356" r="2.6" fill="#b6f07a" opacity="0.95"></circle>'
  ],
  cave: [
    '<path d="M81,150 Q86,145 90,150 Q94,145 99,150" stroke="#0d0b14" stroke-width="2.4" fill="none" stroke-linecap="round"></path>',
    '<path d="M211,130 Q216,125 220,130 Q224,125 229,130" stroke="#0d0b14" stroke-width="2.4" fill="none" stroke-linecap="round"></path>',
    '<path d="M151,180 Q156,175 160,180 Q164,175 169,180" stroke="#0d0b14" stroke-width="2.4" fill="none" stroke-linecap="round"></path>'
  ],
  volcano: [
    '<ellipse cx="96" cy="408" rx="12" ry="8" fill="#140c0e"></ellipse><circle cx="106" cy="402" r="4" fill="#140c0e"></circle><path d="M108,402 L128,386" stroke="#3a2a1a" stroke-width="2" fill="none" stroke-linecap="round"></path><circle cx="128" cy="384" r="3" fill="#ffce7a" opacity="0.9"></circle>'
  ],
  sky: [
    '<ellipse cx="160" cy="250" rx="13" ry="9" fill="#8a6f96"></ellipse><circle cx="170" cy="246" r="4" fill="#8a6f96"></circle><polygon points="150,248 130,240 150,254" fill="#8a6f96"></polygon><polygon points="170,248 190,240 170,254" fill="#8a6f96"></polygon>'
  ],
  forest: [
    '<circle cx="232" cy="384" r="12" fill="#11211a"></circle><ellipse cx="232" cy="398" rx="16" ry="8" fill="#11211a"></ellipse>'
  ],
  jungle: [
    '<circle cx="110" cy="250" r="9" fill="#0c1c12"></circle><ellipse cx="110" cy="262" rx="8" ry="11" fill="#0c1c12"></ellipse><path d="M110,248 Q92,220 84,206" stroke="#0c1c12" stroke-width="3.5" fill="none"></path><circle cx="117" cy="247" r="2" fill="#0c1c12"></circle>',
    '<circle cx="220" cy="210" r="9" fill="#0c1c12"></circle><ellipse cx="220" cy="222" rx="8" ry="11" fill="#0c1c12"></ellipse><path d="M220,208 Q202,180 194,166" stroke="#0c1c12" stroke-width="3.5" fill="none"></path><circle cx="227" cy="207" r="2" fill="#0c1c12"></circle>'
  ]
}

let totalRemoved = 0
const misses = []
for (const [id, subs] of Object.entries(ANIMALS)) {
  const path = `${DIR}/${id}.svg`
  let svg = readFileSync(path, 'utf8')
  let removed = 0
  for (const sub of subs) {
    if (svg.includes(sub)) {
      svg = svg.replace(sub, '')
      removed++
      totalRemoved++
    } else {
      misses.push(`${id}: substring not found`)
    }
  }
  if (!svg.startsWith('<svg') || !svg.endsWith('</svg>')) {
    throw new Error(`${id}.svg malformed after strip`)
  }
  writeFileSync(path, svg, 'utf8')
  console.log(`${id}: removed ${removed}/${subs.length}`)
}
console.log(`\ntotal animal groups removed: ${totalRemoved}`)
if (misses.length) {
  console.log('MISSES:')
  for (const m of misses) console.log('  ' + m)
}
