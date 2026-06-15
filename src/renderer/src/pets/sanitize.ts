/**
 * Sanitize a user-uploaded SVG before it gets inlined into the DOM. We inline
 * (rather than <img>) so pets can theme + animate, which means we must strip
 * anything executable: scripts, event handlers, external/javascript refs,
 * <style>, <foreignObject>, raster <image>, and links. Returns clean <svg>
 * markup, or null if the input isn't a usable SVG.
 */
export function sanitizePetSvg(raw: string): string | null {
  if (!raw || raw.length > 100_000) return null

  const doc = new DOMParser().parseFromString(raw, 'image/svg+xml')
  if (doc.querySelector('parsererror')) return null
  const svg = doc.querySelector('svg')
  if (!svg) return null

  svg
    .querySelectorAll('script, foreignObject, a, iframe, image, style, animate, set')
    .forEach((el) => el.remove())

  const scrub = (el: Element): void => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim().toLowerCase()
      if (name.startsWith('on')) el.removeAttribute(attr.name)
      else if ((name === 'href' || name === 'xlink:href') && !value.startsWith('#')) {
        el.removeAttribute(attr.name)
      } else if (value.includes('javascript:')) el.removeAttribute(attr.name)
    }
  }
  scrub(svg)
  svg.querySelectorAll('*').forEach(scrub)

  if (!svg.getAttribute('viewBox')) svg.setAttribute('viewBox', '0 0 64 64')
  // Drop fixed dimensions so the sprite scales to the pet container.
  svg.removeAttribute('width')
  svg.removeAttribute('height')

  return svg.outerHTML
}
