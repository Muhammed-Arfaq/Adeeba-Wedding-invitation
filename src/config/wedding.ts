/** Single source of truth — edit all invitation content here. */

export const wedding = {
  meta: {
    title: "Adeeba & Ansar — Wedding Invitation",
    description:
      "With gratitude to Allah, join us for the nikah of Adv. Adeeba Ameen and Ansar KP at Nufayyis Palace, Ponnani, on Thursday, 20 August 2026.",
    ogTitle: "Adeeba & Ansar — Wedding Invitation",
    ogDescription:
      "You are cordially invited to celebrate the nikah of Adv. Adeeba Ameen and Ansar KP.",
  },

  /** The 786 emblem printed at the head of the card */
  bismillah: {
    numeric: "786",
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    translit: "In the name of Allah, the Most Gracious, the Most Merciful",
  },

  greeting: "Dear Friend,",

  /** Monogram initials shown on the curtain seal and hero */
  monogram: { left: "A", right: "A" },

  blessing: {
    arabic: "بَارَكَ اللَّهُ لَكُمَا وَبَارَكَ عَلَيْكُمَا وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ",
    translation:
      "May Allah bless you both, and shower His blessings upon you, and unite you both in goodness.",
  },

  cover: {
    subtitle: "Wedding Invitation",
    curtainPrompt: "Tap the seal to open",
  },

  /** The bride's family are the hosts of this invitation. */
  bride: {
    name: "Adv. Adeeba Ameen",
    displayName: "ADV. ADEEBA AMEEN",
    shortName: "Adeeba",
    role: "Bride",
    parents: {
      father: "Mr. Ahammed Ameen OM",
      mother: "Mrs. Shabeena",
    },
    residence: {
      house: "Anthurayil House",
      location: "Puthuponnani (P.O.), Ponnani South",
    },
    grandparents: [
      { first: "Mr. Moythu Moulavi A M", second: "Mrs. Fathima Hajjumma" },
      { first: "Late Abbu Maningayil", second: "Ayishakutty Mangattu" },
    ],
  },

  groom: {
    name: "Ansar KP",
    displayName: "ANSAR KP",
    shortName: "Ansar",
    role: "Groom",
    parents: {
      father: "Mr. Moideen Kutty",
      mother: "Mrs. Nabeesa",
    },
    residence: {
      house: "Kunjilpeedikayil House",
      location: "Kottappadam (P.O.), Koottanad",
    },
    grandparents: [
      { first: "Moidunnikutty (Late)", second: "Zainaba (Late)" },
      { first: "Moidu (Late)", second: "Safiya (Late)" },
    ],
  },

  /** ISO 8601 — drives the countdown. Keep the labels below in sync. */
  weddingDate: "2026-08-20T11:00:00",
  weddingDateLabel: "Thursday, 20 August 2026",
  weddingTimeLabel: "11:00 AM",
  ceremonyName: "Nikah",

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
    lead: "Our daughter",
    trailing: "is to be wed to",
  },

  invitation:
    "Nikah is the sacred bond by which Allah unites two hearts in what is pure and halal. Your presence at that blessed moment is what completes our joy — we await the loving company of you and your family.",

  closingNote:
    "Your presence and duas would mean the world to us as we begin this blessed journey together.",

  thankYou: "Thank you for sharing in our joy.",

  venue: {
    name: "Nufayyis Palace",
    location: "Ponnani, Malappuram",
    landmark: "Near Anappadi Petrol Pump",
    address: "Nufayyis Palace, Near Anappadi Petrol Pump, Ponnani, Malappuram, Kerala",
    mapEmbed: "https://www.google.com/maps?q=Nufayyis+Palace+Ponnani+Malappuram&output=embed",
    directionsUrl:
      "https://www.google.com/maps/dir/?api=1&destination=Nufayyis+Palace+Ponnani+Malappuram",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Nufayyis+Palace+Ponnani+Malappuram",
  },

  /** Signed at the foot of the card — "With love," */
  hosts: {
    salutation: "With love,",
    names: "Mr. Ahammed Ameen OM & Mrs. Shabeena",
    house: "Anthurayil House",
    location: "Puthuponnani (P.O.), Ponnani South",
    phone: "+91 95444 84103",
  },

  music: {
    url: "/music/nasheed.mp3",
    title: "Islamic Wedding Ambience",
    volume: 0.3,
  },
} as const;

export type WeddingConfig = typeof wedding;
