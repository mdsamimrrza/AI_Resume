import { useGetExtraction, getGetExtractionQueryKey } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export function ExtractionTab({ resumeId }: { resumeId: number | null }) {
  const { data, isLoading } = useGetExtraction(resumeId ?? 0, {
    query: {
      enabled: !!resumeId,
      queryKey: getGetExtractionQueryKey(resumeId ?? 0),
    }
  });

  if (!resumeId) return <div className="text-center py-20 text-muted-foreground">Upload a resume to see extraction results.</div>;
  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>;
  if (!data) return <div className="text-center py-20 text-muted-foreground">Waiting for extraction to complete...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-cyan-500">Skill Extraction</h2>
        <p className="text-muted-foreground">We found {data.skills?.length || 0} key skills in your resume.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">Extracted Skills</h3>
          <div className="flex flex-wrap gap-2">
            {data.skills?.map((skill, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                key={skill.id} 
                className="px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 text-sm font-medium"
              >
                {skill.skillName}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">Experience Timeline</h3>
            <div className="p-4 bg-card rounded-xl border">
              <div className="text-2xl font-bold text-cyan-500">{data.experienceYears || 0} Years</div>
              <p className="text-sm text-muted-foreground mt-1">Total combined experience</p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Job Titles</h3>
            <ul className="space-y-2">
              {data.jobTitles?.map((title, i) => (
                <li key={i} className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span>{title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}