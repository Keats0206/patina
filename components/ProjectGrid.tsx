"use client";

import { useEffect, useState } from "react";
import { getStoredProjects, deleteProject, type Project } from "@/lib/projects";
import { ProjectCard } from "./ProjectCard";
import { AddProjectForm } from "./AddProjectForm";
import { Skeleton } from "@/components/ui/skeleton";

function ProjectCardSkeleton() {
  return (
    <div className="border border-border bg-card p-5 rounded">
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-full mb-4" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function ProjectGrid() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setProjects(getStoredProjects());
    }
  }, [mounted]);

  function refresh() {
    setProjects(getStoredProjects());
  }

  if (!mounted) {
    return (
      <div className="space-y-8">
        <AddProjectForm onAdded={refresh} />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <li key={i}>
              <ProjectCardSkeleton />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AddProjectForm onAdded={refresh} />
      {projects.length === 0 ? (
        <div className="border border-border border-dashed rounded flex min-h-[200px] items-center justify-center py-12">
          <p className="text-center text-sm text-muted-foreground">
            No projects yet. Add one with the URL above.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectCard
                project={project}
                onDelete={(id) => {
                  deleteProject(id);
                  refresh();
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
