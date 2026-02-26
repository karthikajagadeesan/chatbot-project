import { create } from 'zustand'
import type { Tables } from '@/type/database-type'

interface ProjectState {
    projects: Tables<'projects'>[]
    currentProject: Tables<'projects'> | null

    // Actions
    setProjects: (projects: Tables<'projects'>[]) => void
    setCurrentProject: (project: Tables<'projects'> | null) => void
    addProject: (project: Tables<'projects'>) => void
    updateProjectInStore: (id: string, updates: Partial<Tables<'projects'>>) => void
    removeProject: (id: string) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
    projects: [],
    currentProject: null,

    setProjects: (projects) => set({ projects }),

    setCurrentProject: (project) => set({ currentProject: project }),

    addProject: (project) => set((state) => ({
        projects: [project, ...state.projects]
    })),

    updateProjectInStore: (id, updates) => set((state) => ({
        projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
        ),
        currentProject: state.currentProject?.id === id
            ? { ...state.currentProject, ...updates }
            : state.currentProject
    })),

    removeProject: (id) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject
    })),
}))
