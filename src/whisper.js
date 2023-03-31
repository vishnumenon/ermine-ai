"use strict";

import { AudioRecorder } from "./recorder";

export default class Whisper {
  transcriber;
  audioRecorder;
  worker;

  constructor() {
    this.transcriber = null;
    this.audioRecorder = null;
    this.worker = null;
  }

  init(onProgress, onResult) {
    return new Promise((resolve, reject) => {
      this.audioRecorder = new AudioRecorder();
      this.worker = new Worker(new URL("./whisper-worker.js", import.meta.url));
      this.worker.onmessage = (e) => {
        switch (e.data.status) {
          case "progress":
            onProgress?.(e.data.progress);
            break;
          case "workerReady":
            this.audioRecorder.init().then(resolve);
            break;
          case "transcriptReady":
            onResult?.(e.data);
        }
      };
      this.worker.onrror = (e) => {
        console.error(e);
        reject(e);
      };
    });
  }

  startStreaming() {
    console.log("Starting Audio Streaming...");
    this.audioRecorder &&
      this.audioRecorder.start(async (audio, windowStart) => {
        this.worker.postMessage({ status: "audioReady", audio, windowStart });
      });
  }

  stopStreaming() {
    this.audioRecorder && this.audioRecorder.stop();
  }
}
