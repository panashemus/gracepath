import type { PrayerResult, ScriptureVerse } from '../types';
import { CATEGORIES, SCRIPTURE_LIBRARY, TRANSLATIONS } from '../data';

export interface PrayerRequest {
  name: string;
  categories: string[];
  request: string;
  tone: string;
  translation: string;
}

const SYSTEM_PROMPT = `You are GracePath, a compassionate, theologically grounded prayer companion. You craft deeply personal, authentic, non-robotic prayers that feel like they come from a trusted pastor or spiritual mentor who truly knows the person.

Core principles:
- Address the person by name naturally, not mechanically
- Speak directly to their specific situation with empathy and spiritual depth
- Use warm, conversational yet reverent language — never formulaic or generic
- Weave scripture references organically into the prayer
- Match the requested tone precisely (uplifting, intercessory, or calming)
- Keep prayers to 3-4 substantial paragraphs — rich but not exhausting
- Always point toward hope, God's character, and His promises
- Avoid clichés and repetitive phrases; each sentence should feel fresh
- Be theologically sound: rooted in grace, faith, and God's love

Return ONLY valid JSON in this exact shape:
{
  "prayer": "the full prayer text as a single string with \\n\\n between paragraphs",
  "scriptures": [
    { "reference": "Book C:V", "text": "verse text in the requested translation", "translation": "NIV" }
  ],
  "reflection": "A single thoughtful journaling prompt (1-2 sentences)"
}`;

function toneInstruction(tone: string): string {
  switch (tone) {
    case 'uplifting':
      return 'Write with joyful, celebratory energy — full of praise, hope, and confident expectation of God\'s goodness.';
    case 'intercession':
      return 'Write with earnest, fervent depth — standing in the gap with boldness, spiritual warfare language, and passionate pleading.';
    case 'calming':
      return 'Write with gentle, soothing tenderness — like a quiet whisper of peace, comforting and reassuring, slow and restful.';
    default:
      return 'Write with warm, balanced encouragement.';
  }
}

function categoryLabels(categoryIds: string[]): string {
  return categoryIds
    .map((id) => CATEGORIES.find((c) => c.id === id)?.label ?? id)
    .join(', ');
}

function buildUserPrompt(req: PrayerRequest): string {
  return `Create a personalized prayer for:
- Name: ${req.name}
- Life areas: ${categoryLabels(req.categories)}
- Their situation: ${req.request || 'A general need for God\'s guidance and blessing'}
- Preferred Bible translation: ${req.translation}
- Desired tone: ${toneInstruction(req.tone)}

Select 2-3 relevant Bible verses (in ${req.translation} translation) that speak directly to this person's situation. Make the prayer feel deeply personal and specific to what they shared.`;
}

export async function generatePrayer(req: PrayerRequest): Promise<PrayerResult> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (apiKey) {
    try {
      const result = await generateViaAPI(req, apiKey);
      return result;
    } catch {
      // Fall through to local generator
    }
  }

  return generateFallback(req);
}

async function generateViaAPI(
  req: PrayerRequest,
  apiKey: string
): Promise<PrayerResult> {
  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'GracePath',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(req) },
        ],
        temperature: 0.85,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      }),
    }
  );

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const data = await response.json();
  const content = JSON.parse(data.choices[0].message.content);

  return {
    id: crypto.randomUUID(),
    name: req.name,
    categories: req.categories,
    request: req.request,
    tone: req.tone,
    translation: req.translation,
    prayer: content.prayer,
    scriptures: (content.scriptures || []).map((s: ScriptureVerse) => ({
      reference: s.reference,
      text: s.text,
      translation: s.translation || req.translation,
    })),
    reflection: content.reflection,
    createdAt: new Date().toISOString(),
  };
}

