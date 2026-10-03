import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { GoogleGenAI } from '@google/genai';

const router = Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// ── Categorize & Emoji ─────────────────────────────────────────
router.post('/categorize', requireAuth, async (req: Request, res: Response) => {
  const { description } = req.body;
  if (!description) return res.status(400).json({ error: 'Description required' });
  
  if (!process.env.GEMINI_API_KEY) {
    // Graceful fallback if no API key
    return res.json({ emoji: '🏷️', category: 'General' });
  }

  try {
    const prompt = `Given this expense description: "${description}", reply with EXACTLY a JSON object with two keys: "emoji" (a single fitting emoji) and "category" (a short category name). Make the category short, e.g. "Food", "Transport", "Bills". Do not include markdown formatting or backticks, just raw JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });
    const text = response.text || '{"emoji": "🏷️", "category": "General"}';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err) {
    res.json({ emoji: '🏷️', category: 'General' });
  }
});

// ── Extract Receipt ────────────────────────────────────────────
// Accepts a base64 encoded image string
router.post('/receipt', requireAuth, async (req: Request, res: Response) => {
  const { base64Image, mimeType = 'image/jpeg' } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the backend.' });
  }
  if (!base64Image) {
    return res.status(400).json({ error: 'base64Image is required' });
  }

  try {
    const prompt = `Analyze this receipt. Return a JSON object with a single key "items". "items" should be an array of objects. Each object should have two keys: "description" (string, the name of the item) and "amount" (number, the price of the item). If you see tax or tip, include them as separate items. Return ONLY raw JSON, no markdown backticks.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        },
        prompt
      ],
    });

    let text = response.text || '{"items": []}';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err) {
    console.error('Gemini Receipt Error:', err);
    res.status(500).json({ error: 'Failed to parse receipt' });
  }
});

// ── Natural Language Quick Add ────────────────────────────────
router.post('/quick-add', requireAuth, async (req: Request, res: Response) => {
  const { text, groupMembers } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the backend.' });
  }
  if (!text || !groupMembers) {
    return res.status(400).json({ error: 'text and groupMembers are required' });
  }

  try {
    const prompt = `
I have an expense to log based on this text: "${text}".
The members in the group are: ${JSON.stringify(groupMembers)}.
Return EXACTLY a raw JSON object (no markdown) with:
- "description": string
- "amount": number (total amount)
- "paidBy": string (id of the user who paid, based on the text. Assume 'Me' or the sender's id is ${req.user!.id} if not specified)
- "splits": array of objects with "userId" (string) and "amount" (number). Make sure the split amounts add up exactly to the total amount. If it's an equal split, divide it.
`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    let resultText = response.text || '{}';
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (err) {
    console.error('Gemini Quick Add Error:', err);
    res.status(500).json({ error: 'Failed to parse quick add text' });
  }
});

export default router;
