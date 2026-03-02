"use client";

import Link from "next/link";
import type { Project } from "@/lib/projects";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`} className="group block transition-opacity hover:opacity-90">
      <Card className="h-full transition-colors hover:bg-accent/50">
        <CardHeader>
          <CardTitle className="group-hover:underline">{project.title}</CardTitle>
          <CardDescription className="truncate">{project.url}</CardDescription>
        </CardHeader>
        <CardContent>
          <time
            dateTime={project.createdAt}
            className="text-xs text-muted-foreground"
          >
            {new Date(project.createdAt).toLocaleDateString()}
          </time>
        </CardContent>
      </Card>
    </Link>
  );
}
