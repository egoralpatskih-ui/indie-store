"use client";

import { supabase } from "../supabase";
import { useState } from "react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    
    const { error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Проверь почту и подтверди email! После этого войди.");
      setEmail("");
      setPassword("");
    }
    
    setLoading(false);
  };

  return (
    <div style={{ padding: 40, fontFamily: 'Arial', backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ fontSize: 36, marginBottom: 20 }}>📝 Регистрация</h1>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ display: 'block', marginBottom: 15, padding: 12, width: 300, borderRadius: 8, border: 'none' }} />
      <input type="password" placeholder="Пароль (мин. 6 символов)" value={password} onChange={(e) => setPassword(e.target.value)} style={{ display: 'block', marginBottom: 20, padding: 12, width: 300, borderRadius: 8, border: 'none' }} />
      <button onClick={handleRegister} disabled={loading} style={{ padding: '12px 24px', backgroundColor: '#e94560', border: 'none', color: 'white', borderRadius: 8, cursor: 'pointer' }}>
        {loading ? "Загрузка..." : "Зарегистрироваться"}
      </button>
      {error && <p style={{ color: '#ff6b6b', marginTop: 20 }}>{error}</p>}
      {success && <p style={{ color: '#4ecca3', marginTop: 20 }}>{success}</p>}
      <p style={{ marginTop: 30 }}>Уже есть аккаунт? <a href="/login" style={{ color: '#4ecca3' }}>Войти</a></p>
    </div>
  );
}