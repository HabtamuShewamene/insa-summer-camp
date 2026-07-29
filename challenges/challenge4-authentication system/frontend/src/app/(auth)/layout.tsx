// Auth layout — intentionally no PublicRoute wrapper here.
// Pages that need redirect-if-logged-in (login, register, forgot-password)
// handle it themselves via PublicRoute.
// Pages that must be accessible regardless of auth state (reset-password,
// verify-email) need to render without being bounced away.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 md:p-8">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
