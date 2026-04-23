import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { createIdea, patchIdea } from "@/lib/mutations/ideas";
import type { Idea, IdeaPriority, Project } from "@/types";

export const IDEA_PRIO_TR: Record<string, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
};

export function IdeaFormModal({
  userId,
  projects,
  idea,
  onClose,
}: {
  userId: string;
  projects: Project[];
  idea: Idea | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(idea?.title ?? "");
  const [projectId, setProjectId] = useState(idea?.projectId ?? "");
  const [notes, setNotes] = useState(idea?.notes ?? "");
  const [priority, setPriority] = useState<IdeaPriority>(idea?.priority ?? "medium");
  const [color, setColor] = useState(idea?.color ?? "#f59e0b");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!title.trim()) {
      return;
    }
    setSaving(true);
    try {
      if (idea) {
        await patchIdea(userId, idea.id, {
          title: title.trim(),
          projectId: projectId === "" ? null : projectId,
          notes,
          priority,
          color,
        });
      } else {
        await createIdea(userId, {
          title: title.trim(),
          projectId: projectId === "" ? null : projectId,
          notes,
          priority,
          color,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open onClose={onClose} title={idea ? "Fikri düzenle" : "Fikir ekle"}>
      <div className="space-y-2">
        <Input id="it" label="Fikir adı" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">Hangi proje</p>
          <select
            className="w-full rounded-lg border border-slate-200 px-2 py-2"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">(Genel)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <TextArea id="in" label="Notlar" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">Önem seviyesi</p>
          <div className="flex gap-1">
            {(["low", "medium", "high"] as const).map((p) => (
              <Button
                key={p}
                type="button"
                variant={priority === p ? "surface" : "ghost"}
                className="!text-xs"
                onClick={() => setPriority(p)}
              >
                {IDEA_PRIO_TR[p]}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium">Renk tercihi</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-14 cursor-pointer"
            />
            {["#f59e0b", "#8b5cf6", "#ec4899", "#10b981", "#3b82f6", "#f43f5e"].map((c) => (
              <button
                key={c}
                type="button"
                className="h-7 w-7 rounded-lg border"
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={save} disabled={saving || !title.trim()}>
            Kaydet
          </Button>
        </div>
      </div>
    </Modal>
  );
}
