import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, CheckSquare, Wallet, StickyNote } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";

export function QuickAddFAB() {
  const [open, setOpen] = useState(false);
  const openQuick = useUIStore((s) => s.openQuick);
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", onDoc);
    }
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-0 safe-pb">
      {open && (
        <ul
          className="mb-3 w-[220px] origin-bottom-right rounded-xl border border-slate-200/90 bg-white py-1.5 shadow-lg shadow-slate-900/10"
          role="menu"
        >
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition duration-200 hover:bg-slate-50"
              onClick={() => {
                openQuick("task");
                setOpen(false);
              }}
            >
              <CheckSquare className="h-4 w-4 text-primary" />
              Görev ekle
            </button>
          </li>
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition duration-200 hover:bg-slate-50"
              onClick={() => {
                openQuick("expense");
                setOpen(false);
              }}
            >
              <Wallet className="h-4 w-4 text-primary" />
              Gider ekle
            </button>
          </li>
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition duration-200 hover:bg-slate-50"
              onClick={() => {
                void navigate("/ideas", { state: { openIdea: true } });
                setOpen(false);
              }}
            >
              <StickyNote className="h-4 w-4 text-primary" />
              Not ekle
            </button>
          </li>
        </ul>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-14 w-14 items-center justify-center rounded-full bg-primary text-slate-900 shadow-float transition duration-200 hover:scale-105 active:scale-95 ${
          open ? "ring-2 ring-primary/30 ring-offset-2" : ""
        }`}
        style={{ marginBottom: "max(0rem, env(safe-area-inset-bottom))" }}
        aria-label="Hızlı ekle"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Plus
          className={`h-7 w-7 transition duration-200 ${open ? "rotate-45" : ""}`}
          strokeWidth={2.5}
        />
      </button>
    </div>
  );
}
