import classNames from "classnames";
import React from "react";

export interface ButtonProps {
  className?: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

function Button({ className, children, ...props }: ButtonProps) {
  return (
    <button
      className={classNames(
        "rounded-xl px-4 py-3 gap-4 inline-flex items-center cursor-pointer transition-all",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
