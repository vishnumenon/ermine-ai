import React, { useEffect, useState } from "react";
import ProgressBar from "../ProgressBar/ProgressBar";
import Spinner from "../Spinner/Spinner";
import classNames from "classnames";
import { formatSeconds } from "@/util";

export interface WindowProgressProps {
  windowStart: number;
  recordingStart?: number;
  isRecording: boolean;
  onWindowEnd: (window: number) => void;
}

function WindowProgress({
  windowStart,
  recordingStart,
  isRecording,
  onWindowEnd,
}: WindowProgressProps) {
  const [duration, setDuration] = useState(0);
  const [recordingDone, setRecordingDone] = useState(false);

  useEffect(() => {
    if (recordingStart) {
      const i = setInterval(() => {
        const now = Date.now();
        const windowStartTimestamp = recordingStart + windowStart * 1000;
        const elapsed = now - windowStartTimestamp;
        const elapsedSeconds = elapsed / 1000;
        setDuration(elapsedSeconds);
        if (!recordingDone && elapsedSeconds >= 30) {
          setRecordingDone(true);
          onWindowEnd(windowStart);
        }
      }, 1000);
      return () => clearInterval(i);
    }
  }, [recordingStart, windowStart, recordingDone, onWindowEnd]);

  useEffect(() => {
    setRecordingDone(false);
  }, [windowStart]);

  console.log(duration);
  return (
    <div className="inline-flex flex-row gap-2 items-center align-middle">
      {recordingDone || !isRecording ? (
        <>
          <Spinner className="!text-neutral-400 ml-1" />
          <span className="text-neutral-400">Transcribing...</span>
        </>
      ) : (
        <>
          <div className="w-44 ml-1">
            <ProgressBar progress={(100 * duration) / 30} />
          </div>

          <span
            className={classNames(
              "text-xs inline-block px-1 py-0.5 mx-1 rounded-lg bg-red-600 text-neutral-50 transition-all"
            )}
          >
            {formatSeconds(duration + windowStart)}
          </span>
        </>
      )}
    </div>
  );
}

export default WindowProgress;
