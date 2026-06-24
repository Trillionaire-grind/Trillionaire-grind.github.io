import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { chromium } from 'playwright';

const URL = 'https://badasscoffee.orderexperience.net/66f71b3df66b1f8f790a96b1/menu/6787f801a783482a5e0c2b24';
const MENU_API = 'https://oxb.pxsweb.com/api/v1/restaurants/66f71b3df66b1f8f790a96b1/menu/tier';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

let menuJson = null;
page.on('response', async (res) => {
  if (res.url().includes('/menu/tier') && res.request().method() === 'GET') {
    try { menuJson = await res.json(); } catch (_) {}
  }
});

await page.goto(URL, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(3000);

if (!menuJson) {
  const key = '49ace91d8c17daf4d13e61c05883ff3edbd02d1b';
  const params = new URLSearchParams({
    key,
    include_combo: 'true',
    show_unavailable: 'false',
    fix_ids: 'true',
    skip_options: 'true',
    one_click: 'true',
    track: 'true',
    show_sold_out_suggestions: 'true',
  });
  const r = await fetch(`${MENU_API}?${params}`);
  menuJson = await r.json();
}

writeFileSync('menu-data.json', JSON.stringify(menuJson, null, 2));

const categories = menuJson.menu.map((c) => ({
  id: c.id,
  name: c.name,
  image: c.image || null,
  itemCount: c.items?.length || 0,
}));

const items = [];
menuJson.menu.forEach((cat) => {
  (cat.items || []).forEach((item) => {
    const price = item.prices?.find((p) => p.is_default)?.price
      ?? item.prices?.[0]?.price
      ?? parseFloat(item.display_price)
      ?? 0;
    items.push({
      id: item.id,
      name: item.name,
      desc: item.description || '',
      price,
      cat: cat.name,
      catId: cat.id,
      image: item.images?.[0] || cat.image || null,
    });
  });
});

writeFileSync('menu-parsed.json', JSON.stringify({ categories, items }, null, 2));
console.log(`Categories: ${categories.length}, Items: ${items.length}`);
categories.forEach((c) => console.log(`- ${c.name} (${c.itemCount})`));
await browser.close();

execSync('node build-menu-data.js', { stdio: 'inherit' });
