/* Phonetic Designs: Create Your Gear customizer (sections/pd-customizer.liquid) */
(() => {
  const STEPS = ['garment', 'connection', 'branch', 'design', 'color', 'placement', 'size', 'review'];
  const STEP_TITLES = {
    garment: 'Garment',
    connection: 'Connection',
    branch: 'Branch',
    design: 'Design',
    color: 'Color',
    placement: 'Print location',
    size: 'Size',
    review: 'Review',
  };
  const PLACEMENT_LABELS = {
    center_chest: 'Center chest',
    left_chest: 'Left chest',
    full_front: 'Full front',
    upper_back: 'Upper back',
    full_back: 'Full back',
    hat_front: 'Hat front',
    left_leg: 'Left pant leg',
    right_leg: 'Right pant leg',
    shorts_leg: 'Shorts leg',
  };
  const TOPS = ['tee', 'longsleeve', 'hoodie', 'tank', 'crop', 'jersey'];
  const BACK_PLACEMENTS = ['upper_back', 'full_back'];
  const NAMED_COLORS = {
    black: '#1b1c1f', white: '#f3f3f1', navy: '#1b2a47', 'heather grey': '#9fa3a8', 'heather gray': '#9fa3a8',
    heather: '#9fa3a8', grey: '#8d9096', gray: '#8d9096', charcoal: '#3b3e44', red: '#b22234', maroon: '#6e1d2b',
    burgundy: '#6e1d2b', royal: '#2a4fa8', blue: '#2f5fb3', 'light blue': '#9ec3e6', 'military green': '#4b5320',
    olive: '#5d6532', green: '#2e6b3a', forest: '#24452f', tan: '#c2a878', sand: '#d8c7a2', khaki: '#b5a37a',
    brown: '#5b3f2c', camo: '#5d6532', orange: '#d9622b', yellow: '#e8c547', gold: '#e2b74a', pink: '#e79bb3',
    purple: '#5e3d8f', cream: '#efe6d2', natural: '#efe6d2', ash: '#c9cbcd', silver: '#c0c3c7', teal: '#1f7a7a',
  };
  const BODY = {
    male: { sw: 92, hip: 72, arm: 28 },
    female: { sw: 80, hip: 76, arm: 24 },
  };
  const STORE_KEY = 'pd-cz-state';

  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const splitList = (s) =>
    String(s || '')
      .split(',')
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);

  function nameToHex(name) {
    const n = String(name || '').toLowerCase();
    if (NAMED_COLORS[n]) return NAMED_COLORS[n];
    let best = '';
    for (const key of Object.keys(NAMED_COLORS)) if (n.includes(key) && key.length > best.length) best = key;
    return best ? NAMED_COLORS[best] : '#8a8f98';
  }

  function luminance(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return 0.3;
    const n = parseInt(m[1], 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }

  function detectGarment(hint) {
    const h = String(hint || '').toLowerCase().trim();
    if ([...TOPS, 'hat', 'pants', 'shorts'].includes(h)) return h;
    if (/\b(hat|cap|beanie|snapback|trucker)\b/.test(h)) return 'hat';
    if (/hood|zip-up|zip up/.test(h)) return 'hoodie';
    if (/short/.test(h)) return 'shorts';
    if (/pant|jogger|trouser|legging/.test(h)) return 'pants';
    if (/tank/.test(h)) return 'tank';
    if (/crop/.test(h)) return 'crop';
    if (/jersey/.test(h)) return 'jersey';
    if (/long[ -]?sleeve|rash|sweatshirt|crewneck/.test(h)) return 'longsleeve';
    return 'tee';
  }

  function formatMoney(cents, format) {
    const fmt = format || '${{amount}}';
    const n = (cents / 100).toFixed(2);
    const [int, dec] = n.split('.');
    const withSep = (sep) => int.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
    return fmt.replace(/\{\{\s*(\w+)\s*\}\}/, (_, key) => {
      switch (key) {
        case 'amount_no_decimals':
          return String(Math.round(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        case 'amount_with_comma_separator':
          return `${withSep('.')},${dec}`;
        case 'amount_no_decimals_with_comma_separator':
          return withSep('.');
        default:
          return `${withSep(',')}.${dec}`;
      }
    });
  }

  /* ---------------- Avatar geometry ---------------- */

  function zonesFor(garment) {
    const hoodie = garment === 'hoodie';
    const hem = garment === 'crop' ? 270 : hoodie ? 352 : 345;
    return {
      center_chest: { x: 150, y: hoodie ? 176 : 178, w: 100, h: 74, view: 'front' },
      left_chest: { x: 213, y: 180, w: 40, h: 34, view: 'front' },
      full_front: { x: 142, y: 172, w: 116, h: hoodie ? 112 : hem - 196, view: 'front' },
      upper_back: { x: 146, y: hoodie ? 232 : 168, w: 108, h: 44, view: 'back' },
      full_back: { x: 142, y: hoodie ? 234 : 176, w: 116, h: hoodie ? 96 : hem - 200, view: 'back' },
      hat_front: { x: 174, y: 38, w: 52, h: 26, view: 'front' },
      left_leg: { x: 212, y: 396, w: 44, h: 84, view: 'front' },
      right_leg: { x: 144, y: 396, w: 44, h: 84, view: 'front' },
      shorts_leg: { x: 214, y: 392, w: 40, h: 36, view: 'front' },
    };
  }

  function topPath(type, b, view) {
    const cx = 200;
    const L = cx - b.sw;
    const R = cx + b.sw;
    const hw = b.hip - 2;
    const hem = type === 'crop' ? 270 : type === 'hoodie' ? 352 : 345;
    const back = view === 'back';
    if (type === 'tank') {
      const neck = back ? 'Q200,156 216,140' : 'Q200,182 216,140';
      return `M184,140 ${neck} L${R - 22},146 Q${R - 14},196 ${R - 4},214 L${cx + hw},${hem} L${cx - hw},${hem} L${L + 4},214 Q${L + 14},196 ${L + 22},146 Z`;
    }
    let collar = back ? 'Q200,150 224,140' : 'Q200,166 224,140';
    if (type === 'jersey' && !back) collar = 'L200,178 L224,140';
    if (type === 'hoodie') collar = back ? 'Q200,148 224,140' : 'Q200,170 224,140';
    const long = type === 'longsleeve' || type === 'hoodie';
    const rs = long
      ? `L${R + 42},318 L${R + 16},328 L${R - 8},216`
      : `L${R + 30},236 L${R + 6},250 L${R - 8},214`;
    const ls = long
      ? `L${L + 8},216 L${L - 16},328 L${L - 42},318`
      : `L${L + 8},214 L${L - 6},250 L${L - 30},236`;
    return `M176,140 ${collar} L${R},156 ${rs} L${cx + hw},${hem} L${cx - hw},${hem} ${ls} L${L},156 Z`;
  }

  function shaded(d, fill) {
    return `<path d="${d}" fill="${fill}"/><path d="${d}" fill="url(#pdcz-sh)"/><path d="${d}" fill="url(#pdcz-sv)" stroke="rgba(0,0,0,.35)" stroke-width="1.5" stroke-linejoin="round"/>`;
  }

  function emblemSvg(z, title) {
    const big = z.h > 60;
    const vb = big ? '0 0 200 300' : '0 0 200 230';
    const t = String(title || '').toUpperCase();
    const fit = t.length > 10 ? ` textLength="196" lengthAdjust="spacingAndGlyphs"` : '';
    return `<svg x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" viewBox="${vb}" preserveAspectRatio="xMidYMid meet">
      <path d="M100 8l84 26v62c0 58-37 101-84 126C53 197 16 154 16 96V34L100 8z" fill="#0d1526" stroke="#fff" stroke-width="10" stroke-linejoin="round"/>
      <path d="M100 30l64 20v46c0 46-28 80-64 101-36-21-64-55-64-101V50l64-20z" fill="none" stroke="#e2b74a" stroke-width="5"/>
      <path d="M100 66l10 20 22 3-16 15.5 3.8 22L100 116l-19.8 10.5 3.8-22L68 89l22-3L100 66z" fill="#fff"/>
      <path d="M60 150h80" stroke="#c8334a" stroke-width="10" stroke-linecap="round"/>
      ${big ? `<text x="100" y="282" text-anchor="middle" font-family="Oswald, Impact, sans-serif" font-weight="700" font-size="40" fill="#e2b74a"${fit}>${esc(t)}</text>` : ''}
    </svg>`;
  }

  /* ---------------- Init ---------------- */

  function init(root) {
    if (root.dataset.ready) return;
    root.dataset.ready = '1';
    let cfg;
    try {
      cfg = JSON.parse(root.querySelector('[data-cz-config]').textContent);
    } catch (e) {
      console.error('Customizer config error', e);
      return;
    }

    const $ = (s) => root.querySelector(s);
    const $$ = (s) => [...root.querySelectorAll(s)];
    const form = $('[data-form]');
    const stage = $('[data-stage]');
    const garment = detectGarment(cfg.garmentHint);
    const isTop = TOPS.includes(garment);
    const zones = zonesFor(garment);
    const designs = cfg.designs || [];
    const colorIdx = cfg.colorIndex;
    const sizeIdx = cfg.sizeIndex;
    const variants = cfg.variants || [];
    const initial = variants.find((v) => v.id === cfg.initialVariant) || variants[0];
    const textMax = Number($('[data-text]')?.maxLength) || 24;

    // ---- placements available for this garment
    const byType = isTop
      ? ['center_chest', 'left_chest', 'full_front', 'upper_back', 'full_back']
      : garment === 'hat'
        ? ['hat_front']
        : garment === 'pants'
          ? ['left_leg', 'right_leg']
          : ['shorts_leg'];
    const override = splitList(cfg.placementsOverride);
    let placements = byType.filter((p) => cfg.placements[p] !== false);
    if (override.length) placements = placements.filter((p) => override.includes(p));
    if (!placements.length) placements = [byType[0]];

    // ---- state
    const state = {
      open: 1,
      view: 'front',
      avatar: 'male',
      skin: '#e2b08c',
      connection: '',
      branch: '',
      type: 'artwork',
      designId: '',
      text: '',
      font: '',
      fontFamily: '',
      textColor: '',
      textHex: '',
      textColorPicked: false,
      uploadUrl: '',
      uploadName: '',
      placement: placements[0],
      category: '',
      search: '',
      showAll: false,
      page: 1,
      opts: (initial?.options || []).map((o, i) => {
        if (i !== sizeIdx) return o;
        const sizes = new Set(variants.map((v) => v.options[i]));
        return sizes.size === 1 ? o : null;
      }),
    };

    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}');
      for (const k of ['avatar', 'skin', 'connection', 'branch', 'type', 'designId', 'text', 'font', 'textColor', 'textColorPicked']) {
        if (saved[k] !== undefined && saved[k] !== '') state[k] = saved[k];
      }
      if (saved.placement && placements.includes(saved.placement)) state.placement = saved.placement;
    } catch (e) {}
    const urlDesign = new URLSearchParams(location.search).get('design');
    if (urlDesign && designs.some((d) => d.id === urlDesign)) {
      state.designId = urlDesign;
      state.type = 'artwork';
    }
    if (state.type === 'upload') state.type = 'artwork';
    if (state.type === 'text' && !$('[data-pane="text"]')) state.type = 'artwork';

    const save = () => {
      try {
        const { avatar, skin, connection, branch, type, designId, text, font, textColor, textColorPicked, placement } = state;
        sessionStorage.setItem(
          STORE_KEY,
          JSON.stringify({ avatar, skin, connection, branch, type: type === 'upload' ? 'artwork' : type, designId, text, font, textColor, textColorPicked, placement })
        );
      } catch (e) {}
    };

    // ---- variant helpers
    const findVariant = () => variants.find((v) => v.options.every((o, i) => state.opts[i] === o));
    const colorName = () => (colorIdx == null ? '' : state.opts[colorIdx] || '');
    const colorHex = () => {
      if (colorIdx == null) return '#1b2a47';
      const btn = $$('[data-group="color"] .pd-cz__swatch').find((b) => b.dataset.value === colorName());
      return (btn && btn.dataset.hex) || nameToHex(colorName());
    };
    const optionAvailable = (i, val) =>
      variants.some(
        (v) =>
          v.available &&
          v.options[i] === val &&
          (i === colorIdx || colorIdx == null || state.opts[colorIdx] == null || v.options[colorIdx] === state.opts[colorIdx])
      );
    const selectedDesign = () => designs.find((d) => d.id === state.designId);
    const feeApplies = () => {
      const f = cfg.fee;
      if (!f) return false;
      return (state.type === 'text' && f.text) || (state.type === 'upload' && f.upload) || (state.type === 'artwork' && f.artwork);
    };
    const quantity = () => Math.max(1, Math.min(99, parseInt($('[data-qty-input]').value, 10) || 1));

    // ---- completion
    const isDone = (step) => {
      switch (step) {
        case 'garment':
          return true;
        case 'connection':
          return !!state.connection;
        case 'branch':
          return !!state.branch;
        case 'design':
          if (state.type === 'text') return state.text.trim().length > 0;
          if (state.type === 'upload') return !!state.uploadUrl && !!$('[data-owner]')?.checked;
          return !!selectedDesign();
        case 'color':
          return colorIdx == null || !!state.opts[colorIdx];
        case 'placement':
          return !!state.placement;
        case 'size':
          return state.opts.every((o) => o != null) && !!findVariant()?.available;
        case 'review':
          return !!$('[data-approve]')?.checked;
      }
      return false;
    };
    const firstIncomplete = () => STEPS.findIndex((s) => !isDone(s));

    /* ---------- Stage rendering ---------- */
    function renderStage() {
      const b = BODY[state.avatar];
      const back = state.view === 'back';
      const color = colorHex();
      const topColor = isTop ? color : '#3a4660';
      const bottomType = garment === 'shorts' ? 'shorts' : 'pants';
      const bottomColor = garment === 'pants' || garment === 'shorts' ? color : '#222b3c';
      const skin = state.skin;
      const hair = '#2a1c12';
      const cx = 200;
      const p = [];

      p.push(`<defs>
        <linearGradient id="pdcz-sh" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#000" stop-opacity=".38"/><stop offset=".3" stop-color="#000" stop-opacity="0"/>
          <stop offset=".55" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".42"/>
        </linearGradient>
        <linearGradient id="pdcz-sv" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#000" stop-opacity=".25"/>
        </linearGradient>
        <radialGradient id="pdcz-floor" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      </defs>`);
      p.push(`<ellipse cx="200" cy="584" rx="120" ry="12" fill="url(#pdcz-floor)"/>`);

      // long hair behind body (female, front view)
      if (state.avatar === 'female' && !back) p.push(`<path d="M154,86 Q148,28 200,32 Q252,28 246,86 L252,176 Q200,190 148,176 Z" fill="${hair}"/>`);

      // legs + shoes
      for (const s of [-1, 1]) {
        p.push(`<line x1="${cx + s * 36}" y1="350" x2="${cx + s * 38}" y2="562" stroke="${skin}" stroke-width="38" stroke-linecap="round"/>`);
        p.push(`<ellipse cx="${cx + s * 40}" cy="574" rx="27" ry="11" fill="#12161e"/>`);
      }

      // bottoms
      const hip = b.hip;
      if (bottomType === 'pants') {
        const d = `M${cx - hip},330 L${cx + hip},330 L${cx + hip + 4},566 L${cx + 6},566 L${cx},392 L${cx - 6},566 L${cx - hip - 4},566 Z`;
        p.push(shaded(d, bottomColor));
        p.push(`<path d="M${cx - hip},330 H${cx + hip} V342 H${cx - hip} Z M${cx + 6},552 H${cx + hip + 4} V566 H${cx + 6} Z M${cx - hip - 4},552 H${cx - 6} V566 H${cx - hip - 4} Z" fill="#000" opacity=".2"/>`);
      } else {
        const d = `M${cx - hip},330 L${cx + hip},330 L${cx + hip + 8},448 L${cx + 6},448 L${cx},382 L${cx - 6},448 L${cx - hip - 8},448 Z`;
        p.push(shaded(d, bottomColor));
        p.push(`<path d="M${cx - hip},330 H${cx + hip} V342 H${cx - hip} Z" fill="#000" opacity=".2"/>`);
      }

      // arms
      const long = garment === 'longsleeve' || garment === 'hoodie';
      for (const s of [-1, 1]) {
        const sx = cx + s * (b.sw - 4);
        const hx = cx + s * (b.sw + 30);
        p.push(`<line x1="${sx}" y1="170" x2="${hx}" y2="${long ? 326 : 322}" stroke="${skin}" stroke-width="${b.arm}" stroke-linecap="round"/>`);
        p.push(`<circle cx="${hx + s * 1}" cy="${long ? 340 : 334}" r="${b.arm / 2 + 2}" fill="${skin}"/>`);
      }

      // neck
      p.push(`<rect x="186" y="106" width="28" height="42" rx="8" fill="${skin}"/><rect x="186" y="128" width="28" height="14" fill="#000" opacity=".12"/>`);

      // hood behind head (front view)
      if (garment === 'hoodie' && !back) p.push(shaded('M156,146 Q140,56 200,44 Q260,56 244,146 Z', topColor));

      // top
      const top = isTop ? garment : 'tee';
      p.push(shaded(topPath(top, b, state.view), topColor));
      if (top === 'hoodie') {
        p.push(`<rect x="${cx - b.hip + 2}" y="338" width="${(b.hip - 2) * 2}" height="14" fill="#000" opacity=".18"/>`);
        if (!back) {
          p.push(`<path d="M150,292 H250 L262,336 H138 Z" fill="#000" opacity=".12" stroke="rgba(0,0,0,.3)"/>`);
          p.push(`<path d="M192,152 L189,206 M208,152 L211,206" stroke="#e8e8e8" stroke-width="2.5" stroke-linecap="round"/>`);
        }
      }
      if (top === 'jersey') {
        p.push(`<path d="M${cx - b.hip + 2},230 V344 M${cx + b.hip - 2},230 V344" stroke="#fff" stroke-opacity=".55" stroke-width="5"/>`);
      }

      // head
      p.push(`<ellipse cx="161" cy="86" rx="6" ry="10" fill="${skin}"/><ellipse cx="239" cy="86" rx="6" ry="10" fill="${skin}"/>`);
      p.push(`<circle cx="200" cy="80" r="39" fill="${skin}"/>`);
      p.push(`<path d="M168,96 Q200,128 232,96 Q228,118 200,121 Q172,118 168,96 Z" fill="#000" opacity=".06"/>`);

      // hood hanging on back (under the hair)
      if (garment === 'hoodie' && back) p.push(shaded('M160,144 Q156,222 200,228 Q244,222 240,144 Z', topColor));

      // hair
      if (state.avatar === 'female') {
        p.push(
          back
            ? `<path d="M154,86 Q148,28 200,32 Q252,28 246,86 L252,176 Q200,190 148,176 Z" fill="${hair}"/>`
            : `<path d="M161,86 Q160,38 200,38 Q240,38 239,86 Q232,58 202,58 Q176,60 161,86 Z" fill="${hair}"/>`
        );
      } else {
        p.push(
          back
            ? `<path d="M161,86 Q158,36 200,36 Q242,36 239,86 Q222,110 200,110 Q178,110 161,86 Z" fill="${hair}"/>`
            : `<path d="M162,80 Q160,36 200,36 Q240,36 238,80 Q232,58 200,57 Q168,58 162,80 Z" fill="${hair}"/>`
        );
      }

      // hat
      if (garment === 'hat') {
        p.push(shaded('M159,72 Q157,28 200,26 Q243,28 241,72 Z', color));
        p.push(`<path d="M200,27 V72" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/>`);
        const brim = 'M152,69 Q200,82 248,69 Q252,78 200,89 Q148,78 152,69 Z';
        if (!back) p.push(`<path d="${brim}" fill="${color}"/><path d="${brim}" fill="#000" opacity=".28"/>`);
        else p.push(`<path d="M188,58 H212 V72 H188 Z" fill="#000" opacity=".3"/>`);
      }

      // artwork
      const z = zones[state.placement];
      let placingText = '';
      if (z) {
        const visible = z.view === state.view;
        if (visible) {
          p.push(`<clipPath id="pdcz-clip"><rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}"/></clipPath>`);
          let art = '';
          if (state.type === 'text' && state.text.trim()) {
            art = `<text data-fit x="${z.x + z.w / 2}" y="${z.y + z.h / 2}" text-anchor="middle" dominant-baseline="central" font-family="${esc(state.fontFamily || 'Oswald, Impact, sans-serif')}" font-size="${z.h * 0.7}" fill="${esc(state.textHex || '#ffffff')}">${esc(state.text.trim())}</text>`;
          } else if (state.type === 'upload' && state.uploadUrl) {
            art = `<image href="${state.uploadUrl}" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" preserveAspectRatio="xMidYMid meet"/>`;
          } else if (state.type === 'artwork' && selectedDesign()) {
            const d = selectedDesign();
            art = d.image
              ? `<image href="${esc(d.image)}" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" preserveAspectRatio="xMidYMid meet"/>`
              : emblemSvg(z, d.title);
          }
          if (art) p.push(`<g class="pd-art" clip-path="url(#pdcz-clip)">${art}</g>`);
          p.push(`<rect class="pd-area" x="${z.x - 2}" y="${z.y - 2}" width="${z.w + 4}" height="${z.h + 4}" rx="3"/>`);
          placingText = PLACEMENT_LABELS[state.placement];
        } else {
          placingText = `${PLACEMENT_LABELS[state.placement]}: tap ${z.view === 'back' ? 'Back' : 'Front'} to see it`;
        }
      }

      stage.innerHTML = p.join('');
      $('[data-placing]').textContent = placingText;

      // auto-fit custom text into its print area
      const t = stage.querySelector('[data-fit]');
      if (t && z) {
        try {
          const bb = t.getBBox();
          if (bb.width > 0) {
            const fs = parseFloat(t.getAttribute('font-size'));
            const scale = Math.min((z.w * 0.94) / bb.width, (z.h * 0.9) / bb.height, 1);
            t.setAttribute('font-size', (fs * scale).toFixed(2));
          }
        } catch (e) {}
      }
    }

    /* ---------- Design grid ---------- */
    function filteredDesigns() {
      const q = state.search.trim().toLowerCase();
      const conn = state.connection.toLowerCase();
      const br = state.branch.toLowerCase();
      const cat = state.category.toLowerCase();
      const matches = (field, val) => {
        if (!val) return true;
        const list = splitList(field);
        return !list.length || list.includes(val) || list.includes('all');
      };
      return designs.filter((d) => {
        if (!state.showAll && (!matches(d.connection, conn) || !matches(d.branch, br))) return false;
        if (cat && !splitList(d.category).includes(cat)) return false;
        if (q) {
          const hay = [d.title, d.category, d.connection, d.branch].join(' ').toLowerCase();
          if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
        }
        return true;
      });
    }

    function renderDesigns() {
      const list = filteredDesigns();
      const shown = list.slice(0, state.page * cfg.pageSize);
      const shield =
        '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 5l15 6v11c0 10-6.5 17.5-15 21-8.5-3.5-15-11-15-21V11l15-6z" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M24 15l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8L24 15z" fill="currentColor"/></svg>';
      $('[data-designs]').innerHTML = shown
        .map(
          (d) => `<li><button type="button" class="pd-cz__design${d.id === state.designId ? ' is-active' : ''}" data-design="${esc(d.id)}" aria-pressed="${d.id === state.designId}">
            <span class="pd-cz__design-img">${d.thumb ? `<img src="${esc(d.thumb)}" alt="" loading="lazy" width="300" height="300">` : shield}</span>
            <span class="pd-cz__design-name">${esc(d.title)}</span></button></li>`
        )
        .join('');
      $('[data-more]').hidden = list.length <= shown.length;
      $('[data-empty]').hidden = list.length > 0;
      const parts = [state.connection, state.branch].filter(Boolean);
      $('[data-filter-note]').textContent =
        !state.showAll && parts.length ? `${list.length} design${list.length === 1 ? '' : 's'} for ${parts.join(' · ')}` : `${list.length} designs`;
    }

    /* ---------- Placement chips ---------- */
    $('[data-group="placement"]').innerHTML = placements
      .map((pl) => `<button type="button" class="pd-cz__chip" data-value="${pl}">${PLACEMENT_LABELS[pl]}</button>`)
      .join('');

    /* ---------- Sync UI ---------- */
    function setActive(group, value) {
      for (const b of $$(`[data-group="${group}"] [data-value]`)) {
        const on = b.dataset.value === value;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on);
      }
    }

    function sync() {
      // auto text color for contrast until the shopper picks one
      if (!state.textColorPicked) {
        const sw = $$('[data-group="text-color"] [data-value]');
        if (sw.length) {
          const light = luminance(colorHex()) > 0.45;
          const pick = sw.find((s) => (light ? luminance(s.dataset.hex) < 0.2 : luminance(s.dataset.hex) > 0.6)) || sw[0];
          state.textColor = pick.dataset.value;
        }
      }
      const tc = $$('[data-group="text-color"] [data-value]').find((s) => s.dataset.value === state.textColor);
      state.textHex = tc ? tc.dataset.hex : '#ffffff';
      const fontBtns = $$('[data-group="font"] [data-value]');
      const fb = fontBtns.find((f) => f.dataset.value === state.font) || fontBtns[0];
      if (fb) {
        state.font = fb.dataset.value;
        state.fontFamily = fb.dataset.family;
      }

      setActive('connection', state.connection);
      setActive('branch', state.branch);
      setActive('font', state.font);
      setActive('text-color', state.textColor);
      setActive('placement', state.placement);
      setActive('category', state.category);
      if (colorIdx != null) setActive('color', colorName());

      // color swatches: fill & availability
      for (const sw of $$('[data-group="color"] .pd-cz__swatch')) {
        if (!sw.style.backgroundImage) sw.style.setProperty('--c', sw.dataset.hex || nameToHex(sw.dataset.value));
        sw.disabled = !optionAvailable(colorIdx, sw.dataset.value);
      }
      const cn = $('[data-color-name]');
      if (cn) cn.textContent = colorName() ? `Selected: ${colorName()}` : '';

      // size & other option chips
      for (const group of $$('[data-option-index]')) {
        const i = Number(group.dataset.optionIndex);
        const prices = variants
          .filter((v) => colorIdx == null || v.options[colorIdx] === state.opts[colorIdx])
          .map((v) => v.price);
        const min = prices.length ? Math.min(...prices) : 0;
        for (const chip of group.querySelectorAll('[data-value]')) {
          const val = chip.dataset.value;
          const on = state.opts[i] === val;
          chip.classList.toggle('is-active', on);
          chip.setAttribute('aria-pressed', on);
          chip.disabled = !optionAvailable(i, val);
          const extra = chip.querySelector('[data-extra]');
          if (extra && i === sizeIdx) {
            const v = variants.find(
              (x) => x.options[i] === val && (colorIdx == null || x.options[colorIdx] === state.opts[colorIdx])
            );
            extra.textContent = v && v.price > min ? `+${formatMoney(v.price - min, cfg.moneyFormat)}` : '';
          }
        }
      }

      // design type tabs
      for (const tab of $$('[data-type]')) {
        const on = tab.dataset.type === state.type;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', on);
      }
      for (const pane of $$('[data-pane]')) pane.hidden = pane.dataset.pane !== state.type;
      const ti = $('[data-text]');
      if (ti && ti.value !== state.text) ti.value = state.text;
      const cnt = $('[data-count]');
      if (cnt) cnt.textContent = `(${state.text.length}/${textMax})`;

      // avatar controls
      for (const b of $$('[data-view]')) {
        b.classList.toggle('is-active', b.dataset.view === state.view);
        b.setAttribute('aria-pressed', b.dataset.view === state.view);
      }
      for (const b of $$('[data-avatar]')) {
        b.classList.toggle('is-active', b.dataset.avatar === state.avatar);
        b.setAttribute('aria-pressed', b.dataset.avatar === state.avatar);
      }
      for (const b of $$('[data-skin]')) {
        b.classList.toggle('is-active', b.dataset.skin === state.skin);
        b.setAttribute('aria-pressed', b.dataset.skin === state.skin);
      }

      // variant + price
      const v = findVariant();
      if (v) $('[data-variant-input]').value = v.id;
      const qty = quantity();
      let unit = v ? v.price : Math.min(...variants.filter((x) => colorIdx == null || x.options[colorIdx] === state.opts[colorIdx]).map((x) => x.price));
      if (!isFinite(unit)) unit = initial?.price || 0;
      const fee = feeApplies() ? cfg.fee.price : 0;
      const total = formatMoney((unit + fee) * qty, cfg.moneyFormat);
      const priceText = v ? total : `From ${total}`;
      $('[data-price]').textContent = priceText;
      $('[data-bar-price]').textContent = priceText;
      const feeNote = $('[data-fee-note]');
      feeNote.hidden = !fee;
      if (fee) feeNote.textContent = `Includes ${formatMoney(fee, cfg.moneyFormat)} customization per item`;

      // step summaries
      const d = selectedDesign();
      const designValue =
        state.type === 'text'
          ? state.text.trim()
            ? `“${state.text.trim()}”`
            : 'Custom text'
          : state.type === 'upload'
            ? state.uploadName || 'Upload'
            : d
              ? d.title
              : 'Choose';
      const sizeValue = state.opts.filter((o, i) => i !== colorIdx && o != null && o !== 'Default Title').join(' / ');
      const values = {
        connection: state.connection || 'Choose',
        branch: state.branch || 'Choose',
        design: designValue,
        color: colorIdx == null ? 'One color' : colorName() || 'Choose',
        placement: PLACEMENT_LABELS[state.placement] || 'Choose',
        size: (sizeValue ? `${sizeValue} · ` : '') + `Qty ${qty}`,
        review: isDone('review') ? 'Approved' : '',
      };
      $$('[data-step]').forEach((li, idx) => {
        const step = li.dataset.step;
        const done = isDone(step);
        li.classList.toggle('is-done', done);
        li.classList.toggle('is-open', idx === state.open);
        li.querySelector('[data-step-toggle]').setAttribute('aria-expanded', idx === state.open);
        li.querySelector('.pd-cz__step-body').hidden = idx !== state.open;
        if (values[step] !== undefined) li.querySelector('[data-value]').textContent = values[step];
      });

      // summary
      const rows = [
        ['Garment', cfg.product],
        ['Connection', state.connection],
        ['Branch', state.branch],
        ['Design', designValue === 'Choose' ? '' : designValue],
        state.type === 'text' ? ['Font / color', `${state.font} · ${state.textColor}`] : null,
        ['Color', colorIdx == null ? '' : colorName()],
        ['Print location', PLACEMENT_LABELS[state.placement]],
        ['Size', sizeValue],
        ['Quantity', String(qty)],
        ['Total', priceText],
      ].filter(Boolean);
      $('[data-summary]').innerHTML = rows
        .map(([k, val]) => `<dt>${esc(k)}</dt><dd>${val ? esc(val) : '<span style="opacity:.5">Not chosen</span>'}</dd>`)
        .join('');

      // progress
      const doneCount = STEPS.filter(isDone).length;
      $('[data-progress-bar]').style.width = `${(doneCount / STEPS.length) * 100}%`;
      $('[data-progress-text]').textContent = `${doneCount} of ${STEPS.length} steps complete`;
      $('[data-prev]').disabled = state.open <= 0;
      $('[data-next]').hidden = state.open >= STEPS.length - 1;

      // buttons
      const all = firstIncomplete() === -1;
      const soldOut = state.opts.every((o) => o != null) && v && !v.available;
      $('[data-submit-label]').textContent = soldOut ? 'Sold out' : 'Add to cart';
      const barBtn = $('[data-bar-action]');
      const nextStep = STEPS[firstIncomplete()];
      barBtn.textContent = all ? 'Add to cart' : `Next: ${STEP_TITLES[nextStep]}`;
      $('[data-bar-step]').textContent = all ? 'Ready to wear the mission' : `${doneCount} of ${STEPS.length} steps done`;

      renderStage();
      save();
    }

    function openStep(i, scroll = true) {
      state.open = Math.max(0, Math.min(STEPS.length - 1, i));
      if (STEPS[state.open] === 'design') renderDesigns();
      sync();
      if (!scroll) return;
      const li = $$('[data-step]')[state.open];
      const mobile = matchMedia('(max-width: 989px)').matches;
      const offset = mobile ? $('.pd-cz__stage-col').getBoundingClientRect().height + 8 : 120;
      const top = li.getBoundingClientRect().top;
      if (top < offset || top > innerHeight * 0.7) {
        scrollTo({ top: scrollY + top - offset, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
    }

    const showError = (msg) => {
      $('[data-error]').textContent = msg || '';
    };

    /* ---------- Events ---------- */
    root.addEventListener('click', (e) => {
      const t = e.target.closest('button');
      if (!t || !root.contains(t)) return;

      if (t.matches('[data-step-toggle]')) {
        const idx = $$('[data-step-toggle]').indexOf(t);
        if (idx === state.open) {
          state.open = -1;
          return sync();
        }
        return openStep(idx, false);
      }
      if (t.matches('[data-prev]')) return openStep(state.open - 1);
      if (t.matches('[data-next]')) return openStep(state.open + 1);

      if (t.matches('[data-view]')) {
        state.view = t.dataset.view;
        return sync();
      }
      if (t.matches('[data-avatar]')) {
        state.avatar = t.dataset.avatar;
        return sync();
      }
      if (t.matches('[data-skin]')) {
        state.skin = t.dataset.skin;
        return sync();
      }

      const group = t.closest('[data-group]')?.dataset.group;
      if (group && t.dataset.value !== undefined) {
        showError('');
        const val = t.dataset.value;
        switch (group) {
          case 'connection':
          case 'branch':
            state[group] = val;
            state.showAll = false;
            state.page = 1;
            sync();
            setTimeout(() => openStep(state.open + 1), 220);
            return;
          case 'category':
            state.category = val;
            state.page = 1;
            renderDesigns();
            return sync();
          case 'font':
            state.font = val;
            return sync();
          case 'text-color':
            state.textColor = val;
            state.textColorPicked = true;
            return sync();
          case 'color':
            state.opts[colorIdx] = val;
            for (let i = 0; i < state.opts.length; i++) {
              if (i !== colorIdx && state.opts[i] != null && !optionAvailable(i, state.opts[i])) state.opts[i] = null;
            }
            return sync();
          case 'placement':
            state.placement = val;
            state.view = zones[val]?.view || 'front';
            return sync();
        }
      }

      const optGroup = t.closest('[data-option-index]');
      if (optGroup && t.dataset.value !== undefined) {
        state.opts[Number(optGroup.dataset.optionIndex)] = t.dataset.value;
        showError('');
        return sync();
      }

      if (t.matches('[data-type]')) {
        state.type = t.dataset.type;
        return sync();
      }
      if (t.matches('[data-design]')) {
        state.designId = t.dataset.design;
        state.type = 'artwork';
        showError('');
        renderDesigns();
        sync();
        const z = zones[state.placement];
        if (z && z.view !== state.view) {
          state.view = z.view;
          sync();
        }
        return;
      }
      if (t.matches('[data-more]')) {
        state.page += 1;
        return renderDesigns();
      }
      if (t.matches('[data-clear-filters]')) {
        state.showAll = true;
        state.category = '';
        state.search = '';
        $('[data-search]').value = '';
        renderDesigns();
        return sync();
      }
      if (t.matches('[data-qty]')) {
        const q = $('[data-qty-input]');
        q.value = Math.max(1, Math.min(99, quantity() + Number(t.dataset.qty)));
        return sync();
      }
      if (t.matches('[data-open-guide]')) return $('[data-guide]').showModal();
      if (t.matches('[data-close-guide]')) return $('[data-guide]').close();
      if (t.matches('[data-bar-action]')) {
        const fi = firstIncomplete();
        if (fi === -1) return form.requestSubmit();
        return openStep(fi);
      }
    });

    $('[data-guide]').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) e.currentTarget.close();
    });

    let searchTimer;
    $('[data-search]').addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.search = e.target.value;
        state.page = 1;
        renderDesigns();
      }, 150);
    });

    $('[data-text]')?.addEventListener('input', (e) => {
      state.text = e.target.value.slice(0, textMax);
      sync();
    });
    $('[data-qty-input]').addEventListener('change', sync);
    $('[data-approve]').addEventListener('change', () => {
      showError('');
      sync();
    });
    $('[data-owner]')?.addEventListener('change', sync);
    $('[data-show-area]').addEventListener('change', (e) => {
      root.toggleAttribute('data-hide-area', !e.target.checked);
    });

    const upload = $('[data-upload]');
    upload?.addEventListener('change', () => {
      const file = upload.files[0];
      const warn = $('[data-upload-warn]');
      warn.hidden = true;
      state.uploadUrl = '';
      state.uploadName = '';
      if (!file) return sync();
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
        warn.textContent = 'Please upload a PNG, JPG or WEBP image.';
        warn.hidden = false;
        upload.value = '';
        return sync();
      }
      if (file.size > 20 * 1024 * 1024) {
        warn.textContent = 'That file is larger than 20 MB. Please upload a smaller image.';
        warn.hidden = false;
        upload.value = '';
        return sync();
      }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          state.uploadUrl = reader.result;
          state.uploadName = file.name;
          $('[data-upload-label]').textContent = `${file.name} (${img.naturalWidth}×${img.naturalHeight}px). Tap to replace`;
          if (img.naturalWidth < cfg.minUploadPx) {
            warn.textContent = `Low resolution: this image is ${img.naturalWidth}px wide. For a sharp print we recommend at least ${cfg.minUploadPx}px.`;
            warn.hidden = false;
          }
          state.type = 'upload';
          const z = zones[state.placement];
          if (z) state.view = z.view;
          sync();
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

    /* ---------- Submit ---------- */
    function setProp(name, value) {
      const input = root.querySelector(`[data-prop="${name}"]`);
      if (!input) return;
      input.value = value || '';
      input.disabled = !value;
    }

    async function makePreview() {
      const z = zones[state.placement];
      const prevView = state.view;
      if (z && z.view !== state.view) {
        state.view = z.view;
        renderStage();
      }
      const svg = stage.cloneNode(true);
      state.view = prevView;
      svg.querySelectorAll('.pd-area').forEach((n) => n.remove());
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('width', '800');
      svg.setAttribute('height', '1200');
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bg.setAttribute('width', '400');
      bg.setAttribute('height', '600');
      bg.setAttribute('fill', '#0b1424');
      svg.insertBefore(bg, svg.firstChild);
      for (const im of svg.querySelectorAll('image')) {
        const href = im.getAttribute('href');
        if (href && !href.startsWith('data:')) {
          const res = await fetch(href.startsWith('//') ? location.protocol + href : href, { mode: 'cors' });
          const blob = await res.blob();
          const dataUrl = await new Promise((r) => {
            const fr = new FileReader();
            fr.onload = () => r(fr.result);
            fr.readAsDataURL(blob);
          });
          im.setAttribute('href', dataUrl);
        }
      }
      const xml = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
      });
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1200;
      canvas.getContext('2d').drawImage(img, 0, 0, 800, 1200);
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
      if (!blob) throw new Error('no preview');
      const dt = new DataTransfer();
      dt.items.add(new File([blob], 'gear-preview.png', { type: 'image/png' }));
      const input = $('[data-preview-file]');
      input.files = dt.files;
      input.disabled = false;
      renderStage();
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fi = firstIncomplete();
      if (fi !== -1) {
        const step = STEPS[fi];
        const msg = {
          design:
            state.type === 'upload' && state.uploadUrl
              ? 'Please confirm you have permission to use your artwork.'
              : 'Please choose a design, add your text or upload artwork.',
          size: findVariant() && !findVariant().available ? 'That size is sold out in this color.' : 'Please choose your size.',
          review: 'Please review your gear and tick the approval box.',
        }[step];
        showError(msg || `Please choose your ${STEP_TITLES[step].toLowerCase()}.`);
        openStep(fi);
        return;
      }
      const v = findVariant();
      if (!v || !v.available) return showError('This option is sold out.');

      const btn = $('[data-submit]');
      btn.setAttribute('aria-busy', 'true');
      showError('');

      const d = selectedDesign();
      const typeLabel = { artwork: 'Phonetic Designs artwork', text: 'Custom text', upload: 'Uploaded artwork' }[state.type];
      setProp('Connection', state.connection);
      setProp('Branch', state.branch);
      setProp('Customization', typeLabel);
      setProp('Design', state.type === 'artwork' && d ? d.title : '');
      setProp('_Design ID', state.type === 'artwork' && d ? d.id : '');
      setProp('Custom text', state.type === 'text' ? state.text.trim() : '');
      setProp('Font', state.type === 'text' ? state.font : '');
      setProp('Text color', state.type === 'text' ? `${state.textColor} (${state.textHex})` : '');
      setProp('Print location', PLACEMENT_LABELS[state.placement]);
      setProp('Avatar', `${state.avatar === 'male' ? 'Male' : 'Female'}, skin tone ${$$('[data-skin]').findIndex((b) => b.dataset.skin === state.skin) + 1}`);
      setProp('Customer approval', 'Approved');
      if (upload) upload.disabled = state.type !== 'upload';

      try {
        await Promise.race([makePreview(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))]);
      } catch (err) {
        const input = $('[data-preview-file]');
        input.disabled = true;
        renderStage();
      }

      try {
        if (feeApplies()) {
          const root_ = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
          const res = await fetch(`${root_}cart/add.js`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ items: [{ id: cfg.fee.id, quantity: quantity(), properties: { _For: cfg.product } }] }),
          });
          if (!res.ok) throw new Error('fee');
        }
      } catch (err) {
        btn.removeAttribute('aria-busy');
        return showError('Could not add the customization fee. Please try again.');
      }

      form.submit();
    });

    // first paint
    openStep(1, false);
    renderDesigns();
    sync();
  }

  const boot = () => document.querySelectorAll('[data-pd-cz]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  document.addEventListener('shopify:section:load', boot);
})();
