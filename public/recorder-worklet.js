"use strict";

// Inspired by: https://dev.to/louisgv/quick-guide-to-audioworklet-30df

class Chunker extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 16000 * 30;
    this._bytesWritten = 0;
    this._windowStart = 0;
    this._buffer = new Float32Array(this.bufferSize);
    this.port.onmessage = (e) => {
      if (e.data === "stop") {
        this.sendPartialBuffer();
      }
    };
  }

  sendPartialBuffer() {
    console.log("Sending final buffer");
    this.port.postMessage({
      audio: this._buffer.slice(0, this._bytesWritten),
      windowStartTime: this._windowStart,
    });
  }

  process(inputs) {
    const input = inputs[0];
    const inputLength = input[0].length;
    const buffer = this._buffer;
    const bufferLength = buffer.length;
    const bytesWritten = this._bytesWritten;

    for (let i = 0; i < inputLength; i++) {
      buffer[bytesWritten + i] = input[0][i];
    }

    this._bytesWritten += inputLength;

    if (this._bytesWritten >= bufferLength) {
      this.port.postMessage({
        audio: buffer,
        windowStartTime: this._windowStart,
      });
      this._bytesWritten = 0;
      this._windowStart += 30;
    }

    return true;
  }
}

registerProcessor("chunker", Chunker);
