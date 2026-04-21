"use client";

import { supabase } from "./supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "owners" | "mobile">("all");
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userVote, setUserVote] = useState<"like" | "dislike" | null>(null);
  const [voteLoading, setVoteLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (isMounted) {
        setUser(data.user);
        if (data.user) {
          const { data: adminData } = await supabase
            .from("admins")
            .select("email")
            .eq("email", data.user.email)
            .maybeSingle();
          setIsAdmin(!!adminData);
        }
      }
    };

    Promise.all([getUser(), loadVotes(), loadGames()]).finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const loadGames = async () => {
    const { data } = await supabase
      .from("games")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    setGames(data || []);
  };

  const loadVotes = async () => {
    const { count: likesCount } = await supabase.from('votes').select('*', { count: 'exact', head: true }).eq('vote_type', 'like');
    const { count: dislikesCount } = await supabase.from('votes').select('*', { count: 'exact', head: true }).eq('vote_type', 'dislike');
    setLikes(likesCount || 0);
    setDislikes(dislikesCount || 0);

    if (user) {
      const { data: myVote } = await supabase.from('votes').select('vote_type').eq('user_id', user.id).maybeSingle();
      if (myVote) setUserVote(myVote.vote_type);
    }
  };

  const handleVote = async (type: "like" | "dislike") => {
    if (!user) { alert("🔐 Нужно войти, чтобы голосовать!"); router.push("/login"); return; }
    if (userVote) { alert("⚠️ Вы уже голосовали!"); return; }
    setVoteLoading(true);
    const { error } = await supabase.from('votes').insert([{ user_id: user.id, vote_type: type }]);
    if (error) { alert("❌ Ошибка: " + error.message); }
    else { setUserVote(type); await loadVotes(); }
    setVoteLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserVote(null);
    setIsAdmin(false);
    router.push("/login");
  };

  const filteredGames = games.filter((game) => {
    if (activeTab === "all") return game.category === "all";
    if (activeTab === "owners") return game.category === "owners";
    if (activeTab === "mobile") return game.category === "mobile";
    return true;
  });

  if (loading) {
    return (
      <div style={{ padding: 40, color: 'white', backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
        <h1>Загрузка игр...</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, fontFamily: 'Arial', backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 48, margin: 0 }}>🔨 PLAYFORGE</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            {user ? (
              <>
                <span style={{ color: '#4ecca3' }}>👤 {user.email}</span>
                {isAdmin && (
                  <button onClick={() => router.push('/admin')} style={{ backgroundColor: '#f9a826', border: 'none', color: '#1a1a2e', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
                    👑 Админ
                  </button>
                )}
                <button onClick={() => router.push('/upload')} style={{ backgroundColor: '#4ecca3', border: 'none', color: '#1a1a2e', width: 40, height: 40, borderRadius: '50%', fontSize: 24, fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                <button onClick={() => router.push('/profile')} style={{ backgroundColor: '#0f3460', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Профиль</button>
                
                {/* 🔥 КНОПКА ПОДДЕРЖКИ */}
                <a href="https://t.me/PlayForgeHelpBot" target="_blank" style={{ textDecoration: 'none' }}>
                  <button style={{ backgroundColor: '#0f3460', border: '1px solid #4ecca3', color: '#4ecca3', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
                    💬 Поддержка
                  </button>
                </a>
                
                <button onClick={handleLogout} style={{ backgroundColor: '#e94560', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Выйти</button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => router.push('/login')} style={{ backgroundColor: 'transparent', border: '1px solid #4ecca3', color: '#4ecca3', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Войти</button>
                <button onClick={() => router.push('/register')} style={{ backgroundColor: '#4ecca3', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Регистрация</button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 40, borderBottom: '1px solid #333', paddingBottom: 15 }}>
          <button onClick={() => setActiveTab("all")} style={{ background: 'none', border: 'none', color: activeTab === "all" ? '#4ecca3' : '#aaa', fontSize: 20, fontWeight: 'bold', cursor: 'pointer', borderBottom: activeTab === "all" ? '2px solid #4ecca3' : 'none', paddingBottom: 10 }}>🎮 Лента</button>
          <button onClick={() => setActiveTab("owners")} style={{ background: 'none', border: 'none', color: activeTab === "owners" ? '#4ecca3' : '#aaa', fontSize: 20, fontWeight: 'bold', cursor: 'pointer', borderBottom: activeTab === "owners" ? '2px solid #4ecca3' : 'none', paddingBottom: 10 }}>👑 Владельцы</button>
          <button onClick={() => setActiveTab("mobile")} style={{ background: 'none', border: 'none', color: activeTab === "mobile" ? '#4ecca3' : '#aaa', fontSize: 20, fontWeight: 'bold', cursor: 'pointer', borderBottom: activeTab === "mobile" ? '2px solid #4ecca3' : 'none', paddingBottom: 10 }}>📱 Мобильные</button>
        </div>

        {filteredGames.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, backgroundColor: '#16213e', borderRadius: 12 }}>
            <p style={{ fontSize: 18, color: '#aaa' }}>Пока нет опубликованных игр</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 30 }}>
            {filteredGames.map((game) => (
              <Link href={`/game/${game.id}`} key={game.id} style={{ textDecoration: 'none', color: 'white' }}>
                <div style={{ backgroundColor: '#16213e', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
                  <div style={{ height: 160, backgroundColor: '#0f3460', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50 }}>
                    🎮
                  </div>
                  <div style={{ padding: 20 }}>
                    <h3>{game.title}</h3>
                    <p style={{ color: '#ccc' }}>{game.genre}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 }}>
                      <span style={{ fontWeight: 'bold', color: game.price === 0 ? '#4ecca3' : '#f9a826' }}>{game.price === 0 ? 'Бесплатно' : game.price + ' ₽'}</span>
                      <button style={{ backgroundColor: '#e94560', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>
                        {game.price === 0 ? 'Скачать' : 'Купить'}
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 60, paddingTop: 30, borderTop: '1px solid #333', textAlign: 'center' }}>
        <p style={{ color: '#aaa', fontSize: 18, marginBottom: 15 }}>Как вам PlayForge?</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40 }}>
          <button onClick={() => handleVote("like")} disabled={voteLoading || !!userVote} style={{ background: 'none', border: 'none', color: userVote === "like" ? '#4ecca3' : '#888', fontSize: 24, cursor: (voteLoading || userVote) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: userVote && userVote !== "like" ? 0.5 : 1 }}>👍 <span style={{ color: 'white', fontSize: 20 }}>{likes}</span></button>
          <button onClick={() => handleVote("dislike")} disabled={voteLoading || !!userVote} style={{ background: 'none', border: 'none', color: userVote === "dislike" ? '#e94560' : '#888', fontSize: 24, cursor: (voteLoading || userVote) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: userVote && userVote !== "dislike" ? 0.5 : 1 }}>👎 <span style={{ color: 'white', fontSize: 20 }}>{dislikes}</span></button>
        </div>
        {userVote && <p style={{ color: '#4ecca3', marginTop: 10 }}>✅ Ваш голос учтён!</p>}
        {!user && <p style={{ color: '#aaa', marginTop: 10 }}>🔐 Войдите, чтобы проголосовать</p>}
      </div>
    </div>
  );
}