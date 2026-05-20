import { UserProfile } from '@/service/user/type';
import { create } from 'zustand';

interface AuthState {
    user: UserProfile | null;
    isAuthenticated: boolean;
    isCheckingAuth: boolean;
    jwtToken: string | null;

    setAuth: (user: UserProfile | null) => void;
    setJwtToken: (token: string | null) => void;
    setCheckingAuth: (isCheckingAuth: boolean) => void;
    setSession: (payload: { user: UserProfile; jwtToken: string }) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isCheckingAuth: true,
    jwtToken: null,

    setAuth: (user) =>
        set({
            user,
            isAuthenticated: !!user,
            isCheckingAuth: false,
        }),

    setJwtToken: (token) =>
        set({
            jwtToken: token,
        }),

    setCheckingAuth: (isCheckingAuth) =>
        set({
            isCheckingAuth,
        }),

    setSession: ({ user, jwtToken }) =>
        set({
            user,
            jwtToken,
            isAuthenticated: true,
            isCheckingAuth: false,
        }),

    clearAuth: () =>
        set({
            user: null,
            isAuthenticated: false,
            isCheckingAuth: false,
            jwtToken: null,
        }),
}));
