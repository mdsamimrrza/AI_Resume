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
import { Menu } from "lucide-react";

export type TabId = "upload" | "extraction" | "gaps" | "suggestions" | "rewrite" | "diff" | "validation";

export default function Analyzer() {
  const [activeTab, setActiveTab] = useState<TabId>("upload");
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: statusData } = useGetResumeStatus((resumeId as any) ?? "", {
    query: {
      enabled: !!resumeId,
      queryKey: getGetResumeStatusQueryKey((resumeId as any) ?? ""),
      refetchInterval: (query) => {
        return query.state.data?.stage !== "complete" ? 3000 : false;
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
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <AppSidebar 
        activeTab={activeTab} 
        onChangeTab={setActiveTab} 
        pipelineStatus={statusData}
        resumeId={resumeId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-40">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">ResumeLift</h1>
          <div className="w-10" /> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="container mx-auto px-4 py-8 lg:p-12 max-w-6xl">
            <div className="transition-all duration-300 ease-in-out">
              {activeTab === "upload" && <UploadTab onUploadSuccess={(id) => { setResumeId(id); setActiveTab("extraction"); }} />}
              {activeTab === "extraction" && <ExtractionTab resumeId={resumeId} />}
              {activeTab === "gaps" && <GapAnalysisTab resumeId={resumeId} />}
              {activeTab === "suggestions" && <SuggestionsTab resumeId={resumeId} />}
              {activeTab === "rewrite" && <RewriteTab resumeId={resumeId} />}
              {activeTab === "diff" && <DiffViewerTab resumeId={resumeId} />}
              {activeTab === "validation" && <ValidationTab resumeId={resumeId} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}