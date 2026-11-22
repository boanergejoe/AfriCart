import { Link } from "react-router";

function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 p-6">
      <div className="card w-full max-w-md bg-base-100 text-center shadow-xl">
        <div className="card-body items-center">
          <p className="text-6xl font-black text-primary">404</p>
          <h1 className="card-title">Page not found</h1>
          <p className="text-sm text-base-content/70">The page you requested does not exist.</p>
          <Link className="btn btn-primary mt-4" to="/dashboard">
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

export default NotFoundPage;
