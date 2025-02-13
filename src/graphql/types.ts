export interface Project {
  id: string;
  name: string;
  isActive: boolean;
  slug: string;
}

export interface GetProjectsData {
  projects: Project[];
} 