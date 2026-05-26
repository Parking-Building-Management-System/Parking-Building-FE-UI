'use client';

import { useEffect } from 'react';

import { getMyProfileApi, refreshApi } from '@/service/user/api';
import { useAuthStore } from '@/stores/use-auth-store';

export function AuthBootstrap() {
    useEffect(() => {
        let isMounted = true;

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

                if (!isMounted) {
                    return;
                }

                authStore.setSession({
                    user,
                    jwtToken: auth.accessToken,
                });
            } catch {
                if (isMounted) {
                    authStore.clearAuth();
                }
            }
        };

        bootstrapAuth();

        return () => {
            isMounted = false;
        };
    }, []);

    return null;
}
