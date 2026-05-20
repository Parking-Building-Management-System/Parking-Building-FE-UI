export function LandingFooter() {
    return (
        <footer className="border-border border-t px-4 py-8 sm:px-6">
            <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p>SmartPark Multi-Tenant SaaS</p>
                <div className="flex items-center gap-2">
                    <span className="bg-primary size-2 rounded-full" />
                    <span>System status: operational</span>
                </div>
                <p>© 2026 SmartPark</p>
            </div>
        </footer>
    );
}
