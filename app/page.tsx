import { ProjectGrid } from "@/components/ProjectGrid";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">
          Projects
        </h1>
        <ProjectGrid />
      </main>
    </div>
  );
}
