"use client";

import { supabase } from "../../supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewGamePage() {
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [developer, setDeveloper] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [releaseDate, setReleaseDate] = useState("");
  const [category, setCategory] = useState("all");
  const [images, setImages] = useState<File[]>([]);
  const [gameFile, setGameFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const router = useRouter();

  const PLATFORM_LAUNCH_DATE = new Date("2026-04-18");
  const MAX_FUTURE_DATE = new Date();
  MAX_FUTURE_DATE.setFullYear(MAX_FUTURE_DATE.getFullYear() + 2);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);

      const { data: whitelistData } = await supabase
        .from('whitelist')
        .select('email')
        .eq('email', data.user.email)
        .maybeSingle();

      setIsWhitelisted(!!whitelistData);
    };
    getUser();
  }, []);

  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;

  const validateDate = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    if (date < PLATFORM_LAUNCH_DATE) return false;
    if (date > MAX_FUTURE_DATE) return false;
    return true;
  };

  const isDateValid = validateDate(releaseDate);
  const dateError = !releaseDate ? "Укажите дату выхода" : !isDateValid ? `Дата должна быть между 18.04.2026 и ${MAX_FUTURE_DATE.toLocaleDateString('ru-RU')}` : "";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !developer || !genre || !description || !releaseDate) {
      alert("Заполните все поля!");
      return;
    }

    if (!isDateValid) {
      alert("Некорректная дата выхода!");
      return;
    }

    if (wordCount < 50) {
      alert(`Описание должно быть не менее 50 слов. Сейчас: ${wordCount}`);
      return;
    }

    if (images.length < 4) {
      alert("Загрузите минимум 4 фото игры!");
      return;
    }

    if (!gameFile) {
      alert("Загрузите файл игры (.rar или .zip)!");
      return;
    }

    if (parseInt(price) < 0) {
      alert("Цена не может быть отрицательной");
      return;
    }

    setUploading(true);

    const { data: game, error: gameError } = await supabase
      .from("games")
      .insert([{
        title,
        developer,
        genre,
        description,
        price: parseInt(price),
        author_id: user.id,
        release_date: releaseDate,
        category,
      }])
      .select()
      .single();

    if (gameError || !game) {
      alert("Ошибка создания игры: " + gameError?.message);
      setUploading(false);
      return;
    }

    const fileExt = gameFile.name.split(".").pop();
    const fileName = `${game.id}/${Date.now()}.${fileExt}`;

    const { error: fileError } = await supabase.storage
      .from("game-files")
      .upload(fileName, gameFile);

    if (fileError) {
      alert("Ошибка загрузки файла игры: " + fileError.message);
      setUploading(false);
      return;
    }

    const { data: fileUrl } = supabase.storage
      .from("game-files")
      .getPublicUrl(fileName);

    await supabase
      .from("games")
      .update({ file_url: fileUrl.publicUrl })
      .eq("id", game.id);

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const imgExt = file.name.split(".").pop();
      const imgName = `${game.id}/${Date.now()}-${i}.${imgExt}`;

      const { error: uploadError } = await supabase.storage
        .from("game-images")
        .upload(imgName, file);

      if (uploadError) continue;

      const { data: urlData } = supabase.storage
        .from("game-images")
        .getPublicUrl(imgName);

      await supabase.from("game_images").insert([{
        game_id: game.id,
        image_url: urlData.publicUrl,
        order: i,
      }]);
    }

    alert(`✅ Игра "${title}" отправлена на модерацию!`);
    router.push("/upload");
    setUploading(false);
  };

  return (
    <div style={{ fontFamily: 'Arial', backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white' }}>
      
      <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <Link href="/upload" style={{ textDecoration: 'none' }}>
          <h1 style={{ fontSize: 32, margin: 0, color: 'white' }}>← Новая игра</h1>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <span style={{ color: '#4ecca3' }}>👤 {user?.email}</span>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
        
        <div style={{ marginBottom: 25 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 16 }}>📝 Название</label>
          <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: 14, borderRadius: 8, border: 'none', fontSize: 16, backgroundColor: '#16213e', color: 'white' }} placeholder="Например: Dungeon Crawler" />
        </div>

        <div style={{ marginBottom: 25 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 16 }}>👨‍💻 Разработчик</label>
          <input value={developer} onChange={e => setDeveloper(e.target.value)} style={{ width: '100%', padding: 14, borderRadius: 8, border: 'none', fontSize: 16, backgroundColor: '#16213e', color: 'white' }} placeholder="Например: PlayForge Team" />
        </div>

        <div style={{ marginBottom: 25 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 16 }}>📂 Категория</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: 14, borderRadius: 8, border: 'none', fontSize: 16, backgroundColor: '#16213e', color: 'white' }}>
            <option value="all">🎮 Лента (все)</option>
            <option value="owners">👑 Владельцы</option>
            <option value="mobile">📱 Мобильные</option>
          </select>
        </div>

        <div style={{ marginBottom: 25 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 16 }}>🎮 Жанр</label>
          <input value={genre} onChange={e => setGenre(e.target.value)} style={{ width: '100%', padding: 14, borderRadius: 8, border: 'none', fontSize: 16, backgroundColor: '#16213e', color: 'white' }} placeholder="Например: Рогалик, Хоррор, Аркада" />
        </div>

        <div style={{ marginBottom: 25 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 16 }}>💰 Цена (₽)</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} style={{ width: '100%', padding: 14, borderRadius: 8, border: 'none', fontSize: 16, backgroundColor: '#16213e', color: 'white' }} placeholder="0 — бесплатно" />
        </div>

        <div style={{ marginBottom: 25 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 16 }}>📅 Дата выхода</label>
          <input type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} style={{ width: '100%', padding: 14, borderRadius: 8, border: releaseDate && !isDateValid ? '2px solid #e94560' : 'none', fontSize: 16, backgroundColor: '#16213e', color: 'white' }} />
          {releaseDate && !isDateValid && <p style={{ color: '#e94560', fontSize: 14, marginTop: 8 }}>❌ {dateError}</p>}
          <p style={{ color: '#aaa', fontSize: 13, marginTop: 5 }}>Допустимые даты: с 18.04.2026 по {MAX_FUTURE_DATE.toLocaleDateString('ru-RU')}</p>
        </div>

        <div style={{ marginBottom: 25 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 16 }}>📖 Описание <span style={{ color: wordCount < 50 ? '#e94560' : '#4ecca3', marginLeft: 10 }}>({wordCount} слов, минимум 50)</span></label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={8} style={{ width: '100%', padding: 14, borderRadius: 8, border: 'none', fontSize: 16, backgroundColor: '#16213e', color: 'white', resize: 'vertical' }} placeholder="Опишите игру подробно..." />
        </div>

        <div style={{ marginBottom: 25 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 16 }}>🎮 Файл игры (.rar или .zip) <span style={{ color: gameFile ? '#4ecca3' : '#e94560' }}>{gameFile ? "✅ Выбран" : "❌ Обязательно"}</span></label>
          <input type="file" accept=".rar,.zip" onChange={e => setGameFile(e.target.files?.[0] || null)} style={{ display: 'block', width: '100%', padding: 14, borderRadius: 8, border: 'none', fontSize: 16, backgroundColor: '#16213e', color: 'white' }} />
          <p style={{ color: '#aaa', fontSize: 13, marginTop: 5 }}>Поддерживаются .rar и .zip файлы. Внутри — билд на Unity / Unreal Engine</p>
        </div>

        <div style={{ marginBottom: 25 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 16 }}>🖼️ Фото игры <span style={{ color: images.length < 4 ? '#e94560' : '#4ecca3', marginLeft: 10 }}>({images.length} из 4 минимум)</span></label>
          <div style={{ border: '2px dashed #333', borderRadius: 12, padding: 30, textAlign: 'center', backgroundColor: '#16213e' }}>
            <input type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: 'none' }} id="file-input" />
            <label htmlFor="file-input" style={{ cursor: 'pointer', color: '#4ecca3', fontSize: 16 }}>📁 Нажмите или перетащите фото сюда</label>
            <p style={{ color: '#e94560', fontSize: 14, marginTop: 15 }}>⚠️ Фото не по теме — блокировка или удаление игры!</p>
          </div>
          {images.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 15 }}>
              {images.map((file, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8 }} />
                  <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: 5, right: 5, background: '#e94560', border: 'none', color: 'white', width: 24, height: 24, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 15, marginTop: 30 }}>
          <button onClick={() => router.push('/upload')} style={{ padding: '14px 28px', backgroundColor: 'transparent', border: '1px solid #666', color: '#aaa', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}>❌ Отмена</button>
          <button onClick={handleSubmit} disabled={uploading || !isDateValid} style={{ padding: '14px 28px', backgroundColor: (uploading || !isDateValid) ? '#555' : '#4ecca3', border: 'none', color: '#1a1a2e', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: (uploading || !isDateValid) ? 'not-allowed' : 'pointer', opacity: uploading ? 0.5 : 1 }}>{uploading ? "Загрузка..." : isWhitelisted ? "✅ Опубликовать (Бесплатно)" : "✅ Опубликовать (100 ₽)"}</button>
        </div>
      </div>
    </div>
  );
}