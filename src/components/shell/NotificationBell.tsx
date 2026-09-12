"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface NotificationItem {
  id: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = () => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="ro-focus-ring relative rounded-full p-2 text-slate-300 hover:bg-white/5 hover:text-white"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 5 1.5 6.5H4.5C4.5 13 6 12 6 8Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-ro-danger" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-white/10 bg-ro-navy-800 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <p className="text-sm font-semibold text-white">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="ro-focus-ring text-xs text-ro-teal-500 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">You&apos;re all caught up.</p>
            ) : (
              notifications.map((n) => (
                <NotificationRow key={n.id} notification={n} onRead={markRead} onClose={() => setOpen(false)} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  notification,
  onRead,
  onClose,
}: {
  notification: NotificationItem;
  onRead: (id: string) => void;
  onClose: () => void;
}) {
  const content = (
    <div
      className={`border-b border-white/5 px-4 py-3 text-sm transition hover:bg-white/5 ${
        notification.read ? "text-slate-400" : "text-slate-100"
      }`}
    >
      <div className="flex items-start gap-2">
        {!notification.read && <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ro-teal-500" />}
        <div className={notification.read ? "" : "flex-1"}>
          <p>{notification.message}</p>
          <p className="mt-1 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link
        href={notification.link}
        onClick={() => {
          if (!notification.read) onRead(notification.id);
          onClose();
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => !notification.read && onRead(notification.id)}
      className="block w-full text-left"
    >
      {content}
    </button>
  );
}
