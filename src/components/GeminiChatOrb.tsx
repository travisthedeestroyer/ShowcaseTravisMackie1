import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence, useAnimationFrame } from "motion/react";
import { GoogleGenAI, Modality } from "@google/genai";
import {
  Mic,
  Key,
  X,
  Sparkles,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  PhoneOff,
  Radio,
} from "lucide-react";
import { AudioRecorder, AudioPlayer } from "../lib/audioUtils";

// ── Types ─────────────────────────────────────────────────────────────────────
type OrbState = "idle" | "connecting" | "listening" | "speaking" | "error";

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Travis Mackie's AI assistant, embedded in his portfolio site. 
Travis is a solo AI developer and independent consultant with 5+ years of experience across major AI platforms (Anthropic, Google Gemini/Vertex AI, OpenAI, Meta, Hugging Face, Cohere).

He's built:
• mycartoon.org — AI cartoon creation studio for kids using Gemini, Veo, and Lyria
• AI Vocal Studio — multi-agent autonomous audio processing pipeline
• Deep Research Agent — modeled on Google AI Studio UI with SSE streaming
• Kronos Trading Crew — AI trading agents with live exchange data

Background: HR leadership + hospitality operations — strong stakeholder communication.
Currently open to: AI Consultant, Solutions Architect, Technical Sales Engineer roles.

