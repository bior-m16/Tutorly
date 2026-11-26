// Tutorly tutor API. Holds the Anthropic and ElevenLabs keys server-side and enforces the free daily limit.
// Deployed with verify_jwt = true: every request carries the signed-in (anonymous) user's token.
import Anthropic from 'npm:@anthropic-ai/sdk@0.30.1';
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const MODEL = 'claude-haiku-4-5-20251001';
const FREE_SOLVES_PER_DAY = 5;
const MAX_IMAGE_BASE64 = 7_000_000; // ~5 MB image
const MAX_TEXT = 4_000;

const SOLVE_SYSTEM = `You are Tutorly, an expert AI tutor that helps students understand their homework problems step by step.

When given an image of a homework problem, you must:
1. Identify the subject area (Math, Physics, Chemistry, Biology, History, Literature, Geography, Computer Science, or Other)
2. Extract and restate the question or problem clearly
3. Solve the problem with detailed step-by-step reasoning
4. Provide a clear final answer
5. Assess the difficulty level (Easy, Medium, or Hard)

Always respond with valid JSON in this exact structure:
{
  "subject": "<subject>",
  "question": "<clear restatement of the question>",
  "answer": "<the final answer>",
  "difficulty": "<Easy|Medium|Hard>",
  "steps": [
    {
      "stepNumber": 1,
      "title": "<short step title>",
      "explanation": "<detailed explanation of this step>",
      "formula": "<optional formula or equation used in this step>",
      "hint": "<a short nudge toward this step that does not reveal its result>"
    }
  ]
}

Be thorough, educational, and encouraging. Show all work. If the image is unclear or not a homework problem, still return valid JSON with subject "Other" and explain what you see.`;
const FOLLOW_UP_SYSTEM = `You are Tutorly, a patient tutor. A student is asking follow-up questions about a homework solution you already worked out. Answer in plain language, in at most 120 words, and check understanding with a short question when it helps. Do not just restate the whole solution.`;
const PRACTICE_SYSTEM = `You write practice problems for students. Given a solved problem, write 3 new problems that practise the same skill at the same level, with different numbers or contexts. Respond with only valid JSON: {"problems":[{"question":"...","answer":"..."}]}. Keep each answer short: the final result, plus one line of working if needed.`;

const QUIZ_SYSTEM = `You write short multiple-choice quizzes for students. Write 5 questions that test understanding, not trivia, at the level the material suggests. Each question has exactly 4 choices and one correct answer. Respond with only valid JSON:
{"title":"<short quiz title>","questions":[{"question":"...","choices":["...","...","...","..."],"answerIndex":0,"explanation":"<one or two sentences on why the answer is right>"}]}
Vary which position holds the correct answer.`;

const FLASHCARDS_SYSTEM = `You write study flashcards for students. Write 10 to 15 cards that cover the key terms, facts and ideas at the level the material suggests. The front is a short prompt (a term, a question or a fill-in-the-blank) and the back is a concise answer of at most 30 words. Respond with only valid JSON:
{"title":"<short deck title>","cards":[{"front":"...","back":"..."}]}`;

const WRITE_SYSTEM = `You are Tutorly's writing helper for students. Write in plain text: no Markdown symbols such as #, * or **. Use short headings on their own line and blank lines between paragraphs. Use numbered or lettered lines for outlines. Write original text in the student's requested style. Respond with only the requested writing, with no preamble or closing remarks.`;

