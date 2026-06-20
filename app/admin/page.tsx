import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "./actions";

type Submission = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  message: string;
  created_at: string;
};

function displayName(s: Submission): string {
  if (s.first_name === "anonymous" && s.last_name === "anonymous") {
    return "anonymous";
  }
  return `${s.first_name} ${s.last_name}`.trim();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const serviceClient = createServiceClient();
  const { data: submissions, error } = await serviceClient
    .from("submissions")
    .select("id, email, first_name, last_name, message, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Submissions</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user.email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium cursor-pointer"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            Failed to load submissions.
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">
              {submissions?.length ?? 0} submission
              {submissions?.length !== 1 ? "s" : ""}
            </p>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-48">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Message
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {submissions && submissions.length > 0 ? (
                    (submissions as Submission[]).map((s, i) => (
                      <tr
                        key={s.id}
                        className={
                          i < submissions.length - 1
                            ? "border-b border-gray-100"
                            : ""
                        }
                      >
                        <td className="px-4 py-3 text-gray-900 align-top">
                          {displayName(s)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 align-top break-all">
                          {s.email}
                        </td>
                        <td className="px-4 py-3 text-gray-700 align-top whitespace-pre-wrap break-words">
                          {s.message}
                        </td>
                        <td className="px-4 py-3 text-gray-400 align-top whitespace-nowrap">
                          {formatDate(s.created_at)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-12 text-center text-gray-400"
                      >
                        No submissions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
