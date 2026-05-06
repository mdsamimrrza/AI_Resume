import { useGetValidation, getGetValidationQueryKey } from "@workspace/api-client-react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export function ValidationTab({ resumeId, pipelineStage }: { resumeId: string | null; pipelineStage: string | null }) {
  const { data, isLoading } = useGetValidation((resumeId as any) ?? "", {
    query: {
      enabled: !!resumeId,
      queryKey: getGetValidationQueryKey((resumeId as any) ?? ""),
    }
  });

  if (!resumeId) return <div className="text-center py-20">Upload a resume to see validation.</div>;
  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  if (!data) {
    const ready = ["validating", "complete"].includes(pipelineStage ?? "");
    return <div className="text-center py-20 text-muted-foreground">{ready ? "Validation is not available yet for this resume." : "Validation is still running. Please wait a moment."}</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-amber-400">Validation</h2>
        <p className="text-muted-foreground">ATS compatibility and formatting checks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-card border rounded-xl flex flex-col items-center justify-center">
          <div className="text-6xl font-black text-amber-400">{data?.atsScore || 0}</div>
          <div className="text-muted-foreground mt-2">ATS Score</div>
        </div>

        <div className="space-y-4">
          {data?.checklist?.map((item, i) => (
            <div key={i} className="flex items-start space-x-3 p-4 bg-card border rounded-lg">
              {item.passed ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              )}
              <div>
                <div className="font-medium">{item.item}</div>
                {item.detail && <div className="text-sm text-muted-foreground mt-1">{item.detail}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
