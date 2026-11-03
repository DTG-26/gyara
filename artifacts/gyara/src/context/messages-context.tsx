import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useCustomer } from "@/context/customer-context";
import { useArtisans } from "@/context/artisans-context";

export interface ChatMessage {
  id: number;
  artisanId: number;
  customerId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface Conversation {
  artisanId: number;
  customerId: string;
  artisanName: string;
  artisanPhotoUrl?: string;
  counterpartName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isOwnerView: boolean;
}

interface DbMessage {
  id: number;
  artisan_id: number;
  customer_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

function mapMessage(m: DbMessage): ChatMessage {
  return {
    id: m.id,
    artisanId: m.artisan_id,
    customerId: m.customer_id,
    senderId: m.sender_id,
    body: m.body,
    readAt: m.read_at,
    createdAt: m.created_at,
  };
}

interface MessagesContextValue {
  conversations: Conversation[];
  loading: boolean;
  unreadTotal: number;
  refresh: () => Promise<void>;
  fetchThread: (artisanId: number, customerId: string) => Promise<ChatMessage[]>;
  sendMessage: (artisanId: number, customerId: string, body: string) => Promise<string | null>;
  markThreadRead: (artisanId: number, customerId: string) => Promise<void>;
}

const MessagesContext = createContext<MessagesContextValue>({
  conversations: [],
  loading: true,
  unreadTotal: 0,
  refresh: async () => {},
  fetchThread: async () => [],
  sendMessage: async () => "Not signed in.",
  markThreadRead: async () => {},
});

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { customer } = useCustomer();
  const { artisans } = useArtisans();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!customer) {
      setConversations([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const ownedArtisanIds = artisans
      .filter((a) => a.ownerCustomerId === customer.id)
      .map((a) => a.id);

    const orFilter = ownedArtisanIds.length > 0
      ? `customer_id.eq.${customer.id},artisan_id.in.(${ownedArtisanIds.join(",")})`
      : `customer_id.eq.${customer.id}`;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(orFilter)
      .order("created_at", { ascending: false });

    if (error || !data) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const rows = (data as DbMessage[]).map(mapMessage);
    const grouped = new Map<string, ChatMessage[]>();
    for (const m of rows) {
      const key = `${m.artisanId}:${m.customerId}`;
      const arr = grouped.get(key) ?? [];
      arr.push(m);
      grouped.set(key, arr);
    }

    const list: Conversation[] = [];
    for (const [key, msgs] of grouped) {
      const [artisanIdStr, customerId] = key.split(":");
      const artisanId = Number(artisanIdStr);
      const artisan = artisans.find((a) => a.id === artisanId);
      const isOwnerView = artisan?.ownerCustomerId === customer.id;
      const last = msgs[0];
      const unreadCount = msgs.filter((m) => !m.readAt && m.senderId !== customer.id).length;
      list.push({
        artisanId,
        customerId,
        artisanName: artisan?.name ?? "Artisan",
        artisanPhotoUrl: artisan?.photoUrl,
        counterpartName: isOwnerView ? "Customer" : (artisan?.name ?? "Artisan"),
        lastMessage: last.body,
        lastMessageAt: last.createdAt,
        unreadCount,
        isOwnerView,
      });
    }

    list.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    setConversations(list);
    setLoading(false);
  }, [customer, artisans]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const fetchThread = async (artisanId: number, customerId: string): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("artisan_id", artisanId)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return (data as DbMessage[]).map(mapMessage);
  };

  const sendMessage = async (artisanId: number, customerId: string, body: string): Promise<string | null> => {
    if (!customer) return "Not signed in.";
    const trimmed = body.trim();
    if (!trimmed) return "Message cannot be empty.";

    const { error } = await supabase.from("messages").insert({
      artisan_id: artisanId,
      customer_id: customerId,
      sender_id: customer.id,
      body: trimmed,
    });

    if (error) return error.message;
    await refresh();
    return null;
  };

  const markThreadRead = async (artisanId: number, customerId: string): Promise<void> => {
    if (!customer) return;
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("artisan_id", artisanId)
      .eq("customer_id", customerId)
      .is("read_at", null)
      .neq("sender_id", customer.id);
    await refresh();
  };

  const unreadTotal = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <MessagesContext.Provider
      value={{ conversations, loading, unreadTotal, refresh, fetchThread, sendMessage, markThreadRead }}
    >
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  return useContext(MessagesContext);
}
