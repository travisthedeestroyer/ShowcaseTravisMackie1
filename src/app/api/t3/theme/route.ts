import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PREAMBLE = `You are T³'s theme designer. Generate a complete visual theme from the user's vibe prompt.

Respond with ONLY a JSON object (no prose, no markdown fences) matching this exact schema:
{
  "name": "<short evocative name, Title Case, max 4 words>",
  "primaryColor": "#RRGGBB",
  "secondaryColor": "#RRGGBB",
  "tertiaryColor": "#RRGGBB",
  "surfaceColor": "#RRGGBB (with alpha baked into the last two digits, e.g. #80FBF7EE for ~50% transparent warm paper)",
  "textColor": "#RRGGBB",
  "glassBorderColor": "#RRGGBB (with alpha)",
  "bgGradientColors": ["#RRGGBB", "#RRGGBB", "#RRGGBB", "#RRGGBB"],
  "orbColors": ["#RRGGBB", "#RRGGBB", "#RRGGBB", "#RRGGBB"],
  "glassAlpha": 0.35
}

Rules:
- Choose a harmonious palette inspired by the vibe.
- If the vibe implies "dark", "cyber", "night", or "noir", the bgGradientColors should be dark and textColor light.
- Otherwise default to a light, airy gradient with dark text.
- All colors are 6-digit hex (#RRGGBB). Surface and glassBorder may include 8-digit hex (#RRGGBBAA).
- Provide exactly 4 gradient stops and 4 orb colors.
- glassAlpha is between 0.10 and 0.80.`;

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
        { role: "user", content: `Vibe: "${prompt}"` },
      ],
      thinking: { type: "disabled" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    // Try to extract a JSON object even if fenced
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*$/i, "").trim();
    let theme: unknown = null;
    try {
      theme = JSON.parse(cleaned);
    } catch {
      // try to find first {...} block
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          theme = JSON.parse(m[0]);
        } catch {
          theme = null;
        }
      }
    }
    return NextResponse.json({ theme, raw });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message, theme: null }, { status: 200 });
  }
}
