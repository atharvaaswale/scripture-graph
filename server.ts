import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

const MASTER_SCHOLAR_SYSTEM_INSTRUCTION = `You are a careful scholar of Marathi Sant Sahitya, Dasbodh, Manache Shlok, and classical Sanskrit scripture (Bhagavad Gita, Puranas, etc.).
You are helping build a structured JSON database of hand-picked verses and the argumentative/thematic connections between them, across multiple scriptures.
This database will power a public visualization, so accuracy, restraint, and fidelity to the original text matter more than producing lots of connections.

RELATION VOCABULARY (closed set — do not invent new types):
"extends", "supports", "contrasts", "restates", "requires", "exemplifies"

CRITICAL RULES:
- Do not fabricate a connection to hit a quota. A verse with zero good matches should get zero edges. Weak/forced connections are worse than missing ones.
- Never paraphrase, alter, modernize, or reconstruct the original Devanagari. Reproduce it exactly as given. If given an incomplete verse, keep it incomplete and flag it in review_notes.
- Distinguish topical similarity from argumentative sequence. Two verses both mentioning "Guru" or "Brahman" are not automatically connected — only connect them if one genuinely builds on, supports, restates, or contrasts with the other's claim.
- Every edge is a draft. For every edge, write a short "why" explaining the actual argumentative or thematic link in your own words, referencing what the verses say. If plausible but uncertain, note it in "why" (e.g., "possible parallel, worth confirming").
- No duplicate IDs. Check existing verse IDs before assigning new ones. Follow {ScriptureCode}-{locator} (e.g. MS-180, DB-6.1.17, BG-2.20).
- No duplicate edges. Check existing edges before proposing new ones between the same pair.
- Output strictly valid JSON matching the schema:
{
  "verses": [
    {
      "id": string,
      "scripture": string,
      "locator": object,
      "display_ref": string,
      "text": string,
      "transliteration": string | null,
      "translation": { "en": string | null, "mr": string | null },
      "theme_tags": string[],
      "notes": string | null
    }
  ],
  "edges": [
    {
      "from": string,
      "to": string,
      "relation": "extends" | "supports" | "contrasts" | "restates" | "requires" | "exemplifies",
      "why": string
    }
  ],
  "chains": [
    {
      "id": string,
      "title": string,
      "sequence": string[]
    }
  ],
  "review_notes": string[]
}
`;

// Propose edges and verses
app.post('/api/propose-verses', async (req: Request, res: Response) => {
  try {
    const { raw_input, existing_database } = req.body;

    if (!raw_input || typeof raw_input !== 'string' || !raw_input.trim()) {
      return res.status(400).json({ error: 'raw_input is required' });
    }

    const ai = getGeminiClient();

    if (!ai) {
      // Return structured fallback or informative note if API key is not yet set
      return res.status(200).json({
        verses: [],
        edges: [],
        chains: [],
        review_notes: [
          'Gemini API Key is not configured yet in the environment. Please configure GEMINI_API_KEY in the Secrets panel to enable AI analysis.',
        ],
      });
    }

    const promptPayload = `
EXISTING DATABASE CONTEXT:
Scriptures registered: ${JSON.stringify(existing_database?.scriptures || {})}
Existing Verse IDs & themes:
${(existing_database?.verses || [])
  .map(
    (v: any) =>
      `- [${v.id}] (${v.display_ref || v.scripture}): "${v.text.replace(/\n/g, ' ')}" Tags: ${(v.theme_tags || []).join(', ')}`,
  )
  .join('\n')}

Existing Edges:
${(existing_database?.edges || [])
  .map((e: any) => `- ${e.from} --[${e.relation}]--> ${e.to}: ${e.why}`)
  .join('\n')}

Existing Chains:
${(existing_database?.chains || [])
  .map((c: any) => `- ${c.id} (${c.title}): ${c.sequence.join(' -> ')}`)
  .join('\n')}

NEW INPUT TO PROCESS:
"""
${raw_input}
"""

Please process the new raw verses, parse their scripture code and locator, keep the exact Devanagari text untouched, generate themes, and propose conservative argumentative edges against existing verses using only: extends, supports, contrasts, restates, requires, exemplifies. Propose chains only if 3+ verses form a genuine sequential argument. Return review_notes for any caveats or observations.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptPayload,
      config: {
        systemInstruction: MASTER_SCHOLAR_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  scripture: { type: Type.STRING },
                  locator: {
                    type: Type.OBJECT,
                    properties: {
                      shlok: { type: Type.INTEGER },
                      dashak: { type: Type.INTEGER },
                      samas: { type: Type.INTEGER },
                      ovi: { type: Type.INTEGER },
                      chapter: { type: Type.INTEGER },
                      verse: { type: Type.INTEGER },
                      skandha: { type: Type.INTEGER },
                      adhyaya: { type: Type.INTEGER },
                      shloka: { type: Type.INTEGER },
                    },
                  },
                  display_ref: { type: Type.STRING },
                  text: { type: Type.STRING },
                  transliteration: { type: Type.STRING, nullable: true },
                  translation: {
                    type: Type.OBJECT,
                    properties: {
                      en: { type: Type.STRING, nullable: true },
                      mr: { type: Type.STRING, nullable: true },
                    },
                  },
                  theme_tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  notes: { type: Type.STRING, nullable: true },
                },
                required: ['id', 'scripture', 'display_ref', 'text', 'theme_tags'],
              },
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  from: { type: Type.STRING },
                  to: { type: Type.STRING },
                  relation: {
                    type: Type.STRING,
                    enum: [
                      'extends',
                      'supports',
                      'contrasts',
                      'restates',
                      'requires',
                      'exemplifies',
                    ],
                  },
                  why: { type: Type.STRING },
                },
                required: ['from', 'to', 'relation', 'why'],
              },
            },
            chains: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  sequence: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['id', 'title', 'sequence'],
              },
            },
            review_notes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['verses', 'edges', 'chains', 'review_notes'],
        },
      },
    });

    const outputText = response.text || '{}';
    const parsed = JSON.parse(outputText);
    return res.json(parsed);
  } catch (err: any) {
    console.error('Error generating verse graph analysis:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to analyze verses',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
