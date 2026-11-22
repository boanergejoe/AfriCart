function ConfigurationError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 p-6">
      <div role="alert" className="card w-full max-w-lg bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <h1 className="card-title text-2xl">Admin console is not configured</h1>
          <p className="text-sm text-base-content/70">
            Set <code className="rounded bg-base-200 px-1 py-0.5">VITE_API_URL</code> to the deployed
            API origin followed by <code>/api</code>, then rebuild the admin app.
          </p>
        </div>
      </div>
    </main>
  );
}

export default ConfigurationError;
