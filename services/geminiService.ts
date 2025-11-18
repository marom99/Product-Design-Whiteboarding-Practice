import { GoogleGenAI, Chat, Content, LiveServerMessage, Modality, Blob } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export function createChatSession(
  history?: Content[], 
  systemInstructionOverride?: string
): Chat {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    history,
    config: {
      systemInstruction: systemInstructionOverride || SYSTEM_INSTRUCTION,
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
    },
  });
  return chat;
}

export function connectToLiveSession(
  callbacks: {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => void;
    onerror: (e: ErrorEvent) => void;
    onclose: (e: CloseEvent) => void;
  },
  difficulty: string
// FIX: The `LiveSession` type is not exported from the '@google/genai' package.
// The return type has been changed to `Promise<any>` to resolve the type error.
): Promise<any> {
  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      outputAudioTranscription: {},
      inputAudioTranscription: {},
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: `${SYSTEM_INSTRUCTION} \n\nYour first task is to provide a ${difficulty} product design challenge.`,
    },
  });
  return sessionPromise;
}

export async function generateCheatSheet(task: string, modelType: 'flash' | 'pro'): Promise<string> {
    const prompt = `You are a world-class principal product designer at a top tech company. 
    Provide a comprehensive, expert-level solution for the following product design challenge. 
    Your response must be well-structured, detailed, and ready for a senior-level interview presentation. 
    Format your answer in markdown with the following sections:

## 1. Why? (Understand your goal)
Clearly define the problem and the core user need. What is the motivation behind solving this?

## 2. Who? (Define the audience)
Describe the primary and secondary user personas. Be specific about their goals, frustrations, and behaviors.

## 3. When & Where? (Understand customer's context and needs)
Detail the user journey and the specific contexts in which they would use this product.

## 4. What? (List ideas)
Brainstorm a list of 3-5 distinct and creative feature ideas to address the problem.

## 5. Prioritize, choose idea
Analyze the brainstormed ideas using an impact/effort framework. Clearly state the impact (High, Medium, Low) and effort (High, Medium, Low) for each. Select the most promising idea and justify your choice.

## 6. Solve
Flesh out the chosen idea. Describe the user flow and key screens or interactions of the solution. Be detailed.

## 7. How? (Measure success)
Define the key success metrics (KPIs) for your solution. Explain what you would track to determine if the solution is successful.

Here is the design challenge:
"${task}"
`;

    const model = modelType === 'pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    // Define a more specific type for the config object
    const config: { temperature: number; thinkingConfig?: { thinkingBudget: number } } = {
        temperature: 0.5,
    };

    if (modelType === 'pro') {
        config.thinkingConfig = { thinkingBudget: 32768 };
    }

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating cheat sheet:", error);
        throw new Error("Failed to generate the cheat sheet answer.");
    }
}