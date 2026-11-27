# Live tutor setup (ElevenLabs)

The live voice tutor runs on ElevenLabs Agents. ElevenLabs handles listening, the tutor's
replies and its voice. Our `tutor` backend only hands the app a short-lived token for each call,
so the ElevenLabs key never ships inside the app.

Until the two secrets below are set, the Live tutor screen says it is not switched on yet,
and the rest of the app works as normal.

## 1. Create the agent

1. Sign up at elevenlabs.io and open **Agents**. Create a new blank agent named "Tutorly live tutor".
2. **First message:** `Hi! I'm your Tutorly tutor. What are we working on today?`
3. **System prompt:** paste the prompt below.
4. **LLM:** pick Claude Haiku 4.5 for the fastest, cheapest replies, or Claude Sonnet for harder subjects.
5. **Voice:** pick any friendly voice from the library.
6. **Optional, if your dashboard shows it:** set the maximum conversation duration to 600 seconds. The app already ends calls at 10 minutes.
7. **Optional, if your dashboard shows it:** turn on **Enable authentication** (Security), so only our backend can start calls.
8. Copy the **agent ID**, which starts with `agent_`.

### System prompt

```
You are Tutorly, a warm, patient tutor talking with a student out loud. Your words are spoken by a
voice, so talk exactly as you would speak: no lists, symbols, Markdown, emoji or written equations
(say "x squared", not "x^2"). Keep each turn under 60 words.

Teach by guiding. Find out what the student is working on and what they already know, then explain
one idea at a time and usually end with a short question to check understanding or to move on.
Do not just give answers to homework: lead the student to work it out, and confirm when they get it.
If they are stuck after a few tries, show the next step.

Keep everything appropriate for school-age students. If asked about something unsafe or unrelated
to learning, gently steer back to studying.
```

## 2. Create an API key

In ElevenLabs, open **Developers > API keys** and create a key. Give it access to
**Conversational AI / Agents** only.

## 3. Add both as Supabase secrets

Supabase dashboard > project `qemztgyclxbnamlgbppg` > **Edge Functions > Secrets**, add:

| Name | Value |
| --- | --- |
| `ELEVENLABS_API_KEY` | the key from step 2 |
| `ELEVENLABS_AGENT_ID` | the agent ID from step 1 |

No redeploy is needed: the `tutor` function reads them on the next call.

## 4. Build

Voice calls use native WebRTC modules, so they work in development and store builds made with
`eas build`, not in Expo Go. The browser version works as is (Chrome, Safari, Edge).

## Costs and limits

- ElevenLabs bills about $0.08 per minute of call time on business plans, plus the LLM, which is
  billed separately. Check current pricing on your plan.
- For free users, each live call counts as one of their 5 daily uses. Plus members have no limit,
  but the app ends every call at 10 minutes.
