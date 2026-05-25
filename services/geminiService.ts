import { GoogleGenAI, Type } from "@google/genai";
import { Course } from "../types";

export const createCourseAssistant = async (course: Course, question: string, apiKey?: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
    
    const systemInstruction = `
      You are a helpful teaching assistant for the course "${course.title}" taught by ${course.instructor}.
      
      Course Description: ${course.description}
      Level: ${course.level}
      Category: ${course.category}
      
      Your goal is to help potential students understand if this course is right for them, 
      or help enrolled students with general questions about the syllabus.
      
      Keep answers concise, friendly, and encouraging.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: question,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Something went wrong while thinking about your question.";
  }
};

interface GeneratorOptions {
    audience?: string;
    level?: string;
    tone?: string;
    category?: string;
    apiKey?: string;
}

export const generateCourseStructure = async (topic: string, options?: GeneratorOptions): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: options?.apiKey || process.env.API_KEY });
    
    const audienceStr = options?.audience ? `Target Audience: ${options.audience}` : 'Target Audience: General Learners';
    const levelStr = options?.level ? `Difficulty: ${options.level}` : 'Difficulty: Beginner';
    const toneStr = options?.tone ? `Tone: ${options.tone}` : 'Tone: Professional';
    const categoryStr = options?.category ? `Category: ${options.category}` : '';

    const prompt = `
      Generate a comprehensive, high-quality course curriculum for the topic: "${topic}".
      
      Context:
      - ${audienceStr}
      - ${levelStr}
      - ${toneStr}
      - ${categoryStr}
      
      Requirements:
      1. Create a catchy Title and Subtitle.
      2. Write a compelling, marketable Description (approx 100 words).
      3. Define 3-5 clear Learning Objectives.
      4. List necessary Prerequisites.
      5. Structure the course into at least 3 Modules.
      6. Each Module should have 3-5 Lessons.
      7. Mix lesson types: 'video' (default), 'article', and 'quiz'.
      8. **CRITICAL**: For 'article' lessons, provide a detailed draft summary or key points in the 'content' field (Markdown format).
      9. **CRITICAL**: For 'quiz' lessons, provide exactly 2 multiple-choice questions in the 'content' field as a JSON string.
      10. Suggest a Price (USD) reflecting the value.
      11. Ensure the course Category matches "${options?.category || 'General'}".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            level: { type: Type.STRING },
            price: { type: Type.NUMBER },
            learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
            requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            modules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  lessons: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['video', 'article', 'quiz'] },
                        content: { type: Type.STRING, description: "Markdown text for articles, or JSON string for quizzes" },
                        duration: { type: Type.STRING, description: "Estimated duration like '5 min'" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response generated");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};