import { Platform } from 'react-native';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase, ensureSession } from './supabase';
import { HomeworkResult, Step, Subject, Difficulty, ChatTurn, PracticeProblem, Quiz, QuizQuestion, Deck, Flashcard, WriteMode, WriteOptions, Summary } from '../types';

// Prompts and the model live in the backend (supabase/functions/tutor), which also
// holds the Anthropic key and enforces the free daily limit.

/** Thrown when a free user has used today's solves. */
export class LimitReachedError extends Error {
  constructor(public limit: number) {
    super(`You've used your ${limit} free solutions for today.`);
  }
}

async function callTutor(body: Record<string, unknown>): Promise<{ text: string }> {
  await ensureSession();
  const { data, error } = await supabase.functions.invoke('tutor', { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const status = error.context.status as number;
      const payload = await error.context.json().catch(() => ({}));
      if (status === 402) throw new LimitReachedError(payload.limit ?? 5);
      throw new Error(`${status} ${payload.error ?? 'server_error'}`);
    }
    throw error;
  }
  if (!data?.text) throw new Error('No response from the tutor');
  return data as { text: string };
}

interface ClaudeResponse {
  subject: Subject;
  question: string;
  answer: string;
  difficulty: Difficulty;
  steps: Step[];
}

function getMimeType(uri: string): string {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return map[ext] ?? 'image/jpeg';
}

async function imageUriToBase64(uri: string): Promise<{ base64: string; mediaType: string }> {
  if (Platform.OS === 'web') {
    // On web, expo-image-picker returns blob: or data: URIs
    if (uri.startsWith('data:')) {
      const [header, base64] = uri.split(',');
      const mediaType = header.replace('data:', '').replace(';base64', '');
      return { base64, mediaType };
    }
    // blob: URL — use fetch + FileReader
    const response = await fetch(uri);
    const blob = await response.blob();
    const mediaType = blob.type || 'image/jpeg';
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve({ base64: result.split(',')[1] ?? '', mediaType });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Native: dynamic import keeps expo-file-system out of the web bundle
  const FileSystem = await import('expo-file-system');
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return { base64, mediaType: getMimeType(uri) };
}

function parseClaudeResponse(text: string): ClaudeResponse {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in response');
  const parsed = JSON.parse(jsonMatch[0]) as ClaudeResponse;
  if (!parsed.subject || !parsed.question || !parsed.answer || !parsed.steps) {
    throw new Error('Invalid response structure from Claude');
  }
  return parsed;
}

export function friendlyError(err: unknown): string {
  if (err instanceof Error) {
    if (err instanceof LimitReachedError) return err.message;
    const msg = err.message;
    if (msg.startsWith('sign_in_failed')) {
      return 'Could not start your session. Check your connection and try again.';
    }
    // callTutor surfaces HTTP errors as messages starting with the status code
    if (msg.startsWith('401') || msg.includes('authentication_error') || msg.includes('invalid x-api-key')) {
      return 'Your session expired. Close and reopen Tutorly, then try again.';
    }
    if (msg.startsWith('429') || msg.includes('busy')) {
      return 'Rate limit reached. Please wait a moment and try again.';
    }
    if (msg.startsWith('5') || msg.includes('502') || msg.includes('503') || msg.includes('Bad Gateway')) {
      return 'The tutor is temporarily unavailable. Please try again in a moment.';
    }
    // Strip raw HTML/JSON noise — only return the first 200 chars
    if (msg.includes('<html') || msg.includes('{')) {
      return 'Unable to reach the AI service. Please check your internet connection and try again.';
    }
    return msg.length > 200 ? msg.slice(0, 200) + '…' : msg;
  }
  return 'An unexpected error occurred. Please try again.';
}

async function callWithRetry(fn: () => Promise<HomeworkResult>): Promise<HomeworkResult> {
  try {
    return await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    const isTransient = msg.startsWith('502') || msg.startsWith('503');
    if (isTransient) {
      await new Promise((r) => setTimeout(r, 2000));
      return fn();
    }
    throw err;
  }
}

export async function analyzeHomeworkImage(imageUri: string): Promise<HomeworkResult> {
  return callWithRetry(() => _analyze(imageUri));
}

/** Solves a problem the student typed instead of photographing. */
export async function solveTypedQuestion(question: string): Promise<HomeworkResult> {
  return callWithRetry(async () => {
    const { text } = await callTutor({ action: 'solve', question });
    return toResult(parseClaudeResponse(text), '');
  });
}

async function _analyze(imageUri: string): Promise<HomeworkResult> {
  const { base64, mediaType } = await imageUriToBase64(imageUri);
  const { text } = await callTutor({ action: 'solve', image: base64, mediaType });
  return toResult(parseClaudeResponse(text), imageUri);
}

function toResult(parsed: ClaudeResponse, imageUri: string): HomeworkResult {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    subject: parsed.subject,
    question: parsed.question,
    answer: parsed.answer,
    steps: parsed.steps,
    imageUri,
    timestamp: new Date().toISOString(),
    difficulty: parsed.difficulty,
  };
}

function describeSolution(result: HomeworkResult): string {
  const steps = result.steps
    .map((s) => `Step ${s.stepNumber}: ${s.title}\n${s.explanation}${s.formula ? `\nFormula: ${s.formula}` : ''}`)
    .join('\n\n');
  return `Subject: ${result.subject}\nQuestion: ${result.question}\n\n${steps}\n\nFinal answer: ${result.answer}`;
}

