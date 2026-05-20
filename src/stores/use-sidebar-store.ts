import { create } from 'zustand';

interface SidebarState {
    isCollapsed: boolean;
    setCollapsed: (isCollapsed: boolean) => void;
    toggle: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
    isCollapsed: false,
    setCollapsed: (isCollapsed) => set({ isCollapsed }),
    toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
}));
