import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">☕</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Thank you!
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Your coffee is on its way. We really appreciate the support.
        </p>
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
