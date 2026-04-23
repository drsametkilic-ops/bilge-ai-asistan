import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { createProject, patchProject } from "@/lib/mutations/projects";
import type { Project, ProjectWorkStatus } from "@/types";
import { KANBAN_LABELS } from "@/types";

export function ProjectFormModal({
  userId,
  project,
  onClose,
}: {
  userId: string;
  project: Project | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [workStatus, setWorkStatus] = useState(project?.workStatus ?? "todo");
  const [color, setColor] = useState(project?.color ?? "#0ea5e9");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) {
      return;
    }
    setSaving(true);
    try {
      if (project) {
        await patchProject(userId, project.id, {
          title: title.trim(),
          description: description.trim() ? description.trim() : "",
          workStatus: workStatus as ProjectWorkStatus,
          color,
        });
      } else {
        await createProject(userId, { title: title.trim(), description: description || undefined, color, workStatus: workStatus as ProjectWorkStatus });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={project ? "Proje — düzenle" : "Yeni proje"}>
      <div className="space-y-2">
        <Input id="pt" label="Proje adı" value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextArea
          id="pd"
          label="Açıklama"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">Durum</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {(["todo", "in_progress", "done", "deferred"] as const).map((s) => (
              <Button
                key={s}
                type="button"
                variant={workStatus === s ? "surface" : "outline"}
                className="!text-xs"
                onClick={() => setWorkStatus(s)}
              >
                {KANBAN_LABELS[s]}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">Renk</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-14 cursor-pointer rounded border-0 p-0"
            />
            {["#0ea5e9", "#a855f7", "#f97316", "#22c55e", "#e11d48"].map((c) => (
              <button
                key={c}
                type="button"
                className="h-7 w-7 rounded-full border border-slate-200"
                style={{ background: c }}
                onClick={() => setColor(c)}
                title={c}
              />
            ))}
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button type="button" onClick={save} disabled={saving || !title.trim()}>
            {saving ? "…" : "Kaydet"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