const WRITE_OPTIONS = {
  format: ['General', 'Email', 'Essay topic ideas', 'Academic', 'Business', 'Creative', 'Blog'],
  tone: ['Auto', 'Formal', 'Neutral', 'Casual'],
  type: ['Auto', 'Expository', 'Reflective', 'Argumentative', 'Descriptive', 'Analytical', 'Comparative', 'Narrative'],
  level: ['Foundation', 'Intermediate', 'Advanced'],
  paragraphs: ['3', '4', '5', '6'],
  length: ['Short', 'Medium', 'Long'],
  change: ['Expand', 'Shorten', 'Continue writing', 'Rewrite', 'Fix grammar', 'Simplify'],
} as const;
const LENGTH_WORDS: Record<string, string> = { Short: 'about 300', Medium: 'about 500', Long: 'about 800' };
const LEVEL_TEXT: Record<string, string> = {
  Foundation: 'a middle-school student: simple vocabulary and clear structure',
  Intermediate: 'a high-school student: varied sentences and developed arguments',
  Advanced: 'a university student: precise vocabulary and nuanced analysis',
};
const CHANGE_TEXT: Record<string, string> = {
  Expand: 'Expand this text with more detail, examples and explanation, keeping the voice and meaning.',
  Shorten: 'Shorten this text to about half its length, keeping the key points.',
  'Continue writing': 'Continue this text naturally for two or three more paragraphs in the same voice. Return only the new part.',
  Rewrite: 'Rewrite this text so it reads more clearly and smoothly, keeping the meaning.',
  'Fix grammar': 'Correct the spelling, grammar and punctuation of this text. Change as little as possible.',
  Simplify: 'Rewrite this text in simpler words that a younger student would understand.',
};

function pick<K extends keyof typeof WRITE_OPTIONS>(opts: any, key: K): string {
  const v = opts?.[key];
  return (WRITE_OPTIONS[key] as readonly string[]).includes(v) ? v : WRITE_OPTIONS[key][0];
}

/** "a"/"an" plus the phrase, e.g. an argumentative essay. */
function withArticle(phrase: string): string {
  return `${/^[aeiou]/i.test(phrase) ? 'an' : 'a'} ${phrase}`;
}

function writePrompt(mode: string, opts: any, hasImage: boolean): string | null {
  const source = hasImage ? 'the material in the attached photo' : 'the text below';
  switch (mode) {
    case 'general': {
      const format = pick(opts, 'format');
      const tone = pick(opts, 'tone');
      const toneText = tone === 'Auto' ? 'a tone that suits the task' : `a ${tone.toLowerCase()} tone`;
      if (format === 'Essay topic ideas') {
        return `Suggest 8 essay topics based on ${source}. For each, give the topic on one line and one sentence on the angle it could take.`;
      }
      if (format === 'Email') return `Write an email for the request in ${source}, with a subject line, in ${toneText}.`;
      return `Write ${withArticle(format === 'General' ? 'piece' : format.toLowerCase() + ' piece')} for the request in ${source}, in ${toneText}.`;
    }
    case 'outline': {
      const type = pick(opts, 'type');
      return `Write a well-structured ${type === 'Auto' ? '' : type.toLowerCase() + ' '}essay outline for the topic in ${source}, pitched at ${LEVEL_TEXT[pick(opts, 'level')]}. Include a working thesis, an introduction, ${pick(opts, 'paragraphs')} body paragraphs each with a topic sentence and two or three supporting points, and a conclusion.`;
    }
    case 'essay': {
      const type = pick(opts, 'type');
      return `Write ${withArticle(type === 'Auto' ? 'essay' : type.toLowerCase() + ' essay')} of ${LENGTH_WORDS[pick(opts, 'length')]} words on the topic in ${source}, pitched at ${LEVEL_TEXT[pick(opts, 'level')]}. Give it a title, an introduction with a clear thesis, body paragraphs and a conclusion.`;
    }
    case 'modify':
      return `${CHANGE_TEXT[pick(opts, 'change')]} The text is ${hasImage ? 'in the attached photo' : 'below'}.`;
  }
  return null;
}

const SUMMARY_SYSTEM = `You summarise study material for students. Respond with only valid JSON:
{"title":"<short title>","tldr":"<the gist in one or two sentences>","points":["<key point>", ...],"terms":[{"term":"...","meaning":"<one sentence>"}]}
Keep points short and in the order the material presents them. Include terms only for words a student would need to learn (0 to 8). Do not add facts that are not in the material.`;
const SUMMARY_LENGTH: Record<string, string> = {
  Brief: '3 to 4 key points',
  Standard: '5 to 7 key points',
  Detailed: '8 to 12 key points, each with a short supporting detail',
};

