import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiFetchJson } from "@/lib/apiFetch";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, Sparkles, BookOpen, Lightbulb, Clock, ChevronDown, ChevronUp, X } from "lucide-react";

interface AIExplanation {
  topic: string;
  subject: string;
  explanation: string;
  keyPoints: string[];
  memoryTip: string;
  relatedTopics: string[];
}

interface PhotoDoubt {
  id: number;
  imageUrl: string;
  question: string | null;
  subject: string | null;
  aiExplanation: AIExplanation;
  createdAt: string;
}

export default function PhotoDoubtSolver() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AIExplanation & { imageUrl: string } | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ["photo-doubts-history"],
    queryFn: () => apiFetchJson<{ doubts: PhotoDoubt[] }>("/api/photo-doubt/my-history"),
  });

  const solveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedImage) throw new Error("Please select an image");
      const formData = new FormData();
      formData.append("image", selectedImage);
      if (question.trim()) formData.append("question", question.trim());

      const token = localStorage.getItem("mission_token");
      const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const resp = await fetch(`${BASE}/api/photo-doubt`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to solve doubt");
      }
      return resp.json() as Promise<AIExplanation & { imageUrl: string }>;
    },
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["photo-doubts-history"] });
      toast.success("Doubt solved!");
    },
    onError: (e: any) => toast.error(e.message ?? "Something went wrong"),
  });

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10 MB"); return; }
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 max-w-xl mx-auto">
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Camera className="text-primary" size={20} />
          <h1 className="text-xl font-bold text-primary">Photo Doubt Solver</h1>
        </div>
        <p className="text-sm text-muted-foreground">Photograph any textbook question or diagram — AI explains it instantly</p>
      </div>

      {/* Upload area */}
      {!previewUrl ? (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-8 text-center mb-4">
          <Sparkles className="mx-auto mb-3 text-primary" size={28} />
          <p className="text-foreground font-medium mb-1">Take a photo or upload an image</p>
          <p className="text-xs text-muted-foreground mb-5">Textbook pages, diagrams, MCQs, clinical images — anything</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => cameraInputRef.current?.click()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Camera size={16} className="mr-2" /> Camera
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              <Upload size={16} className="mr-2" /> Upload
            </Button>
          </div>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
          />
        </div>
      ) : (
        <div className="mb-4 relative">
          <img
            src={previewUrl}
            alt="Selected"
            className="w-full rounded-2xl object-contain max-h-64 bg-muted"
          />
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 bg-black/70 rounded-full p-1.5 text-white hover:bg-black"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Optional question */}
      {previewUrl && (
        <div className="mb-4">
          <Textarea
            placeholder="Optional: Type your specific question about this image..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            className="bg-card border-border text-foreground placeholder:text-muted-foreground resize-none text-sm"
            rows={2}
            maxLength={500}
          />
        </div>
      )}

      {/* Solve button */}
      {previewUrl && !result && (
        <Button
          onClick={() => solveMutation.mutate()}
          disabled={solveMutation.isPending}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 text-base rounded-xl mb-5"
        >
          {solveMutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              AI is analysing...
            </span>
          ) : (
            <span className="flex items-center gap-2"><Sparkles size={16} /> Solve this Doubt</span>
          )}
        </Button>
      )}

      {/* Result */}
      {result && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-primary font-semibold">{result.subject}</p>
              <h2 className="text-base font-bold text-foreground">{result.topic}</h2>
            </div>
            <Button onClick={clearImage} variant="outline" size="sm" className="text-xs">
              New Photo
            </Button>
          </div>

          {/* Explanation */}
          <div className="bg-card rounded-xl p-4 border border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={14} className="text-primary" />
              <p className="text-xs font-semibold text-primary">Explanation</p>
            </div>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{result.explanation}</p>
          </div>

          {/* Key Points */}
          {result.keyPoints?.length > 0 && (
            <div className="bg-card rounded-xl p-4 border border-border/40">
              <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">✓ Key Points</p>
              <ul className="space-y-1">
                {result.keyPoints.map((pt, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0">•</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Memory Tip */}
          {result.memoryTip && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb size={14} className="text-yellow-600 dark:text-yellow-400" />
                <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">Memory Tip</p>
              </div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">{result.memoryTip}</p>
            </div>
          )}

          {/* Related Topics */}
          {result.relatedTopics?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {result.relatedTopics.map((t, i) => (
                <span key={i} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/30">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {(historyQuery.data?.doubts?.length ?? 0) > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">Previous Doubts</h2>
          </div>
          <div className="space-y-2">
            {historyQuery.data!.doubts.map(d => (
              <div key={d.id} className="bg-card border border-border/40 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedHistory(expandedHistory === d.id ? null : d.id)}
                  className="w-full flex items-center gap-3 p-3 text-left"
                >
                  <img src={d.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{d.aiExplanation.topic ?? "Doubt"}</p>
                    <p className="text-xs text-muted-foreground">{d.subject ?? d.aiExplanation.subject} · {new Date(d.createdAt).toLocaleDateString()}</p>
                  </div>
                  {expandedHistory === d.id ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />}
                </button>
                {expandedHistory === d.id && (
                  <div className="px-3 pb-3 space-y-2">
                    <img src={d.imageUrl} alt="" className="w-full rounded-lg max-h-48 object-contain bg-muted" />
                    {d.question && <p className="text-xs text-primary italic">"{d.question}"</p>}
                    <p className="text-sm text-foreground leading-relaxed">{d.aiExplanation.explanation}</p>
                    {d.aiExplanation.keyPoints?.length > 0 && (
                      <ul className="space-y-1 mt-2">
                        {d.aiExplanation.keyPoints.map((pt, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-green-600 dark:text-green-400">•</span> {pt}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
