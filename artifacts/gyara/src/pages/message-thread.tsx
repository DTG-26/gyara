import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { useCustomer } from "@/context/customer-context";
import { useArtisans } from "@/context/artisans-context";
import { useMessages, type ChatMessage } from "@/context/messages-context";
import { sendMessageNotification } from "@/lib/notifications";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MessageThreadPage() {
  const { artisanId, customerId } = useParams<{ artisanId: string; customerId: string }>();
  const [, setLocation] = useLocation();
  const { customer, loading: customerLoading } = useCustomer();
  const { artisans } = useArtisans();
  const { fetchThread, sendMessage, markThreadRead } = useMessages();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const artisanIdNum = Number(artisanId);
  const artisan = artisans.find((a) => a.id === artisanIdNum);
  const isParticipant =
    !!customer &&
    (customer.id === customerId || artisan?.ownerCustomerId === customer.id);

  useEffect(() => {
    if (customerLoading) return;
    if (!customer || !isParticipant) {
      setLocation("/messages");
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchThread(artisanIdNum, customerId).then((data) => {
      if (cancelled) return;
      setMessages(data);
      setLoading(false);
      void markThreadRead(artisanIdNum, customerId);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerLoading, customer, artisanIdNum, customerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (customerLoading || !customer || !isParticipant) {
    return null;
  }

  const counterpartName = artisan?.ownerCustomerId === customer.id ? "your customer" : (artisan?.name ?? "Artisan");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!body.trim()) return;
    setSending(true);
    const sentBody = body.trim();
    const err = await sendMessage(artisanIdNum, customerId, sentBody);
    if (err) {
      setError(err);
    } else {
      setBody("");
      const updated = await fetchThread(artisanIdNum, customerId);
      setMessages(updated);
      void sendMessageNotification({
        artisanId: artisanIdNum,
        customerId,
        senderId: customer!.id,
      });
    }
    setSending(false);
  }

  return (
    <div className="min-h-screen bg-muted/30 text-foreground flex flex-col">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => setLocation("/messages")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
              data-testid="button-back-to-messages"
            >
              <ArrowLeft size={16} />
              <span>Messages</span>
            </button>
            <div className="w-px h-5 bg-border" />
            <span className="font-semibold text-foreground truncate">{counterpartName}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
        <div className="flex-1 space-y-3 mb-4">
          {loading ? (
            <div className="flex items-center gap-2 py-10 text-muted-foreground justify-center">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Loading conversation…</span>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              Say hello to start the conversation.
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.senderId === customer.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`} data-testid={`message-${m.id}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      mine
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-background border border-border text-foreground rounded-bl-sm"
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {formatTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={(e) => void handleSend(e)} className="flex gap-2 sticky bottom-4">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
            data-testid="input-message-body"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="bg-primary text-primary-foreground px-5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
            data-testid="button-send-message"
          >
            <Send size={16} />
          </button>
        </form>
        {error && <p className="text-xs text-destructive font-medium mt-2">⚠ {error}</p>}
      </div>
    </div>
  );
}
