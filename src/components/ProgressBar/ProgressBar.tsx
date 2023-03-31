import React from "react";

export interface ProgressBarProps {
  progress: number;
}

function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
      <div
        className="bg-red-600 h-1.5 rounded-full"
        style={{ width: progress + "%" }}
      ></div>
    </div>
  );
}

export default ProgressBar;
