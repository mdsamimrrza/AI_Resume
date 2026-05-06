import { useState } from "react";
import { useForm } from "react-hook-form";
import { useUploadResume } from "@workspace/api-client-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const uploadSchema = z.object({
  rawText: z.string().optional(),
  jobDescription: z.string().min(50, "Job description must be at least 50 characters"),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export function UploadTab({ onUploadSuccess }: { onUploadSuccess: (id: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    setError(null);
    form.clearErrors();
  };

  const onFormSubmit = async (values: UploadFormValues) => {
    setError(null);
    const jobDescription = (values.jobDescription || "").trim();

    // Validate resume source
    if (!file && (!values.rawText || values.rawText.trim().length < 10)) {
      setError("Please upload a PDF file or paste your resume text.");
      return;
    }

    setIsUploading(true);

    if (file) {
      // Check for Vercel's 4.5MB limit
      if (file.size > 4.4 * 1024 * 1024) {
        setError("File is too large for Vercel (Max 4.4MB). Please use a smaller PDF.");
        setIsUploading(false);
        return;
      }

      // PDF UPLOAD PATH
      const formData = new FormData();
      formData.append("resumeFile", file);
      formData.append("jobDescription", jobDescription);
      if (values.jobTitle?.trim()) formData.append("jobTitle", values.jobTitle.trim());
      if (values.company?.trim()) formData.append("company", values.company.trim());

      try {
      try {
        const response = await fetch("/api/resume/upload", {
          method: "POST",
          body: formData,
          keepalive: true,
          mode: 'cors',
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.details || errData.error || `Server returned ${response.status}`);
        }
        const res = await response.json();
        onUploadSuccess(String(res.id));
      } catch (err: any) {
        console.error("Critical PDF upload error:", err);
        setError("Network error: Connection to server failed. Please refresh the page and try again. (Common on Vercel cold starts)");
        setIsUploading(false);
      }
    } else {
      // TEXT UPLOAD PATH
      uploadResume.mutate(
        { data: { rawText: values.rawText!.trim(), jobDescription, jobTitle: values.jobTitle, company: values.company } as any },
        {
          onSuccess: (res) => {
            onUploadSuccess(String(res.id));
            setIsUploading(false);
          },
          onError: (err: any) => {
            console.error("Text upload error:", err);
            setError(err?.data?.error || "Upload failed. Please check your inputs and try again.");
            setIsUploading(false);
          }
        }
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-purple-500">Workspace Setup</h2>
        <p className="text-muted-foreground">Upload your resume PDF or paste the content to begin analysis.</p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-medium">
          ⚠ {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Your Resume</Label>

              {/* No file selected → show upload drop zone + text paste */}
              {!file && (
                <div className="space-y-4">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-purple-500/5 border-purple-500/20 hover:bg-purple-500/10 transition-colors">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-8 h-8 mb-2 text-purple-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="text-sm text-purple-500 font-semibold">Click to upload Resume PDF</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF only, max 10MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    />
                  </label>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or paste text below</span>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="rawText"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Paste your resume content here..."
                            className="min-h-[250px] resize-none font-mono text-sm bg-purple-500/5 border-purple-500/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* File selected → show file card */}
              {file && (
                <div className="p-6 border-2 border-purple-500/30 bg-purple-500/10 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-500 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-purple-500">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready for analysis</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileChange(null)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>

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
            disabled={isUploading}
          >
            {isUploading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            {isUploading ? "Analyzing..." : "Start Analysis"}
          </Button>
        </form>
      </Form>
    </motion.div>
  );
}