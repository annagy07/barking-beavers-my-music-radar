import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container, Eyebrow } from "@/components/ui/Container";
import { LoginForm } from "@/components/login/LoginForm";

const ERROR_COPY: Record<string, string> = {
  missing: "That link is missing its token — try requesting a new one below.",
  expired: "That link has expired or was already used — request a new one below.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <main className="flex-1">
        <Container className="max-w-md py-16 sm:py-20">
          <Eyebrow>Sign in</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            Enter the email your subscription is under — we&rsquo;ll send a
            one-time link to sign in, no password needed.
          </p>

          {error && ERROR_COPY[error] && (
            <p className="mt-4 border border-accent bg-accent/10 px-4 py-3 text-sm">
              {ERROR_COPY[error]}
            </p>
          )}

          <div className="mt-8">
            <LoginForm />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
