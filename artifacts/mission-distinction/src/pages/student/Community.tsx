import React, { useState, useRef, useEffect, useCallback } from "react";
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
import { useListCommunityPosts, useListCommunityGroups, useCreateCommunityPost, getListCommunityPostsQueryKey } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Edit3, Heart, MessageSquare, Share2, Clock, Users, PlusCircle, Send, MessageCircle, ArrowLeft, Loader2, Wifi, WifiOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { io, Socket } from "socket.io-client";

type ChatMessage = { id: number; groupId: number; senderName: string; senderAvatarUrl?: string | null; content: string; createdAt: string };
type Group = { id: number; name: string; subject: string; memberCount: number; lastMessage?: string | null };

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function StudentCommunity() {
  const [activeTab, setActiveTab] = useState("for-you");
  const [search, setSearch] = useState("");
  const [chatGroupId, setChatGroupId] = useState<number | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [postForm, setPostForm] = useState({ title: "", content: "", groupName: "" });
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

    return () => {
      sock.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const sock = socketRef.current;
    if (!sock) return;
    if (chatGroupId !== null) {
      sock.emit("join-room", chatGroupId);
      setLiveMessages([]);
    }
    return () => {
      if (chatGroupId !== null && sock) sock.emit("leave-room", chatGroupId);
    };
  }, [chatGroupId]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !chatGroupId || sendingMsg) return;
    setSendingMsg(true);
    try {
      await customFetch(`/api/community/messages/${chatGroupId}`, {
        method: "POST",
        body: JSON.stringify({ content: chatMessage.trim() }),
      });
      setChatMessage("");
    } catch {
      toast.error("Failed to send message.");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatMessage(e.target.value);
    if (chatGroupId && socketRef.current?.connected) {
      socketRef.current.emit("typing", chatGroupId);
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

  const posts = Array.isArray(postsData) ? postsData : (postsData as any)?.posts ?? [];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      <div className="flex-1 flex flex-col min-w-0">
        {chatGroupId !== null ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="icon" onClick={() => { setChatGroupId(null); setLiveMessages([]); }}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm">
                {activeGroup?.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-sm">{activeGroup?.name}</p>
                <p className="text-xs text-muted-foreground">{activeGroup?.memberCount} members</p>
              </div>
              <Badge
                variant="outline"
                className={`ml-auto text-xs ${connected ? "border-green-500/30 text-green-400 bg-green-500/5" : "border-yellow-500/30 text-yellow-400 bg-yellow-500/5"}`}
              >
                {connected ? "● Live" : "○ Connecting…"}
              </Badge>
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
                  const isMe = msg.senderName === (user as any)?.fullName;
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
                          {msg.content}
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
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t border-border/40">
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
                <p className="text-muted-foreground">Connect with peers, mentors, and alumni.</p>
              </div>
              <div className="flex gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search posts..."
                    className="pl-9 bg-card/50 border-border/50"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button className="shrink-0" onClick={() => setPostOpen(true)}>
                  <Edit3 className="mr-2 h-4 w-4" /> Create Post
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
                              <div className="flex justify-between items-start mb-1">
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

      <div className="w-full lg:w-80 shrink-0 space-y-6">
        <Card className="bg-card/40 border-border/40">
          <CardHeader className="p-4 pb-2 border-b border-border/40 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageCircle size={16} className="text-primary" /> Group Chats
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {groupsLoading ? (
              <div className="p-4"><Skeleton className="h-20 w-full" /></div>
            ) : groupsList.length === 0 ? (
              <div className="p-4 text-xs text-center text-muted-foreground">No groups available.</div>
            ) : (
              <div className="divide-y divide-border/40">
                {groupsList.map((g) => (
                  <button
                    key={g.id}
                    className="w-full p-3 hover:bg-muted/20 cursor-pointer flex items-center gap-3 text-left transition-colors"
                    onClick={() => { setChatGroupId(g.id); setActiveTab("for-you"); }}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                      {g.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{g.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{g.memberCount} members</p>
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
              <span className="text-orange-500">🏆</span> Top Contributors
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {[
                { name: "Rahul S.", points: 1250, badge: "Expert" },
                { name: "Priya M.", points: 980, badge: "Mentor" },
                { name: "Dr. Arun", points: 850, badge: "Faculty" }
              ].map((c, i) => (
                <div key={i} className="p-3 hover:bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-muted text-[10px]">{c.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] px-1 py-0">{c.badge}</Badge>
                    <span className="text-xs text-primary font-bold">{c.points}</span>
                  </div>
                </div>
              ))}
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
    </div>
  );
}
