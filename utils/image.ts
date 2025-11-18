import { Part } from "@google/genai";

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function dataUrlToGeminiPart(dataUrl: string): Part {
  const match = /^data:(.+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error('Invalid data URL.');
  }

  const mimeType = match[1];
  const data = match[2];

  return { inlineData: { data, mimeType } };
}