function pickScriptures(
  categoryIds: string[],
  translation: string,
  count: number
): ScriptureVerse[] {
  const pool: ScriptureVerse[] = [];
  for (const catId of categoryIds) {
    const entries = SCRIPTURE_LIBRARY[catId];
    if (entries) {
      for (const entry of entries) {
        const transKey = TRANSLATIONS.includes(translation as (typeof TRANSLATIONS)[number])
          ? translation
          : 'NIV';
        pool.push({
          reference: entry.reference,
          text: entry.text[transKey] || entry.text.NIV,
          translation: transKey,
        });
      }
    }
  }
  // Fallback to peace verses if no matches
  if (pool.length === 0) {
    for (const entry of SCRIPTURE_LIBRARY.peace) {
      pool.push({
        reference: entry.reference,
        text: entry.text[translation] || entry.text.NIV,
        translation,
      });
    }
  }
  // Shuffle and pick
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function buildFallbackPrayer(req: PrayerRequest): string {
  const name = req.name || 'Friend';
  const areas = categoryLabels(req.categories);
  const situation = req.request.trim();

  const openings: Record<string, string> = {
    uplifting: `Heavenly Father, today I come before You with a heart full of praise and expectation, lifting up ${name} who is seeking Your touch in the area of ${areas.toLowerCase()}.`,
    intercession: `Lord God, I stand in the gap today for ${name}, crying out to You with an earnest and burdened heart concerning ${areas.toLowerCase()}.`,
    calming: `Dear Lord, I come to You now with a quiet and resting heart, gently bringing ${name} before You in the area of ${areas.toLowerCase()}.`,
  };

  const middles: Record<string, string> = {
    uplifting: situation
      ? `You see exactly what ${name} is walking through — ${situation} — and I declare that You are already at work, already making a way, already preparing the answer that will cause ${name}'s heart to overflow with joy. You are the God who specializes in breakthroughs, who delights in surprising Your children with Your goodness. I ask that You would open doors that no man can shut, that You would pour out favor like rain, and that ${name} would see Your faithfulness in living color.`
      : `You know every desire of ${name}'s heart, every hope that stirs within. I ask that You would pour out Your blessing abundantly, that ${name} would experience the fullness of Your goodness in tangible, unmistakable ways. Let there be a fresh outpouring of Your Spirit, a renewed sense of Your presence, and a deep knowing that You are working all things together for good.`,
    intercession: situation
      ? `You see the weight ${name} is carrying — ${situation} — and I refuse to let go until You move. I plead the blood of Jesus over this situation. I ask for angelic intervention, for divine orchestration, for the forces of darkness to be pushed back. Lord, You are a warrior, and You fight for those who trust in You. I declare victory over every obstacle, every delay, every scheme of the enemy. Let Your kingdom come, let Your will be done, in ${name}'s life as it is in heaven.`
      : `I lift ${name} before Your throne with holy persistence. I ask that You would move mightily, that You would break every chain, that You would release every captive. You are the God who hears, the God who acts, the God who is moved by the cries of Your children. I declare that no weapon formed against ${name} shall prosper, that every assignment of the enemy is cancelled by the power of the cross.`,
    calming: situation
      ? `You know the tender places in ${name}'s heart — ${situation} — and I ask that Your gentle presence would wrap around them like a warm blanket. Let Your peace, the peace that passes all understanding, settle over ${name}'s mind and body. Quiet the racing thoughts. Still the anxious heart. Remind ${name} that they are held, they are seen, they are deeply loved. You are the Good Shepherd who carries the lambs close to His chest.`
      : `I ask that Your peace would settle over ${name} like the morning dew. Let every anxious thought be calmed by the assurance of Your nearness. You are the rest for the weary, the safe harbor for the storm-tossed, the gentle voice that says, "Be still." May ${name} feel Your nearness in a profound and comforting way today.`,
  };

  const closings: Record<string, string> = {
    uplifting: `I thank You, Lord, that You are faithful to complete the good work You have begun in ${name}'s life. I praise You in advance for the testimony that is being written. May ${name} walk today in the confidence of Your love, the joy of Your salvation, and the certainty that the best is yet to come. In Jesus' name, Amen.`,
    intercession: `I seal this prayer in the mighty name of Jesus. I thank You that it is done, that the answer is on its way, that ${name} will see the salvation of the Lord. I declare it, I believe it, and I stand on Your word. In the matchless name of Jesus Christ, Amen.`,
    calming: `I rest this prayer in Your gentle hands, trusting that You are near, that You are working, and that Your love never fails. May ${name} carry Your peace with them throughout this day and into the night. In Jesus' name, Amen.`,
  };

  const tone = req.tone in openings ? req.tone : 'uplifting';
  return [openings[tone], middles[tone], closings[tone]].join('\n\n');
}

function buildReflection(req: PrayerRequest): string {
  const area = categoryLabels(req.categories);
  const reflections = [
    `Where do you sense God inviting you to trust Him more deeply in the area of ${area.toLowerCase()} today? Write one sentence about what surrender looks like for you right now.`,
    `What is one specific way you can partner with God this week regarding ${area.toLowerCase()}? It might be an action, a mindset shift, or simply resting in His timing.`,
    `Reflect on a past moment when God showed up for you unexpectedly. How does remembering that faithfulness change how you view your current situation?`,
    `If you believed God was already working behind the scenes in your situation, how would your prayers, thoughts, and actions change today?`,
    `What would it look like to trade your worries for worship today? Name one thing you can thank God for even in the middle of this season.`,
  ];
  return reflections[Math.floor(Math.random() * reflections.length)];
}

export function generateFallback(req: PrayerRequest): PrayerResult {
  return {
    id: crypto.randomUUID(),
    name: req.name,
    categories: req.categories,
    request: req.request,
    tone: req.tone,
    translation: req.translation,
    prayer: buildFallbackPrayer(req),
    scriptures: pickScriptures(req.categories, req.translation, 3),
    reflection: buildReflection(req),
    createdAt: new Date().toISOString(),
  };
}
