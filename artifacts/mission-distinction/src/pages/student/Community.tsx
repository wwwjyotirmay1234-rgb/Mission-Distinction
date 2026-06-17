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
import { useListCommunityPosts, useListCommunityGroups, useCreateCommunityPost, getListCommunityPostsQueryKey, getListCommunityGroupsQueryKey } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search, Edit3, Heart, MessageSquare, Share2, Clock, Users, PlusCircle, Send,
  MessageCircle, ArrowLeft, Loader2, Paperclip, ImageIcon, FileText, X, Download,
  UserPlus, Crown, UserMinus
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { io, Socket } from "socket.io-client";

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
  createdAt: string;
};
type Group = {
  id: number;
  name: string;
  subject: string;
  description?: string | null;
  memberCount: number;
  lastMessage?: string | null;
  createdBy?: number | null;
};

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

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
      const baseUrl = BASE;
      const res = await fetch(`${baseUrl}/api/users/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSearchResults(await res.json());
    } catch {} finally { setSearching(false); }
  };

  const handleInvite = async (userId: number, name: string) => {
    if (!chatGroupId) return;
    setInviting(userId);
    try {
      const baseUrl = BASE;
      const res = await fetch(`${baseUrl}/api/community/groups/${chatGroupId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `${name} added!`);
        queryClient.invalidateQueries({ queryKey: getListCommunityGroupsQueryKey() });
        setSearchResults(prev => prev.filter(u => u.id !== userId));
      } else {
        toast.error(data.error || "Failed to invite");
      }
    } catch { toast.error("Failed to invite"); } finally { setInviting(null); }
  };

  useEffect(() => {
    if (initialMessages.length > 0) {
      setLiveMessages(initialMessages as ChatMessage[]);
    }
  }, [initialMessages]);

  const chatMessages = liveMessages.length > 0 ? liveMessages : (initialMessages as ChatMessage[]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, typingUser]);

  useEffect(() => {
    if (!token) return;
    const sock = io(window.location.origin, {
      path: `${BASE}/api/socket.io/`,
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
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
    return () => {
      if (chatGroupId !== null && sock) sock.emit("leave-room", chatGroupId);
    };
  }, [chatGroupId]);

  const sendMessagePayload = async (payload: { content?: string; fileUrl?: string; fileType?: string; fileName?: string }) => {
    if (!chatGroupId || sendingMsg) return;
    setSendingMsg(true);
    try {
      await customFetch(`/api/community/messages/${chatGroupId}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch {
      toast.error("Failed to send message.");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    const text = chatMessage.trim();
    setChatMessage("");
    await sendMessagePayload({ content: text });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatMessage(e.target.value);
    if (chatGroupId && socketRef.current?.connected) {
      socketRef.current.emit("typing", chatGroupId);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File must be under 20 MB.");
      return;
    }
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const baseUrl = BASE;
      const res = await fetch(`${baseUrl}/api/upload/community-file`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      await sendMessagePayload({ content: chatMessage.trim(), fileUrl: data.url, fileType: data.fileType, fileName: data.fileName });
      setChatMessage("");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed.");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCreatePost = () => {
    if (!postForm.title || !postForm.content || !postForm.groupName) {
      toast.error("All fields are required.");
      return;
    }
    createPost.mutate({ data: postForm }, {
      onSuccess: () => {
        toast.success("Post created!");
        queryClient.invalidateQueries({ queryKey: getListCommunityPostsQueryKey() });
        setPostOpen(false);
        setPostForm({ title: "", content: "", groupName: "" });
      },
      onError: () => toast.error("Failed to create post."),
    });
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim() || !groupForm.subject.trim()) {
      toast.error("Group name and subject are required.");
      return;
    }
    setCreatingGroup(true);
    try {
      const baseUrl = BASE;
      const res = await fetch(`${baseUrl}/api/community/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(groupForm),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create group");
      }
      toast.success("Group created!");
      queryClient.invalidateQueries({ queryKey: getListCommunityGroupsQueryKey() });
      setGroupOpen(false);
      setGroupForm({ name: "", subject: "", description: "" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to create group.");
    } finally {
      setCreatingGroup(false);
    }
  };

  const posts = Array.isArray(postsData) ? postsData : (postsData as any)?.posts ?? [];

  const SUBJECT_COLORS: Record<string, string> = {
    anatomy: "bg-red-500/20 text-red-400",
    physiology: "bg-blue-500/20 text-blue-400",
    biochemistry: "bg-green-500/20 text-green-400",
    general: "bg-purple-500/20 text-purple-400",
  };
  const getGroupColor = (subject: string) => SUBJECT_COLORS[subject.toLowerCase()] ?? "bg-primary/20 text-primary";

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      <div className="flex-1 flex flex-col min-w-0">
        {chatGroupId !== null ? (
          <div className="flex flex-col h-full">
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
                <Badge
                  variant="outline"
                  className={`text-xs ${connected ? "border-green-500/30 text-green-400 bg-green-500/5" : "border-yellow-500/30 text-yellow-400 bg-yellow-500/5"}`}
                >
                  {connected ? `● ${onlineCount > 0 ? onlineCount : ""}` : "○"}
                </Badge>
              </div>
            </div>

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
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      <Avatar className="h-7 w-7 shrink-0 mt-1">
                        <AvatarImage src={msg.senderAvatarUrl || ""} />
                        <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                          {msg.senderName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                        <span className="text-[10px] text-muted-foreground mb-0.5 px-1">{msg.senderName}</span>
                        <div className={`rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border/40 rounded-tl-sm"}`}>
                          {msg.fileType === "image" && msg.fileUrl && (
                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                              <img
                                src={msg.fileUrl}
                                alt={msg.fileName || "Image"}
                                className="max-w-[240px] max-h-[240px] rounded-lg object-cover mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                                loading="lazy"
                              />
                            </a>
                          )}
                          {msg.fileType === "pdf" && msg.fileUrl && (
                            <a
                              href={msg.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 text-xs underline mb-1 ${isMe ? "text-primary-foreground/80" : "text-primary"}`}
                            >
                              <FileText size={14} />
                              <span className="truncate max-w-[180px]">{msg.fileName || "PDF Document"}</span>
                              <Download size={12} />
                            </a>
                          )}
                          {msg.content && <span>{msg.content}</span>}
                        </div>
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

            <div className="flex gap-2 mt-3 pt-3 border-t border-border/40">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile || sendingMsg}
                title="Attach photo or PDF"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
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
                  <Input
                    placeholder="Search posts..."
                    className="pl-9 bg-card/50 border-border/50"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
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
                                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors">
                                  <Heart size={16} /> {post.likeCount}
                                </button>
                                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-blue-500 transition-colors">
                                  <MessageSquare size={16} /> {post.replyCount || 0}
                                </button>
                                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-green-500 transition-colors">
                                  <Share2 size={16} /> Share
                                </button>
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

      <div className="w-full lg:w-80 shrink-0 space-y-4">
        <Card className="bg-card/40 border-border/40">
          <CardHeader className="p-4 pb-2 border-b border-border/40 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageCircle size={16} className="text-primary" /> Groups
            </CardTitle>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary" onClick={() => setGroupOpen(true)}>
              <PlusCircle size={13} /> New Group
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {groupsLoading ? (
              <div className="p-4"><Skeleton className="h-20 w-full" /></div>
            ) : groupsList.length === 0 ? (
              <div className="p-4 text-xs text-center text-muted-foreground">
                No groups yet. Create the first one!
              </div>
            ) : (
              <div className="divide-y divide-border/40 max-h-80 overflow-y-auto">
                {groupsList.map((g) => (
                  <button
                    key={g.id}
                    className="w-full p-3 hover:bg-muted/20 cursor-pointer flex items-center gap-3 text-left transition-colors"
                    onClick={() => { setChatGroupId(g.id); setActiveTab("for-you"); }}
                  >
                    <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${getGroupColor(g.subject)}`}>
                      {g.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{g.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {g.lastMessage ? g.lastMessage : `${g.memberCount} members · ${g.subject}`}
                      </p>
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
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ImageIcon size={15} className="text-primary" /> Share in Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <ImageIcon size={13} className="text-blue-400 shrink-0" />
                <span>Photos (JPG, PNG, WebP, GIF)</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText size={13} className="text-red-400 shrink-0" />
                <span>PDF documents</span>
              </div>
              <div className="flex items-center gap-2">
                <Paperclip size={13} className="text-green-400 shrink-0" />
                <span>Click 📎 in any group chat to attach</span>
              </div>
              <p className="text-[10px] text-muted-foreground/60 pt-1">Max file size: 20 MB</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle>Create a Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input placeholder="What's on your mind?" className="bg-background/50" value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Group <span className="text-destructive">*</span></Label>
              <Select value={postForm.groupName} onValueChange={(v) => setPostForm({ ...postForm, groupName: v })}>
                <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select a group" /></SelectTrigger>
                <SelectContent>
                  {groupsList.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Content <span className="text-destructive">*</span></Label>
              <Textarea placeholder="Share your thoughts, doubts, or resources..." className="bg-background/50 min-h-[120px] resize-none" value={postForm.content} onChange={(e) => setPostForm({ ...postForm, content: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePost} disabled={createPost.isPending}>
              {createPost.isPending ? "Posting..." : "Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="bg-card border-border/50 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users size={16} /> {activeGroup?.name} — Members
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-72 overflow-y-auto py-1">
            {groupMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No members yet.</p>
            ) : groupMembers.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={m.avatarUrl || ""} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">{m.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-medium truncate">{m.fullName}</span>
                {m.role === "owner" && (
                  <Badge variant="outline" className="text-[10px] px-1.5 border-yellow-500/30 text-yellow-400 gap-1">
                    <Crown size={9} /> Owner
                  </Badge>
                )}
              </div>
            ))}
          </div>
          {isGroupOwner && (
            <div className="pt-2 border-t border-border/40">
              <Button size="sm" className="w-full gap-2" onClick={() => { setMembersOpen(false); setInviteOpen(true); setMemberSearch(""); setSearchResults([]); }}>
                <UserPlus size={14} /> Invite More Students
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="bg-card border-border/50 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus size={16} /> Invite to {activeGroup?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student by name..."
                className="pl-9 bg-background/50"
                value={memberSearch}
                onChange={e => { setMemberSearch(e.target.value); searchStudents(e.target.value); }}
              />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {searchResults.length === 0 && memberSearch.length >= 2 && !searching && (
                <p className="text-sm text-muted-foreground text-center py-4">No students found.</p>
              )}
              {memberSearch.length < 2 && (
                <p className="text-xs text-muted-foreground text-center py-4">Type a name to search for students.</p>
              )}
              {searchResults.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={u.avatarUrl || ""} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">{u.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.fullName}</p>
                    {u.college && <p className="text-xs text-muted-foreground truncate">{u.college}</p>}
                  </div>
                  <Button
                    size="sm"
                    className="h-7 px-3 shrink-0"
                    disabled={inviting === u.id}
                    onClick={() => handleInvite(u.id, u.fullName)}
                  >
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
          <DialogHeader>
            <DialogTitle>Create a Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Group Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Anatomy Study Circle"
                className="bg-background/50"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                maxLength={80}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Subject <span className="text-destructive">*</span></Label>
              <Select value={groupForm.subject} onValueChange={(v) => setGroupForm({ ...groupForm, subject: v })}>
                <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Anatomy">Anatomy</SelectItem>
                  <SelectItem value="Physiology">Physiology</SelectItem>
                  <SelectItem value="Biochemistry">Biochemistry</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                placeholder="What is this group about?"
                className="bg-background/50 resize-none min-h-[80px]"
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                maxLength={300}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateGroup} disabled={creatingGroup || !groupForm.name.trim() || !groupForm.subject}>
              {creatingGroup ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
