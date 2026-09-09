/**
 * Icons lectures: Nightingale's 30-day method plus two public-domain talks.
 * Action plans are written from each lecture's argument, not copied across talks.
 *
 * New recordings are LibriVox public-domain readings:
 * James Allen, As a Man Thinketh (Mark Cawley)
 * Russell Conwell, Acres of Diamonds, Version 2, Part 1 (Phil Chenevert)
 */
export const ICONS_LECTURES = [
  {
    id: "nightingale",
    title: "The Strangest Secret",
    speaker: "Earl Nightingale",
    tagline: "Become what you think about",
    durationLabel: "About 30 min",
    audioSrc: "strangestSecretViews/audio.mp3",
    credit: "Recording: Earl Nightingale · The Strangest Secret",
    playerLabel: "Listen · The Strangest Secret",
    flipHint: " to read Matthew 7:7-8",
    flipLive: "Now showing Matthew chapter 7, verses 7 and 8.",
    modalIntro:
      "Earl Nightingale's method: one goal on a card, listen daily for 30 days. Write what you want more than anything else, stated clearly.",
    completeText:
      "30 days complete. You finished Earl's test. Keep thinking about your goal every day.",
    challengeTitle: "The 30 Day Challenge",
    back: {
      ref: "Matthew 7:7-8",
      verses: [
        {
          num: "7",
          text: "Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.",
        },
        {
          num: "8",
          text: "For every one that asketh receiveth; and he that seeketh findeth; and to him that knocketh it shall be opened.",
        },
      ],
      image: "strangestSecretViews/gospel.png",
      imageAlt: "Illustration for Matthew 7:7-8",
    },
    steps: [
      "Write on a card what you want more than anything else: a single, clearly defined goal. On the other side, write Matthew 7:7-8. Carry it with you so you can look at it several times a day.",
      "Think about it in a cheerful, relaxed, positive way each morning when you get up, at every chance during the day, and just before going to bed at night. Remember you must become what you think about.",
      "Stop thinking about what it is you fear. Each time a fearful or negative thought comes into your mind, replace it with a mental picture of your positive and worthwhile goal.",
      "Each day for this 30-day test, do more than you have to do. Give more of yourself than you have ever done before. Your returns in life must be in direct proportion to what you give.",
      "Do not concern yourself too much with how you are going to achieve your goal. Leave that to a power greater than yourself. All you have to do is know where you are going. The answers will come to you of their own accord.",
      "Above all, do not worry. Hold your goal before you. Everything else will take care of itself.",
      "If you become overwhelmed by negative thoughts, start the 30 days over from that point and go 30 more days.",
      "Listen to this recording often. Keep reminding yourself of what you must do until it becomes habit. Use the player below each day.",
    ],
  },
  {
    id: "allen",
    title: "As a Man Thinketh",
    speaker: "James Allen",
    tagline: "You become what you think",
    durationLabel: "About 54 min",
    audioSrc: "iconsView/audio/as-a-man-thinketh.mp3",
    credit: "Reading: Mark Cawley · James Allen, As a Man Thinketh · LibriVox public domain",
    playerLabel: "Listen · As a Man Thinketh",
    flipHint: " to read Allen's law of thought",
    flipLive: "Now showing James Allen on thought and character.",
    modalIntro:
      "James Allen's law: a man is literally what he thinks. Write one clearly defined goal. Listen to this lecture daily for 30 days.",
    completeText:
      "30 days complete. You finished Allen's test. Keep the thought you chose, and let character catch up to it.",
    challengeTitle: "The 30 Day Thought Test",
    back: {
      ref: "Proverbs 23:7 · James Allen",
      verses: [
        {
          num: "",
          text: "For as he thinketh in his heart, so is he.",
        },
        {
          num: "",
          text: "A man is literally what he thinks, his character being the complete sum of all his thoughts.",
        },
      ],
    },
    steps: [
      "Write the thought you will hold: you become what you think. Put that sentence on your card and look at it several times a day.",
      "Treat circumstances as a mirror of thought, not a jail. Circumstance reveals the man. It does not make him.",
      "Drop the thought that makes you sick or small. The body is the servant of the mind. Health follows clean thinking the way disease follows sour thinking.",
      "Fix one purpose and refuse to drift. A man without a central purpose falls to worries, fears, and self-pity.",
      "Strengthen weak thoughts the way you train a weak body. Daily practice of right thinking builds a strong mind.",
      "Cherish the vision and the ideal. Out of them your world is built. Stay true to the picture you carry.",
      "Practice serenity. Calm mind, calm life. Tempestuous thoughts make a tempestuous life.",
      "Listen to this lecture daily for 30 days until right thought becomes habit. Use the player below each day.",
    ],
  },
  {
    id: "conwell",
    title: "Acres of Diamonds",
    speaker: "Russell Conwell",
    tagline: "Dig where you stand",
    durationLabel: "About 51 min",
    audioSrc: "iconsView/audio/acres-of-diamonds.mp3",
    credit: "Reading: Phil Chenevert · Russell Conwell, Acres of Diamonds · LibriVox public domain",
    playerLabel: "Listen · Acres of Diamonds",
    flipHint: " to read Conwell's charge",
    flipLive: "Now showing Russell Conwell on acres of diamonds.",
    modalIntro:
      "Russell Conwell's charge: your fortune is where you already stand. Write one clearly defined goal at home. Listen to this lecture daily for 30 days.",
    completeText:
      "30 days complete. You finished Conwell's test. Keep digging in the ground you already own.",
    challengeTitle: "The 30 Day Dig",
    back: {
      ref: "Russell Conwell · Acres of Diamonds",
      verses: [
        {
          num: "",
          text: "Your diamonds are not in far distant mountains or in yonder seas. They are in your own backyard, if you will dig for them.",
        },
      ],
    },
    steps: [
      "Write the fortune you will find at home, not far away. Your acres of diamonds are where you stand.",
      "Study the people you already serve. Know what they need before you hunt a new town.",
      "Dig where you stand: this town, this skill, this shop. Opportunity is under your feet.",
      "Get rich by being useful and honest. Wealth that serves others is a duty, not a stain.",
      "See the diamond in the ordinary customer. The mine is often the neighbor you already know.",
      "Do not sell the farm to hunt elsewhere. Ali Hafed walked over acres of diamonds and never saw them.",
      "If you wander, come back and start the 30 days again from where you are.",
      "Listen to this lecture daily for 30 days. Keep digging in your own ground. Use the player below each day.",
    ],
  },
];

export function getIconsLecture(id) {
  return ICONS_LECTURES.find((lecture) => lecture.id === id) || ICONS_LECTURES[0];
}
