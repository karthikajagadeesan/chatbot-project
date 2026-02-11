"use client";

import React, { useState } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Drag Handle ─────────────────────────────────────────────
export function DragHandle({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "flex items-center justify-center cursor-grab active:cursor-grabbing touch-none",
                "text-muted-foreground/40 hover:text-muted-foreground transition-colors",
                className
            )}
        >
            <GripVertical className="h-4 w-4" />
        </div>
    );
}

// ─── Sortable Item Wrapper ───────────────────────────────────
interface SortableItemProps {
    id: string;
    children: (props: { dragHandleProps: Record<string, any>; isDragging: boolean }) => React.ReactNode;
    className?: string;
}

function SortableItem({ id, children, className }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: "relative" as const,
        zIndex: isDragging ? 50 : "auto",
    };

    return (
        <div ref={setNodeRef} style={style} className={className}>
            {children({
                dragHandleProps: { ...attributes, ...listeners },
                isDragging,
            })}
        </div>
    );
}

// ─── SortableList ────────────────────────────────────────────
interface SortableListProps<T> {
    /** The items to render. Each must have a unique identifier. */
    items: T[];
    /** Return a unique string id for each item. */
    getItemId: (item: T, index: number) => string;
    /** Called when items are reordered. Receives the new array. */
    onReorder: (items: T[]) => void;
    /** Render function for each item. */
    renderItem: (
        item: T,
        index: number,
        dragHandleProps: Record<string, any>,
        isDragging: boolean
    ) => React.ReactNode;
    /** Optional render function for the drag overlay (item being dragged). */
    renderOverlay?: (item: T, index: number) => React.ReactNode;
    /** Container class name. */
    className?: string;
    /** Class name for each sortable item wrapper. */
    itemClassName?: string;
    /** Whether drag is disabled. */
    disabled?: boolean;
}

export function SortableList<T>({
    items,
    getItemId,
    onReorder,
    renderItem,
    renderOverlay,
    className,
    itemClassName,
    disabled = false,
}: SortableListProps<T>) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const ids = items.map((item, idx) => getItemId(item, idx));

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = ids.indexOf(active.id as string);
        const newIndex = ids.indexOf(over.id as string);
        if (oldIndex === -1 || newIndex === -1) return;

        const newItems = arrayMove(items, oldIndex, newIndex);
        onReorder(newItems);
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    if (disabled) {
        return (
            <div className={className}>
                {items.map((item, index) => (
                    <div key={getItemId(item, index)} className={itemClassName}>
                        {renderItem(item, index, {}, false)}
                    </div>
                ))}
            </div>
        );
    }

    const activeIndex = activeId ? ids.indexOf(activeId) : -1;
    const activeItem = activeIndex >= 0 ? items[activeIndex] : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                <div className={className}>
                    {items.map((item, index) => (
                        <SortableItem
                            key={getItemId(item, index)}
                            id={getItemId(item, index)}
                            className={itemClassName}
                        >
                            {({ dragHandleProps, isDragging }) =>
                                renderItem(item, index, dragHandleProps, isDragging)
                            }
                        </SortableItem>
                    ))}
                </div>
            </SortableContext>

            <DragOverlay adjustScale={false}>
                {activeItem && renderOverlay ? (
                    <div className="opacity-90 shadow-xl rounded-lg ring-2 ring-primary/20">
                        {renderOverlay(activeItem, activeIndex)}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
