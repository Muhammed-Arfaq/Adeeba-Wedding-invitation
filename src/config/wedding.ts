/** Single source of truth — edit all invitation content here. */

export const wedding = {
  meta: {
    title: "Shuhaib & Farha — Wedding Invitation",
    description:
      "With the blessings of Allah, join us for the wedding ceremony of Shuhaib and Farha at Pookolathur Mahall Auditorium, Karaparambu Road, on Sunday, 26 July 2026.",
    ogTitle: "Shuhaib & Farha — Wedding Invitation",
    ogDescription:
      "You are joyfully invited to celebrate the wedding ceremony of Shuhaib and Farha.",
  },

  /** The 786 emblem printed at the head of the card */
  bismillah: {
    numeric: "786",
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    translit: "In the name of Allah, the Most Gracious, the Most Merciful",
  },

  greeting: "Dear Friend,",

  /** Monogram initials shown on the curtain seal and hero */
  monogram: { left: "S", right: "F" },

  blessing: {
    arabic: "بَارَكَ اللَّهُ لَكُمَا وَبَارَكَ عَلَيْكُمَا وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ",
    translation:
      "May Allah bless you both, and shower His blessings upon you, and unite you both in goodness.",
  },

  cover: {
    subtitle: "Wedding Invitation",
    curtainPrompt: "Tap the seal to open",
  },

  /* The printed card names the groom first, so the site does too — every
     render site pairs groom then bride. */
  groom: {
    name: "Shuhaib",
    displayName: "SHUHAIB",
    shortName: "Shuhaib",
    role: "Groom",
  },

  bride: {
    name: "Farha",
    displayName: "FARHA",
    shortName: "Farha",
    role: "Bride",
  },

  /* ISO 8601 — drives the countdown and the calendar link. Keep the labels
     below in sync. The +05:30 offset is load-bearing: without it the string is
     parsed in whatever timezone the code happens to run in, which is the
     browser's for the countdown and the *server's* for the calendar link — and
     Netlify's servers are UTC, so the "Add to Calendar" button shipped an event
     at 10:00 UTC (3:30 PM in Kerala). Pinning the offset makes both resolve to
     the one instant the card means. */
  weddingDate: "2026-07-26T10:00:00+05:30",
  weddingDateLabel: "Sunday, 26 July 2026",
  weddingTimeLabel: "10:00 AM",
  ceremonyName: "Wedding Ceremony",

  quran: {
    /** Hero — after the curtain opens */
    cover: {
      arabic:
        "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
      reference: "Surah Al-Furqan 25:74",
    },
    /** Welcome section */
    welcome: {
      arabic:
        "وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً",
      verse:
        "And among His signs is that He created for you mates from among yourselves, that you may dwell in tranquillity with them, and He has put love and mercy between your hearts.",
      reference: "Surah Ar-Rum 30:21",
    },
    /** Wedding details section */
    details: {
      arabic:
        "يَا أَيُّهَا النَّاسُ اتَّقُوا رَبَّكُمُ الَّذِي خَلَقَكُم مِّن نَّفْسٍ وَاحِدَةٍ وَخَلَقَ مِنْهَا زَوْجَهَا",
      verse:
        "O mankind, fear your Lord, who created you from one soul and created from it its mate.",
      reference: "Surah An-Nisa 4:1",
    },
  },

  /** Lead line on the welcome section — mirrors the printed card */
  announcement: {
    lead: "With the blessings of Allah, we joyfully invite you to the wedding ceremony of",
    trailing: "&",
  },

  invitation: "Your presence and blessings will make this occasion even more special.",

  closingNote: "Kindly grace the occasion with your presence and duas.",

  thankYou: "Thank you for sharing in our joy.",

  venue: {
    name: "Pookolathur Mahall Auditorium",
    location: "Karaparambu Road",
    /** Not rendered — this is what the calendar entry carries. */
    address: "Pookolathur Mahall Auditorium, Karaparambu Road, Kerala",
    mapEmbed:
      "https://www.google.com/maps?q=Pookolathur+Mahall+Auditorium+Karaparambu+Road+Kerala&output=embed",
    directionsUrl:
      "https://www.google.com/maps/dir/?api=1&destination=Pookolathur+Mahall+Auditorium+Karaparambu+Road+Kerala",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Pookolathur+Mahall+Auditorium+Karaparambu+Road+Kerala",
  },

  /** Foot of the finale — a quiet credit inviting others to commission one. */
  credit: {
    label: "Crafted with love",
    message: "Would you like a digital wedding invitation like this one?",
    cta: "Message on WhatsApp",
    phone: "+91 95671 67619",
    whatsapp: "https://wa.me/919567167619",
  },

  music: {
    url: "/music/nasheed.mp3",
    title: "Islamic Wedding Ambience",
    volume: 0.3,
  },
} as const;

export type WeddingConfig = typeof wedding;
