import { countWords } from "./learnNoteReadTime.js";

/** Legacy HTML notes — merged with Firestore notes on the Notes page */
const LEGACY_BASE_MS = Date.parse("2024-01-01T00:00:00Z");

/** Precomputed from article HTML (see learnNoteReadTime.js). */
const STATIC_WORD_COUNTS = {
  fannyApp: 8902,
  calendarApp: 37,
  coffeeApp: 502,
  datingApp: 582,
  fishApp: 537,
  geographyApp: 352,
  notesApp: 507,
  workoutApp: 266,
  howSell: 1232,
  beDoHave: 675,
  berkInvest: 580,
  coldCall: 754,
  needMoney: 582,
  profitExplained: 258,
  salesMindset: 401,
  salesTips: 339,
  startBusiness: 516,
  warrenMethod: 357,
  capitalismSlavery: 1333,
  profitSeacoast: 494,
  cityBuilding: 398,
  cityDiversity: 707,
  cityZoning: 464,
  citySchool: 411,
  mountainRoads: 848,
  richestCities: 345,
  webApp: 711,
  haitianApp: 590,
  doorSales: 751,
  cityRiver: 780,
};

function legacyNote(genre, slug, title, summary, isAi, order, youtubeId = "") {
  const note = {
    id: `static-${genre}-${slug}`,
    source: "static",
    genre,
    slug,
    title,
    summary,
    isAi,
    wordCount: STATIC_WORD_COUNTS[slug] || countWords([title, summary].join(" ")),
    createdAt: LEGACY_BASE_MS - order * 86400000,
  };
  if (youtubeId) note.youtubeId = youtubeId;
  return note;
}

export const STATIC_NOTES = [
  legacyNote("apps", "fannyApp", "How To Build An App", "The full walkthrough — planning, UI, Firebase, and shipping a real app from scratch.", false, 100, "AZVQ2W6nr44"),
  legacyNote("apps", "webApp", "How to Create a Basic Web App", "Build a message-board app with HTML, CSS, JavaScript, and Node.js — no database required.", true, 91),
  legacyNote("apps", "haitianApp", "How to Build a Haitian App", "Share Haitian culture through code — a proverbs app with Creole and English translations.", true, 90),
  legacyNote("apps", "calendarApp", "How To Build A Calendar App", "Build a simple calendar and task planner with vanilla JavaScript.", true, 99),
  legacyNote("apps", "coffeeApp", "How To Build A Coffee App", "Design a coffee-shop ordering flow — menu, cart, and checkout.", true, 98),
  legacyNote("apps", "datingApp", "How To Build A Dating App", "Core patterns for profiles, matching, and messaging in a dating app.", true, 97),
  legacyNote("apps", "fishApp", "How To Build A Fish App", "Log catches, species, and locations — a field journal in app form.", true, 96),
  legacyNote("apps", "geographyApp", "How To Build A Geography App", "Quiz and map mechanics for a geography learning app.", true, 95),
  legacyNote("apps", "notesApp", "How To Build A Notes App", "Capture ideas fast — notes, tags, and search without over-engineering.", true, 94),
  legacyNote("apps", "workoutApp", "How To Build A Workout App", "Track sets, reps, and progress in a minimal workout logger.", true, 93),

  legacyNote("business", "howSell", "How To Sell Anything", "Selling is an important skillset", false, 100, "GcaXjsNrP90"),
  legacyNote("business", "doorSales", "How To Sell Door To Door", "From your first knock to closing the deal — resilience, scripts, and follow-up.", true, 90),
  legacyNote("business", "beDoHave", "Be. Do. Have.", "learn the secret those 3 words contain", true, 99),
  legacyNote("business", "berkInvest", "Why You Should Invest in Berkshire Hathaway", "Berkshire Hathaway isn’t a typical company—it’s a collection of businesses hand-picked by Warren Buffett and his team over decades.", true, 98),
  legacyNote("business", "coldCall", "How To Cold Call", "Cold calling is one of the fastest ways to create pipeline", true, 97),
  legacyNote("business", "needMoney", "Do You Need Money To Start A Business?", "Short answer: not always...", true, 96),
  legacyNote("business", "profitExplained", "How To Earn A Profit", "Making a profit is the goal of any business or investment...", true, 95),
  legacyNote("business", "salesMindset", "How to Have a Winning Mindset in Sales", "Sales success doesn’t start with scripts or products—it starts in your mind...", true, 94),
  legacyNote("business", "salesTips", "The Biggest Sales Secrets", "Sales is not about pushing a product—it’s about solving problems, building trust, and creating long-term relationships...", true, 93),
  legacyNote("business", "startBusiness", "How To Start A Business", "Starting a business is more than just a great idea...", true, 92),
  legacyNote("business", "warrenMethod", "How To Invest Like Warren Buffett", "Warren Buffett is one of the most successful investors in history...", true, 91),

  legacyNote("city", "capitalismSlavery", "Is Capitalism Pro-Slavery?", "\"wage labor you are renting yourself. which is not very different from being a slave...\"", false, 100, "PKx9IOnIZTs"),
  legacyNote("city", "cityRiver", "How To Use Your River Effectively", "Rivers as living infrastructure — recreation, ecology, access, and flood resilience.", true, 92),
  legacyNote("city", "profitSeacoast", "How To Profit From Your Seacoast", "Your coastline is more than just a scenic boundary—it’s an economic engine...", true, 99),
  legacyNote("city", "cityBuilding", "How To Build A City", "Building a city is one of humanity’s most ambitious undertakings...", true, 98),
  legacyNote("city", "cityDiversity", "The Pros and Cons Of Diversity In A City", "Diversity—across culture, language, age, income, and ability—shapes how a city feels, grows, and solves problems...", true, 97),
  legacyNote("city", "cityZoning", "How To Zone A City", "Zoning is the backbone of effective city planning...", true, 96),
  legacyNote("city", "citySchool", "How To Build A School", "Schools are the foundation of every community...", true, 95),
  legacyNote("city", "mountainRoads", "How To Build Roads In A Mountainous Zone", "Mountain roads unlock remote communities, tourism, emergency access, and trade—but they’re among the most complex pieces of infrastructure to design and build...", true, 94),
  legacyNote("city", "richestCities", "The 5 Wealthiest Cities In The World", "When it comes to global wealth, some cities stand far above the rest...", true, 93),
];

export const NOTE_GENRES = [
  { id: "apps", label: "Apps", color: "red" },
  { id: "business", label: "Businesses", color: "blue" },
  { id: "city", label: "Cities", color: "green" },
];

export function staticNoteUrl(note) {
  const folder = note.isAi ? `${note.genre}/ai` : note.genre;
  return `./content/${folder}/${note.slug}.html`;
}
