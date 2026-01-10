import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Button, Input } from "@heroui/react";
import { Send, Trash2 } from "lucide-react";

type ChatMsg = { role: "user" | "assistant"; content: string };
const AI_CHAT_ENDPOINT = "https://akselereasi-ai-pms.vercel.app/api/aiChat";

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hi! Ask me anything 👋" },
  ]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const endpoint = useMemo(() => AI_CHAT_ENDPOINT, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const clearChat = () => {
    setMessages([{ role: "assistant", content: "Chat cleared. What next?" }]);
    setPrompt("");
  };

  const send = async () => {
    const text = prompt.trim();
    if (!text || loading) return;
    const nextMessages: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setPrompt("");
    setLoading(true);
    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Request failed");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: String(data.reply ?? "—") },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ Error: ${e?.message || "Failed to reach AI endpoint"}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-2xl font-bold">AI Chat</div>
          <div className="text-sm text-gray-500">
            Type a prompt and send it to the AI.
          </div>
        </div>

        <Button onPress={clearChat} variant="flat">
          <Trash2 className="size-4" />
          <span className="ml-2">Clear</span>
        </Button>
      </div>

      <Card className="p-4 h-[62vh] overflow-y-auto border border-gray-200">
        <div className="flex flex-col gap-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl px-4 py-2 whitespace-pre-wrap ${
                m.role === "user"
                  ? "ml-auto bg-secondary text-white"
                  : "mr-auto bg-gray-100 text-neutral-900"
              }`}
            >
              {m.content}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </Card>

      <div className="flex gap-2 mt-4">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type a prompt…"
          isDisabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <Button onPress={send} isDisabled={loading}>
          <Send className="size-4" />
        </Button>
      </div>

      {loading && <div className="text-sm text-gray-500 mt-2">Thinking…</div>}
      <div className="text-xs text-gray-400 mt-2">
        Endpoint: {endpoint}
      </div>
    </div>
  );
}