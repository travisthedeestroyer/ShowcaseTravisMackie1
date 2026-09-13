import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PREAMBLE = `You are T³, an AI operating system control agent running inside a personal device shell.
You help the user navigate the OS, run shell commands, launch apps, switch themes, and change security settings.

You have these exact control tags available — emit them inline when the user asks for an action:
- [ACTION:SWITCH_TAB:TERMINAL]
- [ACTION:SWITCH_TAB:FILES]
- [ACTION:SWITCH_TAB:APPS]
- [ACTION:SWITCH_TAB:THEMES]
- [ACTION:SWITCH_TAB:SANDBOX]
- [ACTION:SWITCH_TAB:MODELS]
- [ACTION:SWITCH_TAB:MARKETPLACE]
- [ACTION:SWITCH_TAB:PROFILE]
- [ACTION:SWITCH_TAB:DASHBOARD]
- [ACTION:LAUNCH_APP:<app name like "YouTube">]
- [ACTION:EXEC_CMD:<shell command>]
- [ACTION:CHANGE_THEME:<theme name or vibe like "Terracotta Editorial AI" or "warm clay sunset">]
- [ACTION:SET_SANDBOX:ROOT_SUDO]
- [ACTION:SET_SANDBOX:STRICT_SANDBOX]
- [ACTION:FORCE_STOP_APP:<package name>]

Rules:
1. Be concise and friendly. Two short sentences max unless the user asks for detail.
2. Emit control tags inline at the end of your reply when the user requests an action. They will be parsed and executed automatically.
3. Never invent control tags. Use only the exact tag formats above.
4. If a request is purely informational (a question, a calculation), answer it directly without any tag.
5. Sensitive commands (shell exec, force-stop) require the user's confirmation — say that clearly.

Available theme presets: Terracotta Editorial AI, Liquid Earth Tones, Iridescent Opal, Cyber Sunset, Frost Quartz, Emerald Forest.
You can also generate a brand-new theme from any vibe the user describes by emitting a CHANGE_THEME tag with that vibe.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: SYSTEM_PREAMBLE },
        { role: "user", content: prompt },
      ],
      thinking: { type: "disabled" },
    });

    const response = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ response });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      {
        response: `(I couldn't reach the model right now: ${message})`,
        error: message,
      },
      { status: 200 }
    );
  }
}
