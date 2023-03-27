import Head from "next/head";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faFileZipper,
  faMicrophoneLines,
  faStop,
} from "@fortawesome/free-solid-svg-icons";
import { ElementRef, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import Modal from "@/components/Modal";
import ProgressBar from "@/components/ProgressBar";
import Button from "@/components/Button";
import Whisper from "../whisper";
import AudioPlayer from "@/components/AudioPlayer";
import { downloadZip } from "client-zip";

let whisper: any = null;

function formatSeconds(seconds: number) {
  const flooredSeconds = Math.floor(seconds);
  const minutes = Math.floor(flooredSeconds / 60);
  const remainingSeconds = flooredSeconds - minutes * 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasWeights, setHasWeights] = useState<boolean | undefined>(false);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [weightsProgress, setWeightsProgress] = useState<{
    [k: string]: number;
  }>({});
  const [transcription, setTranscription] = useState<{ [w: number]: string }>(
    {}
  );
  const [hasAudio, setHasAudio] = useState(false);
  const [currentWindow, setCurrentWindow] = useState<number | undefined>();
  const audioPlayer = useRef<ElementRef<typeof AudioPlayer>>(null);

  useEffect(() => {
    whisper = new Whisper();
  }, []);

  useEffect(() => {
    if (isRecording) {
      whisper.startStreaming();
    } else {
      whisper.stopStreaming();
      if (whisper.audioRecorder) {
        const audioUrl = whisper.audioRecorder.getAudioUrl();
        if (audioUrl && audioPlayer.current) {
          audioPlayer.current.setSource(audioUrl);
          setHasAudio(true);
        }
      }
    }
  }, [isRecording]);

  const beforeRecording = !isRecording && Object.keys(transcription).length < 1;
  const afterRecording = !isRecording && Object.keys(transcription).length > 0;

  const transcriptionWindows = Object.entries(transcription)
    .map(([w, t]) => [parseFloat(w), t] as [number, string])
    .sort((a, b) => a[0] - b[0]);

  async function exportBundle() {
    const transcriptFile = {
      name: title + ".md",
      lastModified: new Date(),
      input: `# ${title} \n\n${transcriptionWindows
        .map(([window, text]) => `{${window}} ${text}`)
        .join(" ")}`,
    };

    console.log(whisper);

    const audioData = whisper.audioRecorder.getAudioBlob();
    console.log(audioData);
    const audioFile = new File([audioData], title + ".ogg");

    const blob = await downloadZip([transcriptFile, audioFile]).blob();

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.zip`;
    link.click();
    link.remove();
  }

  return (
    <>
      <Head>
        <title>Ermine.ai | Local Audio Transcription</title>
        <meta
          name="description"
          content="Transcribe audio from your device microphone using 100% local / client-side processing."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="bg-neutral-50 h-screen p-6 flex flex-col">
        <h1 className="text-6xl font-light">
          <Image
            src="Stoat.svg"
            alt="Ermine.ai"
            width={40}
            height={57}
            className="inline-block mr-4"
          />
          ermine<span className="text-red-500">.</span>ai{" "}
          <span className="text-neutral-400 block text-2xl pt-4 sm:inline sm:text-neutral-300 sm:text-6xl ">
            <span className="hidden sm:inline">–</span> 100% local audio
            recording & transcription
          </span>
        </h1>
        <div className="flex flex-row flex-1">
          <div className="flex-1 flex flex-col transition-all">
            <div
              className={classNames("transition-all flex items-center", {
                "flex-1": beforeRecording,
                "justify-center": !afterRecording,
                "justify-start": afterRecording,
              })}
            >
              <div
                className={classNames("transition-all", {
                  "text-center": beforeRecording,
                  "mt-8": !beforeRecording,
                  "flex flex-row w-full": afterRecording,
                })}
              >
                <div
                  className={classNames(
                    "transition-all text-2xl italic text-neutral-400",
                    { "opacity-0 w-0 h-0 overflow-clip": !beforeRecording }
                  )}
                >
                  Click to begin transcribing
                  <div>
                    <FontAwesomeIcon icon={faArrowDown} className="py-2" />
                  </div>
                </div>
                <div
                  className={classNames(
                    "inline-block relative mb-4 transition-all",
                    {
                      "mx-4": !afterRecording,
                      "w-0 h-0 mx-0 overflow-clip": afterRecording,
                    }
                  )}
                >
                  {isRecording && (
                    <div className="animate-[ping_2s_ease-in-out_infinite] absolute top-3 left-3 bg-red-500 w-14 h-14 rounded-full" />
                  )}
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className={classNames(
                      "relative bg-red-500 w-20 h-20 rounded-full cursor-pointer hover:bg-red-600 transition-colors shadow-lg",
                      {
                        "shadow-inner bg-red-600 hover:bg-red-500":
                          !beforeRecording,
                      }
                    )}
                  >
                    <FontAwesomeIcon
                      icon={isRecording ? faStop : faMicrophoneLines}
                      className="text-neutral-50 text-2xl"
                    />
                  </button>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Recording Title"
                  className={classNames(
                    "border-neutral-300 rounded-xl transition-all w-0",
                    { "border w-64 p-4 font-semibold": !beforeRecording }
                  )}
                />
                <AudioPlayer
                  className={classNames("inline-block pl-4", {
                    "w-0 pl-0 overflow-clip": !hasAudio,
                    "flex-1": hasAudio,
                  })}
                  ref={audioPlayer}
                  onCurrentTimeChange={(time) => {
                    if (time) {
                      const window = transcriptionWindows.findLast(
                        ([w, _]) => time >= w
                      )?.[0];
                      setCurrentWindow(window);
                    } else {
                      setCurrentWindow(undefined);
                    }
                  }}
                />
              </div>
            </div>
            <div
              className={classNames(
                "transition-all bg-white rounded-xl mt-4 p-4",
                {
                  "flex-1 border": !beforeRecording,
                  "flex-0 h-0 overflow-hidden p-0": beforeRecording,
                }
              )}
            >
              {transcriptionWindows.map(([window, transcript], i) => (
                <>
                  <span
                    className={classNames(
                      "text-xs inline-block px-1 py-0.5 mx-1 rounded-lg bg-neutral-200 text-neutral-600 transition-all",
                      {
                        "hover:bg-red-600 hover:text-neutral-50 cursor-pointer":
                          hasAudio && !isRecording,
                      }
                    )}
                    onClick={() => {
                      audioPlayer.current?.setCurrentTime(window);
                      audioPlayer.current?.play();
                    }}
                  >
                    {formatSeconds(window)}
                  </span>
                  <span
                    className={classNames({
                      "text-neutral-300":
                        isRecording && i === transcriptionWindows.length - 1,
                      "bg-red-50 border-t border-b border-red-500":
                        window === currentWindow,
                    })}
                  >
                    {transcript}
                  </span>
                </>
              ))}
            </div>
          </div>
          <div
            className={classNames(
              "transition-all flex items-center justify-center",
              {
                "flex-0 w-0 overflow-hidden": !afterRecording,
                "flex-1": afterRecording,
              }
            )}
          >
            <div>
              <Button
                className="bg-green-600 text-neutral-50 text-2xl"
                onClick={exportBundle}
              >
                <FontAwesomeIcon icon={faFileZipper} />
                Download Audio + Transcript
              </Button>
            </div>
          </div>
        </div>
        <Modal
          visible={hasWeights === false}
          title="Almost ready!"
          content={
            <div className="p-5">
              Before using Ermine.AI, your browser needs to download the model
              that it&apos;ll be using. This only needs to happen once, and
              should only take a few minutes. Press the &lsquo;Load Model&rsquo;
              button to download it now (~50mb).
              <div className="pt-4">
                <ProgressBar
                  progress={
                    Object.keys(weightsProgress).length === 0
                      ? 0
                      : Object.values(weightsProgress).reduce(
                          (a, b) => a + b,
                          0
                        ) / Object.keys(weightsProgress).length
                  }
                />
              </div>
            </div>
          }
          actions={[
            <Button
              onClick={async () => {
                await whisper.init(
                  (data: any) => {
                    if (data.status === "progress") {
                      setWeightsProgress((prev) => {
                        const n = {
                          ...prev,
                          [data.file]: data.progress,
                        };
                        return n;
                      });
                    }
                  },
                  (result: any) => {
                    setTranscription((prev) => ({
                      ...prev,
                      [result.windowStart]: result.transcript.text,
                    }));
                  }
                );
                setHasWeights(true);
              }}
              className="bg-green-600 text-neutral-50"
              key={1}
            >
              Load Model
            </Button>,
          ]}
        />
      </main>
    </>
  );
}
