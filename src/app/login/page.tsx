"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userEmail", form.email);
        window.location.href = "/";
      } else {
        alert("Invalid Email or Password!");
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const styles: any = {
    container: { 
      display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', 
      background: 'linear-gradient(135deg, #fdf2f8 0%, #fae8ff 100%)', 
      position: 'relative', overflow: 'hidden', padding: '20px', fontFamily: '"Comic Sans MS", cursive, sans-serif'
    },
    shape: (size: string, top: string, left: string, delay: string, color: string, type: string) => ({
      position: 'absolute', width: size, height: size, 
      backgroundColor: color, opacity: 0.3,
      top, left, borderRadius: type === 'circle' ? '50%' : '20%',
      transform: type === 'triangle' ? 'rotate(45deg)' : 'none',
      animation: `float 10s infinite ease-in-out ${delay}`, zIndex: 0
    }),
    card: { 
      backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', 
      padding: '40px 50px', borderRadius: '60px', textAlign: 'center', 
      boxShadow: '0 25px 50px rgba(162, 28, 175, 0.15)', border: '8px solid white', 
      width: '100%', maxWidth: '500px', zIndex: 1, position: 'relative'
    },
    imageCircle: { 
      width: '180px', height: '180px', borderRadius: '50%', border: '6px solid #f5d0fe', 
      margin: '0 auto 20px', overflow: 'hidden', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', backgroundColor: 'white', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' 
    },
    imageElement: { width: '100%', height: '100%', objectFit: 'cover' },
    title: { fontSize: '38px', fontWeight: '900', color: '#701a75', marginBottom: '5px' },
    subtitle: { color: '#ec4899', fontWeight: 'bold', fontSize: '14px', marginBottom: '35px', textTransform: 'uppercase' },
    input: { 
      width: '80%', padding: '15px', borderRadius: '25px', border: '3px solid #f5d0fe', 
      textAlign: 'center', fontSize: '18px', marginBottom: '15px', color: '#701a75', 
      fontWeight: 'bold', outline: 'none', background: 'white'
    },
    button: { 
      width: '80%', padding: '10px', borderRadius: '25px', border: 'none', 
      backgroundColor: '#701a75', color: 'white', fontSize: '20px', fontWeight: '900', 
      cursor: 'pointer', boxShadow: '0 10px 20px rgba(112, 26, 117, 0.3)' 
    },
    googleBtn: { 
      width: '100%', padding: '15px', borderRadius: '25px', border: '3px solid #f5d0fe', 
      backgroundColor: 'white', color: '#4b5563', fontSize: '16px', fontWeight: 'bold', 
      cursor: 'pointer', marginTop: '15px', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', gap: '12px' 
    },
    link: { marginTop: '25px', color: '#ec4899', fontSize: '15px', cursor: 'pointer', fontWeight: '900' }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -50px) rotate(20deg); }
          66% { transform: translate(-20px, 20px) rotate(-10deg); }
        }
      `}</style>
      
      <div style={styles.shape('80px', '10%', '5%', '0s', '#f0abfc', 'circle')}></div>
      <div style={styles.shape('60px', '80%', '10%', '2s', '#e879f9', 'square')}></div>
      <div style={styles.shape('100px', '15%', '85%', '4s', '#c084fc', 'circle')}></div>
      <div style={styles.shape('70px', '75%', '80%', '1s', '#f472b6', 'triangle')}></div>
      <div style={styles.shape('40px', '40%', '90%', '5s', '#701a75', 'circle')}></div>

      <div style={styles.card}>
        <div style={styles.imageCircle}>
           <img src="/KoKo-avatar.png" alt="KoKo" style={styles.imageElement} />
        </div>
        <h1 style={styles.title}>Login KoKo</h1>
        <p style={styles.subtitle}>Welcome back, little buddy!</p>
        <form onSubmit={handleSubmit}>
          <input style={styles.input} name="email" type="email" placeholder="EMAIL ADDRESS" value={form.email} onChange={handleChange} required autoComplete="off" />
          <input style={styles.input} name="password" type="password" placeholder="PASSWORD" value={form.password} onChange={handleChange} required autoComplete="off" />
          <button style={styles.button} type="submit">LOGIN NOW 🚀</button>
        </form>
        <div style={{margin: '20px 0', color: '#701a75', fontSize: '14px', fontWeight: '900', opacity: 0.7}}>OR</div>
        <button style={styles.googleBtn} onClick={() => signIn("google", { callbackUrl: "/" })}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="22" alt=""/> 
          Continue with Google
        </button>
        <p style={styles.link} onClick={() => window.location.href = "/signup"}>New Friend? Create Account ✨</p>
      </div>
    </div>
  );
}