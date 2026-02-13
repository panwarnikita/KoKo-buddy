"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function KoKoApp() {
  const { data: session, status: sessionStatus } = useSession();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("KoKo is ready! 🐧");
  const [bubble, setBubble] = useState("Hi! I'm KoKo. Let's play together! ✨");
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);

  const ttsRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesRef = useRef<{ role: string, content: string }[]>([]);
  const audioQueueRef = useRef<Promise<any>>(Promise.resolve());

  useEffect(() => {
    if (sessionStatus === "loading") return;
    const savedName = localStorage.getItem("userName");
    const savedEmail = localStorage.getItem("userEmail");
    let finalName = savedName;
    let finalEmail = savedEmail;

    if (session?.user) {
      finalName = session.user.name || "";
      finalEmail = session.user.email || "";
      localStorage.setItem("userName", finalName);
      localStorage.setItem("userEmail", finalEmail);
    }

    if (!finalName || !finalEmail) {
      window.location.href = "/login";
      return;
    }

    setUserName(finalName);
    setUserEmail(finalEmail);
    setIsStarted(true);

    const chatKey = `KoKo_chat_${finalEmail}`;
    const savedChat = localStorage.getItem(chatKey);
    if (savedChat) {
      const parsed = JSON.parse(savedChat);
      setMessages(parsed);
      messagesRef.current = parsed;
    }

    async function init() {
      try {
        const { TTSLogic, sharedAudioPlayer } = await import("speech-to-speech");
        

        const resumeAudio = async () => {
          const context = (sharedAudioPlayer as any).audioContext;
          if (context && context.state === 'suspended') {
            await context.resume();
          }
        };

        window.addEventListener('click', resumeAudio, { once: true });

        sharedAudioPlayer.configure({ autoPlay: true });
        const tts = new TTSLogic({ voiceId: "en_US-hfc_female-medium", warmUp: true });
        await tts.initialize();
        ttsRef.current = tts;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.onresult = (e: any) => {
            setIsListening(false);
            let transcript = e.results[0][0].transcript;
            const wordsToFix = ["google", "coco", "gogo", "kuku", "kokoro"]; 
            wordsToFix.forEach(word => {
              const regex = new RegExp(word, "gi");
              transcript = transcript.replace(regex, "KoKo");
            });
            handleKoKoLogic(transcript);
          };
          recognition.onend = () => setIsListening(false);
          recognitionRef.current = recognition;
        }
        setStatus("Ready! 🎤");

      } catch (err) { setStatus("Engine Error ❌"); }
    }
    init();
    
    return () => window.removeEventListener('click', () => {});
  }, [session, sessionStatus]);

  const handleKoKoLogic = async (text: string, forceHistory?: any[]) => {
    if (!text || text.trim().length < 2) return;
    setStatus("Thinking... ✨");
    const newHistory = forceHistory || [...messagesRef.current, { role: "user", content: text }];
    setMessages(newHistory);
    messagesRef.current = newHistory;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: newHistory.slice(-15) }) 
      });
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiFullText = "";
      let audioBuffer = ""; 
      if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.play(); }
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const json = JSON.parse(line.replace("data: ", ""));
              const content = json.choices[0].delta?.content || "";
              aiFullText += content;
              audioBuffer += content;
              setBubble(aiFullText);
              const words = audioBuffer.trim().split(/\s+/);
              if (/[.?!]/.test(content) || (content.includes(",") && words.length > 6) || words.length > 10) {
                const textToSpeak = audioBuffer.trim();
                if (textToSpeak.length > 0) {
                    audioBuffer = ""; 
                    audioQueueRef.current = audioQueueRef.current.then(() => speakText(textToSpeak));
                }
              }
            } catch (e) {}
          }
        }
      }
      if (audioBuffer.trim()) {
        const remainingText = audioBuffer.trim();
        audioQueueRef.current = audioQueueRef.current.then(() => speakText(remainingText));
      }
      const finalChat = [...messagesRef.current, { role: "assistant", content: aiFullText.trim() }];
      setMessages(finalChat);
      messagesRef.current = finalChat;
      localStorage.setItem(`KoKo_chat_${userEmail}`, JSON.stringify(finalChat));
      audioQueueRef.current.then(() => {
        setStatus("Ready! 🎤");
        setTimeout(() => { if (videoRef.current) videoRef.current.pause(); }, 1500);
      });
    } catch (err) { setStatus("Error! ❌"); }
  };

  const speakText = async (text: string): Promise<void> => {
    if (!text.trim()) return;
    const { sharedAudioPlayer } = await import("speech-to-speech");
    
    // Zaroori: Audio ko resume karna agar browser ne block kiya ho
    const context = (sharedAudioPlayer as any).audioContext;
    if (context && context.state === 'suspended') {
      await context.resume();
    }

    const result = await ttsRef.current.synthesize(text);
    sharedAudioPlayer.addAudioIntoQueue(result.audio, result.sampleRate);
    return new Promise((resolve) => { setTimeout(resolve, text.length * 70); });
  };

  const handleLogout = () => {
    localStorage.clear();
    setMessages([]);
    messagesRef.current = [];
    signOut({ callbackUrl: "/login" });
  };

  if (!isStarted) return null;

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes float { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(20px, -30px) rotate(10deg); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.7; } }
      `}</style>

      <div style={styles.shape('120px', '5%', '5%', '0s', '#f0abfc', 'circle')}></div>
      <div style={styles.shape('80px', '85%', '85%', '2s', '#c084fc', 'square')}></div>
      <div style={styles.shape('100px', '15%', '85%', '4s', '#fbcfe8', 'circle')}></div>
      <div style={styles.shape('60px', '80%', '10%', '1s', '#f472b6', 'triangle')}></div>

      <div style={styles.leftPanel}>
        <p style={styles.panelTitle}>EXPLORE 🚀</p>
        <div style={styles.glassCard}>📖 Tell me a Story</div>
        <div style={styles.glassCard}>🚀 Science Facts</div>
        <div style={styles.glassCard}>🧩 Solve a Puzzle</div>
        <div style={styles.glassCard}>🌍 Space Mysteries</div>
      </div>

      <div style={styles.rightPanel}>
        <p style={styles.panelTitle}>RECENT HISTORY 💬</p>
        {messages.length > 0 ? messages.slice(-6).reverse().map((msg, i) => (
          <div key={i} style={styles.historyCard}>
            <span style={{color: msg.role === 'user' ? '#ec4899' : '#701a75', fontWeight: 'bold'}}>
              {msg.role === 'user' ? 'Me: ' : 'KoKo: '}
            </span>
            {msg.content.substring(0, 25)}...
          </div>
        )) : <p style={{fontSize: '12px', color: '#999'}}>No history yet!</p>}
      </div>

      <div style={styles.header}>
        <h1 style={styles.title}>KoKo Buddy! ✨</h1>
        <div style={styles.userSection}>
          <span style={styles.welcomeText}>Welcome, <strong>{userName.toUpperCase()}</strong></span>
          <button onClick={handleLogout} style={styles.headerLogoutBtn}>LOGOUT</button>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.chatBubble}>
          <p style={styles.bubbleText}>{bubble}</p>
          <div style={styles.bubbleArrow}></div>
        </div>

        <div style={styles.videoWrapper}>
          <video ref={videoRef} src="/KoKo-listen.mp4" style={styles.videoElement} muted loop playsInline />
        </div>

        <div style={styles.statusContainer}>
          <div style={{...styles.pulse, backgroundColor: isListening ? '#ef4444' : '#10b981'}}></div>
          <p style={{...styles.statusText, color: isListening ? '#ef4444' : '#701a75'}}>{status}</p>
        </div>

        <button 
          style={{...styles.micBtn, transform: isListening ? 'scale(1.1)' : 'scale(1)', backgroundColor: isListening ? '#ef4444' : '#701a75'}} 
          onClick={async () => {
            // Audio context ko manual resume karna zaroori hai click par
            const { sharedAudioPlayer } = await import("speech-to-speech");
            const context = (sharedAudioPlayer as any).audioContext;
            if (context && context.state === 'suspended') await context.resume();

            if (isListening) recognitionRef.current?.stop();
            else { recognitionRef.current?.start(); setIsListening(true); setStatus("Listening... 🎧"); }
          }}>
          {isListening ? '🎧' : '🎤'}
        </button>
      </div>
    </div>
  );
}

const styles: any = {
  container: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #fdf2f8 0%, #fae8ff 100%)', padding: '30px 20px', overflow: 'hidden', fontFamily: '"Comic Sans MS", cursive, sans-serif' },
  shape: (size: string, top: string, left: string, delay: string, color: string, type: string) => ({ position: 'absolute', width: size, height: size, backgroundColor: color, opacity: 0.2, top, left, borderRadius: type === 'circle' ? '50%' : '20%', transform: type === 'triangle' ? 'rotate(45deg)' : 'none', animation: `float 10s infinite ease-in-out ${delay}`, zIndex: 0 }),
  leftPanel: { position: 'absolute', left: '30px', top: '150px', width: '210px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 1 },
  panelTitle: { color: '#701a75', fontSize: '20px', fontWeight: '950', letterSpacing: '1px', marginBottom: '5px', opacity: 0.8 },
  glassCard: { padding: '18px', background: 'rgba(255,255,255,0.7)', borderRadius: '22px', border: '2px solid white', color: '#831843', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 8px 20px rgba(112, 26, 117, 0.05)', backdropFilter: 'blur(10px)' },
  rightPanel: { position: 'absolute', right: '60px', top: '150px', width: '280px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 1 },
  historyCard: { padding: '16px', background: 'rgba(255,255,255,0.5)', borderRadius: '22px', color: '#4b5563', fontSize: '14px', border: '1px solid white', backdropFilter: 'blur(5px)', marginBottom: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', transition: '0.3s' },
  header: { width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', backgroundColor: 'rgba(255,255,255,0.7)', padding: '15px 25px', borderRadius: '25px', border: '2px solid white', backdropFilter: 'blur(10px)', zIndex: 1 },
  title: { fontSize: '24px', color: '#ec4899', margin: '0', fontWeight: '900' },
  userSection: { display: 'flex', alignItems: 'center', gap: '20px' },
  welcomeText: { color: '#831843', fontSize: '16px', fontWeight: '500' },
  headerLogoutBtn: { backgroundColor: '#ec4899', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '15px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(236, 72, 153, 0.3)' },
  mainContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px', zIndex: 1 },
  chatBubble: { backgroundColor: 'white', padding: '30px 40px', borderRadius: '45px', position: 'relative', marginBottom: '35px', width: '100%', minHeight: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '6px solid #fce7f3', boxShadow: '0 15px 40px rgba(0,0,0,0.04)' },
  bubbleText: { fontSize: '24px', fontWeight: '900', color: '#701a75', textAlign: 'center', margin: '0', lineHeight: '1.4' },
  bubbleArrow: { position: 'absolute', bottom: '-22px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: '35px', height: '35px', backgroundColor: 'white', borderRight: '6px solid #fce7f3', borderBottom: '6px solid #fce7f3' },
  videoWrapper: { width: '250px', height: '250px', borderRadius: '50%', overflow: 'hidden', border: '12px solid white', marginBottom: '35px', boxShadow: '0 20px 50px rgba(112, 26, 117, 0.15)', backgroundColor: 'white' },
  videoElement: { width: '100%', height: '100%', objectFit: 'cover' },
  statusContainer: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' },
  pulse: { width: '15px', height: '15px', borderRadius: '50%', animation: 'pulse 1.5s infinite' },
  statusText: { fontWeight: '900', fontSize: '15px', textTransform: 'uppercase' },
  micBtn: { width: '120px', height: '120px', borderRadius: '50%', border: '10px solid white', color: 'white', fontSize: '50px', cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }
};










