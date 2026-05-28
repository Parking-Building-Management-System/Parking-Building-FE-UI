'use client';

import { useEffect } from 'react';

import { getMyProfileApi, refreshApi } from '@/service/user/api';
import { useAuthStore } from '@/stores/use-auth-store';

let bootstrapPromise: Promise<void> | null = null;

export function AuthBootstrap() {
    useEffect(() => {
        const bootstrapAuth = async () => {
            const authStore = useAuthStore.getState();

            authStore.setCheckingAuth(true);

            try {
                const auth = await refreshApi();

                if (!auth.authenticated || !auth.accessToken) {
                    throw new Error('Refresh response is not authenticated.');
                }

                authStore.setJwtToken(auth.accessToken);

                const user = await getMyProfileApi();

                authStore.setSession({
                    user,
                    jwtToken: auth.accessToken,
                });
            } catch {
                useAuthStore.getState().clearAuth();
            }
        };

        bootstrapPromise ??= bootstrapAuth().finally(() => {
            bootstrapPromise = null;
        });
    }, []);

    return null;
}
