import { useGetExtraction, getGetExtractionQueryKey } from "@workspace/api-client-react";
import { Loader2, Layers, Briefcase, TrendingUp, Star, Award } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const SKILL_CATEGORIES: Record<string, { label: string; color: string }> = {
  programming: { label: "Programming", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  framework: { label: "Framework", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  database: { label: "Database", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  cloud: { label: "Cloud", color: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  tool: { label: "Tool", color: "bg-green-500/15 text-green-400 border-green-500/30" },
  soft: { label: "Soft Skill", color: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
  default: { label: "Skill", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
};

function detectCategory(skillName: string): string {
  const lower = skillName.toLowerCase();
  if (/python|java|c\+\+|c#|go|rust|swift|kotlin|php|ruby|typescript|javascript/.test(lower)) return "programming";
  if (/react|angular|vue|django|flask|spring|next\.?js|express|laravel|rails/.test(lower)) return "framework";
  if (/mysql|postgres|mongodb|redis|oracle|sqlite|dynamodb|cassandra/.test(lower)) return "database";
  if (/aws|azure|gcp|cloud|docker|kubernetes|terraform|devops/.test(lower)) return "cloud";
  if (/git|jira|figma|photoshop|excel|linux|bash|jenkins|ci\/cd/.test(lower)) return "tool";
  if (/communication|leadership|teamwork|management|agile|scrum/.test(lower)) return "soft";
  return "default";
}

function ExperienceBar({ years }: { years: number }) {
  const max = 20;
  const pct = Math.min((years / max) * 100, 100);
  const level = years < 2 ? "Junior" : years < 5 ? "Mid-Level" : years < 10 ? "Senior" : "Expert";
  const levelColor = years < 2 ? "text-blue-400" : years < 5 ? "text-cyan-400" : years < 10 ? "text-green-400" : "text-amber-400";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-4xl font-black text-cyan-400">{years}</span>
        <span className={`text-sm font-semibold ${levelColor}`}>{level}</span>
      </div>
      <p className="text-xs text-muted-foreground">Years of Experience</p>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span>5</span>
        <span>10</span>
        <span>15</span>
        <span>20+</span>
      </div>
    </div>
  );
}

export function ExtractionTab({ resumeId }: { resumeId: string | null }) {
  const { data, isLoading } = useGetExtraction((resumeId as any) ?? "", {
    query: {
      enabled: !!resumeId,
      queryKey: getGetExtractionQueryKey((resumeId as any) ?? ""),
    }
  });

  if (!resumeId) return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
      <Layers className="w-12 h-12 opacity-30" />
      <p>Upload a resume to see extraction results.</p>
    </div>
  );

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
      <p className="text-muted-foreground">Extracting skills and experience...</p>
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      <p>Waiting for extraction to complete...</p>
    </div>
  );

  // Group skills by category
  const skills = data.skills || [];
  const grouped = skills.reduce((acc, skill) => {
    const cat = detectCategory(skill.skillName);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  const categoryOrder = ["programming", "framework", "database", "cloud", "tool", "soft", "default"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-cyan-500">Skill Extraction</h2>
          <p className="text-muted-foreground mt-1">
            Identified <span className="text-cyan-400 font-semibold">{skills.length}</span> skills across{" "}
            <span className="text-cyan-400 font-semibold">{Object.keys(grouped).length}</span> categories.
          </p>
        </div>
        <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30 text-sm px-3 py-1">
          <Award className="w-3.5 h-3.5 mr-1.5" />
          {skills.length} Skills Found
        </Badge>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Skills section — 2 columns wide */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-cyan-500" />
              <h3 className="text-lg font-semibold">Skills by Category</h3>
            </div>

            {categoryOrder.map(cat => {
              const catSkills = grouped[cat];
              if (!catSkills || catSkills.length === 0) return null;
              const { label, color } = SKILL_CATEGORIES[cat];
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>{label}</span>
                    <span className="text-xs text-muted-foreground">({catSkills.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {catSkills.map((skill, i) => (
                      <motion.span
                        key={skill.id}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border cursor-default hover:scale-105 transition-transform ${color}`}
                      >
                        {skill.skillName}
                      </motion.span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Experience Card */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-500" />
              <h3 className="text-lg font-semibold">Experience</h3>
            </div>
            <ExperienceBar years={data.experienceYears || 0} />
          </div>

          {/* Job Titles Card */}
          {data.jobTitles && data.jobTitles.length > 0 && (
            <div className="bg-card border rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-cyan-500" />
                <h3 className="text-lg font-semibold">Career History</h3>
              </div>
              <ol className="space-y-3">
                {data.jobTitles.map((title, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3"
                  >
                    <span className="w-6 h-6 rounded-full bg-cyan-500/15 text-cyan-400 text-xs font-bold flex items-center justify-center shrink-0 border border-cyan-500/30">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{title}</span>
                  </motion.li>
                ))}
              </ol>
            </div>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Technical", value: (grouped.programming?.length || 0) + (grouped.framework?.length || 0) + (grouped.database?.length || 0), color: "text-blue-400" },
              { label: "Tools", value: grouped.tool?.length || 0, color: "text-green-400" },
              { label: "Cloud", value: grouped.cloud?.length || 0, color: "text-sky-400" },
              { label: "Soft Skills", value: grouped.soft?.length || 0, color: "text-pink-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-card border rounded-xl p-4 text-center">
                <div className={`text-2xl font-black ${color}`}>{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}