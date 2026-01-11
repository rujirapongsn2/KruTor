import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, SummaryData } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Generates a summary tailored for Grade 4-6 students.
 */
export const generateSummary = async (content: string, fileName?: string): Promise<SummaryData> => {
  const prompt = `
    คุณเป็น "ครูใจดี" ผู้ช่วยสอนนักเรียนชั้นประถมศึกษาปีที่ 4-6 (อายุ 10-12 ปี)
    
    ภารกิจของคุณ:
    1. อ่านเนื้อหาที่แนบมานี้ (หรือถ้ามีแค่ชื่อไฟล์ ให้สร้างเนื้อหาบทเรียนที่เกี่ยวข้องกับชื่อไฟล์นั้น)
    2. สรุปเนื้อหาให้เข้าใจง่ายมากๆ ใช้ภาษาที่เป็นกันเอง เหมือนพี่สอนน้อง
    3. หากเนื้อหาน้อยเกินไป ให้เพิ่มเติมความรู้ที่จำเป็นสำหรับการสอบในระดับชั้นนี้เข้าไปให้ครบถ้วน
    4. จัดรูปแบบให้น่าอ่าน
    
    ข้อมูลนำเข้า: ${fileName ? `ชื่อไฟล์: ${fileName}` : ''}
    เนื้อหา: "${content.substring(0, 20000)}" 
    
    ตอบกลับเป็น JSON Structure ตาม Schema นี้เท่านั้น:
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalTopic: { type: Type.STRING, description: "หัวข้อหลักของเรื่องนี้" },
            summaryContent: { type: Type.STRING, description: "เนื้อหาสรุปที่เขียนแบบเล่าเรื่อง เข้าใจง่าย (ประมาณ 3-4 ย่อหน้า)" },
            keyPoints: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "สรุปประเด็นสำคัญเป็นข้อๆ 3-5 ข้อ (Bullet points) เพื่อให้จำง่าย"
            }
          },
          required: ["originalTopic", "summaryContent", "keyPoints"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as SummaryData;

  } catch (error) {
    console.error("Summary Generation Error:", error);
    throw new Error("ขออภัย ครู AI ไม่สามารถสรุปเนื้อหาได้ในขณะนี้ ลองใหม่อีกครั้งนะ");
  }
};

/**
 * Generates a 10-question quiz based on the summary.
 */
export const generateQuiz = async (summary: SummaryData): Promise<QuizQuestion[]> => {
  const prompt = `
    จากเนื้อหาเรื่อง "${summary.originalTopic}" และสรุปต่อไปนี้:
    "${summary.summaryContent}"

    ช่วยสร้าง "แบบทดสอบวัดความรู้" จำนวน 10 ข้อ สำหรับเด็ก ป.4-6
    - คำถามต้องชัดเจน ไม่กำกวม
    - มีตัวเลือก 4 ตัวเลือก (ก, ข, ค, ง)
    - เฉลยต้องถูกต้องแม่นยำ
    - มีคำอธิบายเฉลยสั้นๆ เพื่อให้เด็กเข้าใจว่าทำไมถึงตอบข้อนั้น
    
    ตอบกลับเป็น JSON Array ของ Objects
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.INTEGER, description: "Index ของคำตอบที่ถูก (0-3)" },
              explanation: { type: Type.STRING, description: "คำอธิบายเฉลยสั้นๆ ให้กำลังใจ" }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No quiz generated");
    return JSON.parse(text) as QuizQuestion[];

  } catch (error) {
    console.error("Quiz Generation Error:", error);
    // Return empty array or throw, handled by UI
    throw new Error("สร้างแบบทดสอบไม่สำเร็จ");
  }
};
