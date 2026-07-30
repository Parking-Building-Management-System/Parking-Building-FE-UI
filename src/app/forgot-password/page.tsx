'use client';

import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/features/admin/error-message';
import { requestStaffPasswordResetApi } from '@/service/user/api';
import {
    passwordResetRequestSchema,
    type PasswordResetRequestValues,
} from '@/service/user/type';

const SUCCESS_MESSAGE =
    'Your request has been recorded. Please contact your Parking Manager to verify your identity and receive a new password.';

export default function ForgotPasswordPage() {
    const form = useForm<PasswordResetRequestValues>({
        resolver: zodResolver(passwordResetRequestSchema),
        defaultValues: { email: '' },
    });
    const requestMutation = useMutation({
        mutationFn: requestStaffPasswordResetApi,
        onSuccess: () => {
            form.reset();
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(
                    error,
                    'Unable to record the request. Please try again.',
                ),
            );
        },
    });

    return (
        <main className="bg-muted flex min-h-svh items-center justify-center p-6">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Forgot password</CardTitle>
                    <CardDescription>
                        Staff can ask their Parking Manager to verify their
                        identity and set a new password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {requestMutation.isSuccess ? (
                        <div
                            className="space-y-5"
                            role="status"
                            aria-live="polite"
                        >
                            <div className="flex gap-3 rounded-lg border border-emerald-600/30 bg-emerald-500/10 p-4 text-sm">
                                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                                <p>{SUCCESS_MESSAGE}</p>
                            </div>
                            <Button asChild className="w-full">
                                <Link href="/auth/login">
                                    <ArrowLeft data-icon="inline-start" />
                                    Back to login
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <form
                            className="space-y-5"
                            onSubmit={form.handleSubmit((values) =>
                                requestMutation.mutate(values),
                            )}
                        >
                            <Field>
                                <FieldLabel htmlFor="email">
                                    Staff email
                                </FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="staff@example.com"
                                    disabled={requestMutation.isPending}
                                    {...form.register('email')}
                                />
                                <FieldDescription>
                                    For privacy, the response is the same for
                                    every submitted address.
                                </FieldDescription>
                                <FieldError
                                    errors={[form.formState.errors.email]}
                                />
                            </Field>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={requestMutation.isPending}
                            >
                                {requestMutation.isPending ? (
                                    <Loader2
                                        className="animate-spin"
                                        data-icon="inline-start"
                                    />
                                ) : null}
                                {requestMutation.isPending
                                    ? 'Submitting request...'
                                    : 'Request password reset'}
                            </Button>
                            <Button
                                asChild
                                variant="link"
                                className="w-full"
                            >
                                <Link href="/auth/login">
                                    <ArrowLeft data-icon="inline-start" />
                                    Back to login
                                </Link>
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
