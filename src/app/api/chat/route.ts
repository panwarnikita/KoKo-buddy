import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { history } = await req.json();
    const apiKey = process.env.NVIDIA_API_KEY;

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-70b-instruct",
        messages: [
          { 
            role: "system", 
            content: `You are KoKo, a smart kids buddy. 
            STRICT RULES:
            1. NO ACTIONS: Speak only plain text.
            2. CONTEXT: Read the conversation history carefully. You MUST remember the last topic or game state.
            3. NO REPETITIVE INTROS: Do NOT say your name again.
            4. TONE: Sweet and short (1-2 sentences).
            5. GAME MASTER: Always track the game state (like Word Chain letters) from the messages provided in history.` 
          },
          ...history 
        ],
        temperature: 0.1, 
        top_p: 0.7,
        stream: true, 
      })
    });

    return new Response(response.body, {
      headers: { "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    return NextResponse.json({ error: "API failed" }, { status: 500 });
  }
}






