const CHAT_SYSTEMS: Record<string, string> = {
  study_fast: `You are Tutorly, a friendly expert tutor for students. Answer the question directly and correctly, then explain why in clear steps a student can follow. Write in plain text without Markdown symbols such as #, * or **; use short numbered steps when they help. Keep answers focused: under 250 words unless the student asks for more.`,
  study_guided: `You are Tutorly, a patient tutor who teaches by guiding. Do not give the final answer straight away. Work out where the student is, then lead them one small step at a time: give a hint or ask one short question, and wait for their reply. Praise progress, correct mistakes gently, and confirm the answer once they reach it. If they are stuck after a few tries, show the next step. Write in plain text without Markdown symbols, in under 120 words per turn.`,
  chat: `You are Tutorly, a friendly assistant for students. Help with everyday questions, ideas, planning and messages in a warm, natural voice. Keep it appropriate for teenagers, and steer away from anything unsafe. Write in plain text without Markdown symbols, and keep replies short unless more is asked for.`,
  voice: `You are Tutorly, a warm tutor talking with a student out loud. Your words will be spoken by a voice, so write exactly as you would speak: no lists, symbols, Markdown, emoji or equations in symbols (say "x squared", not "x^2"). Keep each turn under 60 words. Teach by guiding: explain one idea at a time and usually end with a short question to check understanding or to move on.`,
};

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' });
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

function text(res: Anthropic.Message): string {
  const block = res.content.find((b) => b.type === 'text');
  return block && block.type === 'text' ? block.text : '';
}

type Turn = { role: 'user' | 'assistant'; text: string };
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;

