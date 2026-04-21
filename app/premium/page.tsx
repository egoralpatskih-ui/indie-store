"use client";

import { supabase } from "../supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PremiumPage() {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
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
      await loadSubscription(data.user.id);
      setLoading(false);
    };
    getUser();
  }, []);

  const loadSubscription = async (userId: string) => {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    setSubscription(data);
  };

  const handleSubscribe = async (plan: "pro" | "legenda") => {
    if (!user) {
      router.push("/login");
      return;
    }

    const price = plan === "pro" ? 299 : 699;

    const { data: profile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", user.id)
      .single();

    const balance = profile?.balance || 0;

    if (balance < price) {
      if (confirm("❌ Недостаточно средств! Перейти к пополнению?")) {
        router.push("/recharge");
      }
      return;
    }

    const newBalance = balance - price;
    await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", user.id);

    await supabase
      .from("subscriptions")
      .update({ status: "inactive" })
      .eq("user_id", user.id)
      .eq("status", "active");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error } = await supabase
      .from("subscriptions")
      .insert([{
        user_id: user.id,
        plan,
        status: "active",
        starts_at: new Date(),
        expires_at: expiresAt,
      }]);

    if (error) {
      alert("❌ Ошибка: " + error.message);
      return;
    }

    await supabase.from("transactions").insert([{
      user_id: user.id,
      type: "premium",
      amount: -price,
    }]);

    alert(`✅ Premium ${plan.toUpperCase()} активирован! Баланс: ${newBalance} ₽`);
    window.location.reload();
  };

  if (loading) {
    return <div style={{ padding: 40, color: 'white', backgroundColor: '#1a1a2e', minHeight: '100vh' }}>Загрузка...</div>;
  }

  return (
    <div style={{ fontFamily: 'Arial', backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white' }}>
      
      <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ fontSize: 32, margin: 0, color: 'white' }}>🔨 PLAYFORGE</h1>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <span style={{ color: '#4ecca3' }}>👤 {user?.email}</span>
          <button onClick={() => router.push('/profile')} style={{ backgroundColor: '#0f3460', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Профиль</button>
        </div>
      </div>

      <div style={{ padding: 40 }}>
        <h2 style={{ fontSize: 36, marginBottom: 10 }}>💎 PlayForge Premium</h2>
        <p style={{ color: '#aaa', fontSize: 18, marginBottom: 40 }}>Выбери подписку и получи максимум возможностей</p>

        {subscription && (
          <div style={{ backgroundColor: '#4ecca3', borderRadius: 12, padding: 20, marginBottom: 40, color: '#1a1a2e' }}>
            <p style={{ fontSize: 18, margin: 0 }}>✅ У вас активна подписка <strong>{subscription.plan.toUpperCase()}</strong></p>
            <p style={{ margin: '5px 0 0' }}>Действует до: {new Date(subscription.expires_at).toLocaleDateString('ru-RU')}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 30 }}>
          
          <div style={{ backgroundColor: '#16213e', borderRadius: 16, padding: 30, border: '1px solid #333' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 5 }}>💎 PRO</div>
            <div style={{ fontSize: 36, fontWeight: 'bold', color: '#4ecca3', marginBottom: 20 }}>299 ₽ <span style={{ fontSize: 16, color: '#aaa' }}>/ мес</span></div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 30 }}>
              <li style={{ padding: '8px 0' }}>✅ 0% комиссии на загрузку игр</li>
              <li style={{ padding: '8px 0' }}>✅ 100% дохода с продаж</li>
              <li style={{ padding: '8px 0' }}>✅ Значок PRO в профиле</li>
            </ul>
            <button 
              onClick={() => handleSubscribe("pro")}
              disabled={subscription?.plan === "pro"}
              style={{ 
                width: '100%', 
                padding: 16, 
                backgroundColor: subscription?.plan === "pro" ? '#333' : '#4ecca3', 
                border: 'none', 
                color: subscription?.plan === "pro" ? '#aaa' : '#1a1a2e', 
                borderRadius: 8, 
                fontSize: 18, 
                fontWeight: 'bold', 
                cursor: subscription?.plan === "pro" ? 'not-allowed' : 'pointer' 
              }}>
              {subscription?.plan === "pro" ? "✅ Активна" : "Оформить PRO"}
            </button>
          </div>

          <div style={{ backgroundColor: '#16213e', borderRadius: 16, padding: 30, border: '2px solid #f9a826' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 5 }}>👑 LEGENDA</div>
            <div style={{ fontSize: 36, fontWeight: 'bold', color: '#f9a826', marginBottom: 20 }}>699 ₽ <span style={{ fontSize: 16, color: '#aaa' }}>/ мес</span></div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 30 }}>
              <li style={{ padding: '8px 0' }}>✅ 1% комиссии на загрузку игр</li>
              <li style={{ padding: '8px 0' }}>✅ 15% скидка на ВСЕ игры</li>
              <li style={{ padding: '8px 0' }}>✅ 99% дохода с продаж</li>
              <li style={{ padding: '8px 0' }}>✅ Значок LEGENDA в профиле</li>
            </ul>
            <button 
              onClick={() => handleSubscribe("legenda")}
              disabled={subscription?.plan === "legenda"}
              style={{ 
                width: '100%', 
                padding: 16, 
                backgroundColor: subscription?.plan === "legenda" ? '#333' : '#f9a826', 
                border: 'none', 
                color: subscription?.plan === "legenda" ? '#aaa' : '#1a1a2e', 
                borderRadius: 8, 
                fontSize: 18, 
                fontWeight: 'bold', 
                cursor: subscription?.plan === "legenda" ? 'not-allowed' : 'pointer' 
              }}>
              {subscription?.plan === "legenda" ? "✅ Активна" : "Оформить LEGENDA"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}