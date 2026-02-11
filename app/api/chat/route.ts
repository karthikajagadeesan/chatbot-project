import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const GOOGLE_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!GOOGLE_API_KEY) throw new Error('Missing GOOGLE_GEMINI_API_KEY environment variable');
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Missing Supabase environment variables');

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function detectEndpointIntent(message: string): string | null {
  const lower = message.toLowerCase();

  if (
    lower.includes('product') || lower.includes('item') || lower.includes('catalog') ||
    lower.includes('show') || lower.includes('see') || lower.includes('list') ||
    lower.includes('available') || lower.includes('how many') || lower.includes('count') ||
    lower.includes('stock') || lower.includes('buy') || lower.includes('price') ||
    lower.includes('cheap') || lower.includes('expensive') || lower.includes('recommend')
  ) {
    return 'products';
  }

  if (
    lower.includes('about') || lower.includes('company') || lower.includes('who are') ||
    lower.includes('tell me about') || lower.includes('what is') || lower.includes('history')
  ) {
    return 'about';
  }

  if (
    lower.includes('service') || lower.includes('offer') ||
    lower.includes('provide') || lower.includes('what do you do')
  ) {
    return 'services';
  }

  return null;
}

async function fetchEndpointUrl(userId: string, intent: string): Promise<string | null> {
  try {
    console.log('[fetchEndpointUrl] userId:', userId, 'intent:', intent);

    const { data, error } = await supabase
      .from('api_endpoints')
      .select('endpoint_url')
      .eq('user_id', userId)
      .eq('endpoint_type', intent)
      .single();

    if (error) {
      console.error('[fetchEndpointUrl] Supabase error:', error.message);
      return null;
    }

    console.log('[fetchEndpointUrl] Found URL:', data?.endpoint_url);
    return data?.endpoint_url ?? null;
  } catch (err) {
    console.error('[fetchEndpointUrl] Unexpected error:', err);
    return null;
  }
}

async function fetchEndpointData(url: string): Promise<any | null> {
  try {
    console.log('[fetchEndpointData] Fetching:', url);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('[fetchEndpointData] HTTP error:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('[fetchEndpointData] Got', Array.isArray(data) ? data.length + ' items' : 'object');
    return data;
  } catch (err: any) {
    console.error('[fetchEndpointData] Error:', err.name === 'AbortError' ? 'timeout' : err.message);
    return null;
  }
}

// Passes FULL product data so Gemini can answer any product question accurately
function buildDataContext(intent: string, data: any): string {
  if (!data) return '';

  if (intent === 'products' && Array.isArray(data)) {
    const count = data.length;
    const categories = [...new Set(data.map((p: any) => p.category).filter(Boolean))];

    const productList = data.slice(0, 100).map((p: any) => ({
      id: p.id,
      title: p.title || p.name || 'Unknown',
      price: p.price,
      category: p.category,
      description: p.description?.slice(0, 100),
      rating: p.rating?.rate ?? p.rating,
      image: p.image,
    }));

    return `
LIVE PRODUCT DATA (real-time from configured endpoint):
- Total products: ${count}
- Categories: ${categories.join(', ') || 'N/A'}
- Products:
${JSON.stringify(productList, null, 2)}
`;
  }

  if (intent === 'about') {
    return `\nLIVE COMPANY INFO:\n${JSON.stringify(data, null, 2).slice(0, 1500)}\n`;
  }

  if (intent === 'services') {
    return `\nLIVE SERVICES DATA:\n${JSON.stringify(data, null, 2).slice(0, 1500)}\n`;
  }

  return `\nLIVE DATA:\n${JSON.stringify(data, null, 2).slice(0, 1500)}\n`;
}

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { messages, userMessage, userId } = body;

    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json({ error: 'userMessage is required' }, { status: 400 });
    }
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages must be an array' }, { status: 400 });
    }

    console.log('[POST] Message:', userMessage.slice(0, 60), '| userId:', userId ?? 'MISSING');

    // ── Detect intent & fetch live endpoint data ──────────────────────────────
    const intent = detectEndpointIntent(userMessage);
    let dataContext = '';
    let dataFetched = false;

    if (intent && userId) {
      console.log('[POST] Intent:', intent, '— looking up endpoint...');
      const endpointUrl = await fetchEndpointUrl(userId, intent);

      if (endpointUrl) {
        const data = await fetchEndpointData(endpointUrl);
        if (data) {
          dataContext = buildDataContext(intent, data);
          dataFetched = true;
          console.log('[POST] Context ready:', dataContext.length, 'chars');
        }
      } else {
        console.log('[POST] No endpoint found for intent:', intent);
      }
    } else {
      if (!userId) console.log('[POST] ⚠ userId not provided — skipping endpoint lookup');
      if (!intent) console.log('[POST] No intent matched — general response');
    }

    // ── Build system prompt ───────────────────────────────────────────────────
    const systemPrompt = dataFetched
      ? `You are a helpful AI assistant for a company chatbot. Be concise, friendly, and professional.

IMPORTANT: You have LIVE, REAL data available below. Answer all questions using this data confidently.
Do NOT say you don't have data, and do NOT say endpoints aren't configured — you have the real data.

When answering about products:
- State exact counts, names, and prices from the data.
- Mention categories when relevant.
- If asked to list/show products, name 3-5 specific ones with prices.
- Keep answers to 2-4 sentences unless a full list is explicitly requested.

${dataContext}`
      : `You are a helpful AI assistant for a company chatbot. Be concise, friendly, and professional.
Help users find information about products, services, and company info.
If asked about specific data you don't have, suggest configuring the relevant endpoint in settings.`;

    // ── Build Gemini chat history ─────────────────────────────────────────────
    const rawHistory = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    let history = [...rawHistory];
    while (history.length > 0 && history[0].role === 'model') {
      history.shift();
    }

    console.log('[POST] Calling Gemini | history:', history.length, '| dataFetched:', dataFetched);

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt,
      });

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(userMessage);
      const text = result.response.text();

      console.log('[POST] Gemini response OK');
      return NextResponse.json({ message: text });

    } catch (aiError: any) {
      const statusCode: number = aiError.status ?? aiError.statusCode ?? 500;
      const errMsg: string = aiError.message ?? '';
      console.error('[POST] Gemini error:', statusCode, errMsg);

      // Retry without history on 400
      if (statusCode === 400 || errMsg.includes('[400]')) {
        console.log('[POST] Retrying without history...');
        try {
          const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: systemPrompt,
          });
          const result = await model.generateContent(`User: ${userMessage}`);
          return NextResponse.json({ message: result.response.text() });
        } catch (retryErr: any) {
          return NextResponse.json({ error: `Gemini retry failed: ${retryErr.message}` }, { status: 500 });
        }
      }

      if (statusCode === 401 || statusCode === 403 || errMsg.includes('API_KEY_INVALID')) {
        return NextResponse.json({ error: 'Invalid Gemini API key.' }, { status: 401 });
      }

      if (statusCode === 429 || errMsg.includes('RESOURCE_EXHAUSTED')) {
        return NextResponse.json({ error: 'Gemini quota exceeded. Try again later.' }, { status: 429 });
      }

      return NextResponse.json({ error: `Gemini error (${statusCode}): ${errMsg}` }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[POST] Unhandled error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat message' },
      { status: 500 }
    );
  }
}