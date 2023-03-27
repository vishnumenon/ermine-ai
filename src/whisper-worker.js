import { pipeline } from "@xenova/transformers";

let transcriber;

async function initWorker() {
  transcriber = await pipeline(
    "automatic-speech-recognition",
    "openai/whisper-tiny.en",
    {
      progress_callback: (progress) => {
        postMessage({ status: "progress", progress });
      },
    }
  );
  postMessage({ status: "workerReady" });
}

onmessage = async (e) => {
  switch (e.data.status) {
    case "audioReady":
      const result = await transcriber(e.data.audio);
      postMessage({
        status: "transcriptReady",
        transcript: result,
        windowStart: e.data.windowStart,
      });
  }
};

initWorker();
