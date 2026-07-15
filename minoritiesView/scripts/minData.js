window.MIN_DATA = {
  profile: {
    name: "Member",
    tier: "free",
    avatar: "minoritiesView/assets/person.svg",
  },

  promoVideo: "https://www.youtube.com/watch?v=TG0ErRPkvYQ",

  contentCards: [
    {
      id: "university-drop",
      title: "University Collection — now live",
      date: "Jul 1, 2026",
      comments: 18,
      image: "minoritiesView/assets/shop/uni_hd.webp",
      locked: false,
    },
    {
      id: "editing",
      title: "How to edit content that keeps people watching",
      date: "Jun 28, 2026",
      comments: 31,
      image: null,
      locked: false,
    },
    {
      id: "vip-preview",
      title: "Inside the next member-only drop",
      date: "Jul 3, 2026",
      comments: 7,
      image: "minoritiesView/assets/shop/jacket_bl.webp",
      locked: true,
    },
  ],

  posts: [
    {
      id: "min-text",
      author: "The Minorities",
      date: "Jul 3, 26",
      body: "Podcast question of the week: would you rather fight 100 duck-sized exes or one horse-sized situationship? Wrong answers only — we're reading the best ones on air.",
      image: null,
      likes: 89,
      comments: 52,
      threadComments: [
        { author: "Nicholas Flame", text: "Horse-sized. I like a challenge." },
        { author: "Adam Smith", text: "The ducks would gossip about you forever." },
        { author: "Chris Stip", text: "This is why I pay for Starter." },
      ],
    },
    {
      id: "min-photo",
      author: "The Minorities",
      date: "Jul 2, 26",
      body: "Fit check: she said 'come through comfortable' and you showed up in the Easy hoodie like it's body armor. We don't make the rules — we just sell the uniform.",
      image: "minoritiesView/assets/shop/hoodie_bl.webp",
      likes: 124,
      comments: 38,
      threadComments: [
        { author: "Mike Meyers", text: "Bro looked ready for war and brunch." },
        { author: "Jerome Johnson", text: "Need that hoodie in every color." },
      ],
    },
    {
      id: "min-video",
      type: "video",
      author: "The Minorities",
      date: "Jul 1, 26",
      headline: "We argued 40 minutes about which model looked more 'dangerous'",
      video: "https://www.youtube.com/watch?v=TG0ErRPkvYQ",
      likes: 203,
      comments: 67,
      threadComments: [
        { author: "Nicholas Flame", text: "The BTS energy is unhinged. Love it." },
        { author: "Adam Smith", text: "Cast me in the next shoot." },
      ],
    },
    {
      id: "community-1",
      author: "Adam Smith",
      date: "Jun 28, 26",
      body: "First time posting here — this feels like the group chat we never had on the other apps. Less noise, more real talk.",
      image: null,
      likes: 31,
      comments: 11,
      threadComments: [
        { author: "Chris Stip", text: "Welcome in." },
        { author: "Mike Meyers", text: "Pull up to general chat." },
      ],
    },
    {
      id: "community-2",
      author: "Nicholas Flame",
      date: "Jun 25, 26",
      body: "Copped the University tee. Fit is stupid clean. My girl tried to steal it — that's a W in my book.",
      image: "minoritiesView/assets/shop/uni_bl.webp",
      likes: 47,
      comments: 19,
      threadComments: [{ author: "Jerome Johnson", text: "Classic." }],
    },
  ],

  postDetail: {
    "university-drop": {
      title: "University Collection — now live",
      image: "minoritiesView/assets/shop/uni_hd.webp",
      body: "The University hoodies and tees are available now. Member chat has fit pics and pickup spots — tap Shop for the full collection on BigCartel.",
      comments: [
        { author: "Nicholas Flame", text: "Quality on the hoodie is crazy." },
        { author: "Adam Smith", text: "Copped the white tee too." },
      ],
    },
    editing: {
      title: "How to edit content that keeps people watching",
      image: null,
      body: "Learn the editing workflow that keeps viewers watching — strong hooks in the first 3 seconds, pacing that breathes, and captions that convert casual scrollers into subscribers.",
      comments: [{ author: "Chris Stip", text: "Needed this breakdown." }],
    },
    "vip-preview": {
      title: "Inside the next member-only drop",
      image: "minoritiesView/assets/shop/jacket_bl.webp",
      body: "Starter and V.I.P. members get first look at upcoming Easy collection pieces before the public shop opens. Upgrade to unlock the full preview and early cart access.",
      comments: [{ author: "Mike Meyers", text: "That puffer though." }],
    },
  },

  chats: [
    { id: "vip", name: "V.I.P. Group Chat", preview: "Next live class this Tuesday", vip: true },
    { id: "general", name: "General Community Group Chat", preview: "Welcome everyone", vip: false },
    { id: "nicholas", name: "Nicholas Flame", preview: "Sent the rough cut over", vip: false },
    { id: "mike", name: "Mike Meyers", preview: "Let's link this week", vip: false },
  ],

  threadMessages: {
    vip: [
      { mine: false, text: "Who's pulling up to the live class Tuesday?" },
      { mine: true, text: "I'll be there — got questions on the edit workflow." },
      { mine: false, text: "Perfect. We're diving into hooks and retention." },
      { mine: true, text: "Sounds good." },
    ],
    general: [
      { mine: false, text: "Welcome to the community chat!" },
      { mine: true, text: "Glad to be here." },
    ],
    nicholas: [{ mine: false, text: "Sent the rough cut over — let me know what you think." }],
    mike: [{ mine: false, text: "Let's link this week on the merch collab." }],
  },

  chatroomPeople: ["Adam Savage", "Mike Meyers", "Chris Stip", "Leonard McDouglass", "James Smith", "Jerome Johnson"],

  products: [
    {
      name: "BLACK UNIVERSITY HOODIE",
      price: "$53.99",
      image: "minoritiesView/assets/shop/uni_hd.webp",
      url: "https://2minorities.bigcartel.com/product/black-university-hoodie",
    },
    {
      name: "WHITE UNIVERSITY TEE",
      price: "$32.99",
      image: "minoritiesView/assets/shop/uni_wt.webp",
      url: "https://2minorities.bigcartel.com/product/white-university-tee",
    },
    {
      name: "BLACK UNIVERSITY TEE",
      price: "$32.99",
      image: "minoritiesView/assets/shop/uni_bl.webp",
      url: "https://2minorities.bigcartel.com/product/university-tee",
    },
    {
      name: "EASY CREAM TEE",
      price: "$49.99",
      image: "minoritiesView/assets/shop/shirt_cr.webp",
      url: "https://2minorities.bigcartel.com/product/easy-cream-tee",
    },
    {
      name: "EASY BLACK TEE",
      price: "$39.99",
      image: "minoritiesView/assets/shop/shirt_black.webp",
      url: "https://2minorities.bigcartel.com/product/easy-black-tee",
    },
    {
      name: "EASY BLACK HOODIE",
      price: "$49.99",
      image: "minoritiesView/assets/shop/hoodie_bl.webp",
      url: "https://2minorities.bigcartel.com/product/easy-black-hoodie",
    },
    {
      name: "EASY BLACK SHORTS",
      price: "$39.99",
      image: "minoritiesView/assets/shop/shorts_bl.webp",
      url: "https://2minorities.bigcartel.com/product/easy-black-shorts",
    },
    {
      name: "EASY BLACK/CREAM SWEATS",
      price: "$44.99",
      image: "minoritiesView/assets/shop/sweats_b.webp",
      url: "https://2minorities.bigcartel.com/product/easy-black-cream-sweats",
    },
    {
      name: "EASY SUNSET PUFFER",
      price: "$115.99",
      image: "minoritiesView/assets/shop/jacket_bl.webp",
      url: "https://2minorities.bigcartel.com/product/easy-sunset-puffer",
    },
    {
      name: "EASY SUNSET HAT",
      price: "$34.99",
      image: "minoritiesView/assets/shop/hat.webp",
      url: "https://2minorities.bigcartel.com/product/easy-sunset-hat",
    },
    {
      name: "FRIENDS HOODIE",
      price: "$61.99",
      image: "minoritiesView/assets/shop/friends.webp",
      url: "https://2minorities.bigcartel.com/product/black-panthers-or-grey-goo-s",
    },
  ],

  subscriptions: [
    {
      id: "waterboy",
      name: "Waterboy",
      price: 2,
      perks: "Support the movement. Upgrade to Bench Player or above for content access.",
    },
    {
      id: "bench",
      name: "Bench Player",
      price: 5,
      perks: "Community posts, early merch drops, and member-only chat.",
    },
    {
      id: "starter",
      name: "Starter",
      price: 10,
      perks: "Podcasts, exclusive content, live classes, and everything in Bench Player.",
    },
    {
      id: "vip",
      name: "V.I.P.",
      price: 25,
      perks: "VIP group chat, class replays, 15% merch discount, and everything in Starter.",
    },
  ],

  learn: {
    nextSession: "Tuesday · 4:00 PM EST",
    memberNote: "Starter and V.I.P. members · link opens 15 min before class",
  },

  stripeUrl: "https://buy.stripe.com/test_14k8xh7RXg5e6nmdQZ",
};
