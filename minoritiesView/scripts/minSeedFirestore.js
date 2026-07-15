/**
 * One-time Firestore seed payloads (migrated from legacy minData.js).
 * Seeded by admin when collections are empty — see seedDefaultFirestoreContent().
 */

export const SEED_CONTENT_CARDS = [
  {
    id: "yt-midnight-club",
    title: "MIDNIGHT CLUB | Sacramento CA",
    author: "Jason/Jay",
    image: "https://img.youtube.com/vi/mJUstR8oEcs/hqdefault.jpg",
    video: "https://www.youtube.com/watch?v=mJUstR8oEcs",
    body:
      "FREE PREVIEW — Night out in Sacramento with the crew. Same street-energy vlogs from @thezombiez8. Members get longer cuts, raw B-roll, and drops before YouTube.",
    access: "free",
    locked: false,
    sortOrder: 40,
  },
  {
    id: "yt-ask-minority",
    title: "ASK A MINORITY | Drunk Edition",
    author: "Zed",
    image: "https://img.youtube.com/vi/iwyXu1GZOVM/hqdefault.jpg",
    video: "https://www.youtube.com/watch?v=iwyXu1GZOVM",
    body:
      "FREE PREVIEW — Classic Ask A Minority format. Full drunk edition + unreleased questions are member-only.",
    access: "free",
    locked: false,
    sortOrder: 30,
  },
  {
    id: "yt-love-mansion-finale",
    title: "LOVE MANSION | The Finale",
    author: "The Minorities",
    image: "https://img.youtube.com/vi/_7pseqd0Q-o/hqdefault.jpg",
    video: "https://www.youtube.com/watch?v=_7pseqd0Q-o",
    body: "MEMBERS ONLY (Starter) — Love Mansion finale. Part of the ~90% library unlocked at Starter.",
    access: "starter",
    locked: true,
    sortOrder: 20,
  },
  {
    id: "yt-bombshell",
    title: "A BOMBSHELL ENTERS THE VLOG",
    author: "Zed",
    image: "https://img.youtube.com/vi/v2zZOhZaQrk/hqdefault.jpg",
    video: "https://www.youtube.com/watch?v=v2zZOhZaQrk",
    body:
      "OWNER ONLY — Top-tier uncut episode. Owner members get 100% of the library plus mastermind access.",
    access: "owner",
    locked: true,
    sortOrder: 10,
  },
];

export const SEED_POSTS = [
  {
    id: "welcome-back",
    headline: "We're on our own platform now",
    body:
      "Main channel's gone — you know the story. Full library, member chat, and drops live here now. Free teasers from @thezombiez8 and the archive; members get the episodes platforms keep removing. Register free.",
    authorName: "The Minorities",
    authorUsername: "minorities",
    authorType: "team",
    type: "text",
    sortOrder: 40,
  },
  {
    id: "city-poll",
    body: "Sacramento or Miami for the next street vlog? Comment below — same energy as Midnight Club and Petition to Kiss You.",
    authorName: "The Minorities",
    authorUsername: "minorities",
    authorType: "team",
    type: "text",
    sortOrder: 30,
  },
  {
    id: "hoodie-bts",
    headline: "University hoodie — behind the pack-out",
    body: "Restock is live. Free preview here — members already got early access codes in chat.",
    image: "minoritiesView/assets/shop/uni_hd.webp",
    authorName: "The Minorities",
    authorUsername: "minorities",
    authorType: "team",
    type: "text",
    sortOrder: 20,
  },
  {
    id: "vlog-teaser",
    headline: "GUY CODE — full episodes for members",
    body: "Free preview on YouTube (@thezombiez8). Member cut: How To Escape The Friendzone + Dating In Miami uncut.",
    video: "https://www.youtube.com/watch?v=SqPjHwz6huc",
    authorName: "Jason/Jay",
    authorUsername: "jay",
    authorType: "team",
    type: "video",
    videoProvider: "youtube",
    sortOrder: 10,
  },
];

