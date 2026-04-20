import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client using the environment variable provided by AI Studio
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function parseAccidentScreenshot(file: File): Promise<string> {
  try {
    const isText = file.type === 'text/plain';
    const parts: any[] = [];
    
    const promptText = `請解析這份內容中的人員資訊。輸出要求：極簡、中性、客觀。結論先行。嚴禁使用「不是......而是......」這類轉折句式。
請務必嚴密分析內容，並 **完全依照** 以下格式輸出（請自行統計並替換數字，若該項無人請填0）：

總值星官回報今日人員現況：
應到X員，除受訓X員、休假X員、支援X員、公差X員、勤務（戰情、安官、衛哨、服務臺)X員、補眠暨補眠X員、值班X員，驗菜X員，合計X員，實到X員。

注意：
- 「合計」必須是（受訓+休假+支援+公差+勤務+補眠暨補眠+值班+驗菜）等各種不在位狀況人數的總和。
- **「應到」人數：請將自文本計算或讀取出來的原始應到人數「強制加上5人」，再填入最終的輸出中**（例如：原算法為63人，輸出則為應到68員）。
- **「實到」人數：必須以加上5人後的新「應到」數字扣除「合計」來計算。**這等於實到人數也會在原基礎上自動加上5人。`;

    parts.push({ text: promptText });

    if (isText) {
      const textData = await fileToText(file);
      parts.push({ text: `內容如下：\n${textData}` });
    } else {
      const base64Data = await fileToBase64(file);
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: parts,
        },
      ],
    });

    return response.text || "未取得解析結果。";
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("解析失敗，請確認檔案格式或稍後再試。");
  }
}

function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Get only the base64 part
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
