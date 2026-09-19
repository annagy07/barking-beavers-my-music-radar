import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { BrandMark } from "@/components/ui/BrandMark";
import { STEPS, StepId } from "@/lib/onboardingState";

const STEP_LABELS: Record<StepId, string> = {
  method: "Get to know you",
  artists: "Pick artists",
  review: "Review taste",
  preferences: "What to watch",
  concerts: "Concerts",
  frequency: "Delivery",
  email: "Your email",
  confirm: "Confirm",
  preview: "Your radar",
};

export function WizardShell({
  step,
  children,
}: {
  step: StepId;
  children: React.ReactNode;
}) {
  const index = STEPS.indexOf(step);
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-line">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/">
            <BrandMark className="text-lg" />
          </Link>
          <span className="font-mono text-xs uppercase tracking-wide text-ink-soft">
            Step {index + 1} of {STEPS.length} · {STEP_LABELS[step]}
          </span>
        </Container>
        <div className="h-1 w-full bg-paper-raised">
          <div
            className="h-1 bg-accent transition-all duration-300"
            style={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </header>
      <main className="flex-1">
        <Container className="max-w-2xl py-12 sm:py-16">{children}</Container>
      </main>
    </div>
  );
}
