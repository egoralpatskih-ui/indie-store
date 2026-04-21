"use client";

import { supabase } from "../supabase";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError(error.message);
    } else {
      router.push("/");
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000'
      }
    });
    
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: 'Arial', backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ fontSize: 36, marginBottom: 20 }}>🔐 Вход в PlayForge</h1>
      
      <input 
        type="email" 
        placeholder="Email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: 'block', marginBottom: 15, padding: 12, width: 300, borderRadius: 8, border: 'none', fontSize: 16 }}
      />
      
      <input 
        type="password" 
        placeholder="Пароль" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: 'block', marginBottom: 20, padding: 12, width: 300, borderRadius: 8, border: 'none', fontSize: 16 }}
      />
      
      <button 
        onClick={handleLogin} 
        disabled={loading}
        style={{ padding: '12px 24px', backgroundColor: '#e94560', border: 'none', color: 'white', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 'bold', width: 300 }}>
        {loading ? "Загрузка..." : "Войти"}
      </button>

      <div style={{ marginTop: 20, marginBottom: 20, textAlign: 'center', width: 300, color: '#aaa' }}>
        — или —
      </div>

      <button 
        onClick={handleGoogleLogin}
        style={{ 
          padding: '12px 24px', 
          backgroundColor: 'white', 
          color: '#1a1a2e', 
          border: 'none', 
          borderRadius: 8, 
          cursor: 'pointer', 
          fontSize: 16, 
          fontWeight: 'bold',
          width: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10
        }}>
        🚀 Войти через Google
      </button>
      
      {error && <p style={{ color: '#ff6b6b', marginTop: 20 }}>{error}</p>}
      
      <p style={{ marginTop: 30 }}>
        Нет аккаунта? <a href="/register" style={{ color: '#4ecca3', textDecoration: 'none' }}>Зарегистрироваться</a>
      </p>
    </div>
  );
}