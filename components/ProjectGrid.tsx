"use client";

import { useEffect, useState } from "react";
import { getStoredProjects, type Project } from "@/lib/projects";
import { ProjectCard } from "./ProjectCard";
import { AddProjectForm } from "./AddProjectForm";
import { Card, CardContent } from "@/components/ui/card";

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
      <div className="grid min-h-[200px] place-items-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AddProjectForm onAdded={refresh} />
      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-[200px] items-center justify-center py-12">
            <p className="text-center text-muted-foreground">
              No projects yet. Add one with the URL above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