Be helpful, concise, and compelling. You are talking to visitors via VOICE. Speak naturally, with a friendly, conversational, and professional tone. Avoid long monologues. Keep responses under 2-3 sentences so the conversation flows naturally. Never output markdown formatting or bullet points since this is a voice conversation.`;

// ── Audio analysis helper ─────────────────────────────────────────────────────
// Computes RMS amplitude (0-1) from base64-encoded 16-bit PCM.
// Used to drive orb reactivity from both mic input and assistant output,
// without needing to touch the AudioRecorder/AudioPlayer internals.
function computeRMS(base64: string): number {
  try {
    const binary = atob(base64);
    const len = binary.length;
    if (len < 2) return 0;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer, 0, Math.floor(len / 2));
    let sumSq = 0;
    // Subsample for perf on large chunks
    const step = Math.max(1, Math.floor(int16.length / 1024));
    let count = 0;
    for (let i = 0; i < int16.length; i += step) {
      const s = int16[i];
      sumSq += s * s;
      count++;
    }
    if (count === 0) return 0;
    const rms = Math.sqrt(sumSq / count) / 32768;
    // Perceptual curve + gain for visualization
    return Math.min(1, Math.pow(rms, 0.6) * 2.4);
  } catch {
    return 0;
  }
}

// ── Premium Fluid Orb (WebGL) ─────────────────────────────────────────────────
// The previous Canvas-2D implementation was dominated by ctx.shadowBlur (CPU
// Gaussian blur per frame) and by recreating 4-5 radial gradients every frame.
// Here the entire visual — blob SDF, rim light, two speculars, core pulse,
// outer aura, swirling color — is composed inside one fragment shader.
// Per-frame CPU cost is ~7 uniform writes and one drawArrays call.
// DPR-aware + ResizeObserver, so it stays crisp on retina at any size.

interface OrbCanvasProps {
  orbState: OrbState;
  amplitudeRef: React.MutableRefObject<number>;
}

// State → visual targets. Tune here to change the mood of each state.
// `speed` is time units/sec driving shader noise flow. `chaos` controls
// displacement magnitude. `reactivity` gates how much the amplitude uniform
// moves the shape (so idle/error stay calm even on stray RMS bumps).
const STATE_TARGETS: Record<
  OrbState,
  {
    chaos: number;
    speed: number;
    hueA: number;
    hueB: number;
    saturation: number;
    lightness: number;
    reactivity: number;
  }
> = {
  idle: { chaos: 0.35, speed: 0.22, hueA: 188, hueB: 218, saturation: 0.72, lightness: 0.58, reactivity: 0 },
  connecting: { chaos: 1.05, speed: 2.20, hueA: 28, hueB: 292, saturation: 0.88, lightness: 0.62, reactivity: 0 },
  listening: { chaos: 0.50, speed: 0.55, hueA: 168, hueB: 205, saturation: 0.78, lightness: 0.63, reactivity: 1 },
  speaking: { chaos: 0.82, speed: 1.15, hueA: 232, hueB: 288, saturation: 0.84, lightness: 0.66, reactivity: 1 },
  error: { chaos: 0.28, speed: 0.10, hueA: 4, hueB: 22, saturation: 0.62, lightness: 0.50, reactivity: 0 },
};

const VERT_SRC = /* glsl */ `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Pipeline:
//   1. Compute centered UV in a square coordinate space.
//   2. Sample 3D simplex noise along a circle (angle → position) to displace
//      a base radius — produces the fluid, breathing blob edge.
//   3. Produce a soft SDF mask via smoothstep.
//   4. Color the body with a swirling noise-driven mix of hueA/hueB, add rim
//      light, two speculars, and a core pulse that reacts to amplitude.
//   5. Outer aura as a power-curve falloff outside the body radius.
//   6. Output PREMULTIPLIED color so blending with the glass-panel bg is clean.
const FRAG_SRC = /* glsl */ `
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_amplitude;
uniform float u_chaos;
uniform float u_reactivity;
uniform vec3  u_colorA;
uniform vec3  u_colorB;

// ── Ashima simplex noise ────────────────────────────────────────────────
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g  = step(x0.yzx, x0.xyz);
  vec3 l  = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Two-octave fbm — enough detail without blowing the shader budget
float fbm2(vec3 p) {
  return snoise(p) * 0.66 + snoise(p * 2.3 + 5.0) * 0.34;
}

void main() {
  // Shortest-axis normalized coords, [-1,1] centered.
  vec2 uv   = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
  float d   = length(uv);
  float ang = atan(uv.y, uv.x);

  float ampKick = u_amplitude * u_reactivity;

  // 1. Fluid blob boundary — sample 3D noise on a circle, z = time makes it flow.
  vec3 np = vec3(cos(ang) * 1.3, sin(ang) * 1.3, u_time * 0.25);
  float nBody = fbm2(np);

  float baseR    = 0.48;
  float displace = nBody * u_chaos * 0.135 + ampKick * 0.055;
  float breathe  = 1.0 + sin(u_time * 1.3) * 0.012 + ampKick * 0.035;
  float r        = (baseR + displace) * breathe;

  // Soft SDF edge — slightly thinner when amplitude is high for a crisper reactive feel
  float edge = 0.013 - ampKick * 0.003;
  float body = smoothstep(r + edge, r - edge, d);

  // 2. Body color — swirling liquid gradient between hueA and hueB
  float swirl    = fbm2(vec3(uv * 2.2, u_time * 0.35)) * 0.5 + 0.5;
  float radialT  = clamp(d / r, 0.0, 1.0);
  float colorMix = mix(radialT * 0.8, swirl, 0.6);
  vec3  col      = mix(u_colorA, u_colorB, colorMix);

  // Rim light
  float rim = smoothstep(r - 0.06, r, d);
  col += rim * 0.22;

  // Primary specular (top-left, white — glossy sphere highlight)
  float spec1 = smoothstep(0.32, 0.0, length(uv + vec2(0.22, 0.28))) * 0.55;
  col += vec3(spec1);

  // Secondary bounce specular (bottom-right, tinted with hueB)
  float spec2 = smoothstep(0.34, 0.12, length(uv + vec2(-0.24, -0.28))) * 0.22;
  col += u_colorB * spec2;

  // Core pulse — brightens the center when audio is active
  float core = exp(-d * 7.5) * ampKick;
  col += u_colorA * core * 1.4;

  // 3. Outer aura — power-curve falloff for a deep soft glow
  float auraR    = r + 0.34 + ampKick * 0.1;
  float auraRaw  = 1.0 - smoothstep(r, auraR, d);
  float auraMask = pow(auraRaw, 2.8) * (1.0 - body);
  vec3  auraCol  = mix(u_colorA, u_colorB, 0.5) * (0.55 + ampKick * 0.45);

  // 4. Composite (premultiplied). rgb must equal final_color * alpha so the
  // GPU composites cleanly against the translucent glass-panel background.
  float auraAlpha = auraMask * 0.8;
  vec3  rgb       = col * body + auraCol * auraAlpha;
  float alpha     = body + auraAlpha;

  gl_FragColor = vec4(rgb, alpha);
}
`;

