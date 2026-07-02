/**
 * Offers shown on learnViews/offersView.html
 * lane: "earn" (build & earn) | "fun" (entertainment)
 * visual.kind: "funnel" | "cover" | "photo" | "icon"
 */

export const OFFERS = [
  {
    id: "funnel",
    lane: "earn",
    type: "Productive · Service",
    title: "How To Build Your Own Online Marketing Funnel",
    subtitle: "We teach you what to do — and we can build it for you.",
    leads: [
      "A funnel is not one page or one ad. It's the full path: stranger → lead → trust → purchase. Most people jump straight to traffic and wonder why nothing converts.",
    ],
    split: [
      {
        title: "Learn the how",
        body: "We walk you through what a real funnel needs — offer, landing page, capture, follow-up, checkout — and how the pieces connect before you spend on ads.",
      },
      {
        title: "We build it",
        body: "Don't want to wire it yourself? We implement the funnel for you — pages, flow, and handoff — so you can focus on your product and sales.",
      },
    ],
    bullets: [
      "For founders, creators, and sellers who need leads that actually convert",
      "Education first — implementation optional",
      "Aligned with the business notes on this site, applied to your offer",
    ],
    actions: [
      { label: "Book a funnel build call", nav: "speak", primary: true },
      { label: "Read business notes", nav: "notes", primary: false },
    ],
    note: "On the call we'll scope your offer and quote a build if you want done-for-you.",
    visual: { kind: "funnel", src: "assets/banknote_b.svg", caption: "Traffic → Capture → Nurture → Convert" },
  },
  {
    id: "tech-academy",
    lane: "earn",
    type: "Productive · Course",
    title: "Tech Mastery For Seniors",
    subtitle: "Help the 55+ crowd master their devices — and build a real business around it.",
    leads: [
      "Millions of seniors want to use their phones, tablets, and computers with confidence. Tech Mastery For Seniors is a full academy: seminars, guides, and ongoing support designed for learners who've been told tech is \"not for them.\"",
    ],
    bullets: [
      "NO B.S. Guide and full Academy tiers for serious students",
      "Built for coaches, caregivers, and anyone serving older adults",
    ],
    actions: [
      { label: "Explore Tech Academy", href: "/techAcademy.html", external: true, primary: true },
    ],
    note: "Opens Tech Academy in a new tab",
    visual: { kind: "icon", src: "../techAcademyViews/assets/desk_b.svg", alt: "Tech Mastery For Seniors" },
  },
  {
    id: "tech-academy-vip",
    lane: "earn",
    type: "Productive · Mastermind",
    title: "Tech Mastery For Seniors Academy — VIP",
    subtitle: "The full in-person experience. Limited seats. White-glove tech mastery.",
    leads: [
      "The Academy teaches seniors to master technology online. VIP is for students who want the highest level: in-person classes, travel and lodging handled, and a small mastermind of like-minded learners pushing each other forward.",
      "All Academy content — plus in-person instruction, transportation, food, and lodging included. Master the basics and the advanced skill sets. Limited to 11 members.",
    ],
    split: [
      {
        title: "Everything in Academy",
        body: "Monthly seminars, workshops, weekly Q&A, and I.T. help desk access — the full 12-month Tech Mastery program.",
      },
      {
        title: "VIP layer",
        body: "In-person classes, curated cohort, travel and lodging covered — built for seniors who want the premium, done-with-you experience.",
      },
    ],
    bullets: [
      "Premium mastermind — full pricing on the VIP page",
      "Limited to 11 members",
      "For serious students who want in-person mastery, not just videos",
    ],
    actions: [
      { label: "View VIP details", href: "/techAcademyViews/vip.html", external: true, primary: true },
      { label: "Call to reserve your spot", nav: "speak", primary: false },
    ],
    note: "Premium investment — see vip.html for pricing. Reservation call required.",
    visual: { kind: "icon", src: "../techAcademyViews/assets/graduation.svg", alt: "Tech Mastery VIP Mastermind" },
  },
  {
    id: "write-a-book",
    lane: "earn",
    type: "Productive · Coaching",
    title: "How To Write A Book",
    subtitle: "From idea to published — learn the process or get coached through it.",
    leads: [
      "Most people have a book in them. Few finish one. The gap isn't talent — it's structure: outline, draft, edit, publish, and sell.",
      "I've been through it — from first chapter to a published novel on Amazon. This offer is for authors who want the roadmap, or a partner to keep them accountable until the book is real.",
    ],
    split: [
      {
        title: "Learn the how",
        body: "We cover idea validation, outlining, drafting habits, editing, formatting, and getting your book on Amazon or in readers' hands.",
      },
      {
        title: "Get coached",
        body: "Want accountability? We work through your manuscript together — milestones, feedback, and a path to done.",
      },
    ],
    bullets: [
      "For first-time authors with a story or expertise to share",
      "Fiction, memoir, or business — the process is the same",
      "See A Secret Attraction on Amazon for proof I've shipped a book",
    ],
    actions: [
      { label: "Book a writing strategy call", nav: "speak", primary: true },
      {
        label: "See my published book",
        href: "https://www.amazon.com/Secret-Attraction-Between-Mentor-Mentee/dp/B0DH2ZJ57H",
        external: true,
        primary: false,
      },
    ],
    note: "15–30 min call to discuss your book idea and next steps",
    visual: {
      kind: "cover",
      src: "../secretAttractionViews/assets/book_cover.jpg",
      alt: "A Secret Attraction Between Mentor and Mentee — published by Képler Siguineau",
    },
  },
  {
    id: "app-build",
    lane: "earn",
    type: "Productive · Service",
    title: "Custom App Development",
    subtitle: "From idea to App Store — we design, build, and ship your MVP.",
    leads: [
      "You don't need a dev team of ten. You need someone who's shipped apps before and can translate your idea into something people actually use.",
      "We've built notes apps, club tools, learning platforms, and more — documented in public on this site.",
    ],
    split: [
      {
        title: "Scope & plan",
        body: "We map your core user flow, must-have features, and timeline before writing code.",
      },
      {
        title: "Build & launch",
        body: "Web or mobile — we handle the build, testing, and handoff so you can sell or iterate.",
      },
    ],
    bullets: [
      "For founders with a clear idea who need a technical partner",
      "MVPs, prototypes, and v1 products — not enterprise RFPs",
      "See the Apps notes for how we think about building software",
    ],
    actions: [
      { label: "Book an app scoping call", nav: "speak", primary: true },
      { label: "Read app notes", nav: "notes", primary: false },
    ],
    note: "15–30 min call to see if we're a fit — no commitment.",
    visual: { kind: "icon", src: "assets/app_r.svg", alt: "App development" },
  },
  {
    id: "strategy-call",
    lane: "earn",
    type: "Productive · Consulting",
    title: "1:1 Strategy Call",
    subtitle: "Apps, business, cities, or Mangé Lakay — bring your question.",
    leads: [
      "Sometimes you don't need a course or a funnel — you need a focused conversation with someone who's been in the trenches. Pick a time, bring a project or idea, and we'll talk it through.",
    ],
    bullets: [
      "15–30 minutes, your timezone",
      "Apps, sales, city-building, Haiti projects — whatever you're working on",
      "No pitch deck required — just come prepared with a question",
    ],
    actions: [
      { label: "Pick a time on Calendly", nav: "speak", primary: true },
    ],
    visual: { kind: "photo", src: "assets/sitting.webp", alt: "Képler Siguineau" },
  },
  {
    id: "strangest-secret",
    lane: "earn",
    type: "Growth · Habit",
    title: "The Strangest Secret",
    subtitle: "Earl Nightingale's 30-day challenge — one goal, daily listening, real transformation.",
    leads: [
      "Earl Nightingale's classic recording comes down to one idea: you become what you think about. His 30-day test is simple — write your goal on a card, listen daily, and control your thinking until the habit sticks.",
      "This free app is your companion: a goal card, Earl's full recording, progress tracking, and the original challenge steps in his own words.",
    ],
    bullets: [
      "100% free — no account required",
      "Flip-card goal + Matthew 7:7–8, just like Earl described",
      "Daily listen tracking, offline support, and 7 visual themes",
    ],
    actions: [
      { label: "Start the 30-day challenge", href: "/strangestSecret.html", external: true, primary: true },
    ],
    note: "Free · opens in a new tab",
    visual: {
      kind: "icon",
      src: "../strangestSecretViews/assets/gold_key.webp",
      alt: "The Strangest Secret — gold key",
    },
  },
  {
    id: "secret-attraction",
    lane: "fun",
    type: "Entertainment · Fiction",
    title: "A Secret Attraction Between Mentor and Mentee",
    subtitle: "On mentorship, ambition, and the tension between guidance and desire.",
    leads: [
      "What happens when the person shaping your future becomes the person you can't stop thinking about? This book explores the emotional complexity of mentorship — respect, rivalry, attraction, and the choices that define who you become.",
      "It's written for anyone who has ever had a mentor (or been one) and felt the line between admiration and something deeper.",
    ],
    bullets: [
      "For readers who like character-driven stories with real stakes",
      "If you've ever learned more from a person than from a textbook",
      "If you're building a life and asking who you're becoming along the way",
    ],
    actions: [
      {
        label: "Buy on Amazon",
        href: "https://www.amazon.com/Secret-Attraction-Between-Mentor-Mentee/dp/B0DH2ZJ57H",
        external: true,
        primary: true,
      },
    ],
    note: "Opens Amazon in a new tab",
    visual: {
      kind: "cover",
      src: "../secretAttractionViews/assets/book_cover.jpg",
      alt: "Cover of A Secret Attraction Between Mentor and Mentee",
    },
  },
  {
    id: "tm-experience",
    lane: "fun",
    type: "Entertainment · App",
    title: "TM Experience",
    subtitle: "The #1 app for Toastmasters clubs to run meetings and grow speakers.",
    leads: [
      "Public speaking isn't just talent — it's reps, feedback, and a club that shows up. TM Experience helps Toastmasters clubs manage agendas, track speeches, and give members a place to improve between meetings.",
    ],
    bullets: [
      "Built for club officers and members who want less admin, more speaking",
      "Agendas, speech feedback, tools, and member profiles in one place",
      "Free to try — create an account with your club ID",
    ],
    actions: [
      { label: "Try TM Experience", href: "/TMExperience.html", external: true, primary: true },
    ],
    note: "Opens TM Experience in a new tab",
    visual: {
      kind: "icon",
      src: "../TMExperienceViews/assets/toastmasters-global-logo.png",
      alt: "Toastmasters International",
    },
  },
  {
    id: "liv-lakay",
    lane: "earn",
    type: "Mission · Education",
    title: "Liv Lakay",
    subtitle: "School books for Haiti's future — get access to education.",
    leads: [
      "Liv Lakay was built to support the mission of providing education to the youth of Haiti by making education more accessible. Primary education is every child's right — but access to books and materials is still a barrier for too many students.",
      "The app is a digital library of grade-level school books Haitian children can read on a phone or computer — at home, at school, or wherever they learn.",
    ],
    bullets: [
      "Grade-level books organized for Haitian students",
      "Built to make school materials more accessible",
      "Supports the mission of education access for Haiti's youth",
    ],
    actions: [
      { label: "Explore Liv Lakay", href: "/liv.html", external: true, primary: true },
    ],
    note: "Opens Liv Lakay in a new tab",
    visual: { kind: "icon", src: "../livViews/assets/books.svg", alt: "Liv Lakay — school books for Haiti" },
  },
];

export const OFFER_LANES = [
  { id: "all", label: "All offers", pillClass: "offers-lane-pill--all" },
  { id: "earn", label: "Build & earn — productive", pillClass: "offers-lane-pill--earn", dotClass: "offers-lane-dot--earn" },
  { id: "fun", label: "Entertainment — off the clock", pillClass: "offers-lane-pill--fun", dotClass: "offers-lane-dot--fun" },
];

export const OFFER_SECTIONS = {
  earn: {
    heading: "Build & earn",
    description: "Practical offers tied to making money — learn the strategy, then hire us to implement if you want the shortcut.",
  },
  fun: {
    heading: "Entertainment",
    description: "Not everything here is a lesson. Apps, fiction, and tools you can enjoy on your own time.",
  },
};
