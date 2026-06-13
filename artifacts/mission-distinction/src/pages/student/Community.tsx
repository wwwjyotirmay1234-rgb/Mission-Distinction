import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useListCommunityPosts, useListCommunityGroups, getListCommunityPostsQueryKey } from "@workspace/api-client-react";
import { Search, Edit3, Heart, MessageSquare, Share2, Clock, Users, PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentCommunity() {
  const [activeTab, setActiveTab] = useState("for-you");
  const [search, setSearch] = useState("");

  const { data: postsData, isLoading: postsLoading } = useListCommunityPosts(
    { search: search || undefined },
    { query: { queryKey: getListCommunityPostsQueryKey({ search: search || undefined }) } }
  );

  const { data: groups, isLoading: groupsLoading } = useListCommunityGroups();

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      <div className="flex-1 flex flex-col min-w-0">
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
            <Button className="shrink-0"><Edit3 className="mr-2 h-4 w-4" /> Create Post</Button>
          </div>
        </div>

        <Tabs defaultValue="for-you" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="bg-transparent border-b border-border/50 h-auto p-0 flex-wrap justify-start rounded-none mb-4 w-full overflow-x-auto hide-scrollbar">
            <TabsTrigger value="for-you" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary py-3">For You</TabsTrigger>
            <TabsTrigger value="following" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary py-3">Following</TabsTrigger>
            <TabsTrigger value="popular" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary py-3">Popular</TabsTrigger>
            <TabsTrigger value="mentors" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary py-3">Mentors</TabsTrigger>
            <TabsTrigger value="announcements" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary py-3">Announcements</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-4">
            {postsLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="bg-card/40 border-border/40"><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
              ))
            ) : !postsData?.posts || postsData.posts.length === 0 ? (
              <div className="p-12 text-center border border-dashed rounded-xl text-muted-foreground">
                No posts found.
              </div>
            ) : (
              postsData.posts.map((post) => (
                <Card key={post.id} className="bg-card/40 border-border/40 hover:bg-card/60 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={post.authorAvatarUrl || ""} />
                        <AvatarFallback className="bg-primary/20 text-primary">{post.author.substring(0,2).toUpperCase()}</AvatarFallback>
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
      </div>

      <div className="w-full lg:w-80 shrink-0 space-y-6">
        <Card className="bg-card/40 border-border/40">
          <CardHeader className="p-4 pb-2 border-b border-border/40 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users size={16} className="text-primary" /> My Groups
            </CardTitle>
            <button className="text-primary hover:text-primary/80"><PlusCircle size={16} /></button>
          </CardHeader>
          <CardContent className="p-0">
            {groupsLoading ? (
               <div className="p-4"><Skeleton className="h-20 w-full" /></div>
            ) : !groups || groups.length === 0 ? (
               <div className="p-4 text-xs text-center text-muted-foreground">No groups joined yet.</div>
            ) : (
              <div className="divide-y divide-border/40">
                {groups.slice(0,5).map((g) => (
                  <div key={g.id} className="p-3 hover:bg-muted/20 cursor-pointer flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                      {g.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{g.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{g.memberCount} members</p>
                    </div>
                  </div>
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
                        <AvatarFallback className="bg-muted text-[10px]">{c.name.substring(0,2)}</AvatarFallback>
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
    </div>
  );
}
