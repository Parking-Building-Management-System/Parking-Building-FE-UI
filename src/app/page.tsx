import {
    CTASection,
    FeatureGrid,
    HeroSection,
    LandingFooter,
    LandingNavbar,
    OperationsSection,
} from '@/features/landing';

export default function Home() {
    return (
        <main className="dark bg-background text-foreground min-h-svh overflow-hidden">
            <LandingNavbar />
            <HeroSection />
            <FeatureGrid />
            <OperationsSection />
            <CTASection />
            <LandingFooter />
        </main>
    );
}
