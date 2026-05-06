import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUploadResume } from "@workspace/api-client-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const uploadSchema = z.object({
  rawText: z.string().min(50, "Resume text must be at least 50 characters"),
  jobDescription: z.string().min(50, "Job description must be at least 50 characters"),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export function UploadTab({ onUploadSuccess }: { onUploadSuccess: (id: number) => void }) {
  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      rawText: "",
      jobDescription: "",
      jobTitle: "",
      company: "",
    },
  });

  const uploadResume = useUploadResume();

  const onSubmit = (data: UploadFormValues) => {
    uploadResume.mutate(
      { data },
      {
        onSuccess: (res) => {
          onUploadSuccess(res.id);
        },
      }
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-purple-500">Workspace Setup</h2>
        <p className="text-muted-foreground">Upload your resume and the target job description to begin analysis.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="rawText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Resume</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Paste your resume content here..." 
                      className="min-h-[400px] resize-none font-mono text-sm" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="jobDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Paste the target job description here..." 
                      className="min-h-[400px] resize-none font-mono text-sm" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Job Title (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Senior Frontend Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Company (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-lg bg-purple-600 hover:bg-purple-700 text-white"
            disabled={uploadResume.isPending}
          >
            {uploadResume.isPending && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            Start Analysis
          </Button>
        </form>
      </Form>
    </motion.div>
  );
}