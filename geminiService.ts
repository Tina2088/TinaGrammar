
import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty, GrammarPoint, Question } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateQuestions = async (difficulty: string, category: string, count: number): Promise<Question[]> => {
  const categoryDesc = category === 'All' ? 'Mixed grammar (Non-finite, Relative clauses, etc.)' : category;
  const prompt = `Generate exactly ${count} English grammar fill-in-the-blank questions for Chinese middle school students.
  Difficulty Level: ${difficulty}
  Grammar Focus: ${categoryDesc}
  
  Requirements:
  1. Each question must be a single coherent sentence with exactly ONE blank.
  2. Use sentenceBefore (text before blank) and sentenceAfter (text after blank).
  3. Blank should be exactly where the grammatical challenge is.
  4. Options: exactly 4 choices, one correct.
  5. Distractors: highly plausible but incorrect grammatical structures.
  6. Explanation: Bilingual (English/Chinese) covering the specific rule, clear examples, and common traps.
  
  RETURN ONLY A JSON ARRAY OF OBJECTS matching the Question interface.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              sentenceBefore: { type: Type.STRING },
              sentenceAfter: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
              correctAnswer: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              category: { type: Type.STRING },
              explanation: {
                type: Type.OBJECT,
                properties: {
                  rule: { type: Type.STRING },
                  examples: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING } 
                  },
                  commonErrors: { type: Type.STRING }
                },
                required: ["rule", "examples", "commonErrors"]
              }
            },
            required: ["id", "sentenceBefore", "sentenceAfter", "options", "correctAnswer", "difficulty", "category", "explanation"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const parsed = JSON.parse(text);
    return parsed.map((q: any) => ({
      ...q,
      id: q.id || Math.random().toString(36).substr(2, 9),
      difficulty: q.difficulty || difficulty,
      category: q.category || category
    })) as Question[];
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
};

export const getDeepExplanation = async (sentence: string, selected: string, correct: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context: A student answered "${selected}" but the correct answer is "${correct}" for the sentence "${sentence}".
      Task: Explain clearly in Chinese why ${correct} is right and ${selected} is wrong. 
      Target: Chinese middle school students. 
      Tone: Professional and encouraging.
      Include the grammar rule and one short example.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    return response.text || "解析生成失败。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "抱歉，AI 老师暂时无法提供详细解析。";
  }
};
