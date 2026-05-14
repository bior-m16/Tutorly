import Anthropic from '@anthropic-ai/sdk';
import * as FileSystem from 'expo-file-system';
import { HomeworkResult, Step, Subject, Difficulty } from '../types';

const getClient = () =>
  new Anthropic({
    apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
    dangerouslyAllowBrowser: true,
  });

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

async function imageUriToBase64(uri: string): Promise<{ base64: string; mediaType: string }> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const extension = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mediaTypeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };

  return {
    base64,
    mediaType: mediaTypeMap[extension] ?? 'image/jpeg',
  };
}

function parseClaudeResponse(text: string): ClaudeResponse {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as ClaudeResponse;

  if (!parsed.subject || !parsed.question || !parsed.answer || !parsed.steps) {
    throw new Error('Invalid response structure from Claude');
  }

  return parsed;
}

export async function analyzeHomeworkImage(imageUri: string): Promise<HomeworkResult> {
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
