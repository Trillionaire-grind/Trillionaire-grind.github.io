/**
 * Owner pack. This is the file a buyer fills.
 * Brand, copy, VSL, ranks, rooms, Zoom. Stripe links live in princesStripeConfig.js.
 * Firestore is not required to walk this locally.
 */
window.PRINCES_OWNER = {
  brand: {
    name: "Princes",
    tagline: "To all aspiring princes",
    logo: "princesView/assets/logos/princes-logo-shield.png",
    favicon: "princesView/assets/logos/princes-logo-shield.png",
    colors: {
      navy: "#0b1220",
      gold: "#c9a227",
      cream: "#f6f1e6",
    },
  },
  vsl: {
    url: "",
    placeholder: "VSL goes here. Five minutes. Publishing soon.",
  },
  sales: {
    title: "Yes, I want to fix it",
    description: "To all aspiring princes. Hate the fat on a skinny frame. Enter for $1.",
    kicker: "To all aspiring princes",
    headline: "Are you skinny fat?",
    questions: [
      "Do you tug at your shirt before you walk into a room?",
      "Do you wear sweaters to hide the gut?",
      "Do you skip pools and beaches so nobody sees the truth?",
      "Do you want to go shirtless and get the female attention a prince deserves?",
    ],
    followUp: [
      "Did you answer yes to all the questions?",
      "Do you want to finally fix it?",
    ],
    cta: "Yes, I want to fix it",
    ticketNote: "The dollar is not for us. It is for you. A man who will not invest one dollar will not invest the sweat. We spend more than a dollar to put this page in front of you. We could raise the ticket to cover the ad. For now it stays one dollar. Pay it. Learn to invest in yourself.",
    letter: [
      {
        heading: "Are you tired of being skinny fat",
        paragraphs: [
          "If you nodded five times up there, stay. This is for the skinny-fat man who looks fine in a hoodie and falls apart when the shirt comes off.",
          "You are not huge. People still call you skinny. You still pinch fat on your stomach. You still hate the mirror at night. That split is the whole problem. Soft where a prince should be hard.",
          "You tug the shirt down when you sit. You buy the bigger sweater. You have a story ready for why you will not get in the water. Pools. Beaches. Any place the body has to stand on its own.",
          "You want the other picture. Shirt off. Chest clean. Waist tight. Women looking at you like you already won. That is female validation with no speech attached. The body talks first.",
        ],
      },
      {
        heading: "What you are actually avoiding",
        paragraphs: [
          "You are not avoiding exercise. You are avoiding being seen. The sweater is armor. The skipped beach is armor. The tug on the shirt is armor. Armor on a prince is a confession. You do not believe the body is ready for the room.",
          "Every man in this court starts at 10% body fat. Not as a hobby. As the first law. If the body is soft, the rest of the climb is theater.",
          "This course is how to lose fat as fast as humanly possible. Stupid fast. The kind of speed that makes the sweater pointless in weeks, not years.",
        ],
      },
      {
        heading: "The $1 door",
        paragraphs: [
          "You create an account. You pay one dollar. The course opens. That dollar teaches you to invest in yourself. We do not need the dollar. We may have already spent more than that to reach you.",
          "After the course, the unit is waiting. Private. Specialist. Sergeant. Colonel. Prince's Court. You do not need those rooms tonight. You need the fat gone. You need the shirt off without a story.",
          "If the five lines above are your life, you already decided. The button is only the date you stopped hiding.",
        ],
      },
    ],
  },
  zoomUrl: "https://zoom.us/join",
  memberRankId: "private",
  ranks: null,
  rooms: null,
};