// HSL in [0,360]/[0,1]/[0,1] → linear-ish RGB in [0,1].
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = (((h % 360) + 360) % 360) / 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [hue2rgb(h + 1 / 3), hue2rgb(h), hue2rgb(h - 1 / 3)];
}

function OrbCanvas({ orbState, amplitudeRef }: OrbCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const uRef = useRef<{
    resolution: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
    amplitude: WebGLUniformLocation | null;
    chaos: WebGLUniformLocation | null;
    reactivity: WebGLUniformLocation | null;
    colorA: WebGLUniformLocation | null;
    colorB: WebGLUniformLocation | null;
  } | null>(null);

  const timeRef = useRef(0);
  const displayedAmpRef = useRef(0);
  const currentRef = useRef({ ...STATE_TARGETS.idle });
  const targetRef = useRef({ ...STATE_TARGETS.idle });

  // One-time GL setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // premultipliedAlpha:true → shader outputs premul colors, composites
    // cleanly against the glass-panel background without darkening halos.
    const gl = (canvas.getContext("webgl", {
      premultipliedAlpha: true,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    }) ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;

    if (!gl) {
      console.warn("[OrbCanvas] WebGL unavailable — orb will not render.");
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("[OrbCanvas] Shader compile:", gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("[OrbCanvas] Program link:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Fullscreen quad (two triangles covering clip space)
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1,
      ]),
      gl.STATIC_DRAW
    );
    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Premultiplied-alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    glRef.current = gl;
    programRef.current = program;
    uRef.current = {
      resolution: gl.getUniformLocation(program, "u_resolution"),
      time: gl.getUniformLocation(program, "u_time"),
      amplitude: gl.getUniformLocation(program, "u_amplitude"),
      chaos: gl.getUniformLocation(program, "u_chaos"),
      reactivity: gl.getUniformLocation(program, "u_reactivity"),
      colorA: gl.getUniformLocation(program, "u_colorA"),
      colorB: gl.getUniformLocation(program, "u_colorB"),
    };

    return () => {
      try {
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        if (posBuf) gl.deleteBuffer(posBuf);
      } catch { }
      glRef.current = null;
      programRef.current = null;
      uRef.current = null;
    };
  }, []);

  // DPR-aware sizing — matches CSS box at devicePixelRatio so it's crisp on
  // retina at any container size. Cap at 2× to keep fill-rate sane.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const gl = glRef.current;
      if (!gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      return () => ro.disconnect();
    }

    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Update target parameters when state changes (values lerp toward these)
  useEffect(() => {
    targetRef.current = { ...STATE_TARGETS[orbState] };
  }, [orbState]);

  // Render loop
  useAnimationFrame((_, delta) => {
    const gl = glRef.current;
    const program = programRef.current;
    const u = uRef.current;
    if (!gl || !program || !u) return;

    // Clamp to avoid giant jumps after tab-switch / throttling
    const dt = Math.min(64, delta);
    const lerp = Math.min(1, (dt / 1000) * 3);

    const cur = currentRef.current;
    const tgt = targetRef.current;
    cur.chaos += (tgt.chaos - cur.chaos) * lerp;
    cur.speed += (tgt.speed - cur.speed) * lerp;
    cur.hueA += (tgt.hueA - cur.hueA) * lerp * 0.5;
    cur.hueB += (tgt.hueB - cur.hueB) * lerp * 0.5;
    cur.saturation += (tgt.saturation - cur.saturation) * lerp;
    cur.lightness += (tgt.lightness - cur.lightness) * lerp;
    cur.reactivity += (tgt.reactivity - cur.reactivity) * lerp;

    // Fast attack / slow release amplitude smoothing — matches original feel.
    const targetAmp = amplitudeRef.current * cur.reactivity;
    const alpha = targetAmp > displayedAmpRef.current ? 0.35 : 0.08;
    displayedAmpRef.current += (targetAmp - displayedAmpRef.current) * alpha;
    const amp = displayedAmpRef.current;

    timeRef.current += (cur.speed * dt) / 1000;

    const [aR, aG, aB] = hslToRgb(cur.hueA, cur.saturation, cur.lightness);
    const [bR, bG, bB] = hslToRgb(cur.hueB, cur.saturation, cur.lightness);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform2f(u.resolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform1f(u.time, timeRef.current);
    gl.uniform1f(u.amplitude, amp);
    gl.uniform1f(u.chaos, cur.chaos);
    gl.uniform1f(u.reactivity, cur.reactivity);
    gl.uniform3f(u.colorA, aR, aG, aB);
    gl.uniform3f(u.colorB, bR, bG, bB);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Natural amplitude decay between audio chunks
    amplitudeRef.current *= 0.94;
  });

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full pointer-events-none"
      style={{ display: "block" }}
      aria-hidden="true"
    />
  );
}

