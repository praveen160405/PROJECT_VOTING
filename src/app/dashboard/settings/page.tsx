export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>
       <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">Settings Under Construction</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              This page is not yet implemented. You can build it out from here.
            </p>
          </div>
        </div>
    </div>
  );
}
