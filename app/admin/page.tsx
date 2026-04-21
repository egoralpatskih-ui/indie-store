"use client";

import { supabase } from "../supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      setUser(userData.user);

      const { data: adminData } = await supabase
        .from("admins")
        .select("email")
        .eq("email", userData.user.email)
        .maybeSingle();

      if (!adminData) {
        router.push("/");
        return;
      }

      setIsAdmin(true);
      loadPendingGames();
    };
    checkAdmin();
  }, []);

  const loadPendingGames = async () => {
    const { data } = await supabase
      .from("games")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setGames(data || []);
    setLoading(false);
  };

  const handleCheck = (fileUrl: string, title: string) => {
    window.open(fileUrl, '_blank');
    alert(`📥 Файл игры "${title}" открылся в новой вкладке.\n\nНажмите Ctrl+S чтобы сохранить и проверить на вирусы.`);
  };

  const handleApprove = async (gameId: string) => {
    await supabase.from("games").update({ status: "published" }).eq("id", gameId);
    loadPendingGames();
  };

  const handleRejectAndBan = async (gameId: string, authorId: string) => {
    // Отклоняем игру
    await supabase.from("games").update({ status: "rejected" }).eq("id", gameId);
    
    // Баним пользователя (добавляем в таблицу banned_users)
    await supabase.from("banned_users").insert([{ user_id: authorId }]);
    
    alert("❌ Игра отклонена, пользователь забанен.");
    loadPendingGames();
  };

  if (loading) {
    return <div style={{ padding: 40, color: 'white', backgroundColor: '#1a1a2e', minHeight: '100vh' }}>Загрузка...</div>;
  }

  if (!isAdmin) {
    return <div style={{ padding: 40, color: 'white', backgroundColor: '#1a1a2e', minHeight: '100vh' }}>Доступ запрещён</div>;
  }

  return (
    <div style={{ fontFamily: 'Arial', backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white' }}>
      
      <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ fontSize: 32, margin: 0, color: 'white' }}>👑 Админ-панель</h1>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <span style={{ color: '#4ecca3' }}>👤 {user?.email}</span>
          <button onClick={() => router.push('/')} style={{ backgroundColor: '#0f3460', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>На главную</button>
        </div>
      </div>

      <div style={{ padding: 40 }}>
        <h2 style={{ fontSize: 28, marginBottom: 30 }}>⏳ Игры на модерации ({games.length})</h2>

        {games.length === 0 ? (
          <div style={{ backgroundColor: '#16213e', borderRadius: 12, padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 18, color: '#aaa' }}>Нет игр на модерации</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {games.map((game) => (
              <div key={game.id} style={{ backgroundColor: '#16213e', borderRadius: 12, padding: 25 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <div>
                    <h3 style={{ fontSize: 22, marginBottom: 5 }}>{game.title}</h3>
                    <p style={{ color: '#aaa', marginBottom: 5 }}>Разработчик: {game.developer || 'Не указан'}</p>
                    <p style={{ color: '#aaa', marginBottom: 5 }}>Жанр: {game.genre}</p>
                    <p style={{ color: '#aaa' }}>Цена: {game.price} ₽</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => handleCheck(game.file_url, game.title)}
                    style={{ backgroundColor: '#0f3460', border: 'none', color: 'white', padding: '12px 24px', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>
                    🔍 Проверить
                  </button>
                  <button 
                    onClick={() => handleApprove(game.id)}
                    style={{ backgroundColor: '#4ecca3', border: 'none', color: '#1a1a2e', padding: '12px 24px', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>
                    ✅ Опубликовать
                  </button>
                  <button 
                    onClick={() => handleRejectAndBan(game.id, game.author_id)}
                    style={{ backgroundColor: '#e94560', border: 'none', color: 'white', padding: '12px 24px', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>
                    ❌ Отклонить и забанить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}