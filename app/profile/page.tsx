"use client";

import { supabase } from "../supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function CartTab({ user }: { user: any }) {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    const { data } = await supabase
      .from("cart")
      .select("id, game_id, games(*)")
      .eq("user_id", user.id);
    setCartItems(data || []);
    setLoading(false);
  };

  const removeFromCart = async (cartId: string) => {
    await supabase.from("cart").delete().eq("id", cartId);
    loadCart();
  };

  const handleDownload = async (gameId: string, fileUrl: string, title: string) => {
    await supabase.from("library").insert([{ user_id: user.id, game_id: gameId }]);
    window.open(fileUrl, '_blank');
    alert('📥 Файл открылся в новой вкладке.\n\nНажмите Ctrl+S чтобы сохранить его на компьютер.');
    loadCart();
  };

  if (loading) return <p style={{ color: '#aaa' }}>Загрузка корзины...</p>;

  if (cartItems.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#aaa' }}>
        <p style={{ fontSize: 18 }}>🛒 Корзина пуста</p>
        <Link href="/" style={{ color: '#4ecca3' }}>Перейти в магазин</Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
      {cartItems.map((item) => (
        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f3460', padding: 15, borderRadius: 8 }}>
          <div>
            <h4 style={{ marginBottom: 5 }}>{item.games.title}</h4>
            <p style={{ color: '#aaa', fontSize: 14 }}>{item.games.price === 0 ? 'Бесплатно' : item.games.price + ' ₽'}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {item.games.price === 0 ? (
              <button onClick={() => handleDownload(item.game_id, item.games.file_url, item.games.title)} style={{ backgroundColor: '#4ecca3', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Скачать</button>
            ) : (
              <button onClick={() => alert('Платёжная система в разработке')} style={{ backgroundColor: '#e94560', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Купить</button>
            )}
            <button onClick={() => removeFromCart(item.id)} style={{ backgroundColor: '#333', border: 'none', color: '#aaa', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PurchasedTab({ user }: { user: any }) {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPurchased();
  }, []);

  const loadPurchased = async () => {
    const { data } = await supabase
      .from("library")
      .select("game_id, games(*)")
      .eq("user_id", user.id);
    setGames(data || []);
    setLoading(false);
  };

  const handleDownload = (fileUrl: string, title: string) => {
    window.open(fileUrl, '_blank');
    alert('📥 Файл открылся в новой вкладке.\n\nНажмите Ctrl+S чтобы сохранить его на компьютер.');
  };

  if (loading) return <p style={{ color: '#aaa' }}>Загрузка...</p>;

  if (games.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#aaa' }}>
        <p style={{ fontSize: 18 }}>💰 У вас пока нет купленных игр</p>
        <Link href="/" style={{ color: '#4ecca3' }}>Перейти в магазин</Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15 }}>
      {games.map((item) => (
        <div key={item.game_id} style={{ backgroundColor: '#0f3460', borderRadius: 8, padding: 15 }}>
          <h4 style={{ marginBottom: 10 }}>{item.games.title}</h4>
          <button 
            onClick={() => handleDownload(item.games.file_url, item.games.title)}
            style={{ backgroundColor: '#4ecca3', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', width: '100%' }}>
            🎮 Скачать
          </button>
        </div>
      ))}
    </div>
  );
}

function DownloadedTab({ user }: { user: any }) {
  return <PurchasedTab user={user} />;
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"cart" | "purchased" | "downloaded">("cart");
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", data.user.id)
          .single();
        setBalance(profile?.balance || 0);
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", data.user.id)
          .eq("status", "active")
          .maybeSingle();
        setSubscription(sub);
      } else {
        router.push("/login");
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };
  const handleAddBalance = () => { router.push("/recharge"); };

  if (loading) return <div style={{ padding: 40, color: 'white', backgroundColor: '#1a1a2e', minHeight: '100vh' }}><h1>Загрузка...</h1></div>;
  if (!user) return <div style={{ padding: 40, color: 'white', backgroundColor: '#1a1a2e', minHeight: '100vh' }}><h1>Вы не авторизованы</h1><Link href="/login" style={{ color: '#4ecca3' }}>Войти</Link></div>;

  return (
    <div style={{ fontFamily: 'Arial', backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white' }}>
      <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <Link href="/" style={{ textDecoration: 'none' }}><h1 style={{ fontSize: 32, margin: 0, color: 'white' }}>🔨 PLAYFORGE</h1></Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <span style={{ color: '#4ecca3' }}>
            👤 {user.email}
            {subscription && (
              <span style={{ marginLeft: 10, color: subscription.plan === "pro" ? '#4ecca3' : '#f9a826' }}>
                {subscription.plan === "pro" ? ' 💎 PRO' : ' 👑 LEGENDA'}
              </span>
            )}
          </span>
          <button onClick={() => router.push('/upload')} style={{ backgroundColor: '#4ecca3', border: 'none', color: '#1a1a2e', width: 40, height: 40, borderRadius: '50%', fontSize: 24, fontWeight: 'bold', cursor: 'pointer' }}>+</button>
          <button onClick={handleLogout} style={{ backgroundColor: '#e94560', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Выйти</button>
        </div>
      </div>

      <div style={{ padding: 40 }}>
        <h2 style={{ fontSize: 32, marginBottom: 20 }}>👤 Профиль</h2>
        <div style={{ backgroundColor: '#16213e', borderRadius: 12, padding: 25, marginBottom: 25 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div><div style={{ color: '#aaa', fontSize: 14, marginBottom: 5 }}>EMAIL</div><div style={{ fontSize: 18 }}>{user.email}</div></div>
            <div><div style={{ color: '#aaa', fontSize: 14, marginBottom: 5 }}>ID ПОЛЬЗОВАТЕЛЯ</div><div style={{ fontSize: 14, color: '#ccc', wordBreak: 'break-all' }}>{user.id}</div></div>
            <div><div style={{ color: '#aaa', fontSize: 14, marginBottom: 5 }}>ДАТА РЕГИСТРАЦИИ</div><div style={{ fontSize: 18 }}>{new Date(user.created_at).toLocaleDateString('ru-RU')}</div></div>
          </div>
        </div>

        <div style={{ backgroundColor: '#16213e', borderRadius: 12, padding: '20px 25px', marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div style={{ color: '#aaa', fontSize: 14, marginBottom: 5 }}>💰 БАЛАНС</div><div style={{ fontSize: 36, fontWeight: 'bold', color: '#4ecca3' }}>{balance} ₽</div></div>
          <div style={{ display: 'flex', gap: 15 }}>
            <button onClick={() => router.push('/premium')} style={{ backgroundColor: '#f9a826', border: 'none', color: '#1a1a2e', padding: '12px 24px', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>💎 Premium</button>
            <button onClick={handleAddBalance} style={{ backgroundColor: '#4ecca3', border: 'none', color: '#1a1a2e', padding: '12px 24px', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>+ Пополнить</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 30, borderBottom: '1px solid #333', paddingBottom: 15 }}>
          <button onClick={() => setActiveTab("cart")} style={{ background: 'none', border: 'none', color: activeTab === "cart" ? '#4ecca3' : '#aaa', fontSize: 18, fontWeight: 'bold', cursor: 'pointer', borderBottom: activeTab === "cart" ? '2px solid #4ecca3' : 'none', paddingBottom: 10 }}>🛒 Корзина</button>
          <button onClick={() => setActiveTab("purchased")} style={{ background: 'none', border: 'none', color: activeTab === "purchased" ? '#4ecca3' : '#aaa', fontSize: 18, fontWeight: 'bold', cursor: 'pointer', borderBottom: activeTab === "purchased" ? '2px solid #4ecca3' : 'none', paddingBottom: 10 }}>💰 Купленные</button>
          <button onClick={() => setActiveTab("downloaded")} style={{ background: 'none', border: 'none', color: activeTab === "downloaded" ? '#4ecca3' : '#aaa', fontSize: 18, fontWeight: 'bold', cursor: 'pointer', borderBottom: activeTab === "downloaded" ? '2px solid #4ecca3' : 'none', paddingBottom: 10 }}>📥 Скачанные</button>
        </div>

        <div style={{ backgroundColor: '#16213e', borderRadius: 12, padding: 30, minHeight: 200 }}>
          {activeTab === "cart" && <CartTab user={user} />}
          {activeTab === "purchased" && <PurchasedTab user={user} />}
          {activeTab === "downloaded" && <DownloadedTab user={user} />}
        </div>
      </div>
    </div>
  );
}