'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { ApiError } from '@/lib/api/axios-config';
import {
    getDeviceFingerprint,
    getDeviceLabel,
} from '@/lib/auth/device-fingerprint';
import { useAuthStore } from '@/stores/use-auth-store';
import { getMyProfileApi, loginApi } from '@/service/user/api';
import {
    LoginFormValues,
    LoginRequest,
    Role,
    loginFormSchema,
} from '@/service/user/type';

export default function LoginPage() {
    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm md:max-w-4xl">
                <LoginForm />
            </div>
        </div>
    );
}

const getDefaultRouteByRoles = (roles: Role[]) => {
    if (roles.includes('SYSTEM_ADMIN')) {
        return '/admin';
    }

    if (roles.includes('PARKING_MANAGER')) {
        return '/manager';
    }

    if (roles.includes('STAFF')) {
        return '/staff';
    }

    if (roles.includes('PARKING_USER')) {
        return '/driver';
    }

    return '/';
};

function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
    const router = useRouter();

    const setJwtToken = useAuthStore((state) => state.setJwtToken);
    const setSession = useAuthStore((state) => state.setSession);
    const [showPassword, setShowPassword] = useState(false);
    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
            username: '',
            password: '',
        },
    });

    const loginMutation = useMutation({
        mutationFn: async (values: LoginFormValues) => {
            const payload: LoginRequest = {
                ...values,
                deviceFingerprint: getDeviceFingerprint(values.username),
                deviceLabel: getDeviceLabel(values.username),
            };

            const auth = await loginApi(payload);

            if (!auth.authenticated || !auth.accessToken) {
                throw new Error('Login failed. Please try again.');
            }

            setJwtToken(auth.accessToken);

            const user = await getMyProfileApi();

            return {
                auth,
                user,
            };
        },
        onSuccess: ({ auth, user }) => {
            setSession({
                user,
                jwtToken: auth.accessToken,
            });

            toast.success('Login successfully!');

            router.replace(getDefaultRouteByRoles(user.roles));
        },
        onError: (error: ApiError | Error) => {
            toast.error(error.message || 'Login failed');
        },
    });

    const onSubmit = (values: LoginFormValues) => {
        loginMutation.mutate(values);
    };

    const isPending = loginMutation.isPending;

    return (
        <div className={cn('flex flex-col gap-6', className)} {...props}>
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form
                        className="p-6 md:p-8"
                        onSubmit={form.handleSubmit(onSubmit)}
                    >
                        <FieldGroup>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold">
                                    Welcome back
                                </h1>
                                <p className="text-muted-foreground text-balance">
                                    Login to your SmartPark account
                                </p>
                            </div>

                            <Field>
                                <FieldLabel htmlFor="username">
                                    Email
                                </FieldLabel>
                                <Input
                                    id="username"
                                    type="email"
                                    placeholder="system.admin@smartpark.local"
                                    autoComplete="username"
                                    disabled={isPending}
                                    {...form.register('username')}
                                />
                                <FieldError
                                    errors={[form.formState.errors.username]}
                                />
                            </Field>

                            <Field>
                                <div className="flex items-center">
                                    <FieldLabel htmlFor="password">
                                        Password
                                    </FieldLabel>
                                    <Link
                                        href="/forgot-password"
                                        className="ml-auto text-sm underline-offset-2 hover:underline"
                                    >
                                        Forgot your password?
                                    </Link>
                                </div>

                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        autoComplete="current-password"
                                        disabled={isPending}
                                        className="pr-10"
                                        {...form.register('password')}
                                    />

                                    <button
                                        type="button"
                                        aria-label={
                                            showPassword
                                                ? 'Hide password'
                                                : 'Show password'
                                        }
                                        disabled={isPending}
                                        onClick={() =>
                                            setShowPassword(
                                                (current) => !current,
                                            )
                                        }
                                        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>

                                <FieldError
                                    errors={[form.formState.errors.password]}
                                />
                            </Field>
                            <Field>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isPending}
                                >
                                    {isPending ? 'Logging in...' : 'Login'}
                                </Button>
                            </Field>
                        </FieldGroup>
                    </form>

                    <div className="bg-muted relative hidden md:block">
                        <Image
                            src="https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?q=80&w=2574&auto=format&fit=crop"
                            alt="SmartPark Parking Building"
                            fill
                            priority
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>
                </CardContent>
            </Card>

            <FieldDescription className="px-6 text-center">
                By clicking continue, you agree to our{' '}
                <Link
                    href="/terms"
                    className="hover:text-primary underline underline-offset-4"
                >
                    Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                    href="/privacy"
                    className="hover:text-primary underline underline-offset-4"
                >
                    Privacy Policy
                </Link>
                .
            </FieldDescription>
        </div>
    );
}
