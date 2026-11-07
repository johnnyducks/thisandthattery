/*
 * Placeholder product art: 1940s poster-style SVGs.
 * Swap for real product photography once the affiliate feed is wired up:
 * the renderer calls TT_ART.render(product) and drops the result inside a frame.
 */
(function () {
  let uid = 0;

  function backdrop(id, bg) {
    // Sunburst rays + halftone dots, the classic 40s poster ground.
    const rays = [];
    for (let i = 0; i < 24; i++) {
      const a1 = (i / 24) * Math.PI * 2, a2 = ((i + 0.5) / 24) * Math.PI * 2;
      rays.push(`M200 250 L${200 + Math.cos(a1) * 700} ${250 + Math.sin(a1) * 700} L${200 + Math.cos(a2) * 700} ${250 + Math.sin(a2) * 700}Z`);
    }
    return `
      <defs>
        <pattern id="dots${id}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="4.5" cy="4.5" r="1.6" fill="#000" opacity=".16"/>
        </pattern>
        <radialGradient id="vig${id}" cx="50%" cy="45%" r="70%">
          <stop offset="55%" stop-color="#000" stop-opacity="0"/>
          <stop offset="100%" stop-color="#000" stop-opacity=".35"/>
        </radialGradient>
        <linearGradient id="glass${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#EAF1F2"/>
          <stop offset=".45" stop-color="#9FB4BA"/>
          <stop offset="1" stop-color="#55666C"/>
        </linearGradient>
        <linearGradient id="metal${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity=".45"/>
          <stop offset=".5" stop-color="#fff" stop-opacity="0"/>
          <stop offset="1" stop-color="#000" stop-opacity=".3"/>
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="${bg}"/>
      <path d="${rays.join("")}" fill="#fff" opacity=".09"/>
      <rect width="400" height="500" fill="url(#dots${id})"/>
      <ellipse cx="200" cy="452" rx="130" ry="16" fill="#000" opacity=".22"/>`;
  }

  function grain(x, y, h) {
    let g = "";
    for (let i = 0; i < 5; i++) {
      const xx = x + 6 + i * 4.5;
      g += `<path d="M${xx} ${y + 10} q ${i % 2 ? 3 : -3} ${h / 2} 0 ${h - 20}" stroke="#000" stroke-opacity=".18" stroke-width="1.2" fill="none"/>`;
    }
    return g;
  }

  function hammer(a, id) {
    const handle = `<rect x="185" y="150" width="30" height="300" rx="13" fill="${a.handle}"/>${grain(185, 150, 300)}
      <rect class="ov" x="185" y="150" width="30" height="300" rx="13" fill="url(#metal${id})" opacity=".6"/>`;
    let head = "";
    if (a.type === "claw" || a.type === "framing") {
      const claw = a.type === "claw"
        ? `<path d="M226 112 C 268 104 306 122 330 166 L 318 172 C 296 140 266 132 226 142 Z" fill="${a.head}"/>
           <path d="M226 150 C 262 146 292 160 312 190 L 300 196 C 284 172 258 166 226 170 Z" fill="${a.head}"/>`
        : `<path d="M226 114 L 336 128 L 336 142 L 226 146 Z" fill="${a.head}"/>
           <path d="M226 152 L 330 162 L 330 176 L 226 172 Z" fill="${a.head}"/>`;
      const face = a.type === "framing"
        ? `<g opacity=".45">${[0, 1, 2, 3, 4].map(i => `<line x1="86" y1="${118 + i * 12}" x2="96" y2="${118 + i * 12}" stroke="#000"/>`).join("")}</g>` : "";
      head = `${claw}
        <rect x="176" y="100" width="50" height="84" rx="8" fill="${a.head}"/>
        <path d="M150 120 L178 112 L178 172 L150 164 Z" fill="${a.head}"/>
        <rect x="${a.type === "framing" ? 84 : 92}" y="108" width="62" height="68" rx="9" fill="${a.head}"/>${face}
        <rect class="ov" x="${a.type === "framing" ? 84 : 92}" y="108" width="62" height="68" rx="9" fill="url(#metal${id})"/>
        <rect class="ov" x="176" y="100" width="50" height="84" rx="8" fill="url(#metal${id})"/>
        `;
    } else if (a.type === "tack") {
      head = `<rect x="110" y="122" width="180" height="34" rx="8" fill="${a.head}"/>
        <rect x="102" y="126" width="18" height="26" rx="4" fill="${a.head}"/>
        <rect x="280" y="128" width="26" height="22" rx="3" fill="${a.head}"/>
        <rect x="178" y="112" width="44" height="52" rx="8" fill="${a.head}"/>
        <rect class="ov" x="110" y="122" width="180" height="34" rx="8" fill="url(#metal${id})" opacity=".7"/>
        <circle cx="296" cy="139" r="5" fill="#E2581C"/>`;
    } else if (a.type === "mallet") {
      head = `<rect x="96" y="96" width="208" height="92" rx="20" fill="${a.head}"/>
        <rect x="92" y="100" width="22" height="84" rx="10" fill="#1F1C1A"/>
        <rect x="286" y="100" width="22" height="84" rx="10" fill="#1F1C1A"/>
        <rect x="96" y="96" width="208" height="92" rx="20" fill="url(#metal${id})"/>
        <text x="200" y="150" font-family="Montserrat,sans-serif" font-weight="800" font-size="18" letter-spacing="4" text-anchor="middle" fill="#1F1C1A" opacity=".8">SOFTFALL</text>`;
    }
    return `<g transform="rotate(-28 200 270) translate(0 30)">
      <g transform="translate(10 12)" opacity=".28">${shadowOf(handle + head)}</g>
      ${handle}${head}</g>`;
  }

  function shadowOf(svg) {
    return svg
      .replace(/<(rect|path|circle|ellipse)[^>]*(class="ov"|url\(#)[^>]*\/>/g, "") // drop gloss overlays
      .replace(/<path[^>]*stroke=[^>]*\/>/g, "")                                   // and grain lines
      .replace(/<text[\s\S]*?<\/text>/g, "")
      .replace(/fill="[^"]*"/g, 'fill="#000"');
  }

  // Tiny hammer silhouette reflected in every mirror: the issue's running gag.
  function reflectedHammer(cx, cy, s, rot) {
    return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})" opacity=".35">
      <rect x="-6" y="-10" width="12" height="90" rx="5" fill="#1F1C1A"/>
      <path d="M-40 -28 h56 c18 0 32 8 40 26 l-8 4 c-8 -12 -18 -16 -32 -16 h-56z" fill="#1F1C1A"/>
    </g>`;
  }

  function glassStreaks(clip) {
    return `<g clip-path="url(#${clip})">
      <path d="M60 60 L180 60 L60 330 L-60 330Z" fill="#fff" opacity=".28"/>
      <path d="M200 40 L232 40 L110 380 L78 380Z" fill="#fff" opacity=".22"/>
    </g>`;
  }

  function mirror(a, id) {
    const clip = `clip${id}`;
    if (a.type === "round" || a.type === "convex") {
      const r = a.type === "round" ? 135 : 110, cy = 240;
      const convexLines = a.type === "convex"
        ? `<g clip-path="url(#${clip})" opacity=".25" stroke="#1F1C1A" fill="none">
             <path d="M120 ${cy - 60} Q200 ${cy - 100} 280 ${cy - 60}"/><path d="M110 ${cy + 40} Q200 ${cy + 90} 290 ${cy + 40}"/>
             <path d="M170 ${cy - 100} Q150 ${cy} 170 ${cy + 100}"/><path d="M230 ${cy - 100} Q250 ${cy} 230 ${cy + 100}"/></g>
           <path d="M200 ${cy + r + 10} L200 ${cy + r + 70} M160 ${cy + r + 70} h80" stroke="#1F1C1A" stroke-width="12" stroke-linecap="round"/>`
        : "";
      return `<clipPath id="${clip}"><circle cx="200" cy="${cy}" r="${r - 18}"/></clipPath>
        <circle cx="210" cy="${cy + 12}" r="${r}" fill="#000" opacity=".3"/>
        <circle cx="200" cy="${cy}" r="${r}" fill="${a.frame}"/>
        <circle cx="200" cy="${cy}" r="${r}" fill="url(#metal${id})"/>
        <circle cx="200" cy="${cy}" r="${r - 18}" fill="url(#glass${id})"/>
        <g clip-path="url(#${clip})">${reflectedHammer(230, cy - 10, 1.1, 24)}</g>
        ${glassStreaks(clip)}${convexLines}`;
    }
    if (a.type === "arch") {
      const p = (x, y, w, h) => `M${x} ${y + h} L${x} ${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} L${x + w} ${y + h}Z`;
      return `<clipPath id="${clip}"><path d="${p(132, 54, 136, 386)}"/></clipPath>
        <path d="${p(128, 50, 160, 400)}" fill="#000" opacity=".3" transform="translate(10 8)"/>
        <path d="${p(120, 40, 160, 410)}" fill="${a.frame}"/>
        <path d="${p(120, 40, 160, 410)}" fill="url(#metal${id})"/>
        <path d="${p(132, 54, 136, 386)}" fill="url(#glass${id})"/>
        <g clip-path="url(#${clip})">${reflectedHammer(214, 250, 1.4, -18)}</g>
        ${glassStreaks(clip)}`;
    }
    if (a.type === "sunburst") {
      let rays = "";
      for (let i = 0; i < 48; i++) {
        const ang = (i / 48) * 360, len = i % 2 ? 150 : 175;
        rays += `<path d="M200 230 L${200 - 5} ${230 - len} L200 ${230 - len - 12} L${200 + 5} ${230 - len}Z" fill="${a.frame}" transform="rotate(${ang} 200 230)"/>`;
      }
      return `<clipPath id="${clip}"><circle cx="200" cy="230" r="62"/></clipPath>
        <g opacity=".3" transform="translate(8 10)">${shadowOf(rays)}</g>
        ${rays}
        <circle cx="200" cy="230" r="80" fill="${a.frame}"/>
        <circle cx="200" cy="230" r="80" fill="url(#metal${id})"/>
        <circle cx="200" cy="230" r="62" fill="url(#glass${id})"/>
        <g clip-path="url(#${clip})">${reflectedHammer(214, 222, .7, 30)}</g>
        ${glassStreaks(clip)}`;
    }
    if (a.type === "hand") {
      return `<g transform="rotate(18 200 250)">
        <clipPath id="${clip}"><ellipse cx="200" cy="170" rx="82" ry="98"/></clipPath>
        <g opacity=".3" transform="translate(10 10)"><ellipse cx="200" cy="170" rx="100" ry="116" fill="#000"/><rect x="186" y="270" width="28" height="170" rx="12" fill="#000"/></g>
        <rect x="186" y="270" width="28" height="170" rx="12" fill="${a.frame}"/>
        <rect x="186" y="270" width="28" height="170" rx="12" fill="url(#metal${id})"/>
        <ellipse cx="200" cy="170" rx="100" ry="116" fill="${a.frame}"/>
        <ellipse cx="200" cy="170" rx="100" ry="116" fill="url(#metal${id})"/>
        <ellipse cx="200" cy="170" rx="86" ry="102" fill="#fff" opacity=".5"/>
        <ellipse cx="200" cy="170" rx="82" ry="98" fill="url(#glass${id})"/>
        <g clip-path="url(#${clip})">${reflectedHammer(220, 160, .9, 10)}</g>
        ${glassStreaks(clip)}</g>`;
    }
    return "";
  }

  window.TT_ART = {
    render(product) {
      const id = ++uid, a = product.art;
      const body = product.kind === "hammer" ? hammer(a, id) : mirror(a, id);
      return `<svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${product.brand} ${product.name}" preserveAspectRatio="xMidYMid slice">
        ${backdrop(id, a.bg)}${body}
        <rect width="400" height="500" fill="url(#vig${id})"/></svg>`;
    }
  };
})();
