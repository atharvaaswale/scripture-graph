import { ScriptureDatabase } from '../types';

export const INITIAL_SCRIPTURE_DB: ScriptureDatabase = {
  "schema_version": "1.0",
  "relation_vocabulary": [
    "extends",
    "supports",
    "contrasts",
    "restates",
    "requires",
    "exemplifies"
  ],
  "scriptures": {
    "MS": {
      "full_name": "Manache Shlok",
      "author": "Samarth Ramdas Swami",
      "language": "Marathi",
      "locator_fields": [
        "shlok"
      ]
    },
    "DB": {
      "full_name": "Dasbodh",
      "author": "Samarth Ramdas Swami",
      "language": "Marathi",
      "locator_fields": [
        "dashak",
        "samas",
        "ovi"
      ]
    },
    "BG": {
      "full_name": "Bhagavad Gita",
      "author": "Vyasa (spoken by Krishna to Arjuna)",
      "language": "Sanskrit",
      "locator_fields": [
        "chapter",
        "verse"
      ]
    },
    "BP": {
      "full_name": "Bhagavata Purana",
      "author": "Vyasa",
      "language": "Sanskrit",
      "locator_fields": [
        "skandha",
        "adhyaya",
        "shloka"
      ]
    }
  },
  "verses": [
    {
      "id": "MS-179",
      "scripture": "MS",
      "locator": {
        "shlok": 179
      },
      "display_ref": "मनाचे श्लोक १७९",
      "text": "तिन्ही लोक जेथूनि निर्माण झाले ।\nतया देवरायासि कोणी न बोले ॥\nजगीं थोरला देव तो चोरलासे ।\nगुरूवीण तो सर्वथाही न दीसे ॥ १७९ ॥",
      "transliteration": null,
      "translation": {
        "en": null,
        "mr": null
      },
      "theme_tags": [
        "hiddenness of God",
        "role of Guru"
      ],
      "notes": null
    },
    {
      "id": "MS-178",
      "scripture": "MS",
      "locator": {
        "shlok": 178
      },
      "display_ref": "मनाचे श्लोक १७८",
      "text": "जया मानला देव तो पुजिताहे ।\nपरी देव शोधुनि कोणी न पाहे ॥\nजगी पाहता देव कोट्यानुकोटी ।\nजया मानली भक्ति जे तेचि मोठी ॥ १७८ ॥",
      "transliteration": null,
      "translation": {
        "en": null,
        "mr": null
      },
      "theme_tags": [
        "blind faith",
        "inquiry vs belief"
      ],
      "notes": null
    },
    {
      "id": "MS-189",
      "scripture": "MS",
      "locator": {
        "shlok": 189
      },
      "display_ref": "मनाचे श्लोक १८९",
      "text": "मही निर्मिली देव तो ओळखावा ।\nजया पाहतां मोक्ष तत्काळ जीवा ।",
      "transliteration": null,
      "translation": {
        "en": null,
        "mr": null
      },
      "theme_tags": [
        "moksha",
        "recognition of God"
      ],
      "notes": null
    },
    {
      "id": "DB-5.1.40",
      "scripture": "DB",
      "locator": {
        "dashak": 5,
        "samas": 1,
        "ovi": 40
      },
      "display_ref": "दासबोध ५.१.४०",
      "text": "सद्गुरुचेनि अभयंकरें । प्रगट होईजे ईश्वरें ।\nसंसारदुःखें अपारें । नासोन जाती ॥ ४० ॥",
      "transliteration": null,
      "translation": {
        "en": null,
        "mr": null
      },
      "theme_tags": [
        "Sadguru",
        "grace"
      ],
      "notes": null
    },
    {
      "id": "DB-4.4.5",
      "scripture": "DB",
      "locator": {
        "dashak": 4,
        "samas": 4,
        "ovi": 5
      },
      "display_ref": "दासबोध ४.४.५",
      "text": "सद्वस्तु दाखवी सद्गुरु । सकळ सारासारविचारु ।\nपरब्रह्माचा निर्धारु । अंतरीं बाणे ।",
      "transliteration": null,
      "translation": {
        "en": null,
        "mr": null
      },
      "theme_tags": [
        "Sadguru",
        "discernment"
      ],
      "notes": null
    },
    {
      "id": "DB-6.1.16",
      "scripture": "DB",
      "locator": {
        "dashak": 6,
        "samas": 1,
        "ovi": 16
      },
      "display_ref": "दासबोध ६.१.१६",
      "text": "जें शस्त्रें तोडितां तुटेना । जें पावकें जाळितां जळेना ।\nकालवितां कालवेना । आपेंकरूनी ॥ १६ ॥",
      "transliteration": null,
      "translation": {
        "en": null,
        "mr": null
      },
      "theme_tags": [
        "nature of Brahman",
        "indestructibility"
      ],
      "notes": null
    },
    {
      "id": "DB-6.2.13",
      "scripture": "DB",
      "locator": {
        "dashak": 6,
        "samas": 2,
        "ovi": 13
      },
      "display_ref": "दासबोध ६.२.१३",
      "text": "जें जें रूप आणी नाम । तो तो आवघाचि भ्रम ।\nनामरूपातीत वर्म । अनुभवें जाणावें ॥ १३ ॥",
      "transliteration": null,
      "translation": {
        "en": null,
        "mr": null
      },
      "theme_tags": [
        "beyond name and form",
        "direct experience"
      ],
      "notes": null
    },
    {
      "id": "BG-6.30",
      "scripture": "BG",
      "locator": {
        "chapter": 6,
        "verse": 30
      },
      "display_ref": "BG 6.30",
      "text": "यो मां पश्यति सर्वत्र सर्वं च मयि पश्यति ।\nतस्याहं न प्रणश्यामि स च मे न प्रणश्यति ॥",
      "theme_tags": [
        "See God"
      ],
      "translation": {
        "en": null,
        "mr": null
      },
      "notes": null
    },
    {
      "id": "DB-5.1.13",
      "scripture": "DB",
      "locator": {
        "dashak": 5,
        "samas": 1,
        "ovi": 13
      },
      "display_ref": "DB 5.1.13",
      "text": "जयास वाटे देव पाहावा| तेणें सत्संग धरावा |सत्संगेंविण देवाधिदेवा| पाविजेत नाहीं",
      "theme_tags": [
        "See God",
        "Satsang"
      ],
      "translation": {
        "en": null,
        "mr": null
      },
      "notes": null
    },
    {
      "id": "BG-7.19",
      "scripture": "BG",
      "locator": {
        "chapter": 7,
        "verse": 19
      },
      "display_ref": "BG 7.19",
      "text": "बहूनां जन्मनामन्ते ज्ञानवान्मां प्रपद्यते ।\nवासुदेव: सर्वमिति स महात्मा सुदुर्लभ: ॥",
      "theme_tags": [
        "See God",
        "Brahm",
        "Formless"
      ],
      "translation": {
        "en": null,
        "mr": null
      },
      "notes": null
    },
    {
      "id": "BG-2.23",
      "scripture": "BG",
      "locator": {
        "chapter": 2,
        "verse": 23
      },
      "display_ref": "BG 2.23",
      "text": "नैनं छिन्दन्ति शस्त्राणि नैनं दहति पावकः ।\nन चैनं क्लेदयन्त्यापो न शोषयति मारुतः ॥",
      "theme_tags": [
        "Formless",
        "Brahm",
        "nature"
      ],
      "translation": {
        "en": null,
        "mr": null
      },
      "notes": null
    },
    {
      "id": "BG-9.12",
      "scripture": "BG",
      "locator": {
        "chapter": 9,
        "verse": 12
      },
      "display_ref": "BG 9.12",
      "text": "मोघाशा मोघकर्माणो मोघज्ञाना विचेतसः ।\nराक्षसीमासुरीं चैव प्रकृतिं मोहिनीं श्रिताः ॥",
      "theme_tags": [
        "Diety worship"
      ],
      "translation": {
        "en": null,
        "mr": null
      },
      "notes": null
    },
    {
      "id": "BG-9.11",
      "scripture": "BG",
      "locator": {
        "chapter": 9,
        "verse": 11
      },
      "display_ref": "BG 9.11",
      "text": "अवजानन्ति मां मूढा मानुषीं तनुमाश्रितम् ।\nपरं भावमजानन्तो मम भूतमहेश्वरम् ॥",
      "theme_tags": [
        "Real nature of God"
      ],
      "translation": {
        "en": null,
        "mr": null
      },
      "notes": null
    },
    {
      "id": "DB-6.1.12",
      "scripture": "DB",
      "locator": {
        "dashak": 6,
        "samas": 1,
        "ovi": 12
      },
      "display_ref": "DB 6.1.12",
      "text": "ब्रह्मा विष्णु आणि हर | त्यांसी निर्मिता तोचि थोर | तो वोळखावा परमेश्वर | नाना यत्नें",
      "theme_tags": [],
      "translation": {
        "en": null,
        "mr": null
      },
      "notes": null
    },
    {
      "id": "DB-6.1.21",
      "scripture": "DB",
      "locator": {
        "dashak": 6,
        "samas": 1,
        "ovi": 21
      },
      "display_ref": "DB 6.1.21",
      "text": "देव वोळखावा येक | तेंचि ज्ञान तें सार्थक | येर आवघेंचि निरार्थक | पोटविद्या ||",
      "theme_tags": [
        "one god"
      ],
      "translation": {
        "en": null,
        "mr": null
      },
      "notes": null
    },
    {
      "id": "DB-6.2.21",
      "scripture": "DB",
      "locator": {
        "dashak": 6,
        "samas": 2,
        "ovi": 21
      },
      "display_ref": "DB 6.1.21",
      "text": "प्रकट तें जाणावें असार | आणी गुप्त तें जाणावें सार | गुरुमुखें हा विचार | उमजों लागे ||",
      "theme_tags": [
        "See God from SatGuru"
      ],
      "translation": {
        "en": null,
        "mr": null
      },
      "notes": null
    },
    {
      "id": "DB-6.2.27",
      "scripture": "DB",
      "locator": {
        "dashak": 6,
        "samas": 2,
        "ovi": 27
      },
      "display_ref": "DB 6.1.21",
      "text": "तयास म्हणावें देव | वरकड लोकांचा स्वभाव | जितुके गाव तितुके देव | जनांकारणें ||",
      "theme_tags": [
        "One god"
      ],
      "translation": {
        "en": null,
        "mr": null
      },
      "notes": null
    },
    {
      "id": "DB-5.4.32",
      "scripture": "DB",
      "locator": {
        "dashak": 5,
        "samas": 4,
        "ovi": 32
      },
      "display_ref": "DB 6.1.21",
      "text": "याकारणें ज्ञानासमान| पवित्र उत्तम न दिसे अन्न |म्हणौन आधीं आत्मज्ञान| साधिलें पाहिजे ||",
      "theme_tags": [
        "gyan"
      ],
      "translation": {
        "en": null,
        "mr": null
      },
      "notes": null
    },
    {
      "id": "DB-5.2.9",
      "scripture": "DB",
      "locator": {
        "dashak": 5,
        "samas": 2,
        "ovi": 9
      },
      "display_ref": "DB 6.1.21",
      "text": "जो ब्रह्मज्ञान उपदेसी| अज्ञानअंधारे निरसी |जीवात्मयां परमात्मयांसी| ऐक्यता करी ||",
      "theme_tags": [
        "gyan"
      ],
      "translation": {
        "en": null,
        "mr": null
      },
      "notes": null
    },
    {
      "id": "DB-5.2.14",
      "scripture": "DB",
      "locator": {
        "dashak": 5,
        "samas": 2,
        "ovi": 14
      },
      "display_ref": "DB 6.1.21",
      "text": "गर्भवास अति सांकडी| इछाबंधनाची बेडी |ज्ञान देऊन सीघ्र सोडी| तो सद्गुरु स्वामी ||",
      "theme_tags": [
        "gyan"
      ],
      "translation": {
        "en": null,
        "mr": null
      },
      "notes": null
    },
    {
      "id": "DB-5.2.22",
      "scripture": "DB",
      "locator": {
        "dashak": 5,
        "samas": 2,
        "ovi": 22
      },
      "display_ref": "DB 6.1.21",
      "text": "जो कोणी ज्ञान बोधी| समूळ अविद्या छेदी |इंद्रियेंदमन प्रतिपादी| तो सद्गुरु जाणावा ||",
      "theme_tags": [
        "gyan"
      ],
      "translation": {
        "en": null,
        "mr": null
      },
      "notes": null
    },
    {
      "id": "DB-5.1.45",
      "scripture": "DB",
      "locator": {
        "dashak": 5,
        "samas": 1,
        "ovi": 45
      },
      "display_ref": "DB 6.1.21",
      "text": "आतां सद्गुरु ते कैसे| नव्हेति इतरां गुरु ऐसे |जयांचे कृपेनें प्रकाशे| शुद्ध ज्ञान ||",
      "theme_tags": [
        "gyan"
      ],
      "translation": {
        "en": null,
        "mr": null
      },
      "notes": null
    },
    {
      "id": "DB-5.4.33",
      "scripture": "DB",
      "locator": {
        "dashak": 5,
        "samas": 4,
        "ovi": 33
      },
      "display_ref": "DB 6.1.21",
      "text": "सकळ उपदेशीं विशेष| आत्मज्ञानाचा उपदेश |येविषईं जगदीश| बहुतां ठाईं बोलिला ||",
      "theme_tags": [
        "gyan"
      ],
      "translation": {
        "en": null,
        "mr": null
      },
      "notes": null
    },
    {
      "id": "MS-150",
      "scripture": "MS",
      "locator": {
        "shlok": 150
      },
      "display_ref": "MS 150",
      "text": "नसे पीत ना श्वेत ना श्याम कांहीं।नसे व्यक्त अव्यक्त ना नीळ नाहीं॥म्हणे दास विश्वासतां मुक्ति लाहे।मना संत आनंत शोधूनि पाहे॥ १५० ॥",
      "theme_tags": [
        "gyan"
      ],
      "translation": {
        "en": null,
        "mr": null
      },
      "notes": null
    }
  ],
  "edges": [
    {
      "from": "MS-179",
      "to": "DB-5.1.40",
      "relation": "extends",
      "why": "MS179 states God is unseen without a Guru; DB5.1.40 gives the mechanism — the Sadguru's grace is what makes God manifest."
    },
    {
      "from": "DB-5.1.40",
      "to": "DB-4.4.5",
      "relation": "extends",
      "why": "Both describe what the Sadguru does; 4.4.5 specifies it further as discernment leading to firm certainty of Brahman."
    },
    {
      "from": "DB-6.1.16",
      "to": "DB-6.2.13",
      "relation": "extends",
      "why": "Having defined Brahman by what it is not, this verse adds: all name and form is illusion; truth is known only by direct experience."
    },
    {
      "from": "DB-6.2.13",
      "to": "MS-189",
      "relation": "extends",
      "why": "Having established truth is beyond name-form, MS189 delivers the payoff: recognizing that God grants instant moksha."
    },
    {
      "from": "MS-178",
      "to": "MS-179",
      "relation": "contrasts",
      "why": "MS178 critiques blind, unexamined faith; MS179 points to the real but hidden God found only via a Guru — the corrective to MS178's problem."
    },
    {
      "from": "DB-5.1.13",
      "to": "DB-5.1.40",
      "relation": "restates",
      "why": ""
    },
    {
      "from": "DB-5.1.40",
      "to": "BG-6.30",
      "relation": "extends",
      "why": ""
    },
    {
      "from": "DB-5.1.40",
      "to": "BG-7.19",
      "relation": "extends",
      "why": ""
    },
    {
      "from": "DB-6.1.16",
      "to": "BG-2.23",
      "relation": "extends",
      "why": ""
    },
    {
      "from": "MS-178",
      "to": "BG-9.12",
      "relation": "extends",
      "why": ""
    },
    {
      "from": "MS-178",
      "to": "BG-9.11",
      "relation": "extends",
      "why": ""
    },
    {
      "from": "MS-179",
      "to": "MS-189",
      "relation": "supports",
      "why": ""
    },
    {
      "from": "MS-178",
      "to": "DB-6.1.12",
      "relation": "supports",
      "why": ""
    },
    {
      "from": "MS-179",
      "to": "DB-6.1.21",
      "relation": "extends",
      "why": ""
    },
    {
      "from": "DB-5.1.40",
      "to": "DB-6.2.21",
      "relation": "supports",
      "why": ""
    },
    {
      "from": "MS-179",
      "to": "DB-6.2.27",
      "relation": "extends",
      "why": ""
    },
    {
      "from": "DB-6.1.21",
      "to": "DB-6.2.27",
      "relation": "supports",
      "why": ""
    },
    {
      "from": "DB-5.1.40",
      "to": "DB-5.4.32",
      "relation": "extends",
      "why": ""
    },
    {
      "from": "DB-5.4.32",
      "to": "DB-5.2.9",
      "relation": "supports",
      "why": ""
    },
    {
      "from": "DB-5.4.32",
      "to": "DB-5.2.14",
      "relation": "supports",
      "why": ""
    },
    {
      "from": "DB-5.4.32",
      "to": "DB-5.1.45",
      "relation": "supports",
      "why": ""
    },
    {
      "from": "DB-5.4.32",
      "to": "DB-5.2.22",
      "relation": "supports",
      "why": ""
    },
    {
      "from": "DB-5.4.32",
      "to": "DB-5.4.33",
      "relation": "supports",
      "why": ""
    }
  ],
  "chains": [
    {
      "id": "chain-guru-to-moksha",
      "title": "Hiddenness of God → Guru → Recognition → Moksha",
      "sequence": [
        "MS-179",
        "DB-5.1.40",
        "DB-4.4.5",
        "DB-6.1.16",
        "DB-6.2.13",
        "MS-189"
      ]
    },
    {
      "id": "chain-false-vs-true-faith",
      "title": "Blind faith vs. true recognition",
      "sequence": [
        "MS-178",
        "MS-179"
      ]
    }
  ],
  "review_notes": [
    "Baseline database initialized with 7 foundational verses from Manache Shlok and Dasbodh.",
    "DB-6.1.16 closely parallels Bhagavad Gita 2.23 (नैनं छिन्दन्ति शस्त्राणि) on the indestructibility of the imperishable truth."
  ],
  "node_positions": {
    "MS-178": {
      "x": -140,
      "y": -45,
      "fx": -140,
      "fy": -45
    },
    "MS-179": {
      "x": 404,
      "y": 382,
      "fx": 404,
      "fy": 382
    },
    "DB-6.1.16": {
      "x": 51,
      "y": -54,
      "fx": 51,
      "fy": -54
    },
    "MS-189": {
      "x": 145,
      "y": -20,
      "fx": 145,
      "fy": -20
    },
    "DB-5.1.40": {
      "x": 135,
      "y": 95,
      "fx": 135,
      "fy": 95
    },
    "DB-6.2.13": {
      "x": 190,
      "y": -110,
      "fx": 190,
      "fy": -110
    },
    "DB-4.4.5": {
      "x": 45,
      "y": 155,
      "fx": 45,
      "fy": 155
    },
    "BG-6.30": {
      "x": 301,
      "y": 15,
      "fx": 301,
      "fy": 15
    },
    "DB-5.1.13": {
      "x": 270,
      "y": 105,
      "fx": 270,
      "fy": 105
    },
    "BG-7.19": {
      "x": 259,
      "y": 236,
      "fx": 259,
      "fy": 236
    },
    "BG-2.23": {
      "x": 103,
      "y": 206,
      "fx": 103,
      "fy": 206
    },
    "BG-9.12": {
      "x": 27,
      "y": 289,
      "fx": 27,
      "fy": 289
    },
    "BG-9.11": {
      "x": -96,
      "y": 337,
      "fx": -96,
      "fy": 337
    },
    "DB-6.1.12": {
      "x": -139,
      "y": 184,
      "fx": -139,
      "fy": 184
    },
    "DB-6.1.21": {
      "x": -247,
      "y": 153,
      "fx": -247,
      "fy": 153
    },
    "DB-6.2.21": {
      "x": -344,
      "y": 64,
      "fx": -344,
      "fy": 64
    },
    "DB-6.2.27": {
      "x": -226,
      "y": -42,
      "fx": -226,
      "fy": -42
    },
    "DB-5.4.32": {
      "x": -349,
      "y": -205,
      "fx": -349,
      "fy": -205
    },
    "DB-5.2.9": {
      "x": -211,
      "y": -279,
      "fx": -211,
      "fy": -279
    },
    "DB-5.2.14": {
      "x": -63,
      "y": -221,
      "fx": -63,
      "fy": -221
    },
    "DB-5.2.22": {
      "x": 27,
      "y": -289,
      "fx": 27,
      "fy": -289
    },
    "DB-5.1.45": {
      "x": 156,
      "y": -313,
      "fx": 156,
      "fy": -313
    },
    "DB-5.4.33": {
      "x": 170,
      "y": -155,
      "fx": 170,
      "fy": -155
    },
    "MS-150": {
      "x": 353,
      "y": -67,
      "fx": 353,
      "fy": -67
    }
  }
};
