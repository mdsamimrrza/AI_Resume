import { useGetSuggestions, getGetSuggestionsQueryKey } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

export function SuggestionsTab({ resumeId }: { resumeId: string | null }) {
  const { data, isLoading } = useGetSuggestions((resumeId as any) ?? "", {
    query: {
      enabled: !!resumeId,
      queryKey: getGetSuggestionsQueryKey((resumeId as any) ?? ""),
    }
  });

  if (!resumeId) return <div className="text-center py-20">Upload a resume to see suggestions.</div>;
  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-pink-500">Suggestions</h2>
        <p className="text-muted-foreground">Actionable ways to improve your resume.</p>
      </div>

      <div className="grid gap-6">
        {data?.map(s => (
          <div key={s.id} className="p-6 rounded-xl border bg-card">
            <h3 className="text-xl font-bold mb-4">{s.missingSkill}</h3>
            <ul className="space-y-3">
              {s.bullets?.map((b, i) => (
                <li key={i} className="flex space-x-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-2 shrink-0" />
                  <span className="text-sm">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}