// ── API Key Modal ─────────────────────────────────────────────────────────────
function ApiKeyModal({
  open,
  onClose,
  onSave,
  current,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  current: string;
}) {
  const [val, setVal] = useState(current);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open) setVal(current);
  }, [open, current]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
          >
            <div
              className="glass-panel w-full max-w-md p-6 space-y-5 pointer-events-auto shadow-2xl border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-inner">
                    <Key className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-ink text-base">Gemini API Key</h3>
                    <p className="text-ink-dim text-xs">Required for live voice features</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-ink-dim hover:text-ink transition-colors p-2 bg-white/50 rounded-full hover:bg-white/80"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    placeholder="AIza..."
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full px-4 py-3 pr-10 rounded-2xl bg-white/70 border border-black/[0.08] text-ink text-sm font-mono placeholder:text-ink-dim/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && val.trim()) {
                        onSave(val.trim());
                        onClose();
                      }
                    }}
                  />
                  <button
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink p-1"
                    aria-label={show ? "Hide key" : "Show key"}
                    type="button"
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-ink-dim px-1">
                  Get a free key at{" "}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Google AI Studio
                  </a>
                  . Stored locally only.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl border border-black/[0.08] bg-white/50 text-ink text-sm font-medium hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (val.trim()) {
                      onSave(val.trim());
                      onClose();
                    }
                  }}
                  disabled={!val.trim()}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-bold disabled:opacity-50 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                >
                  Save &amp; Connect
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── State → display config ────────────────────────────────────────────────────
const STATE_META: Record<OrbState, { label: string; sub: string; dot: string }> = {
  idle: { label: "Ready to Connect", sub: "Tap below to start a voice call", dot: "bg-slate-400" },
  connecting: { label: "Connecting…", sub: "Establishing secure voice channel", dot: "bg-amber-400 animate-pulse" },
  listening: { label: "Listening", sub: "Go ahead — I'm hearing you", dot: "bg-emerald-400 animate-pulse" },
  speaking: { label: "Speaking", sub: "Travis AI is responding", dot: "bg-blue-400 animate-pulse" },
  error: { label: "Connection Error", sub: "Something went wrong — try again", dot: "bg-red-400" },
};

