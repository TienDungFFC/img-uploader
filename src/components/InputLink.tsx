import { toast } from "react-toastify";
import copy from "copy-to-clipboard";
import { useState } from "react";
import type { FC } from "react";

type InputLinkProps = {
  value: string;
};

export const InputLink: FC<InputLinkProps> = ({ value }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    const isCopy = copy(value || "");
    if (isCopy) {
      setIsCopied(true);
      toast.success("Copied to clipboard", { theme: "light" });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        disabled
        value={value}
        readOnly
        className="w-full h-10 text-sm text-gray-500 truncate pr-24 bg-gray-100 pl-2 border border-gray-300 rounded-lg"
      />
      <button
        type="button"
        title="Copy to clipboard"
        className={`absolute top-1/2 -translate-y-1/2 right-1 text-sm w-20 h-8 rounded-lg transition-colors shadow-md ${
          isCopied
            ? "bg-green-500 hover:bg-green-600 shadow-green-500/50"
            : "bg-blue-500 hover:bg-blue-600 shadow-blue-500/50"
        } text-gray-50`}
        onClick={handleCopy}
      >
        {isCopied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
};
