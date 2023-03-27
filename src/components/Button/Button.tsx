import classNames from "classnames";
import React from "react";

export interface ButtonProps {
  className?: string;
  children: React.ReactNode;
  onClick: () => void;
}

function Button({ className, children, ...props }: ButtonProps) {
  return (
    <button
      className={classNames(
        "rounded-xl px-4 py-3 gap-4 inline-flex items-center",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
