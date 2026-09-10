import { ScriptureDatabase } from '../types';

export const INITIAL_SCRIPTURE_DB: ScriptureDatabase = {
  schema_version: "1.0",
  relation_vocabulary: [
    "extends",
    "supports",
    "contrasts",
    "restates",
    "requires",
    "exemplifies"
  ],
  scriptures: {
    MS: {
      full_name: "Manache Shlok",
      author: "Samarth Ramdas Swami",
      language: "Marathi",
      locator_fields: ["shlok"]
    },
    DB: {
      full_name: "Dasbodh",
      author: "Samarth Ramdas Swami",
      language: "Marathi",
      locator_fields: ["dashak", "samas", "ovi"]
    },
    BG: {
      full_name: "Bhagavad Gita",
      author: "Vyasa (spoken by Krishna to Arjuna)",
      language: "Sanskrit",
      locator_fields: ["chapter", "verse"]
    },
    BP: {
      full_name: "Bhagavata Purana",
      author: "Vyasa",
      language: "Sanskrit",
      locator_fields: ["skandha", "adhyaya", "shloka"]
    }
  },
  verses: [
    {
      id: "MS-179",
      scripture: "MS",
      locator: { shlok: 179 },
      display_ref: "मनाचे श्लोक १७९",
      text: "तिन्ही लोक जेथूनि निर्माण झाले ।\nतया देवरायासि कोणी न बोले ॥\nजगीं थोरला देव तो चोरलासे ।\nगुरूवीण तो सर्वथाही न दीसे ॥ १७९ ॥",
      transliteration: null,
      translation: {
        en: null,
        mr: null
      },
      theme_tags: ["hiddenness of God", "role of Guru"],
      notes: null
    },
    {
      id: "MS-178",
      scripture: "MS",
      locator: { shlok: 178 },
      display_ref: "मनाचे श्लोक १७८",
      text: "जया मानला देव तो पुजिताहे ।\nपरी देव शोधुनि कोणी न पाहे ॥\nजगी पाहता देव कोट्यानुकोटी ।\nजया मानली भक्ति जे तेचि मोठी ॥ १७८ ॥",
      transliteration: null,
      translation: { en: null, mr: null },
      theme_tags: ["blind faith", "inquiry vs belief"],
      notes: null
    },
    {
      id: "MS-189",
      scripture: "MS",
      locator: { shlok: 189 },
      display_ref: "मनाचे श्लोक १८९",
      text: "मही निर्मिली देव तो ओळखावा ।\nजया पाहतां मोक्ष तत्काळ जीवा ।",
      transliteration: null,
      translation: { en: null, mr: null },
      theme_tags: ["moksha", "recognition of God"],
      notes: null
    },
    {
      id: "DB-5.1.40",
      scripture: "DB",
      locator: { dashak: 5, samas: 1, ovi: 40 },
      display_ref: "दासबोध ५.१.४०",
      text: "सद्गुरुचेनि अभयंकरें । प्रगट होईजे ईश्वरें ।\nसंसारदुःखें अपारें । नासोन जाती ॥ ४० ॥",
      transliteration: null,
      translation: { en: null, mr: null },
      theme_tags: ["Sadguru", "grace"],
      notes: null
    },
    {
      id: "DB-4.4.5",
      scripture: "DB",
      locator: { dashak: 4, samas: 4, ovi: 5 },
      display_ref: "दासबोध ४.४.५",
      text: "सद्वस्तु दाखवी सद्गुरु । सकळ सारासारविचारु ।\nपरब्रह्माचा निर्धारु । अंतरीं बाणे ।",
      transliteration: null,
      translation: { en: null, mr: null },
      theme_tags: ["Sadguru", "discernment"],
      notes: null
    },
    {
      id: "DB-6.1.16",
      scripture: "DB",
      locator: { dashak: 6, samas: 1, ovi: 16 },
      display_ref: "दासबोध ६.१.१६",
      text: "जें शस्त्रें तोडितां तुटेना । जें पावकें जाळितां जळेना ।\nकालवितां कालवेना । आपेंकरूनी ॥ १६ ॥",
      transliteration: null,
      translation: { en: null, mr: null },
      theme_tags: ["nature of Brahman", "indestructibility"],
      notes: null
    },
    {
      id: "DB-6.2.13",
      scripture: "DB",
      locator: { dashak: 6, samas: 2, ovi: 13 },
      display_ref: "दासबोध ६.२.१३",
      text: "जें जें रूप आणी नाम । तो तो आवघाचि भ्रम ।\nनामरूपातीत वर्म । अनुभवें जाणावें ॥ १३ ॥",
      transliteration: null,
      translation: { en: null, mr: null },
      theme_tags: ["beyond name and form", "direct experience"],
      notes: null
    }
  ],
  edges: [
    {
      from: "MS-179",
      to: "DB-5.1.40",
      relation: "extends",
      why: "MS179 states God is unseen without a Guru; DB5.1.40 gives the mechanism — the Sadguru's grace is what makes God manifest."
    },
    {
      from: "DB-5.1.40",
      to: "DB-4.4.5",
      relation: "extends",
      why: "Both describe what the Sadguru does; 4.4.5 specifies it further as discernment leading to firm certainty of Brahman."
    },
    {
      from: "DB-6.1.16",
      to: "DB-6.2.13",
      relation: "extends",
      why: "Having defined Brahman by what it is not, this verse adds: all name and form is illusion; truth is known only by direct experience."
    },
    {
      from: "DB-6.2.13",
      to: "MS-189",
      relation: "extends",
      why: "Having established truth is beyond name-form, MS189 delivers the payoff: recognizing that God grants instant moksha."
    },
    {
      from: "MS-178",
      to: "MS-179",
      relation: "contrasts",
      why: "MS178 critiques blind, unexamined faith; MS179 points to the real but hidden God found only via a Guru — the corrective to MS178's problem."
    }
  ],
  chains: [
    {
      id: "chain-guru-to-moksha",
      "title": "Hiddenness of God → Guru → Recognition → Moksha",
      sequence: ["MS-179", "DB-5.1.40", "DB-4.4.5", "DB-6.1.16", "DB-6.2.13", "MS-189"]
    },
    {
      id: "chain-false-vs-true-faith",
      "title": "Blind faith vs. true recognition",
      sequence: ["MS-178", "MS-179"]
    }
  ],
  review_notes: [
    "Baseline database initialized with 7 foundational verses from Manache Shlok and Dasbodh.",
    "DB-6.1.16 closely parallels Bhagavad Gita 2.23 (नैनं छिन्दन्ति शस्त्राणि) on the indestructibility of the imperishable truth."
  ]
};
