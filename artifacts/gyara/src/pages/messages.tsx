import { useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, MessageSquare, Loader2 } from "lucide-react";
import { useCustomer } from "@/context/customer-context";
import { useMessages } from "@/context/messages-context";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

export default function MessagesPage() {
  const [, setLocation] = useLocation();
  const { customer, loading: customerLoading } = useCustomer();
  const { conversations, loading } = useMessages();

  useEffect(() => {
    if (!customerLoading && !customer) setLocation("/");
  }, [customerLoading, customer, setLocation]);

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
              data-testid="button-back-home"
            >
              <ArrowLeft size={16} />
              <span>Home</span>
            </button>
            <div className="w-px h-5 bg-border" />
            <span className="font-bold text-primary text-lg">Gyara</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="text-2xl font-extrabold text-foreground mb-6">Messages</h1>

        {loading ? (
          <div className="flex items-center gap-2 py-10 text-muted-foreground justify-center">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading conversations…</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-background border border-border rounded-2xl p-10 text-center" data-testid="messages-empty">
            <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={24} className="text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground mb-1">No conversations yet</p>
            <p className="text-sm text-muted-foreground">
              Message an artisan from their profile to start a conversation.
            </p>
          </div>
        ) : (
          <div className="bg-background border border-border rounded-2xl divide-y divide-border overflow-hidden">
            {conversations.map((c) => (
              <button
                key={`${c.artisanId}:${c.customerId}`}
                onClick={() => setLocation(`/messages/${c.artisanId}/${c.customerId}`)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
                data-testid={`conversation-${c.artisanId}-${c.customerId}`}
              >
                {c.artisanPhotoUrl ? (
                  <img
                    src={c.artisanPhotoUrl}
                    alt={c.artisanName}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0 border border-border"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                    {c.artisanName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-foreground truncate">
                      {c.artisanName}
                      {c.isOwnerView && <span className="text-muted-foreground font-normal"> · customer</span>}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{formatWhen(c.lastMessageAt)}</span>
                  </div>
                  <p className={`text-sm truncate ${c.unreadCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {c.lastMessage}
                  </p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="flex-shrink-0 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {c.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
