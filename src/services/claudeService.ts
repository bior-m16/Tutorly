import Anthropic from '@anthropic-ai/sdk';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { HomeworkResult, Step, Subject, Difficulty } from '../types';

function getApiKey(): string {
  // Primary: value embedded at build time via app.config.js `extra`
  const fromExtra = (Constants.expoConfig?.extra as { anthropicApiKey?: string } | undefined)
    ?.anthropicApiKey;
  if (fromExtra) return fromExtra;

  // Fallback for local `expo start` with a .env file
  const fromEnv = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (fromEnv) return fromEnv;

  return '';
}

function getClient(): Anthropic {
  const key = getApiKey();
  if (!key) {
    throw new Error(
      'Anthropic API key is not configured.\n\n' +
      'For local dev: add EXPO_PUBLIC_ANTHROPIC_API_KEY to your .env file.\n' +
      'For EAS builds: run  eas secret:create --name ANTHROPIC_API_KEY'
    );
  }
  return new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
}

const SYSTEM_PROMPT = `You are Tutorly, an expert AI tutor that helps students understand their homework problems step by step.

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
      "formula": "<optional formula or equation used in this step>"
    }
  ]
}

Be thorough, educational, and encouraging. Show all work. If the image is unclear or not a homework problem, still return valid JSON with subject "Other" and explain what you see.`;

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
    const msg = err.message;
    // Anthropic SDK surfaces HTTP errors as messages starting with the status code
    if (msg.startsWith('401') || msg.includes('authentication_error') || msg.includes('invalid x-api-key')) {
      return 'Invalid API key. Check that ANTHROPIC_API_KEY is set correctly in your EAS secrets or .env file.';
    }
    if (msg.startsWith('429') || msg.includes('rate_limit')) {
      return 'Rate limit reached. Please wait a moment and try again.';
    }
    if (msg.startsWith('5') || msg.includes('502') || msg.includes('503') || msg.includes('Bad Gateway')) {
      return 'Anthropic servers are temporarily unavailable. Please try again in a moment.';
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
    const isTransient = msg.includes('502') || msg.includes('503') || msg.includes('529') || msg.includes('Bad Gateway');
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

async function _analyze(imageUri: string): Promise<HomeworkResult> {
  const client = getClient();
  const { base64, mediaType } = await imageUriToBase64(imageUri);

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: base64,
            },
          },
          {
            type: 'text',
            text: 'Please analyze this homework problem and provide a detailed step-by-step solution.',
          },
        ],
      },
    ],
  });

  const textContent = response.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const parsed = parseClaudeResponse(textContent.text);

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
