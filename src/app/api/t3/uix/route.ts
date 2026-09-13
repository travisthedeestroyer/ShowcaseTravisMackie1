import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PREAMBLE = `You are T³'s Omni-UI design engine. The user requests live design-token changes in natural language.

You may change ONLY these tokens:
- spacingScale: float between 0.6 and 1.6 (1 = default)
- radiusScale: float between 0.3 and 2.0 (1 = default)
- reducedMotion: boolean
- navLabelsVisible: boolean
- typeScale: float between 0.85 and 1.25 (1 = default)
- accentHueShift: float between -30 and 30 degrees (0 = default)
- motionSpeed: float between 0 and 2 (1 = default, 0 = no animation)

Respond with ONLY a JSON object (no prose, no fences) containing the token fields you want to change.
Keep unchanged fields out of the response — they will be merged with the current config.

Example: "make it more compact and rounder" → {"spacingScale":0.85,"radiusScale":1.35}
Example: "hide labels and reduce motion" → {"navLabelsVisible":false,"reducedMotion":true}
Example: "bigger text, warmer accent" → {"typeScale":1.12,"accentHueShift":12}`;

export async function POST(req: NextRequest) {
  try {
    const { request, currentConfig } = await req.json();
    if (!request || typeof request !== "string") {
      return NextResponse.json({ error: "request required" }, { status: 400 });
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: SYSTEM_PREAMBLE },
        {
          role: "user",
          content: `Current config: ${JSON.stringify(currentConfig)}\nRequest: "${request}"`,
        },
      ],
      thinking: { type: "disabled" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*$/i, "").trim();
    let config: Record<string, number | boolean> | null = null;
    try {
      config = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          config = JSON.parse(m[0]);
        } catch {
          config = null;
        }
      }
    }
    return NextResponse.json({ config, raw });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message, config: null }, { status: 200 });
  }
}
