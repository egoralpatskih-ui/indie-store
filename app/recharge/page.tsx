"use client";

import { supabase } from "../supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RechargePage() {
  const [user, setUser] = useState<any>(null);
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
      setLoading(false);
    };
    getUser();
  }, []);

  if (loading) {
    return <div style={{ padding: 40, color: 'white', backgroundColor: '#1a1a2e', minHeight: '100vh' }}>Загрузка...</div>;
  }

  return (
    <div style={{ fontFamily: 'Arial', backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white' }}>
      
      <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <Link href="/profile" style={{ textDecoration: 'none' }}>
          <h1 style={{ fontSize: 32, margin: 0, color: 'white' }}>← Назад</h1>
        </Link>
        <div>
          <span style={{ color: '#4ecca3' }}>👤 {user?.email}</span>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        
        <h2 style={{ fontSize: 32, marginBottom: 30 }}>💰 Пополнение баланса</h2>

        <p style={{ color: '#aaa', marginBottom: 20 }}>
          Введите любую сумму и нажмите «Задонатить». После оплаты баланс пополнится автоматически.
        </p>

        {/* 🔥 ВСТАВЬ СЮДА СВОЮ ССЫЛКУ ИЗ DONATIONALERTS */}
        <iframe 
          src="https://www.donationalerts.com/r/s1zOn1488" 
          width="100%" 
          height="500" 
          style={{ border: 'none', borderRadius: 12 }}
        />

        <p style={{ color: '#aaa', marginTop: 20, fontSize: 14 }}>
          После успешной оплаты вернитесь в профиль — баланс обновится автоматически.
        </p>

      </div>
    </div>
  );
}