import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { UploadTab } from "@/components/tabs/upload-tab";
import { ExtractionTab } from "@/components/tabs/extraction-tab";
import { GapAnalysisTab } from "@/components/tabs/gap-analysis-tab";
import { SuggestionsTab } from "@/components/tabs/suggestions-tab";
import { RewriteTab } from "@/components/tabs/rewrite-tab";
import { DiffViewerTab } from "@/components/tabs/diff-viewer-tab";
import { ValidationTab } from "@/components/tabs/validation-tab";
import { useGetResumeStatus, getGetResumeStatusQueryKey } from "@workspace/api-client-react";

export type TabId = "upload" | "extraction" | "gaps" | "suggestions" | "rewrite" | "diff" | "validation";

export default function Analyzer() {
  const [activeTab, setActiveTab] = useState<TabId>("upload");
  const [resumeId, setResumeId] = useState<string | null>(null);

  const { data: statusData } = useGetResumeStatus((resumeId as any) ?? "", {
    query: {
      enabled: !!resumeId,
      queryKey: getGetResumeStatusQueryKey((resumeId as any) ?? ""),
      refetchInterval: (query) => {
        return query.state.data?.stage !== "complete" ? 2000 : false;
      },
    },
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        const tabs: TabId[] = ["upload", "extraction", "gaps", "suggestions", "rewrite", "diff", "validation"];
        const key = parseInt(e.key);
        if (key >= 1 && key <= 7) {
          e.preventDefault();
          setActiveTab(tabs[key - 1]);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <AppSidebar 
        activeTab={activeTab} 
        onChangeTab={setActiveTab} 
        pipelineStatus={statusData}
        resumeId={resumeId}
      />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8 max-w-6xl">
          {activeTab === "upload" && <UploadTab onUploadSuccess={(id) => { setResumeId(id); setActiveTab("extraction"); }} />}
          {activeTab === "extraction" && <ExtractionTab resumeId={resumeId} />}
          {activeTab === "gaps" && <GapAnalysisTab resumeId={resumeId} />}
          {activeTab === "suggestions" && <SuggestionsTab resumeId={resumeId} />}
          {activeTab === "rewrite" && <RewriteTab resumeId={resumeId} />}
          {activeTab === "diff" && <DiffViewerTab resumeId={resumeId} />}
          {activeTab === "validation" && <ValidationTab resumeId={resumeId} />}
        </div>
      </main>
    </div>
  );
}