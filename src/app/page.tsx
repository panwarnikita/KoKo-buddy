"use client";
import { useEffect, useState, useRef } from "react";

export default function OmliApp() {
  const [userName, setUserName] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("Omli is ready! 🐧");
  const [bubble, setBubble] = useState("Hi! I'm Omli. Let's talk!");
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);

  const ttsRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("omli_user_name");
    const savedChat = localStorage.getItem("omli_v3_chat");
    if (savedChat) setMessages(JSON.parse(savedChat));

    async function init() {
      try {
        const { TTSLogic, sharedAudioPlayer } = await import("speech-to-speech");
        sharedAudioPlayer.configure({ autoPlay: true });
        const tts = new TTSLogic({ voiceId: "en_US-hfc_female-medium", warmUp: true });
        await tts.initialize();
        ttsRef.current = tts;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.onresult = (e: any) => {
            setIsListening(false);
            handleOmliLogic(e.results[0][0].transcript);
          };
          recognition.onend = () => setIsListening(false);
          recognitionRef.current = recognition;
        }
        setStatus("Ready! 🎤");
      } catch (err) { setStatus("Engine Error ❌"); }
    }
    init();
  }, []);

  const handleOmliLogic = async (text: string, forceHistory?: any[]) => {
    if (!text || text.trim().length < 2) return;
    setStatus("Thinking... ✨");

    const currentHistory = forceHistory || [...messages, { role: "user", content: text }];
    setMessages(currentHistory);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: currentHistory.slice(-15) }) 
      });

      const data = await res.json();
      const aiText = data.choices[0].message.content;
      const cleanText = aiText.replace(/\*.*?\*/g, '').trim();
      setBubble(cleanText);

      const finalHistory = [...currentHistory, { role: "assistant", content: cleanText }];
      setMessages(finalHistory);
      localStorage.setItem("omli_v3_chat", JSON.stringify(finalHistory));

      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }

      const { sharedAudioPlayer } = await import("speech-to-speech");
      const result = await ttsRef.current.synthesize(cleanText);
      sharedAudioPlayer.addAudioIntoQueue(result.audio, result.sampleRate);

      setTimeout(() => {
        if (videoRef.current) videoRef.current.pause();
        setStatus("Ready! 🎤");
      }, Math.max(3000, cleanText.length * 85));

    } catch (err) { setStatus("Error! ❌"); }
  };

  const startApp = () => {
    if (!userName.trim()) return alert("Enter name!");
    localStorage.setItem("omli_user_name", userName);
    setIsStarted(true);
    // Setting name context initially
    handleOmliLogic(`Hi, my name is ${userName}. Introduce yourself briefly.`, [{ role: "user", content: `Hi, my name is ${userName}.` }]);
  };

  const toggleMic = () => {
    if (isListening) recognitionRef.current?.stop();
    else {
      if (videoRef.current) videoRef.current.pause();
      recognitionRef.current?.start();
      setIsListening(true);
      setStatus("Listening... 🎧");
    }
  };

  return (
    <div style={styles.container}>
      {!isStarted ? (
        <div style={styles.card}>
          <div style={styles.emojiLarge}>🐧</div>
          <h1 style={styles.title}>Omli</h1>
          <p style={styles.subtitle}>Your AI Buddy</p>
          <input 
            style={styles.input} 
            value={userName} 
            onChange={(e) => setUserName(e.target.value)} 
            placeholder="Enter your name..." 
          />
          <button style={styles.button} onClick={startApp}>START 🚀</button>
        </div>
      ) : (
        <div style={styles.mainContent}>
          <div style={styles.chatBubble}>
            <p style={styles.bubbleText}>{bubble}</p>
            <div style={styles.bubbleArrow}></div>
          </div>
          <div style={styles.videoWrapper}>
            <video ref={videoRef} src="/omli-listen.mp4" style={styles.videoElement} muted loop playsInline />
          </div>
          <p style={{...styles.status, color: isListening ? '#ef4444' : '#ec4899'}}>{status}</p>
          <button style={{...styles.micBtn, backgroundColor: isListening ? '#ef4444' : '#ec4899'}} onClick={toggleMic}>
            {isListening ? '🎧' : '🎤'}
          </button>
        </div>
      )}
    </div>
  );
}

const styles: any = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#fdf2f8', padding: '20px' },
  card: { backgroundColor: 'white', padding: '50px', borderRadius: '50px', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.1)', borderTop: '10px solid #ec4899', width: '320px' },
  emojiLarge: { fontSize: '100px', marginBottom: '20px' },
  title: { fontSize: '48px', fontWeight: '900', color: '#ec4899', margin: '0' },
  subtitle: { color: '#9ca3af', fontWeight: 'bold', fontSize: '12px', marginBottom: '30px', textTransform: 'uppercase', letterSpacing: '1px' },
  input: { width: '100%', padding: '15px', borderRadius: '20px', border: '3px solid #fce7f3', textAlign: 'center', fontSize: '18px', marginBottom: '20px', color: '#831843', fontWeight: 'bold' },
  button: { width: '100%', padding: '15px', borderRadius: '20px', border: 'none', backgroundColor: '#ec4899', color: 'white', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer' },
  mainContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '400px' },
  chatBubble: { backgroundColor: 'white', padding: '30px', borderRadius: '40px', position: 'relative', marginBottom: '40px', width: '100%', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #fce7f3' },
  bubbleText: { fontSize: '22px', fontWeight: 'bold', color: '#831843', textAlign: 'center', margin: '0', lineHeight: '1.3' },
  bubbleArrow: { position: 'absolute', bottom: '-18px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: '30px', height: '30px', backgroundColor: 'white', borderRight: '4px solid #fce7f3', borderBottom: '4px solid #fce7f3' },
  videoWrapper: { width: '280px', height: '280px', borderRadius: '50%', overflow: 'hidden', border: '12px solid white', marginBottom: '20px', backgroundColor: 'white' },
  videoElement: { width: '100%', height: '100%', objectFit: 'cover' },
  status: { fontWeight: '900', fontSize: '13px', letterSpacing: '2px', marginBottom: '25px', textTransform: 'uppercase' },
  micBtn: { width: '100px', height: '100px', borderRadius: '50%', border: '8px solid white', color: 'white', fontSize: '40px', cursor: 'pointer' }
};