export const SEED_PRODUCTS = [
  {
    id: "uni-hoodie-black",
    name: "BLACK UNIVERSITY HOODIE",
    price: "$53.99",
    image: "minoritiesView/assets/shop/uni_hd.webp",
    url: "https://2minorities.bigcartel.com/product/black-university-hoodie",
    sortOrder: 100,
  },
  {
    id: "uni-tee-white",
    name: "WHITE UNIVERSITY TEE",
    price: "$32.99",
    image: "minoritiesView/assets/shop/uni_wt.webp",
    url: "https://2minorities.bigcartel.com/product/white-university-tee",
    sortOrder: 90,
  },
  {
    id: "uni-tee-black",
    name: "BLACK UNIVERSITY TEE",
    price: "$32.99",
    image: "minoritiesView/assets/shop/uni_bl.webp",
    url: "https://2minorities.bigcartel.com/product/university-tee",
    sortOrder: 80,
  },
  {
    id: "easy-cream-tee",
    name: "EASY CREAM TEE",
    price: "$49.99",
    image: "minoritiesView/assets/shop/shirt_cr.webp",
    url: "https://2minorities.bigcartel.com/product/easy-cream-tee",
    sortOrder: 70,
  },
  {
    id: "easy-black-tee",
    name: "EASY BLACK TEE",
    price: "$39.99",
    image: "minoritiesView/assets/shop/shirt_black.webp",
    url: "https://2minorities.bigcartel.com/product/easy-black-tee",
    sortOrder: 60,
  },
  {
    id: "easy-black-hoodie",
    name: "EASY BLACK HOODIE",
    price: "$49.99",
    image: "minoritiesView/assets/shop/hoodie_bl.webp",
    url: "https://2minorities.bigcartel.com/product/easy-black-hoodie",
    sortOrder: 50,
  },
  {
    id: "easy-black-shorts",
    name: "EASY BLACK SHORTS",
    price: "$39.99",
    image: "minoritiesView/assets/shop/shorts_bl.webp",
    url: "https://2minorities.bigcartel.com/product/easy-black-shorts",
    sortOrder: 40,
  },
  {
    id: "easy-sweats",
    name: "EASY BLACK/CREAM SWEATS",
    price: "$44.99",
    image: "minoritiesView/assets/shop/sweats_b.webp",
    url: "https://2minorities.bigcartel.com/product/easy-black-cream-sweats",
    sortOrder: 30,
  },
  {
    id: "easy-puffer",
    name: "EASY SUNSET PUFFER",
    price: "$115.99",
    image: "minoritiesView/assets/shop/jacket_bl.webp",
    url: "https://2minorities.bigcartel.com/product/easy-sunset-puffer",
    sortOrder: 20,
  },
  {
    id: "easy-hat",
    name: "EASY SUNSET HAT",
    price: "$34.99",
    image: "minoritiesView/assets/shop/hat.webp",
    url: "https://2minorities.bigcartel.com/product/easy-sunset-hat",
    sortOrder: 10,
  },
  {
    id: "friends-hoodie",
    name: "FRIENDS HOODIE",
    price: "$61.99",
    image: "minoritiesView/assets/shop/friends.webp",
    url: "https://2minorities.bigcartel.com/product/black-panthers-or-grey-goo-s",
    sortOrder: 0,
  },
];

export const SEED_APP_CONFIG = {
  learn: {
    nextSession: "Tuesday 7:00 PM EST — topic TBA",
    previewNote:
      "Starter+ joins live group training. Waterboy sees schedule only. Replays for Starter & Owner.",
    zoomUrl:
      "https://us04web.zoom.us/j/79142289381?pwd=BkYjnBJfEcwjxA9lLjjf9kafc4Wmlv.1",
  },
  promo: {
    title: "Sale",
    body: 'Get your new "University" Hoodie',
    cta: "Yes — shop the University collection ›",
    image: "minoritiesView/assets/shop/uni_hd.webp",
    linkTab: "shop",
  },
};
