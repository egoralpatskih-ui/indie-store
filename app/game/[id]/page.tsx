"use client";

import { supabase } from "../../supabase";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function GamePage() {
  const [user, setUser] = useState<any>(null);
  const [game, setGame] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inCart, setInCart] = useState(false);
  const [inLibrary, setInLibrary] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const gameId = params.id as string;

  const isAuthor = user && game && user.id === game.author_id;

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        checkIfInCart(data.user.id);
        checkIfInLibrary(data.user.id);
      }
    };
    getUser();
    loadGame();
  }, []);

  const checkIfInCart = async (userId: string) => {
    const { data } = await supabase
      .from("cart")
      .select("id")
      .eq("user_id", userId)
      .eq("game_id", gameId)
      .maybeSingle();
    setInCart(!!data);
  };

  const checkIfInLibrary = async (userId: string) => {
    const { data } = await supabase
      .from("library")
      .select("id")
      .eq("user_id", userId)
      .eq("game_id", gameId)
      .maybeSingle();
    setInLibrary(!!data);
  };

  const loadGame = async () => {
    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (gameError || !gameData) {
      setLoading(false);
      return;
    }

    setGame(gameData);

    const { data: imagesData } = await supabase
      .from("game_images")
      .select("*")
      .eq("game_id", gameId)
      .order("order", { ascending: true });

    setImages(imagesData || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  };

  const handleAddToCart = async () => {
    if (!user) {
      alert("🔐 Нужно войти, чтобы добавлять в корзину!");
      router.push("/login");
      return;
    }

    setCartLoading(true);
    const { error } = await supabase
      .from("cart")
      .insert([{ user_id: user.id, game_id: gameId }]);

    if (error) {
      if (error.code === "23505") {
        alert("🛒 Эта игра уже в корзине!");
      } else {
        alert("❌ Ошибка: " + error.message);
      }
    } else {
      setInCart(true);
      alert(`🛒 Игра "${game.title}" добавлена в корзину!`);
    }
    setCartLoading(false);
  };

  const handleDownload = async () => {
    if (!user) {
      alert("🔐 Нужно войти, чтобы скачать игру!");
      router.push("/login");
      return;
    }

    const { error: libError } = await supabase
      .from("library")
      .insert([{ user_id: user.id, game_id: gameId }]);

    if (libError && libError.code !== "23505") {
      console.error("Ошибка добавления в библиотеку:", libError);
    } else {
      setInLibrary(true);
    }

    window.open(game.file_url, '_blank');
    alert('📥 Файл открылся в новой вкладке.\n\nНажмите Ctrl+S чтобы сохранить его на компьютер.');
  };

  const handleBuy = async () => {
    if (!user) {
      alert("🔐 Нужно войти, чтобы купить игру!");
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", user.id)
      .single();

    const balance = profile?.balance || 0;

    if (balance < game.price) {
      if (confirm("❌ Недостаточно средств! Перейти к пополнению?")) {
        router.push("/recharge");
      }
      return;
    }

    const newBalance = balance - game.price;
    await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", user.id);

    const { error: libError } = await supabase
      .from("library")
      .insert([{ user_id: user.id, game_id: gameId }]);

    if (libError) {
      alert("❌ Ошибка при добавлении в библиотеку: " + libError.message);
      return;
    }

    await supabase.from("transactions").insert([{
      user_id: user.id,
      type: "purchase",
      amount: -game.price,
    }]);

    alert(`✅ Игра "${game.title}" куплена! Баланс: ${newBalance} ₽`);
    router.push("/profile");
  };

  const handleDelete = async () => {
    if (!isAuthor) return;

    const confirmed = confirm(`❗ Вы уверены, что хотите удалить "${game.title}"?\n\nИгра будет удалена НАВСЕГДА со всеми файлами и фото.`);
    if (!confirmed) return;

    setDeleting(true);

    try {
      for (const img of images) {
        try {
          const urlParts = img.image_url.split('/');
          const path = urlParts.slice(-2).join('/');
          await supabase.storage.from("game-images").remove([path]);
        } catch (e) {
          console.error("Ошибка удаления фото:", e);
        }
      }

      await supabase.from("game_images").delete().eq("game_id", gameId);

      if (game.file_url) {
        try {
          const urlParts = game.file_url.split('/');
          const path = urlParts.slice(-2).join('/');
          await supabase.storage.from("game-files").remove([path]);
        } catch (e) {
          console.error("Ошибка удаления файла игры:", e);
        }
      }

      await supabase.from("cart").delete().eq("game_id", gameId);
      await supabase.from("library").delete().eq("game_id", gameId);

      const { error } = await supabase.from("games").delete().eq("id", gameId);

      if (error) {
        console.error("Ошибка удаления игры:", error);
        alert("❌ Ошибка при удалении игры: " + error.message);
        setDeleting(false);
        return;
      }

      alert(`✅ Игра "${game.title}" полностью удалена.`);
      window.location.replace("/");
    } catch (e) {
      console.error("Критическая ошибка:", e);
      alert("❌ Произошла ошибка при удалении");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, color: 'white', backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
        <h1>Загрузка...</h1>
      </div>
    );
  }

  if (!game) {
    return (
      <div style={{ padding: 40, color: 'white', backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
        <h1>Игра не найдена</h1>
        <Link href="/" style={{ color: '#4ecca3' }}>← На главную</Link>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial', backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white' }}>
      
      <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ fontSize: 32, margin: 0, color: 'white' }}>🔨 PLAYFORGE</h1>
        </Link>
        <div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <span style={{ color: '#4ecca3' }}>👤 {user.email}</span>
              <button onClick={() => router.push('/upload')} style={{ backgroundColor: '#4ecca3', border: 'none', color: '#1a1a2e', width: 40, height: 40, borderRadius: '50%', fontSize: 24, fontWeight: 'bold', cursor: 'pointer' }}>+</button>
              <button onClick={() => router.push('/profile')} style={{ backgroundColor: '#0f3460', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Профиль</button>
              <button onClick={handleLogout} style={{ backgroundColor: '#e94560', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Выйти</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => router.push('/login')} style={{ backgroundColor: 'transparent', border: '1px solid #4ecca3', color: '#4ecca3', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Войти</button>
              <button onClick={() => router.push('/register')} style={{ backgroundColor: '#4ecca3', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Регистрация</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ width: '100%', height: 300, backgroundColor: '#0f3460', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>
        {images.length > 0 ? (
          <img src={images[0].image_url} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span>🎮</span>
        )}
      </div>

      <div style={{ padding: 40, display: 'grid', gridTemplateColumns: '1fr 350px', gap: 40 }}>
        
        <div>
          <h1 style={{ fontSize: 42, marginBottom: 10 }}>{game.title}</h1>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{ backgroundColor: '#333', padding: '6px 12px', borderRadius: 20, fontSize: 14, color: '#ccc' }}>{game.genre}</span>
            <span style={{ backgroundColor: '#333', padding: '6px 12px', borderRadius: 20, fontSize: 14, color: '#ccc' }}>Дата выхода: {game.release_date || 'не указана'}</span>
          </div>
          
          <p style={{ fontSize: 16, lineHeight: 1.8, color: '#ccc', marginBottom: 30 }}>{game.description}</p>

          {images.length > 1 && (
            <div style={{ marginTop: 30 }}>
              <h3 style={{ marginBottom: 15 }}>📸 Скриншоты</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {images.slice(1).map((img, i) => (
                  <img key={i} src={img.image_url} alt={`Скриншот ${i + 1}`} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ backgroundColor: '#16213e', borderRadius: 12, padding: 25, height: 'fit-content' }}>
          <div style={{ marginBottom: 25 }}>
            <div style={{ color: '#aaa', fontSize: 14, marginBottom: 5 }}>РАЗРАБОТЧИК</div>
            <div style={{ fontSize: 18 }}>{game.developer || 'PlayForge'}</div>
          </div>
          <div style={{ marginBottom: 25 }}>
            <div style={{ color: '#aaa', fontSize: 14, marginBottom: 5 }}>ДАТА ВЫХОДА</div>
            <div style={{ fontSize: 18 }}>{game.release_date || 'Не указана'}</div>
          </div>
          <div style={{ marginBottom: 30 }}>
            <div style={{ color: '#aaa', fontSize: 14, marginBottom: 5 }}>ЦЕНА</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: game.price === 0 ? '#4ecca3' : '#f9a826' }}>
              {game.price === 0 ? 'Бесплатно' : game.price + ' ₽'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
            {game.price === 0 ? (
              <button onClick={handleDownload} style={{ flex: 1, padding: '16px', backgroundColor: inLibrary ? '#2a5a4a' : '#4ecca3', border: 'none', color: 'white', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>
                {inLibrary ? '📥 В БИБЛИОТЕКЕ' : '🎮 СКАЧАТЬ'}
              </button>
            ) : (
              <button onClick={handleBuy} style={{ flex: 1, padding: '16px', backgroundColor: '#e94560', border: 'none', color: 'white', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>
                💰 КУПИТЬ
              </button>
            )}
            
            <button 
              onClick={handleAddToCart} 
              disabled={cartLoading || inCart}
              style={{ 
                padding: '16px', 
                backgroundColor: inCart ? '#333' : '#0f3460', 
                border: 'none', 
                color: inCart ? '#aaa' : 'white', 
                borderRadius: 8, 
                fontSize: 16, 
                fontWeight: 'bold', 
                cursor: inCart ? 'not-allowed' : 'pointer',
                minWidth: 60
              }}>
              {inCart ? '✅' : '🛒'}
            </button>
          </div>

          {user && game && user.id !== game.author_id && (
            <button 
              onClick={() => router.push(`/chat/${game.author_id}`)}
              style={{ 
                width: '100%', 
                padding: '14px', 
                backgroundColor: '#0f3460', 
                border: 'none', 
                color: 'white', 
                borderRadius: 8, 
                fontSize: 14, 
                fontWeight: 'bold', 
                cursor: 'pointer',
                marginTop: 10
              }}>
              💬 Чат с разработчиком
            </button>
          )}

          {isAuthor && (
            <button 
              onClick={handleDelete}
              disabled={deleting}
              style={{ 
                width: '100%', 
                padding: '14px', 
                backgroundColor: '#e94560', 
                border: 'none', 
                color: 'white', 
                borderRadius: 8, 
                fontSize: 14, 
                fontWeight: 'bold', 
                cursor: 'pointer',
                marginTop: 10,
                opacity: deleting ? 0.5 : 1
              }}>
              {deleting ? "Удаление..." : "❌ Удалить игру"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}