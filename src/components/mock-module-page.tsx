import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface MockModulePageConfig {
    title: string;
    description: string;
    bullets: string[];
    plannedApis?: string[];
}

export function MockModulePage({
    title,
    description,
    bullets,
    plannedApis = [],
}: MockModulePageConfig) {
    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-2">
                <span className="bg-muted inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium">
                    Mock page / API pending
                </span>
                <h1 className="text-3xl font-semibold tracking-normal">
                    {title}
                </h1>
                <p className="text-muted-foreground max-w-2xl text-sm">
                    {description}
                </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                <Card>
                    <CardHeader>
                        <CardTitle>Planned module scope</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="text-muted-foreground list-disc space-y-2 pl-5 text-sm">
                            {bullets.map((bullet) => (
                                <li key={bullet}>{bullet}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Planned backend APIs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {plannedApis.length > 0 ? (
                            <ul className="text-muted-foreground list-disc space-y-2 pl-5 text-sm">
                                {plannedApis.map((api) => (
                                    <li key={api}>
                                        <code>{api}</code>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                Backend contract is not ready for this module.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
