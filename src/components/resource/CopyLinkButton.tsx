"use client";

import { useState } from "react";

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="ro-focus-ring rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:border-ro-teal-500/40"
      onClick={() => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied!" : "🔗 Copy Link"}
    </button>
  );
}
