window.PRINCES_CATALOG = {
  brand: "Princes",
  tagline: "To all aspiring princes",
  workingLogo: "princesView/assets/logos/princes-logo-shield.png",
  names: [
    { id: "princes", name: "Princes", note: "Product name. Locked." },
  ],
  headlines: [
    "You already know what you look like with the shirt off",
    "Fix the prince in the mirror first",
    "A soft body cannot hold a command",
    "10% body fat is the first law",
    "The 10% law",
    "Fix the man in the mirror first",
  ],
  /** Live class room. Replace with the Princes Zoom meeting link. */
  zoomUrl: "https://zoom.us/join",
  tiers: [
    {
      id: "ticket",
      name: "Recruit",
      price: 1,
      cadence: "once",
      label: "$1 ticket",
      perks: "The fat-loss course. The first law. No unit yet.",
      access: ["course:body"],
    },
    {
      id: "private",
      name: "Private",
      price: 14.97,
      cadence: "month",
      label: "$14.97 / month",
      perks: "You are in the unit. Live classes. Posts. Member chat. Calendar.",
      access: ["course:body", "learn", "posts", "chat", "calendar"],
    },
    {
      id: "specialist",
      name: "Specialist",
      price: 47,
      cadence: "week",
      label: "$47 / week",
      perks: "Every course. Monthly accountability. You are skilled labor now.",
      access: ["course:body", "learn", "posts", "chat", "calendar", "courses:all"],
    },
    {
      id: "sergeant",
      name: "Sergeant",
      price: 997,
      cadence: "month",
      label: "$997 / month",
      perks: "A squad of 8 other men. You open a group chat. You build each other.",
      access: ["course:body", "learn", "posts", "chat", "calendar", "courses:all", "squad"],
    },
    {
      id: "colonel",
      name: "Colonel",
      price: 10000,
      cadence: "month",
      label: "$10,000 / month",
      perks: "A month-long call with the Princes and every other Colonel. The goal is to become a Prince.",
      access: ["course:body", "learn", "posts", "chat", "calendar", "courses:all", "squad", "command"],
    },
    {
      id: "court",
      name: "Prince's Court",
      price: 1000000,
      cadence: "year",
      label: "$1,000,000 / year",
      perks: "The small table. Princes talking to princes. Seats are few. Someone leaves. Someone takes the chair.",
      access: ["course:body", "learn", "posts", "chat", "calendar", "courses:all", "squad", "command", "mastermind"],
    },
  ],
  midOffers: [],
  ranksManual: {
    title: "How an army is stacked",
    intro: "The product is Princes. The paid rooms under that table use U.S. Army titles. A rank is a job, not a costume.",
    layers: [
      {
        name: "Enlisted",
        ranks: "Recruit, Private, Private First Class, Specialist",
        job: "They do the work. Recruit just arrived. Private is in the unit. Specialist is trained and trusted with more tools.",
      },
      {
        name: "NCOs (sergeants)",
        ranks: "Corporal, Sergeant, Staff Sergeant",
        job: "They lead the men next to them. A fire team is about 4. A squad is about 9: you plus 8. That is why Sergeant is the $997 room.",
      },
      {
        name: "Officers",
        ranks: "Lieutenant, Captain, Major, Lieutenant Colonel, Colonel",
        job: "They command a platoon, a company, a battalion, then a regiment. Colonel is the last rank before generals. That is the $10k room: close to the table, not yet on it.",
      },
      {
        name: "Flag officers",
        ranks: "Brigadier General through General",
        job: "A small room. Fixed chairs. The Joint Chiefs work this way. You do not add a tenth seat. A man leaves. Another man takes the chair.",
      },
    ],
    seats: [
      "A minister of X is a civilian job the state names: war, law, police, money. The army, the courts, and the police sit under those jobs.",
      "The army analog is a command: Chief of Staff, a theater commander, a service chief. The chair already exists. You replace the man in it.",
      "Old armies sold commissions. A British officer could buy a Captain's seat. That is the buy-or-replace path.",
      "The other path: raise your own unit. You do not take their chair. You stand up a new command. Your own court.",
    ],
    reading: [
      { title: "FM 7-21.13 The Soldier's Guide", note: "Free Army manual. What a soldier is, what a unit is." },
      { title: "FM 3-21.8 Infantry Rifle Platoon and Squad", note: "Free. Fire team, squad, platoon. Read this for the Sergeant room." },
      { title: "FM 6-0 Commander and Staff Organization and Operations", note: "Free. Staff officers. Closest book to ministers." },
      { title: "The Armed Forces Officer (National Defense University)", note: "Free PDF. Enlisted, NCO, officer. Short." },
      { title: "Small Unit Leadership by Dandridge M. Malone", note: "Sergeants. How 8 men become a squad." },
      { title: "Team of Teams by Stanley McChrystal", note: "Modern command. How a general staff actually talks." },
      { title: "Call Sign Chaos by Jim Mattis", note: "A Marine's path from lieutenant to the top room." },
      { title: "Purchase of commissions in the British Army (history)", note: "How a seat was bought. The old version of replace-a-prince." },
    ],
  },
  topics: {
    body: { label: "Body", color: "#C9A227" },
    mindset: { label: "Mindset", color: "#6B4C9A" },
    app: { label: "App", color: "#1F6FEB" },
    business: { label: "Business", color: "#0F7B4A" },
    city: { label: "City", color: "#B42318" },
  },
  teamRoles: ["member", "leader", "staff", "owner"],
  courses: [
    {
      id: "body",
      title: "How to lose fat as fast as humanly possible",
      meta: "Your first command",
      topic: "body",
      access: "ticket",
      image: "princesView/assets/courses/body.png",
      href: "fatLossViews/app.html?from=princes",
    },
  ],
  classes: [
    {
      id: "class-body-1",
      title: "10% body fat: the first law",
      when: "Tue Nov 25 · 8:00 PM ET",
      date: "2026-11-25",
      time: "20:00",
      topic: "body",
      sub: "Why every man in this unit starts with the mirror.",
    },
    {
      id: "class-mind-1",
      title: "The prince's morning",
      when: "Thu Nov 27 · 7:00 AM ET",
      date: "2026-11-27",
      time: "07:00",
      topic: "mindset",
      sub: "A short rule set for the first hour of the day.",
    },
    {
      id: "class-biz-1",
      title: "Price like a prince",
      when: "Sat Nov 29 · 11:00 AM ET",
      date: "2026-11-29",
      time: "11:00",
      topic: "business",
      sub: "How men who sell well stop apologizing for the number.",
    },
  ],
  events: [
    { id: "e1", title: "10% body fat: the first law", date: "2026-11-25", time: "20:00", topic: "body", sub: "Live class. Bring your current weight and waist.", joinType: "link", joinUrl: "https://zoom.us/join", unlimited: true },
    { id: "e10", title: "Ledger reminder", date: "2026-11-25", time: "09:00", topic: "body", sub: "Log breakfast. No live room. Add it to your calendar." },
    { id: "e2", title: "The prince's morning", date: "2026-11-27", time: "07:00", topic: "mindset", sub: "Live class. First-hour rules.", joinType: "link", joinUrl: "https://zoom.us/join", unlimited: true },
    { id: "e3", title: "Price like a prince", date: "2026-11-29", time: "11:00", topic: "business", sub: "Live class. Offer, price, close.", joinType: "link", joinUrl: "https://zoom.us/join" },
    { id: "e4", title: "Build a simple app this month", date: "2026-12-02", time: "19:00", topic: "app", sub: "Workshop. Ship one page that takes money.", joinType: "register", joinUrl: "https://zoom.us/join", unlimited: true },
    { id: "e5", title: "City night: Kotfè", date: "2026-12-05", time: "18:00", topic: "city", sub: "How a town gets food, streets, and owners.", joinType: "register", joinUrl: "https://zoom.us/join", seats: 24, seatsTaken: 18 },
    { id: "e6", title: "Waist check", date: "2026-12-08", time: "20:00", topic: "body", sub: "Accountability. Post the number. No live room." },
    { id: "e7", title: "Mindset office hours", date: "2026-12-08", time: "12:00", topic: "mindset", sub: "Open questions. 45 minutes.", joinType: "link", joinUrl: "https://zoom.us/join", unlimited: true },
    { id: "e8", title: "Offer review", date: "2026-12-08", time: "16:00", topic: "business", sub: "Bring one offer. We tighten it live.", joinType: "register", joinUrl: "https://zoom.us/join", seats: 9, seatsTaken: 6 },
    { id: "e9", title: "App office hours", date: "2026-12-08", time: "21:00", topic: "app", sub: "Unstick your build on your own time. Calendar only." },
  ],
  seedPosts: [
    {
      id: "p1",
      author: "Siguineau",
      role: "owner",
      title: "Fix the prince in the mirror first",
      body: "If you do not like the man in the mirror, change him first. A weak prince trains a weak unit. Get to 10% body fat.",
      topic: "body",
    },
    {
      id: "p2",
      author: "Staff",
      role: "staff",
      title: "Private is open",
      body: "Recruits who finish the fat course can step into Private. Classes, posts, and chat start there.",
      topic: "mindset",
    },
    {
      id: "p3",
      author: "Siguineau",
      role: "owner",
      title: "The 10% law",
      body: "Every man in this court starts at 10% body fat. That is the first law.",
      topic: "body",
      access: "ticket",
      pinned: true,
    },
  ],
  chatRooms: [
    {
      id: "court",
      name: "Prince's Court",
      mark: "PC",
      access: "court",
      vip: true,
      sub: "The small table. Seats are few.",
      lockHint: "Prince's Court",
    },
    {
      id: "global",
      name: "Global",
      mark: "GL",
      access: "ticket",
      global: true,
      sub: "Every recruit in one room.",
      lockHint: "$1 ticket",
    },
    {
      id: "unit",
      name: "Unit",
      mark: "UN",
      access: "private",
      sub: "Daily talk for the men.",
      lockHint: "Private",
    },
    {
      id: "announcements",
      name: "Announcements",
      mark: "AN",
      access: "private",
      sub: "Orders from staff.",
      lockHint: "Private",
    },
    {
      id: "body",
      name: "10% law",
      mark: "10",
      access: "private",
      sub: "Fat course talk.",
      lockHint: "Private",
    },
    {
      id: "squad",
      name: "Squad",
      mark: "SQ",
      access: "sergeant",
      sub: "You plus 8. Hold the number.",
      lockHint: "Sergeant",
    },
    {
      id: "colonel",
      name: "Colonel",
      mark: "CO",
      access: "colonel",
      sub: "The month-long call.",
      lockHint: "Colonel",
    },
  ],
  fatLossApp: "fatLossViews/app.html",
};

(function applyOwnerPack(catalog, owner) {
  if (!owner) return;
  var brand = owner.brand || {};
  if (brand.name) catalog.brand = brand.name;
  if (brand.tagline) catalog.tagline = brand.tagline;
  if (brand.logo) catalog.workingLogo = brand.logo;
  if (brand.favicon) catalog.favicon = brand.favicon;
  if (brand.colors) catalog.brandColors = brand.colors;
  if (owner.vsl) catalog.vsl = owner.vsl;
  if (owner.sales) catalog.sales = owner.sales;
  if (owner.zoomUrl) catalog.zoomUrl = owner.zoomUrl;
  if (owner.memberRankId) catalog.memberRankId = owner.memberRankId;
  if (owner.ranks && owner.ranks.length) catalog.tiers = owner.ranks;
  if (owner.rooms && owner.rooms.length) catalog.chatRooms = owner.rooms;
  if (owner.ranksManual) catalog.ranksManual = owner.ranksManual;
})(window.PRINCES_CATALOG, window.PRINCES_OWNER);
