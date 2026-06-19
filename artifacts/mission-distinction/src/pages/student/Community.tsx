import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useListCommunityPosts, useListCommunityGroups, useCreateCommunityPost, getListCommunityPostsQueryKey, getListCommunityGroupsQueryKey } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search, Edit3, Heart, MessageSquare, Share2, Clock, Users, PlusCircle, Send,
  MessageCircle, ArrowLeft, Loader2, Paperclip, ImageIcon, FileText, X, Download,
  UserPlus, Crown, UserMinus, BookOpen, Lightbulb, Youtube, ExternalLink, Plus,
  Shield, Brain, Play
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { io, Socket } from "socket.io-client";
import { apiFetch } from "@/lib/apiFetch";

type RichFlashcard = { deckId: number; title: string; subject: string; cardCount: number; isAdminShared?: boolean };
type RichMnemonic = { id: number; topic: string; subject: string; mnemonic: string; description?: string; isAdminShared?: boolean };
type RichVideo = { url: string; videoId: string };

type ChatMessage = {
  id: number;
  groupId: number;
  senderId?: number | null;
  senderName: string;
  senderAvatarUrl?: string | null;
  content: string;
  fileUrl?: string | null;
  fileType?: string | null;
  fileName?: string | null;
  messageType?: string | null;
  richContent?: string | null;
  createdAt: string;
};
type Group = {
  id: number; name: string; subject: string; description?: string | null;
  memberCount: number; lastMessage?: string | null; createdBy?: number | null;
};
type Deck = { id: number; subject: string; title: string; cardCount: number; isAdminShared: boolean };
type Mnemonic = { id: number; subject: string; topic: string; mnemonic: string; description?: string; isAdminShared: boolean };

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("?")[0];
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/");
      const idx = parts.indexOf("embed");
      if (idx !== -1) return parts[idx + 1];
    }
  } catch {}
  return null;
}

// ── Rich message cards ──────────────────────────────────────────────────────

