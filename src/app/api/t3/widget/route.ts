import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREAMBLE = `You are T³'s Generative Widget Agent. The user describes a widget they want, and you generate a complete widget definition as JSON (no prose, no fences).

Choose the best "kind" for the widget:
- CHART: bar/line/area/donut chart with data points
- GAUGE: circular gauge 0-100 with label
- COUNTER: big number with label + optional delta
- LIST: list of items with icons and values
- NOTES: editable sticky note
- TIMER: countdown timer with start/stop
- CLOCK: analog or digital clock
- WEATHER: weather card with icon + temp + condition
- MARKDOWN: rendered text content (headings, bullets, bold)
- METRICS: 2-column grid of label/value pairs
- PROGRESS: multiple progress bars
- STATUS: online/offline/warning/error indicators
- QUOTE: rotating inspirational quotes
- CALENDAR: mini calendar with events
- ACTIVITY: activity feed / timeline
- CUSTOM: anything else (provide customHtml as sanitized HTML)

Schema:
{
  "id": "w_<timestamp>",
  "title": "<short title>",
  "description": "<one-line description>",
  "kind": "<one of the kinds above>",
  "enabled": true,
  "accent": "#RRGGBB",
  "background": "glass",
  "span": 4,
  "icon": "<lucide icon name from: Activity, BarChart3, Gauge, Hash, List, StickyNote, Timer, Clock, CloudSun, FileText, Cpu, BarChart2, CheckCircle, AlertCircle, XCircle, Calendar, Quote, Zap, Sun, Moon, Cloud, CloudRain, CloudSnow, Star, Heart, Bell, Coffee, Music, Camera, Mail, Phone, MapPin, Globe, Download, Upload, Code, Terminal, Folder, Settings, Lock, Eye, TrendingUp, TrendingDown, DollarSign, Percent, Wifi, Signal, Battery, HardDrive, Server, Shield, ShieldCheck, KeyRound, User, Users, Rocket, Wrench, Monitor, Smartphone, MessageSquare, Mic, Headphones, Volume2>",
  "data": { ... kind-specific data ... }
}

Kind-specific data:
- CHART: { "chartType": "bar"|"line"|"area"|"donut", "points": [{"label":"Mon","value":42,"color":"#4285F4"}] }
- GAUGE: { "gaugeValue": 75, "gaugeLabel": "CPU Usage", "gaugeMax": 100 }
- COUNTER: { "counterValue": 1337, "counterLabel": "Total Requests", "counterDelta": "+12%" }
- LIST: { "items": [{"label":"CPU","value":"45%","icon":"Cpu","color":"#4285F4"}] }
- NOTES: { "noteContent": "Remember to...\n- Buy milk\n- Call mom" }
- TIMER: { "timerSeconds": 1500 }
- CLOCK: { "clockTimezone": "America/New_York", "clockFormat": "12h"|"24h"|"analog" }
- WEATHER: { "weatherTemp": 68, "weatherCondition": "Sunny", "weatherLocation": "SF", "weatherIcon": "CloudSun" }
- MARKDOWN: { "markdown": "# Heading\\n- bullet point\\n**bold text**" }
- METRICS: { "metrics": [{"label":"CPU","value":"45%","icon":"Cpu","color":"#4285F4"}] }
- PROGRESS: { "progress": [{"label":"Disk","value":72,"color":"#C1613D"}] }
- STATUS: { "statuses": [{"label":"API","status":"online","color":"#5E8570"}] }
- QUOTE: { "quotes": ["Stay curious.","Less is more."] }
- CALENDAR: { "calendarEvents": [{"day":15,"title":"Team meeting","color":"#4285F4"}] }
- ACTIVITY: { "activities": [{"time":"10:30","title":"Deployed v2.0","icon":"Zap","color":"#C1613D"}] }
- CUSTOM: { "customHtml": "<div>...</div>" }

Rules:
1. Generate realistic, interesting mock data that matches the widget's purpose.
2. Use the earth palette accent colors when possible: #C1613D (terracotta), #5E8570 (sage), #456175 (slate), #D9A05B (amber).
3. For charts, generate 4-8 data points with realistic labels and values.
4. For lists/metrics, generate 3-6 items.
5. For quotes, generate 3-5 quotes.
6. For calendar, generate 2-4 events on the current month.
7. For activity, generate 4-6 timeline entries.
8. Make the widget feel useful and complete — not a placeholder.
9. Respond with ONLY the JSON object.`;

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();
    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "description required" }, { status: 400 });
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: PREAMBLE },
        { role: "user", content: `Widget description: "${description}"` },
      ],
      thinking: { type: "disabled" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*$/i, "").trim();
    let widget = null;
    try {
      widget = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) {
        try { widget = JSON.parse(m[0]); } catch { widget = null; }
      }
    }

    // Ensure required fields
    if (widget) {
      widget.id = widget.id || `w_${Date.now()}`;
      widget.enabled = true;
      widget.generatedFrom = description;
      widget.generatedAt = Date.now();
    }

    return NextResponse.json({ widget, raw });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message, widget: null }, { status: 200 });
  }
}
