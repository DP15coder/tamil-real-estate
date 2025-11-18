import OpenAI from "openai";

export async function generate(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY missing: cannot call LLM");
    const openai = new OpenAI({ apiKey });
    console.log("Calling OpenAI API............")

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
    });

    console.log("OpenAI API Completed............")
    return completion.choices[0].message.content?.trim() || "";
}

