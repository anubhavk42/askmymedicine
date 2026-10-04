import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Track active models and fallbacks
let activeEmbeddingModel = 'gemini-embedding-2-preview';
let activeTextModel = 'gemini-3.8-flash';

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey),
    activeEmbeddingModel,
    activeTextModel,
  });
});

// Embed Content endpoint
app.post('/api/embed', async (req, res) => {
  try {
    const { texts } = req.body;
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'texts array is required' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in environment (GEMINI_API_KEY).',
      });
    }

    const embeddings: number[][] = [];
    const embeddingModelsToTry = [
      activeEmbeddingModel,
      'text-embedding-004',
      'gemini-embedding-2-preview',
    ];

    // Helper to embed a single text with model fallback
    async function embedSingle(text: string): Promise<number[]> {
      let lastErr: any = null;
      for (const model of embeddingModelsToTry) {
        try {
          const response = await ai!.models.embedContent({
            model,
            contents: text,
          });

          // response.embeddings is standard in @google/genai
          if (response.embeddings && response.embeddings.length > 0 && response.embeddings[0]?.values) {
            if (activeEmbeddingModel !== model) {
              console.log(`Switched active embedding model to: ${model}`);
              activeEmbeddingModel = model;
            }
            return response.embeddings[0].values;
          }
        } catch (err: any) {
          lastErr = err;
          console.warn(`Embedding failed with model ${model}:`, err?.message || err);
        }
      }
      throw lastErr || new Error('Failed to embed text with all candidate models');
    }

    // Process in batches of 5 concurrent requests to avoid rate limits
    const BATCH_SIZE = 5;
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const chunk = texts.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(chunk.map((t) => embedSingle(t)));
      embeddings.push(...results);
    }

    return res.json({
      embeddings,
      modelUsed: activeEmbeddingModel,
    });
  } catch (error: any) {
    console.error('Error generating embeddings:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate embeddings',
      activeEmbeddingModel,
    });
  }
});

// Generation Endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, systemInstruction, chunks } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in environment (GEMINI_API_KEY).',
      });
    }

    const textModelsToTry = [
      activeTextModel,
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
    ];

    let lastErr: any = null;
    let generatedText = '';
    let usedModel = activeTextModel;

    let finalPrompt = prompt;
    if (chunks && Array.isArray(chunks) && chunks.length > 0 && !prompt.includes('RETRIEVED CLINICAL CHUNKS')) {
      const chunksContext = chunks
        .map(
          (c: any, i: number) =>
            `[CHUNK ${i + 1}] Medicine: ${c.medicine || c.medicineName} | Section: ${c.section || c.sectionHeading} | Reviewed: ${c.reviewedDate || c.lastReviewedDate}\n${c.text}`
        )
        .join('\n\n---\n\n');
      finalPrompt = `RETRIEVED CLINICAL CHUNKS (ONLY SOURCE OF TRUTH):\n${chunksContext}\n\nPATIENT QUESTION:\n${prompt}`;
    }

    for (const model of textModelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: finalPrompt,
          config: {
            systemInstruction: systemInstruction || undefined,
            temperature: 0.1, // clinical consistency
          },
        });

        if (response.text) {
          generatedText = response.text;
          usedModel = model;
          if (activeTextModel !== model) {
            console.log(`Switched active text model to: ${model}`);
            activeTextModel = model;
          }
          break;
        }
      } catch (err: any) {
        lastErr = err;
        console.warn(`Text generation failed with model ${model}:`, err?.message || err);
      }
    }

    if (!generatedText && lastErr) {
      throw lastErr;
    }

    return res.json({
      answer: generatedText,
      modelUsed: usedModel,
    });
  } catch (error: any) {
    console.error('Error generating answer:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate answer from Gemini API',
      activeTextModel,
    });
  }
});

// Vite or Static handling
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AskMyMedicine server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
