import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { INITIAL_SCRIPTURE_DB } from './src/data/initialData';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// --- UNIVERSAL DATABASE PERSISTENCE ON DISK ---
// Stored in data/universal_database.json so every device connects to the exact same dataset & positions
const DATA_DIR = path.join(process.cwd(), 'data');
const UNIVERSAL_DB_FILE = path.join(DATA_DIR, 'universal_database.json');

function ensureUniversalDatabase(): any {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(UNIVERSAL_DB_FILE)) {
      fs.writeFileSync(UNIVERSAL_DB_FILE, JSON.stringify(INITIAL_SCRIPTURE_DB, null, 2), 'utf-8');
      return INITIAL_SCRIPTURE_DB;
    }
    const content = fs.readFileSync(UNIVERSAL_DB_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    // Ensure node_positions map exists
    if (!parsed.node_positions && INITIAL_SCRIPTURE_DB.node_positions) {
      parsed.node_positions = INITIAL_SCRIPTURE_DB.node_positions;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading universal database file, falling back to seed:', err);
    return INITIAL_SCRIPTURE_DB;
  }
}

function saveUniversalDatabase(data: any): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(UNIVERSAL_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// 1. Get Universal Database
app.get('/api/database', (_req: Request, res: Response) => {
  try {
    const db = ensureUniversalDatabase();
    res.json(db);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve universal database' });
  }
});

// 2. Save Full Universal Database (verses, edges, chains, node_positions)
app.post('/api/database', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || !Array.isArray(payload.verses) || !Array.isArray(payload.edges)) {
      return res.status(400).json({ error: 'Invalid database structure' });
    }
    saveUniversalDatabase(payload);
    res.json({ success: true, database: payload });
  } catch (err: any) {
    console.error('Failed to save universal database:', err);
    res.status(500).json({ error: 'Failed to save universal database' });
  }
});

// 3. Update Arranged Node Positions
app.patch('/api/database/positions', (req: Request, res: Response) => {
  try {
    const { positions } = req.body;
    if (!positions || typeof positions !== 'object') {
      return res.status(400).json({ error: 'Invalid positions payload' });
    }
    const currentDb = ensureUniversalDatabase();
    currentDb.node_positions = {
      ...(currentDb.node_positions || {}),
      ...positions,
    };
    saveUniversalDatabase(currentDb);
    res.json({ success: true, node_positions: currentDb.node_positions });
  } catch (err: any) {
    console.error('Failed to update node positions:', err);
    res.status(500).json({ error: 'Failed to update node positions' });
  }
});

// 4. Reset Universal Database to Seed Data
app.post('/api/database/reset', (_req: Request, res: Response) => {
  try {
    saveUniversalDatabase(INITIAL_SCRIPTURE_DB);
    res.json({ success: true, database: INITIAL_SCRIPTURE_DB });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

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
    universalDbPresent: fs.existsSync(UNIVERSAL_DB_FILE),
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
