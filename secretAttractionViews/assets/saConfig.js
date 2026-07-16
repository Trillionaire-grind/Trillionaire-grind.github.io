/** Shared URLs for the Secret Attraction funnel — update Stripe link when ready. */
export const AMAZON_URL =
  "https://www.amazon.com/Secret-Attraction-Between-Mentor-Mentee/dp/B0DH2ZJ57H";

/** Stripe Payment Link for premium signed copy. Set success URL to premiumThankYou.html in Stripe dashboard. */
export const PREMIUM_STRIPE_URL =
  "https://buy.stripe.com/3cI00iaiff3v1RMeTC6Ri0K";

/**
 * Instagram highlight with reader/buyer photos.
 * Example: https://www.instagram.com/stories/highlights/12345678901234567/
 * Or your profile if the highlight is pinned there.
 */
export const INSTAGRAM_HANDLE = "buildwithkepler";

/** Profile — works best when visitors aren't signed in (highlights show as circles). */
export const INSTAGRAM_PROFILE_URL =
  "https://www.instagram.com/buildwithkepler/";

/** Direct highlight link — often requires Instagram sign-in. */
export const INSTAGRAM_HIGHLIGHT_URL =
  "https://www.instagram.com/stories/highlights/18061154864358319/";

/** @deprecated use INSTAGRAM_PROFILE_URL / INSTAGRAM_HIGHLIGHT_URL */
export const INSTAGRAM_TESTIMONIALS_URL = INSTAGRAM_PROFILE_URL;

/**
 * Local copies of highlight images (save from Instagram → assets/buyers/).
 * Leave src empty until files are added; grid falls back to Instagram link card.
 */
export const TESTIMONIAL_PHOTOS = [
  { src: "secretAttractionViews/assets/buyers/reader-1.jpg", caption: "Early reader with her copy" },
  { src: "secretAttractionViews/assets/buyers/reader-2.jpg", caption: "Book club pick" },
  { src: "secretAttractionViews/assets/buyers/reader-3.jpg", caption: "Launch day reader" },
  { src: "secretAttractionViews/assets/buyers/reader-4.jpg", caption: "Another happy reader" },
  { src: "secretAttractionViews/assets/buyers/reader-5.jpg", caption: "Reader photo" },
];
