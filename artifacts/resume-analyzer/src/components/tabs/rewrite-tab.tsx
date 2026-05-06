import { useGetRewrite, getGetRewriteQueryKey } from "@workspace/api-client-react";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RewriteTab({ resumeId }: { resumeId: number | null }) {
  const { data, isLoading } = useGetRewrite(resumeId ?? 0, {
    query: {
      enabled: !!resumeId,
      queryKey: getGetRewriteQueryKey(resumeId ?? 0),
    }
  });

  if (!resumeId) return <div className="text-center py-20">Upload a resume to see the rewrite.</div>;
  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-green-500" /></div>;

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 text-green-500">Rewritten Resume</h2>
          <p className="text-muted-foreground">Optimized version of your resume.</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>

      <div className="flex-1 bg-card border rounded-xl p-6 font-mono text-sm whitespace-pre-wrap overflow-y-auto">
        {data?.rewrittenText || "Waiting for rewrite..."}
      </div>
    </div>
  );
}