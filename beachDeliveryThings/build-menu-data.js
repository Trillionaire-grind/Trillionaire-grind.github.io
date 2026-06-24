import { readFileSync, writeFileSync } from 'fs';

const SIZE_LABELS = new Set(['Medium', 'Big Kahuna', 'Small', 'Large', 'Regular', 'Single', 'Double', 'Quad']);
const SIZE_PATTERN = '(Small|Medium|Large|Big Kahuna|Regular|Single|Double|Quad)';

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48);
}

function normalizeSize(size) {
  if (SIZE_LABELS.has(size)) return size;
  const match = [...SIZE_LABELS].find(s => s.toLowerCase() === size.toLowerCase());
  return match || size;
}

function parseName(name) {
  const normalized = name.replace(/\s+,/g, ',').trim();

  // "Bad Ass Mocha | Iced, Medium" or "Espresso | Hot, Single"
  const commaMatch = normalized.match(new RegExp(`^(.+),\\s*(${SIZE_PATTERN})$`, 'i'));
  if (commaMatch) {
    return { baseName: commaMatch[1].trim(), size: normalizeSize(commaMatch[2]) };
  }

  // "Lemonade | Medium" or "Iced Espresso | Double"
  const parts = normalized.split(' | ').map((p) => p.trim());
  const last = parts[parts.length - 1];
  if (parts.length >= 2 && SIZE_LABELS.has(last)) {
    return { baseName: parts.slice(0, -1).join(' | '), size: last };
  }

  // "Hazelnut Hula | Iced-Medium" (missing comma in source data)
  if (parts.length >= 2) {
    const hyphenMatch = last.match(new RegExp(`^(.+)-(${SIZE_PATTERN})$`, 'i'));
    if (hyphenMatch) {
      return {
        baseName: [...parts.slice(0, -1), hyphenMatch[1]].join(' | '),
        size: normalizeSize(hyphenMatch[2]),
      };
    }
  }

  return { baseName: normalized, size: null };
}

function cleanDesc(desc) {
  return (desc || '').replace(/^\d+\s*oz\s*\|\s*/i, '').trim();
}

const raw = JSON.parse(readFileSync('menu-parsed.json', 'utf8'));
const favIds = new Set([
  raw.items.find((i) => i.cat === 'Featured')?.id,
  raw.items.find((i) => i.cat === 'Bad Ass Lattes | Hot')?.id,
  raw.items.find((i) => i.cat === 'Bakery')?.id,
  raw.items.find((i) => i.cat === 'Breakfast')?.id,
].filter(Boolean));

const groups = new Map();

for (const item of raw.items) {
  const { baseName, size } = parseName(item.name);
  const key = `${item.catId}::${baseName}`;

  if (!groups.has(key)) {
    groups.set(key, {
      id: `g-${slug(item.catId + '-' + baseName)}`,
      name: baseName,
      desc: cleanDesc(item.desc) || item.desc,
      cat: item.cat,
      catId: item.catId,
      image: item.image,
      favorite: favIds.has(item.id),
      sizes: [],
    });
  }

  const g = groups.get(key);
  if (item.image && !g.image) g.image = item.image;
  if (favIds.has(item.id)) g.favorite = true;

  if (size) {
    g.sizes.push({
      id: item.id,
      label: size,
      price: item.price,
      desc: item.desc,
    });
  } else {
    g.sizes.push({
      id: item.id,
      label: 'Regular',
      price: item.price,
      desc: item.desc,
    });
  }
}

const SIZE_ORDER = { Small: 0, Single: 1, Regular: 2, Medium: 3, Double: 4, Large: 5, Quad: 6, 'Big Kahuna': 7 };

const MENU = [...groups.values()].map((g) => {
  g.sizes.sort((a, b) => (SIZE_ORDER[a.label] ?? 99) - (SIZE_ORDER[b.label] ?? 99));
  g.price = Math.min(...g.sizes.map((s) => s.price));
  g.fromPrice = g.sizes.length > 1;
  if (g.sizes.length === 1 && g.sizes[0].label === 'Regular' && !g.name.includes('|')) {
    g.id = g.sizes[0].id;
    g.price = g.sizes[0].price;
    delete g.fromPrice;
    g.sizes = null;
  }
  return g;
});

const out = `const CATEGORIES = ${JSON.stringify(raw.categories, null, 2)};\n\nconst MENU = ${JSON.stringify(MENU, null, 2)};\n`;
writeFileSync('menu-data.js', out);
console.log(`Built ${MENU.length} menu groups from ${raw.items.length} raw items`);
