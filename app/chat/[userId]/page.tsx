"use client";

import { supabase } from "../../supabase";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function ChatPage() {
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [developer, setDeveloper] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const developerId = params.userId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);
      loadOrCreateConversation(data.user.id);
      loadDeveloper();
    };
    getUser();
  }, []);

  const loadDeveloper = async () => {
    const { data } = await supabase
      .from("users")
      .select("email, id")
      .eq("id", developerId)
      .single();
    setDeveloper(data);
  };

  const loadOrCreateConversation = async (userId: string) => {
    // Проверяем, есть ли уже диалог
    let { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .or(`owner_id.eq.${userId},developer_id.eq.${userId}`)
      .or(`owner_id.eq.${developerId},developer_id.eq.${developerId}`)
      .maybeSingle();

    if (!conv) {
      // Создаём новый диалог
      const { data: newConv } = await supabase
        .from("conversations")
        .insert([{ owner_id: userId, developer_id: developerId }])
        .select("id")
        .single();
      conv = newConv;
    }

    if (conv) {
      setConversationId(conv.id);
      loadMessages(conv.id);
      subscribeToMessages(conv.id);
    }
    setLoading(false);
  };

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    scrollToBottom();
  };

  const subscribeToMessages = (convId: string) => {
    supabase
      .channel(`conversation:${convId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .subscribe();
  };

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;

    await supabase.from("messages").insert([{
      conversation_id: conversationId,
      sender_id: user.id,
      text: newMessage,
    }]);

    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return <div style={{ padding: 40, color: 'white', backgroundColor: '#1a1a2e', minHeight: '100vh' }}>Загрузка...</div>;
  }

  return (
    <div style={{ fontFamily: 'Arial', backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ fontSize: 32, margin: 0, color: 'white' }}>💬 Чат с {developer?.email || 'разработчиком'}</h1>
        </Link>
        <div>
          <span style={{ color: '#4ecca3' }}>👤 {user?.email}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 40px' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start', marginBottom: 15 }}>
            <div style={{ maxWidth: '70%', padding: 12, borderRadius: 12, backgroundColor: msg.sender_id === user.id ? '#4ecca3' : '#16213e', color: msg.sender_id === user.id ? '#1a1a2e' : 'white' }}>
              {msg.text}
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 5 }}>
                {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: 20, borderTop: '1px solid #333' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение..."
            style={{ flex: 1, padding: 14, borderRadius: 8, border: 'none', fontSize: 16, backgroundColor: '#16213e', color: 'white' }}
          />
          <button onClick={sendMessage} style={{ padding: '0 24px', backgroundColor: '#4ecca3', border: 'none', color: '#1a1a2e', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
}