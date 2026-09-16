/**
 * Icons lectures: Nightingale's 30-day method plus the two Icons recordings.
 * Action plans are written from each lecture after processing the audio.
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
    id: "twentyfive",
    title: "25-min biblical walking affirmations (reset your identity & mind)",
    speaker: "Identity Walk",
    tagline: "Speak who God says you are",
    durationLabel: "About 26 min",
    audioSrc: "audios/25_minutes.mp3",
    credit: "Recording · 25-min biblical walking affirmations",
    playerLabel: "Listen · 25-min biblical walking affirmations (reset your identity & mind)",
    flipHint: " to read the identity charge",
    flipLive: "Now showing the identity declarations from 25-min biblical walking affirmations.",
    modalIntro:
      "This walk resets identity. Write one clearly defined goal. Walk or sit still, receive the declarations, then speak them for 30 days.",
    completeText:
      "30 days complete. You finished the identity walk. Keep agreeing with who God says you are.",
    challengeTitle: "The 30 Day Identity Walk",
    back: {
      ref: "25-min biblical walking affirmations",
      verses: [
        {
          num: "",
          text: "I am who God says I am. I am the beloved. That is my primary identity.",
        },
        {
          num: "",
          text: "I am chosen, called, equipped, and loved before I perform.",
        },
      ],
    },
    steps: [
      "Walk if you can, or sit in stillness. First receive the declarations spoken over you. Then speak them out loud and agree with them.",
      "Begin with gratitude. Today is a gift. You are alive, covered, and loved. Choose gratitude over anxiety and trust over fear.",
      "Take your identity from God, not from failure, fear, or anyone else's opinion. You are the beloved. Walk like a child of the Most High.",
      "Honor your body as the temple of the Holy Spirit. Every stride is worship. You are being renewed. Partner with your body: move it well, rest it well.",
      "Stop chasing abundance. Goodness is already in motion toward you. Live as a conduit: what flows to you is meant to flow through you.",
      "Lay down the need to control every outcome. Peace does not depend on circumstances. Every battle is the Lord's. You are seated and at rest.",
      "Remember you were made for purpose. Your story, gifts, and pain were not wasted. Be a river of living water to the people in your path.",
      "Come back tomorrow. Repetition is how identity is rewritten. Use the player below each day until these words become how you walk.",
    ],
  },
  {
    id: "abundant",
    title: "Abundant Wealth Mindset",
    speaker: "Creation Session",
    tagline: "Call the desire as already here",
    durationLabel: "About 14 min",
    audioSrc: "audios/Abundant%20Wealth%20Mindset.mp3",
    credit: "Recording · Abundant Wealth Mindset",
    playerLabel: "Listen · Abundant Wealth Mindset",
    flipHint: " to read Mark 11:24",
    flipLive: "Now showing Mark chapter 11, verse 24.",
    modalIntro:
      "This session creates one desire in the present. Sit alone in a quiet room. Write that one thing clearly. Listen daily for 30 days.",
    completeText:
      "30 days complete. You finished the creation sessions. Keep calling the desire as already here, then take the next step God shows you.",
    challengeTitle: "The 30 Day Creation Session",
    back: {
      ref: "Mark 11:24 · Romans 4:17",
      verses: [
        {
          num: "",
          text: "Therefore I tell you, whatever you ask in prayer, believe that you have received it, and it will be yours.",
        },
        {
          num: "",
          text: "God calls into existence the things that do not exist. Do the same with the desire He put in your heart.",
        },
      ],
    },
    steps: [
      "Sit alone in a quiet room. Do not drive. Give this voice your full attention.",
      "Choose one specific desire for this session: one thing, amount, item, or relationship. You can run the process again later. This time, hold only one.",
      "Ignore what the five senses report. There is an invisible realm. Place the desire in your imagination as already real.",
      "Assume the feeling of the desire fulfilled. Say I am strong when you feel weak. Say I am wealthy when you feel poor. Keep your attention there.",
      "Receive God's light from above, down your spine, and out from your heart. You are the light of the world. Radiate it.",
      "Believe it is already done in this moment. Do not hunt for proof. Then release the desire from your mind and let God accomplish it.",
      "Ask: what is the next thing I need to do. Follow that guidance, even a small step. Isaiah 30:21: this is the path, walk in it.",
      "Listen to this recording often. Keep the words: that which I seek is seeking me. I am ready, receptive, and grateful.",
    ],
  },
];

export function getIconsLecture(id) {
  const aliases = { allen: "twentyfive", conwell: "abundant" };
  const resolved = aliases[id] || id;
  return ICONS_LECTURES.find((lecture) => lecture.id === resolved) || ICONS_LECTURES[0];
}