/**
 * Answers a follow-up question about a solved problem, optionally focused on one step.
 * `history` holds the earlier turns of this follow-up chat, oldest first.
 */
export async function askFollowUp(
  result: HomeworkResult,
  history: ChatTurn[],
  question: string,
  stepNumber?: number,
): Promise<string> {
  const focus = stepNumber ? `The student is asking about step ${stepNumber}.` : 'The student is asking about the solution in general.';
  const context = `Here is the solved problem.\n\n${describeSolution(result)}\n\n${focus}`;
  const { text } = await callTutor({ action: 'followup', context, history, question });
  return text.trim();
}

/** Generates 3 similar practice problems with short answers. */
export async function generatePractice(result: HomeworkResult): Promise<PracticeProblem[]> {
  const { text } = await callTutor({ action: 'practice', context: describeSolution(result) });
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No practice problems returned');
  const parsed = JSON.parse(match[0]) as { problems?: PracticeProblem[] };
  const problems = (parsed.problems ?? []).filter((p) => p.question && p.answer);
  if (problems.length === 0) throw new Error('No practice problems returned');
  return problems.slice(0, 3);
}

/** Makes a 5-question multiple-choice quiz from a typed topic or a photo of notes. */
type StudySource = { topic: string } | { imageUri: string };

async function studyRequest(action: 'quiz' | 'flashcards', source: StudySource): Promise<Record<string, unknown>> {
  const body: Record<string, unknown> = { action };
  if ('topic' in source) {
    body.topic = source.topic;
  } else {
    const { base64, mediaType } = await imageUriToBase64(source.imageUri);
    body.image = base64;
    body.mediaType = mediaType;
  }
  const { text } = await callTutor(body);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No ${action} returned`);
  return JSON.parse(match[0]);
}

export async function generateQuiz(source: StudySource): Promise<Quiz> {
  const parsed = (await studyRequest('quiz', source)) as { title?: string; questions?: QuizQuestion[] };
  const questions = (parsed.questions ?? []).filter(
    (q) =>
      q.question &&
      Array.isArray(q.choices) &&
      q.choices.length >= 2 &&
      Number.isInteger(q.answerIndex) &&
      q.answerIndex >= 0 &&
      q.answerIndex < q.choices.length,
  );
  if (questions.length === 0) throw new Error('No quiz returned');
  return { title: parsed.title || ('topic' in source ? source.topic : 'Quiz from your notes'), questions };
}

export async function generateFlashcards(source: StudySource): Promise<Deck> {
  const parsed = (await studyRequest('flashcards', source)) as { title?: string; cards?: Flashcard[] };
  const cards = (parsed.cards ?? [])
    .filter((c) => c && typeof c.front === 'string' && typeof c.back === 'string' && c.front.trim() && c.back.trim())
    .map((c) => ({ front: c.front.trim(), back: c.back.trim() }));
  if (cards.length === 0) throw new Error('No flashcards returned');
  return {
    id: `deck_${Date.now()}`,
    title: parsed.title || ('topic' in source ? source.topic : 'Cards from your notes'),
    cards,
    createdAt: new Date().toISOString(),
  };
}

export async function generateWriting(
  mode: WriteMode,
  input: { text?: string; imageUri?: string },
  options: WriteOptions,
): Promise<string> {
  const body: Record<string, unknown> = { action: 'write', mode, options };
  if (input.text?.trim()) body.text = input.text.trim();
  if (input.imageUri) {
    const { base64, mediaType } = await imageUriToBase64(input.imageUri);
    body.image = base64;
    body.mediaType = mediaType;
  }
  const { text } = await callTutor(body);
  const out = text.trim();
  if (!out) throw new Error('Nothing was written');
  return out;
}

export async function summarize(
  input: { text?: string; imageUri?: string },
  opts: { length: 'Brief' | 'Standard' | 'Detailed'; simple: boolean },
): Promise<Summary> {
  const body: Record<string, unknown> = { action: 'summarize', length: opts.length, simple: opts.simple };
  if (input.text?.trim()) body.text = input.text.trim();
  if (input.imageUri) {
    const { base64, mediaType } = await imageUriToBase64(input.imageUri);
    body.image = base64;
    body.mediaType = mediaType;
  }
  const { text } = await callTutor(body);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No summary returned');
  const parsed = JSON.parse(match[0]) as Partial<Summary>;
  const points = (parsed.points ?? []).filter((p): p is string => typeof p === 'string' && p.trim().length > 0);
  if (!parsed.tldr && points.length === 0) throw new Error('No summary returned');
  const terms = (parsed.terms ?? []).filter((t) => t && typeof t.term === 'string' && typeof t.meaning === 'string');
  const source = input.text?.trim() || 'From a photo';
  return {
    id: `s_${Date.now()}`,
    title: parsed.title || 'Summary',
    tldr: parsed.tldr ?? '',
    points,
    terms,
    source: source.length > 120 ? source.slice(0, 120) + '…' : source,
    createdAt: new Date().toISOString(),
  };
}

/** Plain-text version of a summary, for copying or for making study sets from it. */
export function summaryToText(s: Summary): string {
  const parts = [s.title, '', s.tldr, '', 'Key points:', ...s.points.map((p) => `• ${p}`)];
  if (s.terms.length) parts.push('', 'Key terms:', ...s.terms.map((t) => `${t.term}: ${t.meaning}`));
  return parts.join('\n');
}
