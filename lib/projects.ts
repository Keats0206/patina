export interface Project {
  id: string;
  url: string;
  title: string;
  createdAt: string;
}

const STORAGE_KEY = "soupcan-projects";

/** SessionStorage key prefix for initial AI-generated HTML when importing a URL. Value is read once then cleared. */
export const INITIAL_HTML_STORAGE_KEY_PREFIX = "soupcan-initial-";

function safeParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function getStoredProjects(): Project[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? safeParse(raw, []) : [];
}

export function setStoredProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function titleFromUrl(url: string): string {
  try {
    return new URL(url).hostname || url;
  } catch {
    return url;
  }
}

export function addProject(url: string): Project {
  const projects = getStoredProjects();
  const id = `project-${Date.now()}`;
  const title = titleFromUrl(url);
  const project: Project = {
    id,
    url,
    title,
    createdAt: new Date().toISOString(),
  };
  setStoredProjects([...projects, project]);
  return project;
}

export function getProjectById(id: string): Project | undefined {
  return getStoredProjects().find((p) => p.id === id);
}

/** Remove a project and its stored variants/initial HTML. */
export function deleteProject(id: string): void {
  if (typeof window === "undefined") return;
  const projects = getStoredProjects().filter((p) => p.id !== id);
  setStoredProjects(projects);
  localStorage.removeItem(`soupcan-variants-${id}`);
  localStorage.removeItem(`soupcan-project-context-${id}`);
  sessionStorage.removeItem(`${INITIAL_HTML_STORAGE_KEY_PREFIX}${id}`);
}

const USER_CONTEXT_KEY = "soupcan-user-context";

export function getUserContext(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(USER_CONTEXT_KEY) ?? "";
}

export function setUserContext(context: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_CONTEXT_KEY, context);
}

export function getProjectContext(projectId: string): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(`soupcan-project-context-${projectId}`) ?? "";
}

export function setProjectContext(projectId: string, context: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`soupcan-project-context-${projectId}`, context);
}
