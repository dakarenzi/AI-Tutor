import { GoogleGenAI, GenerateContentResponse, Part, Modality, Type } from "@google/genai";
import { TUTOR_IDENTITY_MESSAGE } from '../constants';
import { Message, Exercise } from '../types';

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!API_KEY || API_KEY === 'your-api-key-here' || API_KEY === 'PLACEHOLDER_API_KEY') {
  console.error("❌ GEMINI_API_KEY environment variable not set. App may not function correctly.");
  console.error("Please set GEMINI_API_KEY in .env.local file");
  console.error("Current API_KEY value:", API_KEY ? "SET (but invalid)" : "NOT SET");
} else {
  console.log("✅ API key loaded successfully");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const EXERCISE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    questionType: {
      type: Type.STRING,
      enum: ['MCQ', 'FILL_IN_THE_BLANK', 'SHORT_ANSWER'],
      description: 'The type of question.',
    },
    questionText: {
      type: Type.STRING,
      description: 'The question itself.',
    },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'A list of options for Multiple Choice Questions. Should be empty for other types.',
    },
    answer: {
      type: Type.STRING,
      description: 'The correct answer. For MCQs, this should be the exact text of the correct option.',
    },
  },
  required: ['questionType', 'questionText', 'answer'],
};

const fileToGenerativePart = (dataUrl: string): Part => {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URL');
  }
  const [_, mimeType, data] = match;
  return {
    inlineData: {
      mimeType,
      data,
    },
  };
};

export async function generateResponse(
  history: Message[],
  newMessage: string,
  image?: string | null,
  isDeepThoughtMode?: boolean,
  retries: number = 3
): Promise<GenerateContentResponse> {
  const modelName = isDeepThoughtMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
  
  const config: { systemInstruction: string; thinkingConfig?: { thinkingBudget: number } } = {
    systemInstruction: TUTOR_IDENTITY_MESSAGE,
  };
  
  if (isDeepThoughtMode) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  const userParts: Part[] = [{ text: newMessage }];
  if (image) {
    userParts.unshift(fileToGenerativePart(image));
  }
  
  const contents = [
    ...history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    })),
    { role: 'user', parts: userParts }
  ];

  let lastError: any;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: config,
      });

      return response;
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a 503/overload error
      const errorMessage = error?.message || JSON.stringify(error);
      const isOverloadError = errorMessage.includes('503') || 
                             errorMessage.includes('overloaded') || 
                             errorMessage.includes('UNAVAILABLE');
      
      if (isOverloadError && attempt < retries - 1) {
        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.warn(`Model overloaded, retrying in ${waitTime}ms... (attempt ${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // If it's not a retryable error or we've exhausted retries, throw
      throw error;
    }
  }
  
  throw lastError;
}

export async function transcribeAudio(audioDataUrl: string): Promise<string> {
    const audioPart = fileToGenerativePart(audioDataUrl);
    const textPart = { text: "Transcribe the following audio recording." };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [audioPart, textPart] },
    });

    return response.text;
}

export async function generateSpeech(text: string, voiceName: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio data received from TTS API.");
  }
  return base64Audio;
}

export async function generateExercise(history: Message[]): Promise<GenerateContentResponse> {
  const modelName = 'gemini-2.5-flash';
  
  const contents = [
    ...history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    })),
    { 
      role: 'user', 
      parts: [{ text: "Based on our recent conversation, please generate one exercise question to test my understanding. The question can be Multiple Choice (MCQ), Fill-in-the-Blank, or a Short Answer question. Please follow your 'Exercise Generation Rules' from your core identity and respond in the required JSON format." }] 
    }
  ];

  const response = await ai.models.generateContent({
    model: modelName,
    contents: contents,
    config: {
      systemInstruction: TUTOR_IDENTITY_MESSAGE,
      responseMimeType: "application/json",
      responseSchema: EXERCISE_RESPONSE_SCHEMA,
    },
  });

  return response;
}

export async function evaluateAnswer(question: Exercise, userAnswer: string): Promise<GenerateContentResponse> {
    const modelName = 'gemini-2.5-flash';

    const prompt = `As Kaelo, my AI Tutor, please evaluate my answer. Follow your 'Feedback Strategy' from your core identity.

    **The Question:**
    ${question.questionText}

    **My Answer:**
    ${userAnswer}

    **The Correct Answer:**
    ${question.answer}

    Please provide constructive feedback. Start by reinforcing my effort, then gently correct if needed, and provide a clear explanation to help me understand.`;

    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            systemInstruction: TUTOR_IDENTITY_MESSAGE
        },
    });

    return response;
}
