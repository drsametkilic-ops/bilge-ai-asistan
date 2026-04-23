import { useCallback } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/Button";
import {
  KANBAN_STATUSES,
  KANBAN_LABELS,
  type TaskWorkStatus,
} from "@/types";

export interface BoardItem {
  id: string;
  title: string;
  workStatus: TaskWorkStatus;
}

type WorkBoardProps<T extends BoardItem> = {
  title: string;
  addLabel: string;
  onAdd: () => void;
  items: T[];
  filterSlot?: React.ReactNode;
  onPatchStatus: (id: string, status: TaskWorkStatus) => void | Promise<void>;
  renderCard: (item: T) => React.ReactNode;
};

function useTaskDrag(id: string) {
  return useDraggable({ id });
}

const colId = (s: TaskWorkStatus) => `col-${s}`;

function ColHead({ status, children, count }: { status: TaskWorkStatus; children: React.ReactNode; count: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: colId(status) });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[min(60vh,420px)] w-full min-w-[220px] shrink-0 flex-col rounded-xl border-2 border-dashed border-slate-200/90 bg-slate-50/80 shadow-sm transition-all duration-200 sm:min-w-[240px] md:max-w-[min(100%,300px)] md:flex-1 ${
        isOver ? "border-primary border-solid bg-primary/5 shadow-md ring-1 ring-primary/20" : ""
      }`}
    >
      <div className="shrink-0 border-b border-slate-200/80 px-3 py-2">
        <p className="text-sm font-semibold text-slate-800">{KANBAN_LABELS[status]}</p>
        <p className="text-xs text-slate-500">{count} kayıt</p>
      </div>
      <div className="max-h-[min(60vh,560px)] flex-1 space-y-3 overflow-y-auto overflow-x-hidden scroll-smooth px-2.5 py-2.5 [scrollbar-gutter:stable]">
        {children}
      </div>
    </div>
  );
}

function DraggableFrame({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useTaskDrag(id);
  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? ("relative" as const) : undefined,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        isDragging
          ? "z-20 scale-[1.02] cursor-grabbing shadow-lg ring-2 ring-primary/35"
          : "cursor-grab active:cursor-grabbing"
      }
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

export function WorkBoard<T extends BoardItem>({
  title,
  addLabel,
  onAdd,
  items,
  filterSlot,
  onPatchStatus,
  renderCard,
}: WorkBoardProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) {
        return;
      }
      const aId = String(active.id);
      if (String(over.id) === aId) {
        return;
      }
      const oId = String(over.id);
      if (oId.startsWith("col-")) {
        const next = oId.replace(/^col-/, "") as TaskWorkStatus;
        if (!KANBAN_STATUSES.includes(next)) {
          return;
        }
        const t = items.find((i) => i.id === aId);
        if (t && t.workStatus === next) {
          return;
        }
        void onPatchStatus(aId, next);
        return;
      }
      const overItem = items.find((i) => i.id === oId);
      if (overItem && overItem.id !== aId) {
        const next = overItem.workStatus;
        const t = items.find((i) => i.id === aId);
        if (t && t.workStatus === next) {
          return;
        }
        void onPatchStatus(aId, next);
      }
    },
    [items, onPatchStatus]
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-brand-dark md:text-xl">{title}</h2>
        <Button type="button" onClick={onAdd}>
          {addLabel}
        </Button>
      </div>
      {filterSlot}
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex w-full min-w-0 flex-col gap-3 md:flex-nowrap md:overflow-x-auto md:pb-1 md:[scrollbar-gutter:stable] xl:flex-row">
          {KANBAN_STATUSES.map((status) => {
            const col = items.filter((i) => i.workStatus === status);
            return (
              <ColHead key={status} status={status} count={col.length}>
                {col.map((i) => (
                  <DraggableFrame key={i.id} id={i.id}>
                    {renderCard(i)}
                  </DraggableFrame>
                ))}
              </ColHead>
            );
          })}
        </div>
      </DndContext>
    </section>
  );
}
