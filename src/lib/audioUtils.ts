const WORKLET_CODE = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  floatTo16BitPCM(input) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  }

  process(inputs) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      if (channelData) {
        const pcm16 = this.floatTo16BitPCM(channelData);
        // Send Int16Array back to main thread
        this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
      }
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
`;

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export class AudioRecorder {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onData: (base64PCM: string) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      } });
      
      // Force 16kHz for Gemini input
      this.context = new window.AudioContext({ sampleRate: 16000 });
      
      const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      await this.context.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);

      this.source = this.context.createMediaStreamSource(this.stream);
      this.workletNode = new AudioWorkletNode(this.context, 'pcm-processor');

      this.workletNode.port.onmessage = (e) => {
        const arrayBuffer = e.data as ArrayBuffer;
        const base64 = arrayBufferToBase64(arrayBuffer);
        this.onData(base64);
      };

      this.source.connect(this.workletNode);
      this.workletNode.connect(this.context.destination); // Required for some browsers to process worklet
    } catch (err) {
      console.error("Error starting audio recording", err);
      throw err;
    }
  }

  stop() {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.context && this.context.state !== 'closed') {
      this.context.close();
      this.context = null;
    }
  }
}

export class AudioPlayer {
  private context: AudioContext | null = null;
  private nextTime: number = 0;

  init() {
    if (!this.context) {
      // Gemini output is 24kHz
      this.context = new window.AudioContext({ sampleRate: 24000 });
      this.nextTime = this.context.currentTime;
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  playBase64PCM(base64PCM: string) {
    this.init();
    if (!this.context) return;

    const arrayBuffer = base64ToArrayBuffer(base64PCM);
    const int16Data = new Int16Array(arrayBuffer);
    
    // Convert Int16 to Float32
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / (int16Data[i] < 0 ? 0x8000 : 0x7FFF);
    }

    const audioBuffer = this.context.createBuffer(1, float32Data.length, 24000);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = this.context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.context.destination);

    // Schedule playback seamlessly
    const startTime = Math.max(this.context.currentTime, this.nextTime);
    source.start(startTime);
    this.nextTime = startTime + audioBuffer.duration;
  }

  stop() {
    this.nextTime = 0;
    if (this.context && this.context.state !== 'closed') {
      this.context.close();
      this.context = null;
    }
  }

  interrupt() {
    // Quickly stop current playback and reset queue without closing context
    if (this.context) {
      this.context.suspend().then(() => {
        if (this.context) {
          this.nextTime = this.context.currentTime;
          this.context.resume();
        }
      });
    }
  }
}
