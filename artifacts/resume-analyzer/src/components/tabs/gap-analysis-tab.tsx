import { useGetGaps, getGetGapsQueryKey } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

export function GapAnalysisTab({ resumeId }: { resumeId: number | null }) {
  const { data, isLoading } = useGetGaps(resumeId ?? 0, {
    query: {
      enabled: !!resumeId,
      queryKey: getGetGapsQueryKey(resumeId ?? 0),
    }
  });

  if (!resumeId) return <div className="text-center py-20">Upload a resume to see gap analysis.</div>;
  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-amber-500">Gap Analysis</h2>
        <p className="text-muted-foreground">Missing requirements between your resume and the job description.</p>
      </div>

      <div className="grid gap-4">
        {data?.map(gap => (
          <div key={gap.id} className="p-4 rounded-xl border bg-card flex justify-between items-center">
            <div>
              <div className="font-bold text-lg">{gap.missingSkill}</div>
              <div className="text-sm text-muted-foreground">{gap.suggestion}</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${gap.importanceLevel === 'critical' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
              {gap.importanceLevel}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}