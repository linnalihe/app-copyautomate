import SubmissionForm from "@/components/SubmissionForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <div className="mb-6">
          <div className="inline-block bg-gray-900 text-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
            <p className="text-sm font-medium leading-relaxed">
              Tell us about the project you want to build
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SubmissionForm />
        </div>
      </div>
    </main>
  );
}
