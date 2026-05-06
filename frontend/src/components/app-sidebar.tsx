import { type TabId } from "@/pages/analyzer";
import { PipelineStatus } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Moon, Sun, Upload, FileText, AlertCircle, Lightbulb, Edit, SplitSquareHorizontal, CheckCircle2, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppSidebarProps {
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
  pipelineStatus?: PipelineStatus;
  resumeId: string | null;
}

export function AppSidebar({ activeTab, onChangeTab, pipelineStatus, resumeId }: AppSidebarProps) {
  const { theme, setTheme } = useTheme();

  const tabs: { id: TabId; label: string; icon: React.ReactNode; color: string; statusName: string }[] = [
    { id: "upload", label: "Upload", icon: <Upload className="w-4 h-4" />, color: "text-purple-500", statusName: "upload" },
    { id: "extraction", label: "Extraction", icon: <FileText className="w-4 h-4" />, color: "text-cyan-500", statusName: "extraction" },
    { id: "gaps", label: "Gap Analysis", icon: <AlertCircle className="w-4 h-4" />, color: "text-amber-500", statusName: "gaps" },
    { id: "suggestions", label: "Suggestions", icon: <Lightbulb className="w-4 h-4" />, color: "text-pink-500", statusName: "suggestions" },
    { id: "rewrite", label: "Rewrite", icon: <Edit className="w-4 h-4" />, color: "text-green-500", statusName: "rewrite" },
    { id: "diff", label: "Diff Viewer", icon: <SplitSquareHorizontal className="w-4 h-4" />, color: "text-purple-400", statusName: "diff" },
    { id: "validation", label: "Validation", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-amber-400", statusName: "validation" },
  ];

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col justify-between">
      <div>
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight">ResumeLift</h1>
          {pipelineStatus?.matchScore && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">Match Score</span>
              <span className="text-lg font-bold text-primary">{pipelineStatus.matchScore}%</span>
            </div>
          )}
        </div>
        
        <nav className="px-3 space-y-1">
          {tabs.map((tab, index) => {
            const stageStatus = pipelineStatus?.stages?.find(s => s.name === tab.statusName);
            const status = stageStatus?.status || (resumeId && index > 0 ? "pending" : "idle");
            const isLocked = !resumeId && index > 0;

            return (
              <button
                key={tab.id}
                onClick={() => !isLocked && onChangeTab(tab.id)}
                disabled={isLocked}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                  activeTab === tab.id 
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                  isLocked && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center space-x-3">
                  <span className={cn(activeTab === tab.id ? tab.color : "")}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </div>
                
                {status === "complete" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {status === "in_progress" && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                {isLocked && <Lock className="w-3 h-3 opacity-50" />}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <><Sun className="w-4 h-4 mr-2" /> Light Mode</>
          ) : (
            <><Moon className="w-4 h-4 mr-2" /> Dark Mode</>
          )}
        </Button>
      </div>
    </div>
  );
}