"use client";

import { supabase } from "../supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UploadPage() {
  const [user, setUser] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);
      loadGames(data.user.id);
      setLoading(false);
    };
    getUser();
  }, []);

  const loadGames = async (userId: string) => {
    const { data } = await supabase
      .from("games")
      .select("*")
      .eq("author_id", userId)
      .order("created_at", { ascending: false });
    setGames(data || []);
  };

  if (loading) {
    return <div style={{ padding: 40, color: 'white', backgroundColor: '#1a1a2e', minHeight: '100vh' }}>Загрузка...</div>;
  }

  return (
    <div style={{ fontFamily: 'Arial', backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white' }}>
      
      {/* ШАПКА */}
      <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ fontSize: 32, margin: 0, color: 'white' }}>🔨 PLAYFORGE</h1>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <span style={{ color: '#4ecca3' }}>👤 {user?.email}</span>
          <button onClick={() => router.push('/profile')} style={{ backgroundColor: '#0f3460', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Профиль</button>
        </div>
      </div>

      {/* КОНТЕНТ */}
      <div style={{ padding: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
          <h2 style={{ fontSize: 32, margin: 0 }}>📤 Мои игры</h2>
          <button 
            onClick={() => router.push('/upload/new')}
            style={{ backgroundColor: '#4ecca3', border: 'none', color: '#1a1a2e', padding: '14px 28px', borderRadius: 8, fontSize: 18, fontWeight: 'bold', cursor: 'pointer' }}>
            + New Game
          </button>
        </div>

        {games.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, backgroundColor: '#16213e', borderRadius: 12 }}>
            <p style={{ fontSize: 18, color: '#aaa' }}>У вас пока нет загруженных игр</p>
            <button onClick={() => router.push('/upload/new')} style={{ marginTop: 20, backgroundColor: '#4ecca3', border: 'none', color: '#1a1a2e', padding: '12px 24px', borderRadius: 8, cursor: 'pointer' }}>Загрузить первую игру</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {games.map((game) => (
              <div key={game.id} style={{ backgroundColor: '#16213e', borderRadius: 12, padding: 20 }}>
                <h3>{game.title}</h3>
                <p style={{ color: '#aaa' }}>{game.genre}</p>
                <p style={{ color: game.status === 'published' ? '#4ecca3' : '#f9a826' }}>
                  {game.status === 'published' ? '✅ Опубликовано' : '⏳ На модерации'}
                </p>
                <p>{game.price} ₽</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}