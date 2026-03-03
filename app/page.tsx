import { ProjectGrid } from "@/components/ProjectGrid";

export default function Home() {
  return (
    <div className="px-8 py-10">
      <h1 className="mb-8 text-lg font-medium tracking-tight text-foreground">
        Projects
      </h1>
      <ProjectGrid />
    </div>
  );
}
