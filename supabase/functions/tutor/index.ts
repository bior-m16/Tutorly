// Tutorly tutor API. Holds the Anthropic key server-side and enforces the free daily limit.
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

    return json({ error: 'unknown_action' }, 400);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return json({ error: 'busy' }, 429);
    if (err instanceof Anthropic.APIError) return json({ error: 'ai_unavailable', status: err.status }, 502);
    console.error(err);
    return json({ error: 'server_error' }, 500);
  }
});
