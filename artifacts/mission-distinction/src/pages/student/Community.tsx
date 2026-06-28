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
  Shield, Brain, Play, Check, CheckCheck, MoreVertical, Trash2, Pencil, Bell, Video,
  Camera, Link
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { io, Socket } from "socket.io-client";
import { apiFetch } from "@/lib/apiFetch";
import VideoCall from "@/components/VideoCall";

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
  isEdited?: boolean | null;
  editedAt?: string | null;
  deletedForEveryone?: boolean | null;
  deletedBy?: string | null;
  seenBy?: string | null;
  createdAt: string;
};
type GroupInvite = {
  id: number; groupId: number; inviterId: number; inviterName: string;
  groupName: string; groupSubject: string; status: string; createdAt: string;
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
  const thumb = `https://i.ytimg.com/vi/${data.videoId}/mqdefault.jpg`;
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
              <img src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`} alt="Preview" className="w-full aspect-video object-cover" />
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
  const [postForm, setPostForm] = useState({ title: "", content: "" });
  const [postMediaUrl, setPostMediaUrl] = useState("");
  const [postMediaType, setPostMediaType] = useState<"image" | "video" | "">("");
  const [postYouTubeUrl, setPostYouTubeUrl] = useState("");
  const [postUploading, setPostUploading] = useState(false);
  const [postMediaMode, setPostMediaMode] = useState<"none" | "photo" | "youtube">("none");
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
  // Video call state
  const [videoOpen, setVideoOpen] = useState(false);
  // Invite / edit / delete state
  const [pendingInvites, setPendingInvites] = useState<GroupInvite[]>([]);
  const [invitedUserIds, setInvitedUserIds] = useState<Set<number>>(new Set());
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [msgCtxMenu, setMsgCtxMenu] = useState<{ msgId: number; isMe: boolean } | null>(null);
  // Emoji reactions & comments
  const [emojiPickerPostId, setEmojiPickerPostId] = useState<number | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const [commentsData, setCommentsData] = useState<Record<number, any[]>>({});
  const [commentLoading, setCommentLoading] = useState<Record<number, boolean>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<number, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const postFileInputRef = useRef<HTMLInputElement>(null);
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

  // Helper: parse seenBy JSON array
  const parseSeenByLocal = (raw: string | null | undefined): number[] => {
    try { return JSON.parse(raw || "[]") as number[]; } catch { return []; }
  };

  // Load pending invites on mount and every 30s
  useEffect(() => {
    const load = async () => {
      try {
        const data = await customFetch("/api/community/invites/my");
        setPendingInvites(Array.isArray(data) ? (data as GroupInvite[]) : []);
      } catch {}
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const handleAcceptInvite = async (inviteId: number) => {
    try {
      const data = await customFetch(`/api/community/invites/${inviteId}/accept`, { method: "POST" });
      toast.success((data as any).message || "Joined group!");
      setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
      queryClient.invalidateQueries({ queryKey: getListCommunityGroupsQueryKey() });
    } catch (e: any) { toast.error(e?.message || "Failed to accept invite"); }
  };

  const handleDeclineInvite = async (inviteId: number) => {
    try {
      await customFetch(`/api/community/invites/${inviteId}/decline`, { method: "POST" });
      toast.info("Invite declined");
      setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
    } catch (e: any) { toast.error(e?.message || "Failed to decline"); }
  };

  const handleEditMessage = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditText(msg.content);
    setMsgCtxMenu(null);
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editText.trim()) return;
    try {
      const updated = await customFetch(`/api/community/messages/${editingMessageId}`, {
        method: "PATCH", body: JSON.stringify({ content: editText.trim() }),
      });
      setLiveMessages(prev => prev.map(m => m.id === editingMessageId ? { ...m, ...(updated as ChatMessage) } : m));
      setEditingMessageId(null);
      setEditText("");
    } catch (e: any) { toast.error(e?.message || "Failed to edit message"); }
  };

  const handleDeleteMessage = async (msgId: number, forEveryone: boolean) => {
    setMsgCtxMenu(null);
    try {
      await customFetch(`/api/community/messages/${msgId}`, {
        method: "DELETE", body: JSON.stringify({ forEveryone }),
      });
      if (forEveryone) {
        setLiveMessages(prev => prev.map(m => m.id === msgId ? { ...m, deletedForEveryone: true, content: "" } : m));
      } else {
        setLiveMessages(prev => prev.filter(m => m.id !== msgId));
      }
    } catch (e: any) { toast.error(e?.message || "Failed to delete"); }
  };

  const searchStudents = async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`);
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
      toast.success((data as any).message || `Invite request sent to ${name}`);
      setInvitedUserIds(prev => new Set([...prev, userId]));
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
    sock.on("message-edited", (updated: ChatMessage) => {
      setLiveMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
    });
    sock.on("message-deleted", ({ messageId, forEveryone }: { messageId: number; forEveryone: boolean }) => {
      if (forEveryone) {
        setLiveMessages(prev => prev.map(m => m.id === messageId ? { ...m, deletedForEveryone: true, content: "" } : m));
      } else {
        setLiveMessages(prev => prev.filter(m => m.id !== messageId));
      }
    });
    sock.on("group-seen", ({ groupId: seenGroupId, userId: seenUserId }: { groupId: number; userId: number }) => {
      setLiveMessages(prev => prev.map(m => {
        if (m.groupId !== seenGroupId) return m;
        const seen = (() => { try { return JSON.parse(m.seenBy || "[]") as number[]; } catch { return []; } })();
        if (seen.includes(seenUserId)) return m;
        return { ...m, seenBy: JSON.stringify([...seen, seenUserId]) };
      }));
    });
    sock.on("new-invite", ({ invite, groupName }: { invite: GroupInvite; groupName: string }) => {
      setPendingInvites(prev => [{ ...invite, groupName }, ...prev]);
      toast.info(`${invite.inviterName} invited you to "${groupName}"`, { duration: 5000 });
    });
    return () => { sock.disconnect(); socketRef.current = null; };
  }, [token]);

  useEffect(() => {
    const sock = socketRef.current;
    if (!sock) return;
    if (chatGroupId !== null) {
      sock.emit("join-room", chatGroupId);
      setLiveMessages([]);
      setOnlineCount(0);
      // Mark messages as seen when opening chat
      apiFetch(`/api/community/groups/${chatGroupId}/mark-seen`, { method: "POST" }).catch(() => {});
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
      const res = await apiFetch(`/api/upload/community-file`, {
        method: "POST", body: formData,
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
    await sendMessagePayload({
      content: `📚 Shared a flashcard deck: ${deck.title}`,
      messageType: "flashcard",
      richContent: JSON.stringify({ deckId: deck.id, title: deck.title, subject: deck.subject, cardCount: deck.cardCount, isAdminShared: deck.isAdminShared }),
    });
  };

  const handleShareMnemonic = async (m: Mnemonic) => {
    setMnemonicPickerOpen(false);
    await sendMessagePayload({
      content: `💡 Shared a mnemonic: ${m.topic}`,
      messageType: "mnemonic",
      richContent: JSON.stringify({ id: m.id, topic: m.topic, subject: m.subject, mnemonic: m.mnemonic, description: m.description, isAdminShared: m.isAdminShared }),
    });
  };

  const handleShareVideo = async (url: string, videoId: string) => {
    setVideoPickerOpen(false);
    await sendMessagePayload({
      content: `🎥 Shared a video`,
      messageType: "video",
      richContent: JSON.stringify({ url, videoId }),
    });
  };

  const handlePostPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("Photo must be under 20 MB."); return; }
    setPostUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch("/api/upload/community-file", { method: "POST", body: formData });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Upload failed"); }
      const data = await res.json();
      setPostMediaUrl(data.url);
      setPostMediaType("image");
    } catch (err: any) { toast.error(err?.message || "Upload failed."); }
    finally { setPostUploading(false); if (postFileInputRef.current) postFileInputRef.current.value = ""; }
  };

  const handlePostYouTubeConfirm = () => {
    const vid = extractYouTubeId(postYouTubeUrl.trim());
    if (!vid) { toast.error("Not a valid YouTube URL."); return; }
    setPostMediaUrl(postYouTubeUrl.trim());
    setPostMediaType("video");
  };

  const clearPostMedia = () => {
    setPostMediaUrl("");
    setPostMediaType("");
    setPostYouTubeUrl("");
    setPostMediaMode("none");
  };

  const QUICK_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🔥", "🙏", "👏"];

  const handleReact = async (postId: number, emoji: string) => {
    setEmojiPickerPostId(null);
    try {
      const res = await apiFetch(`/api/community/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) return;
      const data = await res.json();
      queryClient.setQueryData(getListCommunityPostsQueryKey({ search: search || undefined }), (old: any) => {
        if (!old) return old;
        const arr = Array.isArray(old) ? old : (old?.posts ?? []);
        return arr.map((p: any) => p.id === postId
          ? { ...p, likeCount: data.likeCount, likedByMe: data.likedByMe, myEmoji: data.myEmoji, reactions: data.reactions }
          : p);
      });
    } catch {}
  };

  const loadComments = async (postId: number) => {
    setCommentLoading(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await apiFetch(`/api/community/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setCommentsData(prev => ({ ...prev, [postId]: data }));
      }
    } catch {} finally {
      setCommentLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const toggleComments = (postId: number) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(postId)) { next.delete(postId); }
      else { next.add(postId); loadComments(postId); }
      return next;
    });
  };

  const handleSubmitComment = async (postId: number) => {
    const text = commentTexts[postId]?.trim();
    if (!text) return;
    setSubmittingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await apiFetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); toast.error(err.error || "Failed to comment"); return; }
      const comment = await res.json();
      setCommentsData(prev => ({ ...prev, [postId]: [...(prev[postId] || []), comment] }));
      setCommentTexts(prev => ({ ...prev, [postId]: "" }));
      // Increment replyCount in posts cache
      queryClient.setQueryData(getListCommunityPostsQueryKey({ search: search || undefined }), (old: any) => {
        if (!old) return old;
        const arr = Array.isArray(old) ? old : (old?.posts ?? []);
        return arr.map((p: any) => p.id === postId ? { ...p, replyCount: (p.replyCount || 0) + 1 } : p);
      });
    } catch {} finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    try {
      const res = await apiFetch(`/api/community/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) return;
      setCommentsData(prev => ({ ...prev, [postId]: (prev[postId] || []).filter((c: any) => c.id !== commentId) }));
      queryClient.setQueryData(getListCommunityPostsQueryKey({ search: search || undefined }), (old: any) => {
        if (!old) return old;
        const arr = Array.isArray(old) ? old : (old?.posts ?? []);
        return arr.map((p: any) => p.id === postId ? { ...p, replyCount: Math.max(0, (p.replyCount || 1) - 1) } : p);
      });
    } catch {}
  };

  const handleCreatePost = () => {
    if (!postForm.title || !postForm.content) {
      toast.error("Title and content are required.");
      return;
    }
    const payload: any = { title: postForm.title, content: postForm.content };
    if (postMediaUrl && postMediaType) {
      payload.mediaUrl = postMediaUrl;
      payload.mediaType = postMediaType;
    }
    createPost.mutate({ data: payload }, {
      onSuccess: () => {
        toast.success("Post shared!");
        queryClient.invalidateQueries({ queryKey: getListCommunityPostsQueryKey() });
        setPostOpen(false);
        setPostForm({ title: "", content: "" });
        clearPostMedia();
      },
      onError: () => toast.error("Failed to create post."),
    });
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim() || !groupForm.subject.trim()) { toast.error("Group name and subject are required."); return; }
    setCreatingGroup(true);
    try {
      const res = await apiFetch(`/api/community/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
                <Button
                  size="sm"
                  variant={videoOpen ? "default" : "outline"}
                  className={`h-7 px-2 text-xs gap-1 ${videoOpen ? "bg-primary text-primary-foreground" : "border-primary/30 text-primary hover:bg-primary/10"}`}
                  onClick={() => setVideoOpen(v => !v)}
                  title="Video call with group members"
                >
                  <Video size={12} /> {videoOpen ? "End" : "Video"}
                </Button>
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
                chatMessages
                  .filter(msg => {
                    if (msg.deletedForEveryone) return true;
                    if (msg.deletedBy) {
                      try {
                        const deletedBy = JSON.parse(msg.deletedBy) as number[];
                        if (deletedBy.includes((user as any)?.id)) return false;
                      } catch {}
                    }
                    return true;
                  })
                  .map((msg) => {
                  const isMe = msg.senderId === (user as any)?.id;
                  const myId = (user as any)?.id;
                  const isEditing = editingMessageId === msg.id;
                  const seenByArr = parseSeenByLocal(msg.seenBy);
                  const seenByOthers = seenByArr.some(id => id !== myId);
                  const flashcardData = !msg.deletedForEveryone && msg.messageType === "flashcard" ? parseRich<RichFlashcard>(msg.richContent) : null;
                  const mnemonicData = !msg.deletedForEveryone && msg.messageType === "mnemonic" ? parseRich<RichMnemonic>(msg.richContent) : null;
                  const videoData = !msg.deletedForEveryone && msg.messageType === "video" ? parseRich<RichVideo>(msg.richContent) : null;
                  return (
                    <div key={msg.id} className={`flex gap-2 group ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      <Avatar className="h-7 w-7 shrink-0 mt-1">
                        <AvatarImage src={msg.senderAvatarUrl || ""} />
                        <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                          {msg.senderName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                        <span className="text-[10px] text-muted-foreground mb-0.5 px-1">{msg.senderName}</span>

                        {msg.deletedForEveryone ? (
                          <div className={`rounded-2xl px-3 py-2 text-sm italic text-muted-foreground border border-border/30 ${isMe ? "bg-muted/20 rounded-tr-sm" : "bg-card rounded-tl-sm"}`}>
                            🚫 This message was deleted
                          </div>
                        ) : isEditing ? (
                          <div className="flex flex-col gap-1 w-full min-w-[200px]">
                            <Input value={editText} onChange={e => setEditText(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") handleSaveEdit(); if (e.key === "Escape") setEditingMessageId(null); }}
                              className="bg-card/80 border-primary/50 text-sm" autoFocus />
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingMessageId(null)}>Cancel</Button>
                              <Button size="sm" className="h-6 text-xs px-2" onClick={handleSaveEdit}>Save</Button>
                            </div>
                          </div>
                        ) : (
                          <div className={`flex items-end gap-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                            {isMe && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost"
                                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground mb-0.5">
                                    <MoreVertical size={12} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-card border-border/60 w-44" align={isMe ? "end" : "start"}>
                                  <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-primary/10 text-sm" onClick={() => handleEditMessage(msg)}>
                                    <Pencil size={13} className="text-primary" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-muted/20 text-sm" onClick={() => handleDeleteMessage(msg.id, false)}>
                                    <Trash2 size={13} className="text-muted-foreground" /> Delete for me
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-destructive/10 text-sm text-destructive focus:text-destructive" onClick={() => handleDeleteMessage(msg.id, true)}>
                                    <Trash2 size={13} /> Delete for everyone
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            <div className="flex flex-col">
                              {flashcardData && <FlashcardCard data={flashcardData} isMe={isMe} />}
                              {mnemonicData && <MnemonicCard data={mnemonicData} isMe={isMe} />}
                              {videoData && <VideoCard data={videoData} isMe={isMe} />}
                              {!flashcardData && !mnemonicData && !videoData && (
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
                            </div>
                          </div>
                        )}

                        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe ? "flex-row-reverse" : ""}`}>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {msg.isEdited && !msg.deletedForEveryone && (
                            <span className="text-[10px] text-muted-foreground/60">· edited</span>
                          )}
                          {isMe && !msg.deletedForEveryone && (
                            seenByOthers
                              ? <CheckCheck size={12} className="text-blue-400 shrink-0" />
                              : <Check size={12} className="text-muted-foreground/50 shrink-0" />
                          )}
                        </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Community Hub</h1>
                <p className="text-sm text-muted-foreground">Connect with peers, share resources, and learn together.</p>
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
                    .map((post: any) => {
                      const ytId = post.mediaType === "video" ? extractYouTubeId(post.mediaUrl || "") : null;
                      return (
                        <Card key={post.id} className="bg-card/40 border-border/40 hover:bg-card/60 transition-colors overflow-hidden">
                          <CardContent className="p-0">
                            {/* Media */}
                            {post.mediaUrl && post.mediaType === "image" && (
                              <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer">
                                <img src={post.mediaUrl} alt={post.title} className="w-full max-h-[420px] object-cover" loading="lazy" />
                              </a>
                            )}
                            {post.mediaUrl && post.mediaType === "video" && ytId && (
                              <div className="relative w-full aspect-video bg-black">
                                <iframe
                                  src={`https://www.youtube.com/embed/${ytId}`}
                                  title={post.title}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  className="absolute inset-0 w-full h-full"
                                />
                              </div>
                            )}

                            <div className="p-5">
                              {/* Author row */}
                              <div className="flex items-center gap-3 mb-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={post.authorAvatarUrl || ""} />
                                  <AvatarFallback className="bg-primary/20 text-primary text-sm">{post.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm leading-tight">{post.author}</p>
                                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <Clock size={10} /> {new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                  </p>
                                </div>
                              </div>

                              {/* Content */}
                              <h3 className="font-bold text-base mb-1 leading-snug">{post.title}</h3>
                              <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-4">{post.content}</p>

                              {/* Reaction summary bar */}
                              {post.reactions && Object.keys(post.reactions).length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {Object.entries(post.reactions as Record<string, number>)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([emoji, cnt]) => (
                                      <button
                                        key={emoji}
                                        onClick={() => handleReact(post.id, emoji)}
                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all hover:scale-105 active:scale-95 ${post.myEmoji === emoji ? "border-primary/50 bg-primary/10 text-primary" : "border-border/40 bg-muted/20 text-muted-foreground hover:border-primary/30"}`}
                                      >
                                        <span>{emoji}</span>
                                        <span className="font-medium">{cnt}</span>
                                      </button>
                                    ))}
                                </div>
                              )}

                              {/* Actions row */}
                              <div className="flex items-center gap-4 pt-2 border-t border-border/30">
                                {/* Emoji reaction button */}
                                <div className="relative">
                                  <button
                                    onClick={() => setEmojiPickerPostId(emojiPickerPostId === post.id ? null : post.id)}
                                    className={`flex items-center gap-1.5 text-sm font-medium transition-all hover:scale-105 active:scale-95 ${post.likedByMe ? "text-red-400" : "text-muted-foreground hover:text-red-400"}`}
                                  >
                                    <span className="text-base leading-none">{post.myEmoji || "🤍"}</span>
                                    <span>{post.likeCount || 0}</span>
                                  </button>
                                  {/* Emoji picker popover */}
                                  {emojiPickerPostId === post.id && (
                                    <div className="absolute bottom-8 left-0 z-50 flex gap-1 p-2 rounded-2xl bg-card border border-border/50 shadow-xl">
                                      {QUICK_EMOJIS.map(e => (
                                        <button
                                          key={e}
                                          onClick={() => handleReact(post.id, e)}
                                          className={`text-xl leading-none p-1.5 rounded-full transition-all hover:scale-125 hover:bg-muted/40 ${post.myEmoji === e ? "bg-primary/15 scale-110" : ""}`}
                                        >
                                          {e}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Comment button */}
                                <button
                                  onClick={() => toggleComments(post.id)}
                                  className={`flex items-center gap-1.5 text-sm font-medium transition-all hover:scale-105 active:scale-95 ${expandedComments.has(post.id) ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                                >
                                  <MessageSquare size={16} />
                                  <span>{post.replyCount || 0}</span>
                                </button>
                              </div>

                              {/* Comments section */}
                              {expandedComments.has(post.id) && (
                                <div className="mt-3 space-y-3 border-t border-border/20 pt-3">
                                  {commentLoading[post.id] ? (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                                      <Loader2 size={12} className="animate-spin" /> Loading comments…
                                    </div>
                                  ) : (commentsData[post.id] || []).length === 0 ? (
                                    <p className="text-xs text-muted-foreground py-1">No comments yet. Be the first!</p>
                                  ) : (
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                      {(commentsData[post.id] || []).map((c: any) => (
                                        <div key={c.id} className="flex items-start gap-2 group">
                                          <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                                            <AvatarImage src={c.authorAvatarUrl || ""} />
                                            <AvatarFallback className="text-[9px] bg-primary/20 text-primary">{c.author?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-1.5 flex-wrap">
                                              <span className="text-xs font-semibold leading-tight">{c.author}</span>
                                              <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                                              {(user as any)?.id === c.userId && (
                                                <button onClick={() => handleDeleteComment(post.id, c.id)} className="text-[10px] text-destructive/60 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity ml-auto">Delete</button>
                                              )}
                                            </div>
                                            <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">{c.content}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {/* Comment input */}
                                  <div className="flex gap-2 items-center">
                                    <Avatar className="h-6 w-6 shrink-0">
                                      <AvatarImage src={(user as any)?.avatarUrl || ""} />
                                      <AvatarFallback className="text-[9px] bg-primary/20 text-primary">{((user as any)?.fullName || "U").substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 flex gap-1.5">
                                      <Input
                                        className="h-7 text-xs bg-muted/20 border-border/30 flex-1"
                                        placeholder="Write a comment…"
                                        value={commentTexts[post.id] || ""}
                                        onChange={e => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitComment(post.id); } }}
                                        maxLength={1000}
                                      />
                                      <Button
                                        size="sm"
                                        className="h-7 px-2"
                                        disabled={!commentTexts[post.id]?.trim() || submittingComment[post.id]}
                                        onClick={() => handleSubmitComment(post.id)}
                                      >
                                        {submittingComment[post.id] ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
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

        {pendingInvites.length > 0 && (
          <Card className="bg-card/40 border-border/40 border-primary/30">
            <CardHeader className="p-4 pb-2 border-b border-border/40">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserPlus size={15} className="text-primary" /> Group Invites
                <Badge className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary border-primary/30">{pendingInvites.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40 max-h-60 overflow-y-auto">
                {pendingInvites.map(inv => (
                  <div key={inv.id} className="p-3 flex flex-col gap-1.5">
                    <p className="text-xs font-medium truncate">{inv.groupName || "Group Invite"}</p>
                    <p className="text-[11px] text-muted-foreground">from {inv.inviterName}</p>
                    <div className="flex gap-1.5 mt-0.5">
                      <Button size="sm" className="h-6 text-xs px-2 flex-1" onClick={() => handleAcceptInvite(inv.id)}>
                        <Check size={11} className="mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 text-xs px-2 flex-1" onClick={() => handleDeclineInvite(inv.id)}>
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
      <Dialog open={postOpen} onOpenChange={(v) => { setPostOpen(v); if (!v) { setPostForm({ title: "", content: "" }); clearPostMedia(); } }}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader><DialogTitle>Share with the Community</DialogTitle></DialogHeader>
          <input ref={postFileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handlePostPhotoUpload} />
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input placeholder="What's on your mind?" className="bg-background/50" value={postForm.title}
                onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label>Caption / Content <span className="text-destructive">*</span></Label>
              <Textarea placeholder="Share your thoughts, doubts, notes, or resources..."
                className="bg-background/50 min-h-[100px] resize-none" value={postForm.content}
                onChange={(e) => setPostForm({ ...postForm, content: e.target.value })} maxLength={5000} />
            </div>

            {/* Media attachment */}
            {!postMediaUrl && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Attach media (optional)</Label>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant={postMediaMode === "photo" ? "default" : "outline"}
                    className="gap-1.5 h-8 text-xs" onClick={() => { setPostMediaMode(m => m === "photo" ? "none" : "photo"); }}>
                    <Camera size={13} /> Photo
                  </Button>
                  <Button type="button" size="sm" variant={postMediaMode === "youtube" ? "default" : "outline"}
                    className="gap-1.5 h-8 text-xs" onClick={() => { setPostMediaMode(m => m === "youtube" ? "none" : "youtube"); }}>
                    <Youtube size={13} className="text-red-400" /> YouTube
                  </Button>
                </div>

                {postMediaMode === "photo" && (
                  <div className="border border-dashed border-border/60 rounded-lg p-4 text-center">
                    {postUploading ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 size={16} className="animate-spin" /> Uploading…
                      </div>
                    ) : (
                      <button type="button" onClick={() => postFileInputRef.current?.click()}
                        className="flex flex-col items-center gap-1.5 w-full text-muted-foreground hover:text-foreground transition-colors">
                        <ImageIcon size={24} className="text-primary/50" />
                        <span className="text-sm">Click to upload a photo</span>
                        <span className="text-xs">JPG, PNG, WebP, GIF · max 20 MB</span>
                      </button>
                    )}
                  </div>
                )}

                {postMediaMode === "youtube" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input placeholder="https://youtube.com/watch?v=..." className="bg-background/50 flex-1 text-sm"
                        value={postYouTubeUrl} onChange={e => setPostYouTubeUrl(e.target.value)} />
                      <Button type="button" size="sm" className="shrink-0 h-9" onClick={handlePostYouTubeConfirm}>
                        <Link size={13} />
                      </Button>
                    </div>
                    {postYouTubeUrl && !extractYouTubeId(postYouTubeUrl) && (
                      <p className="text-xs text-destructive">Not a valid YouTube URL</p>
                    )}
                    {extractYouTubeId(postYouTubeUrl) && (
                      <div className="rounded-lg overflow-hidden border border-border/40">
                        <img src={`https://i.ytimg.com/vi/${extractYouTubeId(postYouTubeUrl)}/mqdefault.jpg`} alt="Preview" className="w-full aspect-video object-cover" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Media preview with remove */}
            {postMediaUrl && postMediaType === "image" && (
              <div className="relative rounded-lg overflow-hidden border border-border/40">
                <img src={postMediaUrl} alt="Preview" className="w-full max-h-[200px] object-cover" />
                <button onClick={clearPostMedia} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 rounded-full p-1 transition-colors">
                  <X size={14} className="text-white" />
                </button>
              </div>
            )}
            {postMediaUrl && postMediaType === "video" && extractYouTubeId(postMediaUrl) && (
              <div className="relative rounded-lg overflow-hidden border border-border/40">
                <img src={`https://i.ytimg.com/vi/${extractYouTubeId(postMediaUrl)}/mqdefault.jpg`} alt="YouTube preview" className="w-full aspect-video object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center">
                    <Play size={16} className="text-white ml-0.5" fill="white" />
                  </div>
                </div>
                <button onClick={clearPostMedia} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 rounded-full p-1 transition-colors">
                  <X size={14} className="text-white" />
                </button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPostOpen(false); setPostForm({ title: "", content: "" }); clearPostMedia(); }}>Cancel</Button>
            <Button onClick={handleCreatePost} disabled={createPost.isPending || postUploading}>
              {createPost.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sharing...</> : "Share Post"}
            </Button>
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
                  <Button size="sm" className="h-7 px-3 shrink-0"
                    variant={invitedUserIds.has(u.id) ? "outline" : "default"}
                    disabled={inviting === u.id || invitedUserIds.has(u.id)}
                    onClick={() => !invitedUserIds.has(u.id) && handleInvite(u.id, u.fullName)}>
                    {inviting === u.id ? <Loader2 size={12} className="animate-spin" /> : invitedUserIds.has(u.id) ? <><Check size={12} className="mr-1" />Sent</> : "Invite"}
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

      {/* Video Call */}
      {videoOpen && chatGroupId && activeGroup && (
        <VideoCall
          roomKey={`group-${chatGroupId}`}
          title={activeGroup.name}
          onClose={() => setVideoOpen(false)}
        />
      )}
    </div>
  );
}
