// AI Insight Engine - Note Summarizer & Action Item Extractor
// Supports both Gemini and OpenAI APIs via user-provided key

export interface AIInsight {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  tags: string[];
}

export type AIProvider = 'gemini' | 'openai';

interface AIConfig {
  provider: AIProvider;
  apiKey: string;
}

const SYSTEM_PROMPT = `Sen bir yapay zeka not asistanısın. Kullanıcının el yazısı notlarını analiz edip şu formatta JSON döndür:
{
  "summary": "Notun 2-3 cümlelik özeti",
  "keyPoints": ["Önemli nokta 1", "Önemli nokta 2", "Önemli nokta 3"],
  "actionItems": ["Yapılacak iş 1", "Yapılacak iş 2"],
  "tags": ["otomatik-etiket-1", "otomatik-etiket-2"]
}
Kurallar:
- Türkçe yanıt ver.
- keyPoints en fazla 5 madde olsun.
- actionItems boş olabilir eğer not bir görev içermiyorsa.
- tags en fazla 4 etiket öner, kısa ve anlamlı olsun.
- Sadece JSON döndür, başka bir şey yazma.`;

async function callGemini(apiKey: string, noteContent: string): Promise<AIInsight> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: SYSTEM_PROMPT },
            { text: `İşte kullanıcının notu:\n\n${noteContent}` }
          ]
        }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API hatası: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini boş yanıt döndürdü');
  
  return JSON.parse(text) as AIInsight;
}

async function callOpenAI(apiKey: string, noteContent: string): Promise<AIInsight> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `İşte kullanıcının notu:\n\n${noteContent}` }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API hatası: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI boş yanıt döndürdü');

  return JSON.parse(text) as AIInsight;
}

export class AIInsightEngine {
  private static config: AIConfig | null = null;

  static configure(provider: AIProvider, apiKey: string) {
    this.config = { provider, apiKey };
    // Persist to localStorage
    localStorage.setItem('kawaiinote-ai-config', JSON.stringify(this.config));
  }

  static getConfig(): AIConfig | null {
    if (this.config) return this.config;
    const stored = localStorage.getItem('kawaiinote-ai-config');
    if (stored) {
      this.config = JSON.parse(stored);
      return this.config;
    }
    return null;
  }

  static isConfigured(): boolean {
    return this.getConfig() !== null;
  }

  static async analyze(noteContent: string): Promise<AIInsight> {
    const config = this.getConfig();
    if (!config) {
      throw new Error('AI yapılandırılmamış. Lütfen önce API anahtarınızı girin.');
    }

    if (!noteContent || noteContent.trim().length < 10) {
      throw new Error('Analiz için yeterli metin bulunamadı. Lütfen daha fazla not yazın.');
    }

    if (config.provider === 'gemini') {
      return callGemini(config.apiKey, noteContent);
    } else {
      return callOpenAI(config.apiKey, noteContent);
    }
  }

  static clearConfig() {
    this.config = null;
    localStorage.removeItem('kawaiinote-ai-config');
  }
}
