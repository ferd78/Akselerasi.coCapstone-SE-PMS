import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OpenAI } from "openai";

type Msg = { role: "system" | "user" | "assistant"; content: string };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) {
      res.status(500).json({ error: "Missing HF_TOKEN env var" });
      return;
    }

    const { messages } = req.body as { messages: Msg[] };

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages[] is required" });
      return;
    }

    const MAX_CHARS = 4000;
    if (messages.some((m) => (m.content ?? "").length > MAX_CHARS)) {
      res.status(400).json({ error: "Message too long" });
      return;
    }

    const client = new OpenAI({
      baseURL: "https://router.huggingface.co/v1",
      apiKey: hfToken,
    });

    const completion = await client.chat.completions.create({
      model: "openai/gpt-oss-20b:groq",
      messages,
    });

    const reply = completion.choices?.[0]?.message?.content ?? "—";
    res.status(200).json({ reply });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e?.message || "AI request failed" });
  }
}
