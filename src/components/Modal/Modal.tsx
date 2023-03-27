import classNames from "classnames";
import React from "react";

export interface ModalProps {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  content: React.ReactNode;
  actions?: React.ReactNode;
  wide?: boolean;
}

function Modal({
  visible,
  onClose,
  title,
  content,
  actions,
  wide,
}: ModalProps) {
  return (
    <div
      id="default-modal"
      className={classNames(
        { hidden: !visible },
        "overflow-x-hidden overflow-y-auto fixed h-modal md:h-full top-4 left-0 right-0 md:inset-0 z-50 flex justify-center items-center bg-black bg-opacity-10"
      )}
    >
      <div
        className={classNames("relative w-full px-4 h-full md:h-auto", {
          "max-w-5xl": wide,
          "max-w-2xl": !wide,
        })}
      >
        <div className="bg-white z-50 rounded-xl shadow relative max-h-[90vh] dark:bg-gray-700  flex flex-col">
          <div className="flex items-start justify-between p-5 border-b rounded-t dark:border-gray-600">
            <h3 className="text-gray-900 text-xl lg:text-2xl font-semibold dark:text-white">
              {title}
            </h3>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </button>
            )}
          </div>
          <div className="overflow-auto max-h-full">{content}</div>
          {actions && (
            <div className="flex space-x-2 items-center p-4 border-t border-gray-200 rounded-b dark:border-gray-600 justify-end">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default Modal;
