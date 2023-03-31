"use strict";

export class AudioRecorder {
  context: AudioContext | null;
  sampleRate: number;
  callbackIntervalMS: number;
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[] | null;
  stream: MediaStream | null;
  chunker: AudioWorkletNode | null;

  constructor() {
    this.sampleRate = 16000;
    this.callbackIntervalMS = 5000; // Call onAudio at this rate
    this.context = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.chunker = null;
  }

  getAudioUrl() {
    const blob = this.getAudioBlob();
    if (blob) {
      return window.URL.createObjectURL(blob);
    }
  }

  getAudioBlob() {
    if (this.audioChunks) {
      const audio = new Blob(this.audioChunks, {
        type: "audio/ogg; codecs=opus",
      });
      return audio;
    }
  }

  async init() {
    this.context = new window.AudioContext({
      sampleRate: this.sampleRate,
      // @ts-ignore
      channelCount: 1,
      echoCancellation: false,
      autoGainControl: true,
    });
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    this.mediaRecorder = new MediaRecorder(this.stream);
  }

  stop() {
    this.mediaRecorder?.stop();
    this.chunker?.port.postMessage("stop");
    this.context?.suspend();
  }

  async start(onAudio: (audio: Float32Array, windowStart: number) => void) {
    if (!this.mediaRecorder) {
      throw new Error("Media recorder not initialized.");
    }
    if (!this.stream) {
      throw new Error("Stream not initialized.");
    }
    if (!this.context) {
      throw new Error("Audio context not initialized.");
    }

    const source = this.context.createMediaStreamSource(this.stream!);
    await this.context.audioWorklet.addModule("/recorder-worklet.js");
    const chunker = new AudioWorkletNode(this.context, "chunker");
    source.connect(chunker).connect(this.context.destination);

    chunker.port.onmessage = (e: {
      data: { audio: Float32Array; windowStartTime: number };
    }) => {
      onAudio?.(e.data.audio, e.data.windowStartTime);
    };

    this.chunker = chunker;

    this.mediaRecorder.ondataavailable = async (e) => {
      this.audioChunks?.push(e.data);
    };

    this.mediaRecorder.start(this.callbackIntervalMS);
  }
}
