"use client";

import Link from "next/link";
import type { Project } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function ProjectCard({
  project,
  onDelete,
}: {
  project: Project;
  onDelete?: (id: string) => void;
}) {
  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!onDelete) return;
    if (window.confirm("Delete this project? This cannot be undone.")) {
      onDelete(project.id);
    }
  }

  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <div className="relative h-full border border-border bg-card p-5 rounded transition-colors hover:border-foreground/20 hover:bg-card/80">
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            title="Delete project"
            aria-label="Delete project"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
        <div className="pr-8 mb-1 text-sm font-medium text-foreground">
          {project.title}
        </div>
        <div className="text-xs text-muted-foreground truncate mb-4">
          {project.url}
        </div>
        <time
          dateTime={project.createdAt}
          className="text-xs text-muted-foreground/60"
        >
          {new Date(project.createdAt).toLocaleDateString()}
        </time>
      </div>
    </Link>
  );
}
