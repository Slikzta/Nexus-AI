/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function generateChatResponse(
  modelName: string,
  systemInstruction: string,
  history: Message[]
) {
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please configure it in the settings.");
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: history.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role, // System instructions are handled separately in config
        parts: [{ text: msg.content }]
      })),
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
}

export async function* streamChatResponse(
  modelName: string,
  systemInstruction: string,
  history: Message[]
) {
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please configure it in the settings.");
  }

  try {
    const stream = await ai.models.generateContentStream({
      model: modelName,
      contents: history.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role,
        parts: [{ text: msg.content }]
      })),
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Error streaming response:", error);
    throw error;
  }
}
