import { toast } from "sonner";

export async function uploadAnnouncementFile(
  file: File,
  setUploading: (v: boolean) => void,
  onDone: (url: string, fileType: string, fileName: string) => void,
) {
  setUploading(true);
  try {
    const formData = new FormData();
    formData.append("file", file);
    const { apiFetch } = await import("@/lib/apiFetch");
    const res = await apiFetch("/api/upload/announcement-file", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Upload failed");
    }
    const data = await res.json();
    onDone(data.url, data.fileType, data.fileName);
    toast.success("File attached!");
  } catch (err: any) {
    toast.error(err.message || "Upload failed. Please try again.");
  } finally {
    setUploading(false);
  }
}
