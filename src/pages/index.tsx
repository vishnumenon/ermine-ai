"use strict";

import Head from "next/head";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faFileZipper,
  faMicrophoneLines,
  faStop,
} from "@fortawesome/free-solid-svg-icons";
import { ElementRef, Fragment, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import Whisper from "../whisper";
import AudioPlayer from "@/components/AudioPlayer";
import { downloadZip } from "client-zip";
import WindowProgress from "@/components/WindowProgress/WindowProgress";
import Spinner from "@/components/Spinner/Spinner";
import { formatSeconds } from "@/util";

let whisper: any = null;

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [hasWeights, setHasWeights] = useState<boolean | undefined>(false);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("Untitled");
  const [transcription, setTranscription] = useState<{
    [w: number]: string | null;
  }>({});
  const [hasAudio, setHasAudio] = useState(false);
  const [currentWindow, setCurrentWindow] = useState<number | undefined>();
  const [recordingStart, setRecordingStart] = useState<number | undefined>();
  const audioPlayer = useRef<ElementRef<typeof AudioPlayer>>(null);

  useEffect(() => {
    whisper = new Whisper();
  }, []);

  useEffect(() => {
    if (isRecording) {
      setRecordingStart(Date.now());
      setTranscription({
        0: null,
      });
      whisper.startStreaming();
    } else {
      setRecordingStart(undefined);
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
        .map(([window, text]) => `{${formatSeconds(window)}} ${text}`)
        .join(" ")}`,
    };

    const audioData = whisper.audioRecorder.getAudioBlob();
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
        <a
          href="https://github.com/vishnumenon/ermine-ai"
          className="github-corner"
          aria-label="View source on GitHub"
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 250 250"
            style={{
              fill: "#151513",
              color: "#fff",
              position: "absolute",
              top: 0,
              border: 0,
              right: 0,
            }}
            aria-hidden="true"
          >
            <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path>
            <path
              d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"
              fill="currentColor"
              style={{ transformOrigin: "130px 106px;" }}
              className="octo-arm"
            ></path>
            <path
              d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z"
              fill="currentColor"
              className="octo-body"
            ></path>
          </svg>
        </a>
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
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 flex min-h-0 flex-col transition-all">
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
                  "flex flex-col md:flex-row w-full": afterRecording,
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
                  className={classNames("inline-block", {
                    "w-0 pl-0 overflow-clip": !hasAudio,
                    "md:flex-1 md:pl-4 mt-4 md:mt-0 w-full md:w-auto": hasAudio,
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
              className={classNames("transition-all bg-white rounded-xl", {
                "flex-1 border p-4 mt-4 min-h-0 overflow-auto":
                  !beforeRecording,
                "flex-0 h-0 overflow-hidden p-0": beforeRecording,
              })}
            >
              {transcriptionWindows.map(([window, transcript], i) => (
                <Fragment key={window}>
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
                  {transcript === null ? (
                    <WindowProgress
                      isRecording={isRecording}
                      recordingStart={recordingStart}
                      windowStart={window}
                      onWindowEnd={(window) => {
                        setTranscription((prev) => ({
                          ...prev,
                          [window + 30]: prev[window + 30] ?? null,
                        }));
                      }}
                    />
                  ) : (
                    <span
                      className={classNames({
                        "bg-red-50 border-t border-b border-red-500":
                          window === currentWindow,
                      })}
                    >
                      {transcript.trim()}
                    </span>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
          <div
            className={classNames(
              "transition-all flex items-center justify-center",
              {
                "flex-0 h-0 overflow-hidden": !afterRecording,
                "pt-6": afterRecording,
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
              Before using Ermine.AI, your browser needs to load and initialize
              the transcription model. The first time you use Ermine.AI, this
              might take a few minutes while the model files are downloaded and
              cached (~50mb). Please be patient! Later sessions will be much
              faster. Currently, the model only supports English transcription.
              <div className="pt-2 font-semibold">
                If you&apos;re prompted to allow microphone access, please do
                so!
              </div>
            </div>
          }
          actions={[
            <Button
              onClick={async () => {
                setLoadingModel(true);
                await whisper.init(
                  (data: any) => {
                    if (data.status === "progress") {
                      // console.debug(data);
                    }
                  },
                  (result: any) => {
                    setTranscription((prev) => ({
                      ...prev,
                      [result.windowStart]: result.transcript.text,
                    }));
                  }
                );
                setLoadingModel(false);
                setHasWeights(true);
              }}
              className="bg-green-600 text-neutral-50 hover:bg-green-700 disabled:hover:cursor-not-allowed disabled:bg-neutral-500"
              key={1}
              disabled={loadingModel}
            >
              {loadingModel && <Spinner />}
              Load Model
            </Button>,
          ]}
        />
      </main>
    </>
  );
}