async function isPlus(userId: string): Promise<boolean> {
  const { data } = await admin.from('subscribers').select('plus_until').eq('user_id', userId).maybeSingle();
  return !!data?.plus_until && new Date(data.plus_until) > new Date();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data: auth } = await admin.auth.getUser(token);
  const user = auth?.user;
  if (!user) return json({ error: 'sign_in_required' }, 401);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  try {
    if (body.action === 'solve') {
      const { image, mediaType, question } = body;
      const typed = typeof question === 'string' && question.trim().length > 0;
      if (typed ? question.length > MAX_TEXT : typeof image !== 'string' || image.length > MAX_IMAGE_BASE64 || !IMAGE_TYPES.includes(mediaType)) {
        return json({ error: typed ? 'too_long' : 'bad_image' }, 400);
      }
      const plus = await isPlus(user.id);
      if (!plus) {
        const { data: used, error } = await admin.rpc('bump_solves', { p_user: user.id });
        if (error) throw error;
        if ((used as number) > FREE_SOLVES_PER_DAY) {
          return json({ error: 'limit_reached', limit: FREE_SOLVES_PER_DAY }, 402);
        }
      }
      const res = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: SOLVE_SYSTEM,
        messages: [{
          role: 'user',
          content: typed
            ? `Here is the homework problem, typed by the student:\n\n${question}\n\nPlease provide a detailed step-by-step solution.`
            : [
                { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
                { type: 'text', text: 'Please analyze this homework problem and provide a detailed step-by-step solution.' },
              ],
        }],
      });
      return json({ text: text(res), plus });
    }

    if (body.action === 'followup') {
      const { context, history, question } = body as { context: string; history: Turn[]; question: string };
      if (typeof context !== 'string' || typeof question !== 'string' || !Array.isArray(history)) {
        return json({ error: 'bad_request' }, 400);
      }
      if (context.length > MAX_TEXT * 2 || question.length > MAX_TEXT || history.length > 40) {
        return json({ error: 'too_long' }, 400);
      }
      const messages: Anthropic.MessageParam[] = [
        { role: 'user', content: context },
        { role: 'assistant', content: 'Got it. What would you like to know?' },
        ...history.map((t): Anthropic.MessageParam => ({
          role: t.role === 'assistant' ? 'assistant' : 'user',
          content: String(t.text).slice(0, MAX_TEXT),
        })),
        { role: 'user', content: question },
      ];
      const res = await anthropic.messages.create({ model: MODEL, max_tokens: 1024, system: FOLLOW_UP_SYSTEM, messages });
      return json({ text: text(res) });
    }

    if (body.action === 'practice') {
      const { context } = body as { context: string };
      if (typeof context !== 'string' || context.length > MAX_TEXT * 2) return json({ error: 'bad_request' }, 400);
      const res = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: PRACTICE_SYSTEM,
        messages: [{ role: 'user', content: context }],
      });
      return json({ text: text(res) });
    }

    if (body.action === 'quiz' || body.action === 'flashcards') {
      const { topic, image, mediaType } = body;
      const fromTopic = typeof topic === 'string' && topic.trim().length > 0;
      if (fromTopic ? topic.length > MAX_TEXT : typeof image !== 'string' || image.length > MAX_IMAGE_BASE64 || !IMAGE_TYPES.includes(mediaType)) {
        return json({ error: fromTopic ? 'too_long' : 'bad_image' }, 400);
      }
      // A quiz or deck costs about as much as a solve, so it counts toward the free daily limit.
      if (!(await isPlus(user.id))) {
        const { data: used, error } = await admin.rpc('bump_solves', { p_user: user.id });
        if (error) throw error;
        if ((used as number) > FREE_SOLVES_PER_DAY) {
          return json({ error: 'limit_reached', limit: FREE_SOLVES_PER_DAY }, 402);
        }
      }
      const quiz = body.action === 'quiz';
      const res = await anthropic.messages.create({
        model: MODEL,
        max_tokens: quiz ? 2048 : 3000,
        system: quiz ? QUIZ_SYSTEM : FLASHCARDS_SYSTEM,
        messages: [{
          role: 'user',
          content: fromTopic
            ? `Make ${quiz ? 'a quiz' : 'flashcards'} on this topic:\n\n${topic}`
            : [
                { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
                { type: 'text', text: `Make ${quiz ? 'a quiz' : 'flashcards'} on the material in these notes.` },
              ],
        }],
      });
      return json({ text: text(res) });
    }

    if (body.action === 'write') {
      const { mode, text: input, image, mediaType, options } = body;
      const hasImage = typeof image === 'string' && image.length > 0;
      const hasText = typeof input === 'string' && input.trim().length > 0;
      if (!hasImage && !hasText) return json({ error: 'bad_request' }, 400);
      if (hasText && input.length > MAX_TEXT * 2) return json({ error: 'too_long' }, 400);
      if (hasImage && (image.length > MAX_IMAGE_BASE64 || !IMAGE_TYPES.includes(mediaType))) return json({ error: 'bad_image' }, 400);
      const instruction = writePrompt(mode, options, hasImage);
      if (!instruction) return json({ error: 'bad_request' }, 400);
      if (!(await isPlus(user.id))) {
        const { data: used, error } = await admin.rpc('bump_solves', { p_user: user.id });
        if (error) throw error;
        if ((used as number) > FREE_SOLVES_PER_DAY) {
          return json({ error: 'limit_reached', limit: FREE_SOLVES_PER_DAY }, 402);
        }
      }
      const content: Array<Anthropic.Messages.ImageBlockParam | Anthropic.Messages.TextBlockParam> = [];
      if (hasImage) content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: image } });
      content.push({ type: 'text', text: hasText ? `${instruction}\n\n${input}` : instruction });
      const res = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 3000,
        system: WRITE_SYSTEM,
        messages: [{ role: 'user', content }],
      });
      return json({ text: text(res) });
    }

    if (body.action === 'summarize') {
      const { text: input, image, mediaType, length, simple } = body;
      const hasImage = typeof image === 'string' && image.length > 0;
      const hasText = typeof input === 'string' && input.trim().length > 0;
      if (!hasImage && !hasText) return json({ error: 'bad_request' }, 400);
      if (hasText && input.length > MAX_TEXT * 3) return json({ error: 'too_long' }, 400);
      if (hasImage && (image.length > MAX_IMAGE_BASE64 || !IMAGE_TYPES.includes(mediaType))) return json({ error: 'bad_image' }, 400);
      if (!(await isPlus(user.id))) {
        const { data: used, error } = await admin.rpc('bump_solves', { p_user: user.id });
        if (error) throw error;
        if ((used as number) > FREE_SOLVES_PER_DAY) {
          return json({ error: 'limit_reached', limit: FREE_SOLVES_PER_DAY }, 402);
        }
      }
      const size = Object.prototype.hasOwnProperty.call(SUMMARY_LENGTH, length) ? SUMMARY_LENGTH[length] : SUMMARY_LENGTH.Standard;
      const instruction = `Summarise ${hasImage ? 'the material in the attached photo' : 'the text below'} in ${size}.${simple === true ? ' Use simple words a 12-year-old would understand.' : ''}`;
      const content: Array<Anthropic.Messages.ImageBlockParam | Anthropic.Messages.TextBlockParam> = [];
      if (hasImage) content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: image } });
      content.push({ type: 'text', text: hasText ? `${instruction}\n\n${input}` : instruction });
      const res = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: SUMMARY_SYSTEM,
        messages: [{ role: 'user', content }],
      });
      return json({ text: text(res) });
    }

    if (body.action === 'chat') {
      const { mode, messages: turns, image, mediaType } = body;
      const system = Object.prototype.hasOwnProperty.call(CHAT_SYSTEMS, mode) ? CHAT_SYSTEMS[mode] : undefined;
      if (!system || !Array.isArray(turns) || turns.length === 0 || turns.length > 40) return json({ error: 'bad_request' }, 400);
      const history: Turn[] = turns.map((t: any) => ({
        role: t?.role === 'assistant' ? 'assistant' : 'user',
        text: String(t?.text ?? '').slice(0, MAX_TEXT),
      }));
      if (history[history.length - 1].role !== 'user') return json({ error: 'bad_request' }, 400);
      const hasImage = typeof image === 'string' && image.length > 0;
      if (hasImage && (image.length > MAX_IMAGE_BASE64 || !IMAGE_TYPES.includes(mediaType))) return json({ error: 'bad_image' }, 400);
      // A conversation counts once toward the free daily limit, when it starts.
      if (history.filter((t) => t.role === 'user').length === 1 && !(await isPlus(user.id))) {
        const { data: used, error } = await admin.rpc('bump_solves', { p_user: user.id });
        if (error) throw error;
        if ((used as number) > FREE_SOLVES_PER_DAY) {
          return json({ error: 'limit_reached', limit: FREE_SOLVES_PER_DAY }, 402);
        }
      }
      // The API needs strictly alternating roles starting with the user: merge any repeats.
      const merged: Turn[] = [];
      for (const t of history) {
        const last = merged[merged.length - 1];
        if (last && last.role === t.role) last.text += `\n\n${t.text}`;
        else merged.push({ ...t });
      }
      if (merged[0].role !== 'user') merged.unshift({ role: 'user', text: '(start)' });
      const messages: Anthropic.MessageParam[] = merged.map((t, i) => {
        const isLast = i === merged.length - 1;
        if (isLast && hasImage) {
          return {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
              { type: 'text', text: t.text || 'Help me with this.' },
            ],
          };
        }
        return { role: t.role, content: t.text || '(no text)' };
      });
      const res = await anthropic.messages.create({
        model: MODEL,
        max_tokens: mode === 'voice' ? 300 : 1200,
        system,
        messages,
      });
      return json({ text: text(res) });
    }

    if (body.action === 'voice_session') {
      // Live voice tutor: ElevenLabs runs the call. We mint a short-lived conversation token here
      // so the ElevenLabs key never reaches the app.
      const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
      const agentId = Deno.env.get('ELEVENLABS_AGENT_ID');
      if (!apiKey || !agentId) return json({ error: 'voice_not_configured' }, 503);
      // Each live session counts once toward the free daily limit.
      if (!(await isPlus(user.id))) {
        const { data: used, error } = await admin.rpc('bump_solves', { p_user: user.id });
        if (error) throw error;
        if ((used as number) > FREE_SOLVES_PER_DAY) {
          return json({ error: 'limit_reached', limit: FREE_SOLVES_PER_DAY }, 402);
        }
      }
      const res = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`,
        { headers: { 'xi-api-key': apiKey } },
      );
      if (!res.ok) {
        console.error('elevenlabs token', res.status, await res.text().catch(() => ''));
        return json({ error: 'voice_unavailable' }, 502);
      }
      const { token: conversationToken } = await res.json();
      if (!conversationToken) return json({ error: 'voice_unavailable' }, 502);
      return json({ text: 'ok', conversationToken });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return json({ error: 'busy' }, 429);
    if (err instanceof Anthropic.APIError) return json({ error: 'ai_unavailable', status: err.status }, 502);
    console.error(err);
    return json({ error: 'server_error' }, 500);
  }
});
