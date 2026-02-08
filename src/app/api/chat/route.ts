import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { history } = await req.json();

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer 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"
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-70b-instruct",
        messages: [
          { 
            role: "system", 
            content: `You are Omli, a smart kids buddy. 
            STRICT RULES:
            1. NO ACTIONS: Do NOT use asterisks or write actions like *waddles* or *smiles*. Speak only plain text.
            2. CONTEXT: Always check the history. If you are discussing a topic (like Machine Learning), continue it. Never say "I don't have prior history."
            3. NO REPETITIVE INTROS: Do NOT introduce yourself or say your name after the first message.
            4. TONE: Sweet and concise. 2-3 sentences only.
            5. GAME HELP: If the user says "I don't know", "help me", or "I give up" during any game (like Word Chain or 20 Questions), you MUST provide the correct answer or a valid word based on the game's current state from the history.
            6. CONTINUITY: Never forget the game state. If you are in Word Chain, always remember the last letter.` 
          },
          ...history 
        ],
        temperature: 0.3, 
      })
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "API failed" }, { status: 500 });
  }
}







