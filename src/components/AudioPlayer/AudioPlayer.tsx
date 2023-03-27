import React, {
  ForwardedRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export interface AudioPlayerProps {
  onCurrentTimeChange: (time: number | undefined) => void;
  className?: string;
}

export interface AudioPlayerHandle {
  setSource: (url: any) => void;
  setCurrentTime: (time: number) => void;
  play: () => void;
}

const AudioPlayer: React.ForwardRefRenderFunction<
  AudioPlayerHandle,
  AudioPlayerProps
> = ({ onCurrentTimeChange, className }, ref) => {
  const playerElem = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    playerElem.current?.addEventListener("timeupdate", () => {
      onCurrentTimeChange(playerElem.current?.currentTime);
    });
  });

  useImperativeHandle(ref, () => ({
    setSource: (url: any) => {
      if (playerElem.current) {
        playerElem.current.src = url;
      }
    },
    setCurrentTime: (time: number) => {
      if (playerElem.current) {
        playerElem.current.currentTime = time;
      }
    },
    play: () => {
      if (playerElem.current) {
        playerElem.current.play();
      }
    },
  }));

  return <audio className={className} ref={playerElem} controls />;
};

export default forwardRef(AudioPlayer);
