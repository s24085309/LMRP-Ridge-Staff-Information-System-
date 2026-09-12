"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const EXAMPLES = [
  "How do I create a Teamlist?",
  "Recovery",
  "Google Classroom",
  "Parent Evening",
  "Newsletter",
  "Credit Card Jot Form",
  "Letterhead",
];

export default function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  const submit = (term?: string) => {
    const q = (term ?? value).trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className={compact ? "" : "w-full"}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="relative"
      >
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="What are you looking for?"
          aria-label="Search Ridge Oasis"
          className={`ro-focus-ring w-full rounded-xl border border-white/10 bg-ro-navy-800 py-3 pl-11 pr-4 text-white placeholder:text-slate-500 ${
            compact ? "text-sm" : "text-lg"
          }`}
        />
      </form>

      {!compact && (
        <>
          <p className="mt-2 text-sm text-slate-400">
            Search for a procedure, document, person, system, form or topic...
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => submit(ex)}
                className="ro-focus-ring rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:border-ro-teal-500/40 hover:text-white"
              >
                {ex}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
