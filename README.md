<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Travis Mackie — AI Engineer Showcase

> Production-grade portfolio showcasing full-stack AI products built solo. Features voice-directed cartoon creation platform and AI music production studio with multi-agent pipelines.

View live: https://ai.studio/apps/a14e55b9-6eaf-4051-af4c-f9c78d533439

## Featured Projects

### 1. MYCARTOON.ORG — Voice-Directed Cartoon Platform
- **Live at:** https://mycartoon.org
- **Tech Stack:** React, TypeScript, Gemini 2.0 Live API, Veo 2, DALL-E, Supabase, Stripe
- **Key Features:**
  - Real-time voice direction using Gemini Live API with WebRTC
  - Multi-stage content pipeline: scriptwriting → scene generation → video production
  - Token economy with Stripe payments and subscription tiers
  - COPPA compliance with age gates and privacy controls
  - Interactive mini-games during production

### 2. REMIX: Vocal Studio Pro — AI Music Production Platform
- **Tech Stack:** React, TypeScript, Gemini 2.5 Flash, Lyria Pro API, FFmpeg, Express.js
- **Key Features:**
  - 6-agent parallel processing pipeline
  - AI-generated lyrics, beat production with Lyria Pro
  - FFmpeg audio mastering: EQ, compression, limiting
  - Real-time waveform visualization
  - Exponential backoff retry logic for API rate limits

## Recent Enhancements

✨ **Video Demo Integration:** Added live demo video for Remix project showing the complete workflow
📊 **Detailed Feature Lists:** Expanded project descriptions with comprehensive technical details from actual codebases
🎨 **Interactive Components:** Enhanced CartoonSandbox with 4-frame UI flow preview
📈 **Updated Stats:** Accurate metrics reflecting 8+ AI APIs and 15+ technologies integrated
🎯 **Enhanced Metadata:** Improved descriptions for better discoverability

## Run Locally

**Prerequisites:** Node.js 18+

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   Create `.env.local` and add your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_key_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Project Structure

```
showcase/
├── public/
│   └── remix-demo.mp4          # Demo video for Remix project
├── src/
│   ├── components/
│   │   ├── Projects.tsx        # Enhanced with video demo & detailed features
│   │   ├── Hero.tsx           # Landing section
│   │   ├── About.tsx          # Updated stats and bio
│   │   ├── Pipeline.tsx       # 6-agent architecture visualization
│   │   ├── Skills.tsx         # Comprehensive tech stack
│   │   └── ...
│   ├── App.tsx
│   └── main.tsx
└── metadata.json              # Enhanced project metadata
```

## Technologies & Skills

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Canvas/WebGL
- **AI/ML:** Gemini 2.0 Live API, Gemini 2.5 Flash/Pro, Lyria Pro, Veo 2, DALL-E
- **Backend:** Node.js, Express, FFmpeg, Supabase, PostgreSQL
- **Payments:** Stripe Payment Element, webhook handling, token economy
- **Audio:** Web Audio API, MediaRecorder API, OfflineAudioContext
- **Architecture:** Multi-agent orchestration, Promise.all parallelism, exponential backoff

## Contact

Open to freelance and contract work for AI engineering projects.

---

Built with passion in Mt. Vernon, Ohio 🚀
