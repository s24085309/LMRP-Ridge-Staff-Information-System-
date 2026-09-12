"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupportRequest } from "@/app/(app)/s3/new/actions";
import { ACTIVITY_TYPES, SUBJECTS, SPORTS, CULTURAL_ACTIVITIES } from "@/lib/s3/categories";

interface LearnerHit {
  id: string;
  firstName: string;
  surname: string;
  grade: number | null;
  learnerId: string;
}

interface SupportCategoryOption {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
}

export default function SupportRequestForm({
  categories,
  prefill,
  duplicateWarning,
}: {
  categories: SupportCategoryOption[];
  prefill?: {
    learner?: LearnerHit | null;
    categoryId?: string;
    subcategoryId?: string;
    activityType?: string;
    activityName?: string;
    comment?: string;
  };
  duplicateWarning?: { referenceNumber: string } | null;
}) {
  const [learnerQuery, setLearnerQuery] = useState("");
  const [learnerResults, setLearnerResults] = useState<LearnerHit[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<LearnerHit | null>(prefill?.learner ?? null);
  const [categoryId, setCategoryId] = useState(prefill?.categoryId ?? "");
  const [subcategoryId, setSubcategoryId] = useState(prefill?.subcategoryId ?? "");
  const [activityType, setActivityType] = useState(prefill?.activityType ?? "");
  const [activityName, setActivityName] = useState(prefill?.activityName ?? "");
  const [comment, setComment] = useState(prefill?.comment ?? "");
  const [acknowledgedDuplicate, setAcknowledgedDuplicate] = useState(false);

  useEffect(() => {
    if (learnerQuery.trim().length < 2) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/s3/learners/search?q=${encodeURIComponent(learnerQuery)}`, { signal: controller.signal })
        .then((r) => r.json())
        .then(setLearnerResults)
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [learnerQuery]);

  const visibleLearnerResults = learnerQuery.trim().length < 2 ? [] : learnerResults;

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
  );
  const selectedSubcategory = useMemo(
    () => selectedCategory?.subcategories.find((s) => s.id === subcategoryId),
    [selectedCategory, subcategoryId]
  );

  const activityOptions =
    activityType === "Subject" ? SUBJECTS : activityType === "Sport" ? SPORTS : activityType === "Culture" ? CULTURAL_ACTIVITIES : null;

  const categoryIsOther = selectedCategory?.name === "Other";
  const subcategoryIsOther = selectedSubcategory?.name === "Other";
  const activityIsOther = activityType === "Other";

  if (duplicateWarning && !acknowledgedDuplicate) {
    return (
      <div className="rounded-xl border border-ro-warn/30 bg-ro-warn/10 p-6">
        <p className="font-semibold text-white">A similar support request has recently been submitted</p>
        <p className="mt-2 text-sm text-slate-300">
          A support request in this category was already submitted for this learner in the last
          two weeks (reference {duplicateWarning.referenceNumber}). Different staff members may
          legitimately report the same concern — this is just a heads-up.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => setAcknowledgedDuplicate(true)}
            className="ro-focus-ring rounded-lg bg-ro-teal-500 px-4 py-2 text-sm font-semibold text-ro-navy-950 hover:brightness-110"
          >
            Continue Submission
          </button>
          <a
            href="/s3/my-submissions"
            className="ro-focus-ring rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-ro-teal-500/40"
          >
            View My Submissions
          </a>
          <a
            href="/s3"
            className="ro-focus-ring rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-ro-teal-500/40"
          >
            Cancel
          </a>
        </div>
      </div>
    );
  }

  return (
    <form action={createSupportRequest} className="space-y-6">
      {acknowledgedDuplicate && <input type="hidden" name="confirmDuplicate" value="true" />}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-200">Learner</label>
        {selectedLearner ? (
          <div className="flex items-center justify-between rounded-lg border border-ro-teal-500/40 bg-ro-teal-500/5 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-white">
                {selectedLearner.firstName} {selectedLearner.surname}
              </p>
              <p className="text-xs text-slate-400">
                Grade {selectedLearner.grade ?? "—"} · {selectedLearner.learnerId}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedLearner(null)}
              className="ro-focus-ring text-xs text-slate-400 hover:text-white"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              value={learnerQuery}
              onChange={(e) => setLearnerQuery(e.target.value)}
              placeholder="Search learner by name or learner number…"
              className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-white placeholder:text-slate-500"
            />
            {visibleLearnerResults.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full rounded-lg border border-white/10 bg-ro-navy-800 shadow-xl">
                {visibleLearnerResults.map((l) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLearner(l);
                        setLearnerResults([]);
                        setLearnerQuery("");
                      }}
                      className="ro-focus-ring flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5"
                    >
                      <span>
                        {l.firstName} {l.surname}
                      </span>
                      <span className="text-xs text-slate-400">Grade {l.grade ?? "—"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <input type="hidden" name="learnerId" value={selectedLearner?.id ?? ""} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">Type of Support / Concern</label>
          <select
            name="categoryId"
            required
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSubcategoryId("");
            }}
            className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-white"
          >
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCategory && selectedCategory.subcategories.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">More specifically…</label>
            <select
              name="subcategoryId"
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-white"
            >
              <option value="">Select…</option>
              {selectedCategory.subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {(categoryIsOther || subcategoryIsOther) && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">
            Please describe the type of concern
          </label>
          <input
            name="categoryOtherDetail"
            required
            placeholder="Briefly describe the concern, since it didn't fit the listed categories"
            className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-white placeholder:text-slate-500"
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">Activity / Context</label>
          <select
            name="activityType"
            required
            value={activityType}
            onChange={(e) => {
              setActivityType(e.target.value);
              setActivityName("");
            }}
            className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-white"
          >
            <option value="">Select…</option>
            {ACTIVITY_TYPES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {activityOptions && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">
              {activityType === "Subject" ? "Subject" : activityType === "Sport" ? "Sport" : "Cultural Activity"}
            </label>
            <select
              name="activityName"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-white"
            >
              <option value="">Select…</option>
              {activityOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activityIsOther && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">
            Please describe the activity / context
          </label>
          <input
            name="activityOtherDetail"
            required
            placeholder="e.g. During a school trip, in the library, etc."
            className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-white placeholder:text-slate-500"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-200">Staff Member Comment</label>
        <textarea
          name="comment"
          required
          rows={5}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Please provide any relevant information about the concern."
          className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-white placeholder:text-slate-500"
        />
        <p className="mt-1 text-xs text-slate-500">
          Please provide factual observations where possible. Avoid assumptions or diagnostic statements.
        </p>
      </div>

      <div className="rounded-lg border border-ro-warn/30 bg-ro-warn/10 px-4 py-3 text-xs text-amber-100">
        If this concern involves an immediate safety risk or emergency, follow the school&rsquo;s
        emergency/safeguarding procedures immediately rather than relying solely on this system.
      </div>

      <button
        type="submit"
        className="ro-focus-ring w-full rounded-lg bg-ro-teal-500 px-4 py-3 font-semibold text-ro-navy-950 hover:brightness-110"
      >
        Submit Support Request
      </button>
    </form>
  );
}