function FlashcardCard({ data, isMe }: { data: RichFlashcard; isMe: boolean }) {
  return (
    <a href={`${BASE}/student/flashcards`} className="block no-underline">
      <div className={`rounded-xl border p-3 mt-1 min-w-[220px] max-w-[260px] transition-colors ${isMe ? "bg-primary/30 border-primary-foreground/20 hover:bg-primary/40" : "bg-primary/5 border-primary/20 hover:bg-primary/10"}`}>
        <div className="flex items-center gap-1.5 mb-2">
          <BookOpen size={13} className={isMe ? "text-primary-foreground/70" : "text-primary/70"} />
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${isMe ? "text-primary-foreground/70" : "text-primary/70"}`}>Flashcard Deck</span>
          {data.isAdminShared && <Shield size={10} className={isMe ? "text-primary-foreground/50" : "text-primary/50"} />}
        </div>
        <p className={`font-semibold text-sm mb-1 leading-snug ${isMe ? "text-primary-foreground" : "text-foreground"}`}>{data.title}</p>
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${isMe ? "border-primary-foreground/30 text-primary-foreground/80" : "border-primary/30 text-primary bg-primary/10"}`}>{data.subject}</Badge>
          <span className={`text-[10px] ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{data.cardCount} card{data.cardCount !== 1 ? "s" : ""}</span>
        </div>
        <div className={`flex items-center gap-1 mt-2 text-[10px] ${isMe ? "text-primary-foreground/60" : "text-primary/60"}`}>
          <Brain size={10} /> <span>Tap to study</span>
        </div>
      </div>
    </a>
  );
}

function MnemonicCard({ data, isMe }: { data: RichMnemonic; isMe: boolean }) {
  return (
    <div className={`rounded-xl border p-3 mt-1 min-w-[220px] max-w-[280px] ${isMe ? "bg-primary/30 border-primary-foreground/20" : "bg-yellow-500/5 border-yellow-500/20"}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <Lightbulb size={13} className={isMe ? "text-primary-foreground/70" : "text-yellow-400/80"} />
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${isMe ? "text-primary-foreground/70" : "text-yellow-400/80"}`}>Mnemonic</span>
        {data.isAdminShared && <Shield size={10} className={isMe ? "text-primary-foreground/50" : "text-yellow-400/50"} />}
      </div>
      <p className={`text-[10px] mb-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{data.subject} · {data.topic}</p>
      <p className={`font-bold text-sm mb-1 leading-snug ${isMe ? "text-primary-foreground" : "text-yellow-300"}`}>"{data.mnemonic}"</p>
      {data.description && (
        <p className={`text-xs leading-relaxed line-clamp-3 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{data.description}</p>
      )}
    </div>
  );
}

function VideoCard({ data, isMe }: { data: RichVideo; isMe: boolean }) {
  const thumb = `https://img.youtube.com/vi/${data.videoId}/mqdefault.jpg`;
  return (
    <a href={data.url} target="_blank" rel="noopener noreferrer" className="block no-underline mt-1">
      <div className={`rounded-xl border overflow-hidden min-w-[220px] max-w-[280px] transition-colors ${isMe ? "border-primary-foreground/20 hover:border-primary-foreground/40" : "border-border/40 hover:border-border"}`}>
        <div className="relative">
          <img src={thumb} alt="YouTube video" className="w-full aspect-video object-cover" loading="lazy" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors">
            <div className="w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg">
              <Play size={16} className="text-white ml-0.5" fill="white" />
            </div>
          </div>
        </div>
        <div className={`px-3 py-2 flex items-center gap-1.5 ${isMe ? "bg-primary/30" : "bg-card/60"}`}>
          <Youtube size={12} className={isMe ? "text-primary-foreground/60" : "text-red-400"} />
          <span className={`text-[10px] truncate ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{data.url}</span>
          <ExternalLink size={10} className={`shrink-0 ${isMe ? "text-primary-foreground/50" : "text-muted-foreground/50"}`} />
        </div>
      </div>
    </a>
  );
}

// ── Share dialogs ───────────────────────────────────────────────────────────

function FlashcardPicker({ open, onClose, onShare }: {
  open: boolean; onClose: () => void; onShare: (deck: Deck) => void;
}) {
  const { data: decks = [], isLoading } = useQuery<Deck[]>({
    queryKey: ["flashcard-decks"],
    queryFn: () => apiFetch("/api/flashcards/decks").then(r => r.json()),
    enabled: open,
  });
  const [filter, setFilter] = useState("");
  const filtered = decks.filter(d => d.title.toLowerCase().includes(filter.toLowerCase()) || d.subject.toLowerCase().includes(filter.toLowerCase()));
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="bg-card border-border/60 sm:max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><BookOpen size={16} className="text-primary" /> Share Flashcard Deck</DialogTitle></DialogHeader>
        <Input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search decks…" className="bg-background/50 border-border/50" />
        {isLoading ? <Skeleton className="h-32 w-full" /> : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No decks found. Create one in Flashcards first.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {filtered.map(deck => (
              <button key={deck.id} onClick={() => onShare(deck)}
                className="w-full text-left p-3 rounded-xl border border-border/40 bg-card/40 hover:bg-primary/5 hover:border-primary/20 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm truncate">{deck.title}</p>
                  {deck.isAdminShared && <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30 gap-1 shrink-0"><Shield size={8} /> Official</Badge>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">{deck.subject}</Badge>
                  <span className="text-xs text-muted-foreground">{deck.cardCount} cards</span>
                </div>
              </button>
            ))}
          </div>
        )}
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MnemonicPicker({ open, onClose, onShare }: {
  open: boolean; onClose: () => void; onShare: (m: Mnemonic) => void;
}) {
  const { data: mnemonics = [], isLoading } = useQuery<Mnemonic[]>({
    queryKey: ["mnemonics"],
    queryFn: () => apiFetch("/api/mnemonics").then(r => r.json()),
    enabled: open,
  });
  const [filter, setFilter] = useState("");
  const filtered = mnemonics.filter(m => m.topic.toLowerCase().includes(filter.toLowerCase()) || m.mnemonic.toLowerCase().includes(filter.toLowerCase()) || m.subject.toLowerCase().includes(filter.toLowerCase()));
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="bg-card border-border/60 sm:max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Lightbulb size={16} className="text-yellow-400" /> Share Mnemonic</DialogTitle></DialogHeader>
        <Input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search mnemonics…" className="bg-background/50 border-border/50" />
        {isLoading ? <Skeleton className="h-32 w-full" /> : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No mnemonics found. Create one in Mnemonics first.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {filtered.map(m => (
              <button key={m.id} onClick={() => onShare(m)}
                className="w-full text-left p-3 rounded-xl border border-border/40 bg-card/40 hover:bg-yellow-500/5 hover:border-yellow-500/20 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  {m.isAdminShared && <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30 gap-1"><Shield size={8} /> Official</Badge>}
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">{m.subject}</Badge>
                  <span className="text-xs text-muted-foreground font-medium truncate">{m.topic}</span>
                </div>
                <p className="text-sm font-bold text-yellow-400/90 truncate">"{m.mnemonic}"</p>
              </button>
            ))}
          </div>
        )}
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VideoPicker({ open, onClose, onShare }: {
  open: boolean; onClose: () => void; onShare: (url: string, videoId: string) => void;
}) {
  const [url, setUrl] = useState("");
  const videoId = extractYouTubeId(url.trim());
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { onClose(); setUrl(""); } }}>
      <DialogContent className="bg-card border-border/60 sm:max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Youtube size={16} className="text-red-400" /> Share YouTube Video</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">YouTube URL</label>
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="bg-background/50 border-border/50" />
          </div>
          {videoId && (
            <div className="rounded-xl overflow-hidden border border-border/40">
              <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="Preview" className="w-full aspect-video object-cover" />
            </div>
          )}
          {url.trim() && !videoId && <p className="text-xs text-destructive">Not a valid YouTube URL</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); setUrl(""); }}>Cancel</Button>
          <Button disabled={!videoId} onClick={() => { if (videoId) { onShare(url.trim(), videoId); setUrl(""); } }}>Share Video</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function StudentCommunity() {
  const [activeTab, setActiveTab] = useState("for-you");
  const [search, setSearch] = useState("");
  const [chatGroupId, setChatGroupId] = useState<number | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [postForm, setPostForm] = useState({ title: "", content: "", groupName: "" });
  const [groupForm, setGroupForm] = useState({ name: "", subject: "", description: "" });
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: number; fullName: string; avatarUrl?: string | null; college?: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState<number | null>(null);
  const [transferringTo, setTransferringTo] = useState<number | null>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);
  // Rich share state
  const [flashcardPickerOpen, setFlashcardPickerOpen] = useState(false);
  const [mnemonicPickerOpen, setMnemonicPickerOpen] = useState(false);
  const [videoPickerOpen, setVideoPickerOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { user, token } = useAuth();

  const { data: postsData, isLoading: postsLoading } = useListCommunityPosts(
    { search: search || undefined },
    { query: { queryKey: getListCommunityPostsQueryKey({ search: search || undefined }) } }
  );

  const { data: groups, isLoading: groupsLoading } = useListCommunityGroups();
  const createPost = useCreateCommunityPost();

  const groupsList: Group[] = Array.isArray(groups) ? groups : [];
  const activeGroup = groupsList.find(g => g.id === chatGroupId);

  const { data: initialMessages = [], isLoading: chatLoading } = useQuery<ChatMessage[]>({
    queryKey: ["chat-messages", chatGroupId],
    queryFn: () => customFetch(`/api/community/messages/${chatGroupId}`),
    enabled: chatGroupId !== null,
  });

  const { data: groupMembers = [] } = useQuery<{ id: number; fullName: string; avatarUrl?: string | null; role: string }[]>({
    queryKey: ["group-members", chatGroupId],
    queryFn: () => customFetch(`/api/community/groups/${chatGroupId}/members`),
    enabled: chatGroupId !== null && membersOpen,
  });

  const isGroupOwner = activeGroup && (activeGroup as any).memberRole === "owner";

  const searchStudents = async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`${BASE}/api/users/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSearchResults(await res.json());
    } catch {} finally { setSearching(false); }
  };

  const handleInvite = async (userId: number, name: string) => {
    if (!chatGroupId) return;
    setInviting(userId);
    try {
      const data = await customFetch(`/api/community/groups/${chatGroupId}/invite`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }),
      });
      toast.success((data as any).message || `${name} added!`);
      queryClient.invalidateQueries({ queryKey: getListCommunityGroupsQueryKey() });
      queryClient.invalidateQueries({ queryKey: ["group-members", chatGroupId] });
      setSearchResults(prev => prev.filter(u => u.id !== userId));
    } catch (e: any) { toast.error(e?.message || "Failed to invite"); } finally { setInviting(null); }
  };

  const handleTransferOwner = async (userId: number, name: string) => {
    if (!chatGroupId) return;
    if (!window.confirm(`Transfer group ownership to ${name}? You will become a regular member.`)) return;
    setTransferringTo(userId);
    try {
      const data = await customFetch(`/api/community/groups/${chatGroupId}/transfer-owner`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }),
      });
      toast.success((data as any).message || "Ownership transferred");
      queryClient.invalidateQueries({ queryKey: getListCommunityGroupsQueryKey() });
      queryClient.invalidateQueries({ queryKey: ["group-members", chatGroupId] });
      setMembersOpen(false);
    } catch (e: any) { toast.error(e?.message || "Failed to transfer ownership"); } finally { setTransferringTo(null); }
  };

  const handleDeleteGroup = async () => {
    if (!chatGroupId || !activeGroup) return;
    if (!window.confirm(`Permanently delete "${activeGroup.name}"? This removes all messages and members.`)) return;
    setDeletingGroup(true);
    try {
      await customFetch(`/api/community/groups/${chatGroupId}`, { method: "DELETE" });
      toast.success("Group deleted");
      queryClient.invalidateQueries({ queryKey: getListCommunityGroupsQueryKey() });
      setMembersOpen(false);
      setChatGroupId(null);
      setLiveMessages([]);
    } catch (e: any) { toast.error(e?.message || "Failed to delete group"); } finally { setDeletingGroup(false); }
  };

  useEffect(() => {
    if (initialMessages.length > 0) setLiveMessages(initialMessages as ChatMessage[]);
  }, [initialMessages]);

  const chatMessages = liveMessages.length > 0 ? liveMessages : (initialMessages as ChatMessage[]);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, typingUser]);

  useEffect(() => {
    if (!token) return;
    const sock = io(window.location.origin, {
      path: `${BASE}/api/socket.io/`,
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true, reconnectionAttempts: 5, reconnectionDelay: 2000,
    });
    socketRef.current = sock;
    sock.on("connect", () => setConnected(true));
    sock.on("disconnect", () => setConnected(false));
    sock.on("connect_error", () => setConnected(false));
    sock.on("new-message", (msg: ChatMessage) => {
      setLiveMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    sock.on("user-typing", ({ name }: { name: string }) => {
      setTypingUser(name);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setTypingUser(null), 2500);
    });
    sock.on("room-count", ({ count }: { count: number }) => setOnlineCount(count));
    return () => { sock.disconnect(); socketRef.current = null; };
  }, [token]);

  useEffect(() => {
    const sock = socketRef.current;
    if (!sock) return;
    if (chatGroupId !== null) {
      sock.emit("join-room", chatGroupId);
      setLiveMessages([]);
      setOnlineCount(0);
    }
    return () => { if (chatGroupId !== null && sock) sock.emit("leave-room", chatGroupId); };
  }, [chatGroupId]);

  const sendMessagePayload = async (payload: {
    content?: string; fileUrl?: string; fileType?: string; fileName?: string;
    messageType?: string; richContent?: string;
  }) => {
    if (!chatGroupId || sendingMsg) return;
    setSendingMsg(true);
    try {
      await customFetch(`/api/community/messages/${chatGroupId}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch { toast.error("Failed to send message."); }
    finally { setSendingMsg(false); }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    const text = chatMessage.trim();
    setChatMessage("");
    await sendMessagePayload({ content: text });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatMessage(e.target.value);
    if (chatGroupId && socketRef.current?.connected) socketRef.current.emit("typing", chatGroupId);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("File must be under 20 MB."); return; }
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${BASE}/api/upload/community-file`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Upload failed"); }
      const data = await res.json();
      await sendMessagePayload({ content: chatMessage.trim(), fileUrl: data.url, fileType: data.fileType, fileName: data.fileName });
      setChatMessage("");
    } catch (err: any) { toast.error(err?.message || "Upload failed."); }
    finally { setUploadingFile(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleShareFlashcard = async (deck: Deck) => {
    setFlashcardPickerOpen(false);
    setShareMenuOpen(false);
    await sendMessagePayload({
      content: `📚 Shared a flashcard deck: ${deck.title}`,
      messageType: "flashcard",
      richContent: JSON.stringify({ deckId: deck.id, title: deck.title, subject: deck.subject, cardCount: deck.cardCount, isAdminShared: deck.isAdminShared }),
    });
  };

  const handleShareMnemonic = async (m: Mnemonic) => {
    setMnemonicPickerOpen(false);
    setShareMenuOpen(false);
    await sendMessagePayload({
      content: `💡 Shared a mnemonic: ${m.topic}`,
      messageType: "mnemonic",
      richContent: JSON.stringify({ id: m.id, topic: m.topic, subject: m.subject, mnemonic: m.mnemonic, description: m.description, isAdminShared: m.isAdminShared }),
    });
  };

  const handleShareVideo = async (url: string, videoId: string) => {
    setVideoPickerOpen(false);
    setShareMenuOpen(false);
    await sendMessagePayload({
      content: `🎥 Shared a video`,
      messageType: "video",
      richContent: JSON.stringify({ url, videoId }),
    });
  };

  const handleCreatePost = () => {
    if (!postForm.title || !postForm.content || !postForm.groupName) { toast.error("All fields are required."); return; }
    createPost.mutate({ data: postForm }, {
      onSuccess: () => { toast.success("Post created!"); queryClient.invalidateQueries({ queryKey: getListCommunityPostsQueryKey() }); setPostOpen(false); setPostForm({ title: "", content: "", groupName: "" }); },
      onError: () => toast.error("Failed to create post."),
    });
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim() || !groupForm.subject.trim()) { toast.error("Group name and subject are required."); return; }
    setCreatingGroup(true);
    try {
      const res = await fetch(`${BASE}/api/community/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(groupForm),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Failed to create group"); }
      toast.success("Group created!");
      queryClient.invalidateQueries({ queryKey: getListCommunityGroupsQueryKey() });
      setGroupOpen(false);
      setGroupForm({ name: "", subject: "", description: "" });
    } catch (err: any) { toast.error(err?.message || "Failed to create group."); }
    finally { setCreatingGroup(false); }
  };

  const posts = Array.isArray(postsData) ? postsData : (postsData as any)?.posts ?? [];

  const SUBJECT_COLORS: Record<string, string> = {
    anatomy: "bg-red-500/20 text-red-400",
    physiology: "bg-blue-500/20 text-blue-400",
    biochemistry: "bg-green-500/20 text-green-400",
    general: "bg-purple-500/20 text-purple-400",
  };
  const getGroupColor = (subject: string) => SUBJECT_COLORS[subject.toLowerCase()] ?? "bg-primary/20 text-primary";

  // Parse rich content safely
  function parseRich<T>(raw: string | null | undefined): T | null {
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      <div className="flex-1 flex flex-col min-w-0">
        {chatGroupId !== null ? (
          <div className="flex flex-col h-full">
            {/* Chat header */}
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="icon" onClick={() => { setChatGroupId(null); setLiveMessages([]); }}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-sm shrink-0 ${getGroupColor(activeGroup?.subject || "")}`}>
                {activeGroup?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{activeGroup?.name}</p>
                <p className="text-xs text-muted-foreground">{activeGroup?.subject} · {activeGroup?.memberCount} members</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={() => setMembersOpen(true)}>
                  <Users size={12} /> Members
                </Button>
                {isGroupOwner && (
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/10" onClick={() => { setInviteOpen(true); setMemberSearch(""); setSearchResults([]); }}>
                    <UserPlus size={12} /> Invite
                  </Button>
                )}
                <Badge variant="outline" className={`text-xs ${connected ? "border-green-500/30 text-green-400 bg-green-500/5" : "border-yellow-500/30 text-yellow-400 bg-yellow-500/5"}`}>
                  {connected ? `● ${onlineCount > 0 ? onlineCount : ""}` : "○"}
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
              {chatLoading && liveMessages.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading messages...
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                  <MessageCircle className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderId === (user as any)?.id || msg.senderName === (user as any)?.fullName;
                  const flashcardData = msg.messageType === "flashcard" ? parseRich<RichFlashcard>(msg.richContent) : null;
                  const mnemonicData = msg.messageType === "mnemonic" ? parseRich<RichMnemonic>(msg.richContent) : null;
                  const videoData = msg.messageType === "video" ? parseRich<RichVideo>(msg.richContent) : null;
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      <Avatar className="h-7 w-7 shrink-0 mt-1">
                        <AvatarImage src={msg.senderAvatarUrl || ""} />
                        <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                          {msg.senderName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                        <span className="text-[10px] text-muted-foreground mb-0.5 px-1">{msg.senderName}</span>
                        {/* Rich content renders outside the bubble */}
                        {flashcardData && <FlashcardCard data={flashcardData} isMe={isMe} />}
                        {mnemonicData && <MnemonicCard data={mnemonicData} isMe={isMe} />}
                        {videoData && <VideoCard data={videoData} isMe={isMe} />}
                        {/* Standard bubble for text/image/pdf or caption alongside rich content */}
                        {((!flashcardData && !mnemonicData && !videoData) || msg.content.trim()) && !flashcardData && !mnemonicData && !videoData && (
                          <div className={`rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border/40 rounded-tl-sm"}`}>
                            {msg.fileType === "image" && msg.fileUrl && (
                              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                <img src={msg.fileUrl} alt={msg.fileName || "Image"} className="max-w-[240px] max-h-[240px] rounded-lg object-cover mb-1 cursor-pointer hover:opacity-90 transition-opacity" loading="lazy" />
                              </a>
                            )}
                            {msg.fileType === "pdf" && msg.fileUrl && (
                              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 text-xs underline mb-1 ${isMe ? "text-primary-foreground/80" : "text-primary"}`}>
                                <FileText size={14} />
                                <span className="truncate max-w-[180px]">{msg.fileName || "PDF Document"}</span>
                                <Download size={12} />
                              </a>
                            )}
                            {msg.content && <span>{msg.content}</span>}
                          </div>
                        )}
                        <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              {typingUser && (
                <div className="flex gap-2 items-center px-1">
                  <div className="flex gap-0.5 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{typingUser} is typing…</span>
                </div>
              )}
              {uploadingFile && (
                <div className="flex justify-center">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin" /> Uploading file…
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Toolbar */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-border/40">
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" className="hidden" onChange={handleFileUpload} />
              <Button size="icon" variant="ghost" className="shrink-0 text-muted-foreground hover:text-foreground" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile || sendingMsg} title="Attach photo or PDF">
                <Paperclip className="h-4 w-4" />
              </Button>
              {/* Share rich content */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="shrink-0 text-muted-foreground hover:text-primary" title="Share flashcard, mnemonic, or video" disabled={sendingMsg}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-card border-border/60 w-52" align="start" side="top">
                  <DropdownMenuItem className="gap-3 cursor-pointer focus:bg-primary/10" onClick={() => setFlashcardPickerOpen(true)}>
                    <BookOpen size={15} className="text-primary shrink-0" />
                    <span>Share Flashcard Deck</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-3 cursor-pointer focus:bg-yellow-500/10" onClick={() => setMnemonicPickerOpen(true)}>
                    <Lightbulb size={15} className="text-yellow-400 shrink-0" />
                    <span>Share Mnemonic</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-3 cursor-pointer focus:bg-red-500/10" onClick={() => setVideoPickerOpen(true)}>
                    <Youtube size={15} className="text-red-400 shrink-0" />
                    <span>Share YouTube Video</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Input
                placeholder="Type a message..."
                className="bg-card/50 border-border/50 flex-1"
                value={chatMessage}
                onChange={handleTyping}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
              />
              <Button size="icon" onClick={handleSendMessage} disabled={sendingMsg || !chatMessage.trim()}>
                {sendingMsg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Community Hub</h1>
                <p className="text-muted-foreground">Connect with peers, share resources, and learn together.</p>
              </div>
              <div className="flex gap-2">
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input placeholder="Search posts..." className="pl-9 bg-card/50 border-border/50" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Button className="shrink-0" onClick={() => setPostOpen(true)}>
                  <Edit3 className="mr-2 h-4 w-4" /> Post
                </Button>
              </div>
            </div>

            <Tabs defaultValue="for-you" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="bg-transparent border-b border-border/50 h-auto p-0 flex-wrap justify-start rounded-none mb-4 w-full overflow-x-auto hide-scrollbar">
                <TabsTrigger value="for-you" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary py-3">For You</TabsTrigger>
                <TabsTrigger value="popular" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary py-3">Popular</TabsTrigger>
              </TabsList>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-4">
                {postsLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <Card key={i} className="bg-card/40 border-border/40"><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
                  ))
                ) : posts.length === 0 ? (
                  <div className="p-12 text-center border border-dashed rounded-xl text-muted-foreground">
                    No posts found. Be the first to post!
                  </div>
                ) : (
                  [...posts]
                    .sort(activeTab === "popular"
                      ? (a: any, b: any) => (b.likeCount || 0) - (a.likeCount || 0)
                      : (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                    .map((post: any) => (
                      <Card key={post.id} className="bg-card/40 border-border/40 hover:bg-card/60 transition-colors">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarImage src={post.authorAvatarUrl || ""} />
                              <AvatarFallback className="bg-primary/20 text-primary">{post.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                                <div>
                                  <span className="font-semibold text-sm">{post.author}</span>
                                  <span className="text-muted-foreground text-xs ml-2">in</span>
                                  <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 border-primary/30 text-primary bg-primary/5">{post.groupName}</Badge>
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Clock size={12} className="mr-1" /> {new Date(post.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <h3 className="font-bold text-base mt-2 mb-1">{post.title}</h3>
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{post.content}</p>
                              <div className="flex items-center gap-6">
                                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors"><Heart size={16} /> {post.likeCount}</button>
                                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-blue-500 transition-colors"><MessageSquare size={16} /> {post.replyCount || 0}</button>
                                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-green-500 transition-colors"><Share2 size={16} /> Share</button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </Tabs>
          </>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 shrink-0 space-y-4">
        <Card className="bg-card/40 border-border/40">
          <CardHeader className="p-4 pb-2 border-b border-border/40 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><MessageCircle size={16} className="text-primary" /> Groups</CardTitle>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary" onClick={() => setGroupOpen(true)}>
              <PlusCircle size={13} /> New Group
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {groupsLoading ? (
              <div className="p-4"><Skeleton className="h-20 w-full" /></div>
            ) : groupsList.length === 0 ? (
              <div className="p-4 text-xs text-center text-muted-foreground">No groups yet. Create the first one!</div>
            ) : (
              <div className="divide-y divide-border/40 max-h-80 overflow-y-auto">
                {groupsList.map((g) => (
                  <button key={g.id} className="w-full p-3 hover:bg-muted/20 cursor-pointer flex items-center gap-3 text-left transition-colors"
                    onClick={() => { setChatGroupId(g.id); setActiveTab("for-you"); }}>
                    <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${getGroupColor(g.subject)}`}>
                      {g.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{g.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{g.lastMessage ? g.lastMessage : `${g.memberCount} members · ${g.subject}`}</p>
                    </div>
                    <MessageCircle size={14} className="text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/40">
          <CardHeader className="p-4 pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Share2 size={15} className="text-primary" /> Share in Chat</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><ImageIcon size={13} className="text-blue-400 shrink-0" /><span>Photos &amp; PDFs (via 📎)</span></div>
              <div className="flex items-center gap-2"><BookOpen size={13} className="text-primary shrink-0" /><span>Flashcard Decks (via +)</span></div>
              <div className="flex items-center gap-2"><Lightbulb size={13} className="text-yellow-400 shrink-0" /><span>Mnemonics (via +)</span></div>
              <div className="flex items-center gap-2"><Youtube size={13} className="text-red-400 shrink-0" /><span>YouTube Videos (via +)</span></div>
              <p className="text-[10px] text-muted-foreground/60 pt-1">Open any group chat and tap + to share study materials.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader><DialogTitle>Create a Post</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Title <span className="text-destructive">*</span></Label><Input placeholder="What's on your mind?" className="bg-background/50" value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Group <span className="text-destructive">*</span></Label>
              <Select value={postForm.groupName} onValueChange={(v) => setPostForm({ ...postForm, groupName: v })}>
                <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select a group" /></SelectTrigger>
                <SelectContent>{groupsList.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Content <span className="text-destructive">*</span></Label><Textarea placeholder="Share your thoughts, doubts, or resources..." className="bg-background/50 min-h-[120px] resize-none" value={postForm.content} onChange={(e) => setPostForm({ ...postForm, content: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePost} disabled={createPost.isPending}>{createPost.isPending ? "Posting..." : "Post"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="bg-card border-border/50 max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Users size={16} /> {activeGroup?.name} — Members</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto py-1">
            {groupMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No members yet.</p>
            ) : groupMembers.map(m => (
              <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/20">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={m.avatarUrl || ""} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">{m.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-medium truncate">{m.fullName}</span>
                {m.role === "owner" ? (
                  <Badge variant="outline" className="text-[10px] px-1.5 border-yellow-500/30 text-yellow-400 gap-1 shrink-0"><Crown size={9} /> Owner</Badge>
                ) : isGroupOwner ? (
                  <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] shrink-0 border-primary/30 text-primary hover:bg-primary/10" disabled={transferringTo === m.id} onClick={() => handleTransferOwner(m.id, m.fullName)}>
                    {transferringTo === m.id ? <Loader2 size={10} className="animate-spin" /> : "Make Owner"}
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
          {isGroupOwner && (
            <div className="pt-2 border-t border-border/40 space-y-2">
              <Button size="sm" className="w-full gap-2" onClick={() => { setMembersOpen(false); setInviteOpen(true); setMemberSearch(""); setSearchResults([]); }}><UserPlus size={14} /> Invite More Students</Button>
              <Button size="sm" variant="outline" className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10" disabled={deletingGroup} onClick={handleDeleteGroup}>
                {deletingGroup ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />} Delete Group
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="bg-card border-border/50 max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus size={16} /> Invite to {activeGroup?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search student by name..." className="pl-9 bg-background/50" value={memberSearch} onChange={e => { setMemberSearch(e.target.value); searchStudents(e.target.value); }} />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {searchResults.length === 0 && memberSearch.length >= 2 && !searching && <p className="text-sm text-muted-foreground text-center py-4">No students found.</p>}
              {memberSearch.length < 2 && <p className="text-xs text-muted-foreground text-center py-4">Type a name to search for students.</p>}
              {searchResults.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20">
                  <Avatar className="h-8 w-8"><AvatarImage src={u.avatarUrl || ""} /><AvatarFallback className="bg-primary/20 text-primary text-xs">{u.fullName.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{u.fullName}</p>{u.college && <p className="text-xs text-muted-foreground truncate">{u.college}</p>}</div>
                  <Button size="sm" className="h-7 px-3 shrink-0" disabled={inviting === u.id} onClick={() => handleInvite(u.id, u.fullName)}>
                    {inviting === u.id ? <Loader2 size={12} className="animate-spin" /> : "Add"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent className="bg-card border-border/50 max-w-md">
          <DialogHeader><DialogTitle>Create a Group</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Group Name <span className="text-destructive">*</span></Label><Input placeholder="e.g. Anatomy Study Circle" className="bg-background/50" value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} maxLength={80} /></div>
            <div className="space-y-1.5"><Label>Subject <span className="text-destructive">*</span></Label>
              <Select value={groupForm.subject} onValueChange={(v) => setGroupForm({ ...groupForm, subject: v })}>
                <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Anatomy">Anatomy</SelectItem>
                  <SelectItem value="Physiology">Physiology</SelectItem>
                  <SelectItem value="Biochemistry">Biochemistry</SelectItem>
                  <SelectItem value="NEET PG">NEET PG</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label><Textarea placeholder="What is this group about?" className="bg-background/50 resize-none min-h-[80px]" value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} maxLength={300} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateGroup} disabled={creatingGroup || !groupForm.name.trim() || !groupForm.subject}>
              {creatingGroup ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rich share pickers */}
      <FlashcardPicker open={flashcardPickerOpen} onClose={() => setFlashcardPickerOpen(false)} onShare={handleShareFlashcard} />
      <MnemonicPicker open={mnemonicPickerOpen} onClose={() => setMnemonicPickerOpen(false)} onShare={handleShareMnemonic} />
      <VideoPicker open={videoPickerOpen} onClose={() => setVideoPickerOpen(false)} onShare={handleShareVideo} />
    </div>
  );
}