// ── Main Component ────────────────────────────────────────────────────────────
export function GeminiChatOrb() {
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("gemini_api_key") ?? "";
  });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [isLive, setIsLive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sessionRef = useRef<any>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);

  // Refs that mirror state to defeat stale closures inside long-lived callbacks.
  const isLiveRef = useRef(false);
  const orbStateRef = useRef<OrbState>("idle");
  // Hard short-circuit for the mic send path when the WS starts closing.
  // Prevents tens of "WebSocket is already in CLOSING or CLOSED state" console spam
  // between the socket going into CLOSING and `onclose` firing.
  const socketDeadRef = useRef(false);
  // Send-path buffer. Your AudioWorklet fires 128-sample (8ms) chunks; Google's
  // best-practices page recommends 20–40ms per realtime audio message. We batch
  // 4 chunks (~32ms) before calling sendRealtimeInput to cut WS traffic ~4×
  // and reduce perceived latency on weaker connections.
  const sendBufferRef = useRef<Uint8Array[]>([]);
  const sendBufferBytesRef = useRef(0);
  // Live amplitude (0-1) read by OrbCanvas every frame.
  const amplitudeRef = useRef(0);

  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);
  useEffect(() => {
    orbStateRef.current = orbState;
  }, [orbState]);

  const client = useMemo(
    () => (apiKey ? new GoogleGenAI({ apiKey }) : null),
    [apiKey]
  );

  const saveKey = useCallback((key: string) => {
    localStorage.setItem("gemini_api_key", key);
    setApiKey(key);
    setErrorMsg(null);
  }, []);

  // Tear down audio + session without touching orbState.
  // Lets error handlers preserve the "error" visual after cleanup.
  const teardown = useCallback(() => {
    if (sessionRef.current) {
      try {
        if (typeof sessionRef.current.close === "function") {
          sessionRef.current.close();
        }
      } catch (e) {
        console.warn("Session close failed:", e);
      }
      sessionRef.current = null;
    }
    if (recorderRef.current) {
      try { recorderRef.current.stop(); } catch { }
      recorderRef.current = null;
    }
    if (playerRef.current) {
      try { playerRef.current.stop(); } catch { }
      playerRef.current = null;
    }
    amplitudeRef.current = 0;
    isLiveRef.current = false;
    socketDeadRef.current = true;
    sendBufferRef.current.length = 0;
    sendBufferBytesRef.current = 0;
    setIsLive(false);
  }, []);

  const disconnect = useCallback(() => {
    teardown();
    setOrbState("idle");
    setErrorMsg(null);
  }, [teardown]);

  // Clean up on unmount — prevents mic/WS leaks when user navigates away mid-call.
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        try { sessionRef.current.close?.(); } catch { }
      }
      if (recorderRef.current) {
        try { recorderRef.current.stop(); } catch { }
      }
      if (playerRef.current) {
        try { playerRef.current.stop(); } catch { }
      }
    };
  }, []);

  const startVoiceSession = useCallback(async () => {
    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }
    if (!client) return;

    setErrorMsg(null);
    setOrbState("connecting");
    socketDeadRef.current = false;
    sendBufferRef.current.length = 0;
    sendBufferBytesRef.current = 0;

    try {
      // 1. Audio player for assistant output
      playerRef.current = new AudioPlayer();
      playerRef.current.init();

      // 2. Mic recorder. Callback uses refs (not state) to avoid stale closure.
      // `socketDeadRef` short-circuits the callback immediately when the WS goes
      // into CLOSING/CLOSED state, so in-flight worklet chunks don't spam the
      // SDK between "socket started closing" and "onclose fired".
      //
      // We also BATCH sends: the worklet fires 128-sample (8ms) chunks at ~125 Hz.
      // Google's Live API docs recommend 20–40ms per send. We accumulate 4 chunks
      // (~32ms ≈ 1024 PCM bytes) and send as one message. This:
      //  - cuts WS traffic ~4× (125 Hz → ~31 Hz)
      //  - reduces JSON serialization + server dispatch overhead
      //  - keeps us inside the recommended window for smoothest VAD
      // Amplitude for the orb is still computed per-chunk for smooth reactivity.
      const BATCH_TARGET_BYTES = 256 * 4; // 4 × 128-sample 16-bit frames = 1024 B
      recorderRef.current = new AudioRecorder((base64PCM) => {
        if (!sessionRef.current || !isLiveRef.current || socketDeadRef.current) return;

        // Feed the orb from EVERY raw chunk so visual amplitude stays at 125 Hz.
        if (orbStateRef.current === "listening") {
          const rms = computeRMS(base64PCM);
          if (rms > amplitudeRef.current) amplitudeRef.current = rms;
        }

        // Append this chunk's bytes into the send buffer.
        let bytes: Uint8Array;
        try {
          const binary = atob(base64PCM);
          bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        } catch {
          return; // bad chunk, drop
        }
        sendBufferRef.current.push(bytes);
        sendBufferBytesRef.current += bytes.length;

        // Flush when we have ~32ms worth of audio.
        if (sendBufferBytesRef.current < BATCH_TARGET_BYTES) return;

        const total = sendBufferBytesRef.current;
        const merged = new Uint8Array(total);
        let offset = 0;
        for (const chunk of sendBufferRef.current) {
          merged.set(chunk, offset);
          offset += chunk.length;
        }
        sendBufferRef.current.length = 0;
        sendBufferBytesRef.current = 0;

        // Encode merged PCM to base64. fromCharCode.apply with a chunked loop
        // avoids "Maximum call stack" on large payloads.
        let binary2 = "";
        const CHUNK = 0x8000;
        for (let i = 0; i < merged.length; i += CHUNK) {
          binary2 += String.fromCharCode.apply(
            null,
            merged.subarray(i, i + CHUNK) as unknown as number[]
          );
        }
        const mergedB64 = btoa(binary2);

        try {
          sessionRef.current.sendRealtimeInput({
            audio: {
              data: mergedB64,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        } catch (e: any) {
          const msg = String(e?.message || e || "");
          if (e?.name === "InvalidStateError" || /CLOS(ING|ED)/i.test(msg)) {
            socketDeadRef.current = true;
            isLiveRef.current = false;
          } else {
            console.error("Error sending audio chunk", e);
          }
        }
      });
      await recorderRef.current.start();

      // 3. Open the Gemini Live session.
      //
      // Config shape (per https://ai.google.dev/gemini-api/docs/live-api/capabilities,
      // last updated 2026-03-09): responseModalities / speechConfig / systemInstruction
      // live directly on `config`. Nesting under `generationConfig` is deprecated.
      //
      // Model: `gemini-2.5-flash-native-audio-preview-12-2025` is the flagship Live API
      // model for native-audio voice agents (supports Puck + all TTS voices, system
      // instructions, and speechConfig). Prior IDs in this codebase
      // (`gemini-2.0-flash-exp`, `gemini-2.0-flash-live-001`) are in the deprecated
      // Gemini 2.0 family and are being shut down — the server accepts the WebSocket
      // handshake then immediately closes it, which surfaces as a cascade of
      // "WebSocket is already in CLOSING or CLOSED state" logs.
      //
      // Alternative: `gemini-3.1-flash-live-preview` (newest, featured in current
      // get-started guide). Swap if you want to try 3.1 latency.
      const session = await client.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Puck" },
            },
          },
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
        },
        callbacks: {
          onopen: () => {
            isLiveRef.current = true;
            setIsLive(true);
            setOrbState("listening");
          },
          onmessage: (message: any) => {
            // `goAway` arrives before the server actually terminates the WS —
            // flip our dead-socket flag immediately so the mic callback stops
            // shoving chunks into a soon-to-close socket.
            // https://ai.google.dev/gemini-api/docs/live-api/best-practices
            if (message?.goAway) {
              console.warn("Server GoAway — session ending:", message.goAway);
              socketDeadRef.current = true;
              return;
            }

            const sc = message?.serverContent;
            if (!sc) return;

            if (sc.interrupted) {
              try { playerRef.current?.interrupt(); } catch { }
              amplitudeRef.current = 0;
              if (orbStateRef.current !== "listening") {
                setOrbState("listening");
              }
              return;
            }

            if (sc.modelTurn?.parts) {
              // First audio part of a turn flips us to speaking.
              if (orbStateRef.current !== "speaking") {
                setOrbState("speaking");
              }
              for (const part of sc.modelTurn.parts) {
                if (part.inlineData?.data) {
                  try { playerRef.current?.playBase64PCM(part.inlineData.data); } catch { }
                  const rms = computeRMS(part.inlineData.data);
                  if (rms > amplitudeRef.current) amplitudeRef.current = rms;
                }
              }
            }

            // `generationComplete` or `turnComplete` both indicate the model is
            // done speaking. Either is a valid trigger for returning to listening;
            // we accept whichever arrives first. Guard against redundant renders —
            // both flags can fire across adjacent messages for the same turn.
            if (sc.generationComplete || sc.turnComplete) {
              amplitudeRef.current = 0;
              if (orbStateRef.current !== "listening") {
                setOrbState("listening");
              }
            }
          },
          onerror: (err: any) => {
            // Surface as much as the SDK gives us (message / reason / code / the whole blob)
            console.error("Live session error:", err);
            socketDeadRef.current = true;
            const reason =
              err?.message ||
              err?.reason ||
              err?.error?.message ||
              "Connection error";
            setErrorMsg(reason);
            teardown();
            setOrbState("error");
          },
          onclose: (e: any) => {
            // CloseEvent fields: code, reason, wasClean
            console.warn("Live session closed:", {
              code: e?.code,
              reason: e?.reason,
              wasClean: e?.wasClean,
            });
            socketDeadRef.current = true;

            // If we already showed an error, just clean audio up.
            if (orbStateRef.current === "error") {
              teardown();
              return;
            }

            // Unexpected close → show the reason so the user (and you) can see why.
            const reason = (e?.reason || "").toString().trim();
            const code = e?.code;
            const serverClosed =
              !e?.wasClean || (typeof code === "number" && code !== 1000 && code !== 1005);

            if (serverClosed) {
              setErrorMsg(
                reason
                  ? `Connection closed by server: ${reason}`
                  : `Connection closed unexpectedly${code ? ` (code ${code})` : ""}`
              );
              teardown();
              setOrbState("error");
            } else {
              // Clean client-initiated close
              disconnect();
            }
          },
        },
      });

      sessionRef.current = session;
    } catch (err: any) {
      console.error("Failed to start session:", err);
      setErrorMsg(err?.message || "Failed to access microphone or connect to API.");
      teardown();
      setOrbState("error");
    }
  }, [apiKey, client, teardown, disconnect]);

  const toggleConnection = () => {
    if (isLive || orbState === "connecting") {
      disconnect();
    } else {
      startVoiceSession();
    }
  };

  const meta = STATE_META[orbState];

  // Derived class strings (kept readable — no template-literal chaos)
  const glowClasses = isLive
    ? "w-[600px] h-[600px] rounded-full blur-[100px] transition-all duration-1000 bg-blue-400/40 scale-110"
    : orbState === "error"
      ? "w-[600px] h-[600px] rounded-full blur-[100px] transition-all duration-1000 bg-red-400/25 scale-100"
      : "w-[600px] h-[600px] rounded-full blur-[100px] transition-all duration-1000 bg-gray-400/20 scale-90";

  const apiKeyButtonClasses = apiKey
    ? "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all backdrop-blur-md bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 hover:bg-emerald-500/20"
    : "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all backdrop-blur-md bg-orange-500/10 text-orange-700 border border-orange-500/20 hover:bg-orange-500/20 shadow-lg shadow-orange-500/20";

  const actionButtonClasses = isLive
    ? "relative z-10 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base transition-all shadow-xl bg-red-500 hover:bg-red-600 text-white shadow-red-500/30 min-w-[220px]"
    : orbState === "connecting"
      ? "relative z-10 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base transition-all shadow-xl bg-ink/70 text-white cursor-wait min-w-[220px]"
      : "relative z-10 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base transition-all shadow-xl bg-ink hover:bg-ink-light text-white shadow-black/20 min-w-[220px]";

  return (
    <section
      id="voice-agent"
      className="px-4 sm:px-6 max-w-5xl mx-auto w-full py-16 relative z-10"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center opacity-30">
        <div className={glowClasses} />
      </div>

      {/* Header */}
      <div className="text-center mb-12 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 mb-6 backdrop-blur-sm">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold tracking-widest uppercase">Gemini Live Voice</span>
        </div>
        <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight mb-4">
          Speak with <span className="text-gradient">Travis AI</span>
        </h2>
        <p className="text-ink-dim text-lg max-w-xl mx-auto">
          A real-time, ultra-low latency voice conversation powered by the Gemini 2.0 Multimodal Live API.
        </p>
      </div>

      {/* Orb Panel */}
      <div className="relative glass-panel rounded-3xl p-8 sm:p-12 overflow-hidden flex flex-col items-center justify-center min-h-[560px] shadow-2xl border border-white/40 bg-white/40 backdrop-blur-xl">
        {/* Top controls */}
        <div className="absolute top-6 right-6 flex gap-2 z-20">
          <button onClick={() => setShowKeyModal(true)} className={apiKeyButtonClasses}>
            <Key className="w-3.5 h-3.5" />
            {apiKey ? "API Key Active" : "Add API Key"}
          </button>
        </div>

        {/* Top-left badge: live indicator only when connected */}
        <div className="absolute top-6 left-6 z-20">
          <AnimatePresence>
            {isLive && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 text-[11px] font-bold tracking-wider uppercase"
              >
                <Radio className="w-3 h-3" />
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Live
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* The Orb — no icon overlay; the orb IS the visual */}
        <div className="relative w-72 h-72 sm:w-[340px] sm:h-[340px] mb-8 mt-4 z-10 flex items-center justify-center">
          <OrbCanvas orbState={orbState} amplitudeRef={amplitudeRef} />
        </div>

        {/* Status block */}
        <div className="text-center z-10 mb-8 space-y-2" aria-live="polite">
          <div className="flex items-center justify-center gap-2.5">
            <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
            <h3 className="font-display font-bold text-2xl text-ink leading-none">
              {meta.label}
            </h3>
          </div>
          <p className="text-sm text-ink-dim h-5">{meta.sub}</p>
        </div>

        {/* Primary action */}
        <motion.button
          onClick={toggleConnection}
          className={actionButtonClasses}
          whileHover={{ scale: orbState === "connecting" ? 1 : 1.02 }}
          whileTap={{ scale: orbState === "connecting" ? 1 : 0.96 }}
          disabled={orbState === "connecting"}
          aria-label={isLive ? "Disconnect voice session" : "Start voice session"}
        >
          {isLive ? (
            <>
              <PhoneOff className="w-5 h-5" />
              End Conversation
            </>
          ) : orbState === "connecting" ? (
            <>
              <Wifi className="w-5 h-5 animate-pulse" />
              Connecting…
            </>
          ) : orbState === "error" ? (
            <>
              <Mic className="w-5 h-5" />
              Try Again
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              Start Conversation
            </>
          )}
        </motion.button>

        {/* Helper hint under button */}
        <p className="mt-4 text-[11px] text-ink-dim/80 text-center max-w-sm z-10">
          {!apiKey ? (
            <>Add a Gemini API key to enable voice. Free tier works fine.</>
          ) : isLive ? (
            <>Speak naturally. The orb reacts to your voice in real time.</>
          ) : (
            <>Your microphone is only active during an open session.</>
          )}
        </p>

        {/* Error banner */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 bg-red-100/90 backdrop-blur border border-red-200 text-red-700 rounded-2xl text-sm z-20 shadow-lg max-w-[90%]"
            >
              <WifiOff className="w-4 h-4 shrink-0" />
              <span className="font-medium truncate">{errorMsg}</span>
              <button
                onClick={() => setErrorMsg(null)}
                className="ml-1 p-0.5 rounded-full hover:bg-red-200/60 transition-colors shrink-0"
                aria-label="Dismiss error"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ApiKeyModal
        open={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        onSave={saveKey}
        current={apiKey}
      />
    </section>
  );
}