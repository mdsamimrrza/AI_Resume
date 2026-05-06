import { useGetDiff, getGetDiffQueryKey } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

export function DiffViewerTab({ resumeId }: { resumeId: number | null }) {
  const { data, isLoading } = useGetDiff(resumeId ?? 0, {
    query: {
      enabled: !!resumeId,
      queryKey: getGetDiffQueryKey(resumeId ?? 0),
    }
  });

  if (!resumeId) return <div className="text-center py-20">Upload a resume to see diffs.</div>;
  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-purple-400">Diff Viewer</h2>
        <p className="text-muted-foreground">What changed in your resume.</p>
      </div>

      <div className="bg-card border rounded-xl p-6 font-mono text-sm whitespace-pre-wrap leading-relaxed">
        {data?.diffs?.map((diff, i) => (
          <span key={i} className={
            diff.type === 'added' ? 'bg-green-500/20 text-green-400' :
            diff.type === 'removed' ? 'bg-red-500/20 text-red-400 line-through' :
            ''
          }>
            {diff.text}
          </span>
        ))}
      </div>
    </div>
  );
}