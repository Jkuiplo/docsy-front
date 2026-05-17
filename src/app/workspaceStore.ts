import { create } from 'zustand';

interface WorkspaceState {
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: (workspaceId: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  selectedWorkspaceId: localStorage.getItem('selectedWorkspaceId'),
  setSelectedWorkspaceId: (workspaceId) => {
    if (workspaceId) {
      localStorage.setItem('selectedWorkspaceId', workspaceId);
    } else {
      localStorage.removeItem('selectedWorkspaceId');
    }

    set({ selectedWorkspaceId: workspaceId });
  },
}));
