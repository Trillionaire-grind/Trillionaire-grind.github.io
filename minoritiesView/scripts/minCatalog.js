/**
 * Local app catalog — subscription tiers and checkout defaults.
 * User-generated content (posts, cards, shop, learn) lives in Firestore.
 */
window.MIN_CATALOG = {
  profile: {
    name: "Member",
    tier: "free",
    avatar: "minoritiesView/assets/person.svg",
  },

  subscriptions: [
    {
      id: "waterboy",
      name: "Waterboy",
      price: 0,
      image:
        "https://m.media-amazon.com/images/I/7172BRJQr9L._AC_UF894,1000_QL80_.jpg",
      perks:
        "Free forever. Teasers, shop, and announcements. No member chat, comments, or premium content.",
    },
    {
      id: "bench",
      name: "Bench Player",
      price: 1,
      image:
        "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi5FUxKYUWw7jX6E5L4gZRrbjp88hiK-9_g4o0NHoxcE-Gq_DRYAiWVT4me3bdhykIg9yoQ2-_uUYk9_jBgICGM1qFX7sbz6FoxN7xLLw2s9v5kafTd5JNNOXjlNU_0rJVnPmFhW7UJ6GQ/s1600/bench.jpg",
      perks:
        "$1/month — member chat, comment on posts, and community participation. Content library still locked.",
    },
    {
      id: "starter",
      name: "Starter",
      price: 14.99,
      image:
        "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=900&auto=format&fit=crop&q=80",
      perks:
        "Everything in Bench Player plus group training calls and ~90% of the content library (vlogs, home drops, replays).",
    },
    {
      id: "owner",
      name: "Owner",
      price: 2497,
      limited: true,
      image:
        "https://www.usatoday.com/gcdn/-mm-/7fab6e2b7e51a83a9260f81f52dcde6dafa846dc/c=0-120-1692-1076/local/-/media/2018/05/31/USATODAY/USATODAY/636634001641190840-USATSI-10865754.jpg?width=1600&height=800&fit=crop&format=pjpg&auto=webp",
      perks:
        "All content. 1:1 coaching on dating & wealth mindset. Private Owner mastermind (max 20 members). Premium high-ticket tier.",
    },
  ],

  stripeUrl: "https://buy.stripe.com/test_14k8xh7RXg5e6nmdQZ",
};
