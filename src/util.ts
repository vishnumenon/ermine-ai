"use strict";

export class AudioRecorder {
  context: AudioContext | null;
  sampleRate: number;
  recordingIntervalSeconds: number;
  callbackIntervalMS: number;
  mediaRecorder: MediaRecorder | null;
  audio: Blob | null;

  constructor() {
    this.sampleRate = 16000;
    this.recordingIntervalSeconds = 30;
    this.callbackIntervalMS = 5000; // Call onAudio at this rate
    this.context = null;
    this.mediaRecorder = null;
    this.audio = null;
  }

  getAudioUrl() {
    if (this.audio) {
      return window.URL.createObjectURL(this.audio);
    }
  }

  getAudioBlob() {
    return this.audio;
  }

  async init() {
    this.context = new window.AudioContext({
      sampleRate: this.sampleRate,
      // @ts-ignore
      channelCount: 1,
      echoCancellation: false,
      autoGainControl: true,
      noiseSuppression: true,
    });
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    this.mediaRecorder = new MediaRecorder(stream);
  }

  stop() {
    this.mediaRecorder?.stop();
  }

  start(onAudio: (audio: Float32Array, windowStart: number) => void) {
    if (!this.mediaRecorder) {
      throw new Error("Media recorder not initialized.");
    }
    if (!this.context) {
      throw new Error("Audio context not initialized.");
    }

    let windowStartTime = 0;
    let windowStartIndex = 0;
    let chunks: Blob[] = [];

    this.mediaRecorder.ondataavailable = async (e) => {
      chunks.push(e.data);
      const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
      this.audio = blob;
      const arrayBuf = await blob.arrayBuffer();
      const buf = new Uint8Array(arrayBuf);
      const audioBuffer = await this.context!.decodeAudioData(buf.buffer);
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length - windowStartIndex,
        audioBuffer.sampleRate
      );
      console.log(audioBuffer);
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start(0, windowStartTime);
      const renderedBuffer = await offlineContext.startRendering();
      const audio = renderedBuffer.getChannelData(0);
      onAudio?.(audio, windowStartTime);

      if (
        audioBuffer.duration - windowStartTime >
        this.recordingIntervalSeconds
      ) {
        windowStartTime = audioBuffer.duration;
        windowStartIndex = audioBuffer.length;
      }
    };

    this.mediaRecorder.start(this.callbackIntervalMS);
  }
}
