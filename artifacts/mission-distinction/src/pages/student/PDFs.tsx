import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useListPdfs, getListPdfsQueryKey } from "@workspace/api-client-react";
import { Search, Filter, Download, BookOpen, Clock, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentPDFs() {
  const [search, setSearch] = useState("");
  
  const { data: pdfsData, isLoading } = useListPdfs(
    { search: search || undefined },
    { query: { queryKey: getListPdfsQueryKey({ search: search || undefined }) } }
  );

  return (
    <div className="h-full flex flex-col xl:flex-row gap-6">
      <div className="flex-1 space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">PDF Library</h1>
            <p className="text-muted-foreground">Standard textbooks & reference materials.</p>
          </div>
          <div className="flex gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search by title, author..." 
                className="pl-9 bg-muted/50 border-border/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0 bg-muted/50">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Recently Viewed */}
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock size={16} className="text-primary" /> Recently Viewed
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar">
            {[1,2,3].map(i => (
              <Card key={i} className="min-w-[200px] snap-start bg-card/40 border-border/40 hover:bg-card/60 cursor-pointer shrink-0">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-14 bg-primary/20 rounded object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium line-clamp-1">Guyton & Hall Physiology {i}</p>
                    <p className="text-xs text-muted-foreground mt-1">Page 142</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* PDF Grid */}
        <h2 className="text-sm font-semibold mb-1">All Books</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 xl:gap-6">
          {isLoading ? (
            Array(8).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />)
          ) : !pdfsData?.pdfs || pdfsData.pdfs.length === 0 ? (
            <div className="col-span-full p-12 text-center border border-dashed rounded-xl text-muted-foreground">
              No PDFs found.
            </div>
          ) : (
            pdfsData.pdfs.map((pdf) => (
              <div key={pdf.id} className="group relative">
                <div className="aspect-[3/4] bg-muted/30 rounded-xl border border-border/50 overflow-hidden relative shadow-md transition-transform group-hover:-translate-y-1">
                  {pdf.thumbnailUrl ? (
                    <img src={pdf.thumbnailUrl} alt={pdf.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center p-4 text-center border-l-4 border-l-primary shadow-inner">
                      <span className="font-bold text-lg opacity-50">{pdf.title.substring(0, 2)}</span>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                    <Button size="sm" className="w-full"><BookOpen className="mr-2 h-4 w-4" /> Read</Button>
                    <Button size="sm" variant="secondary" className="w-full"><Download className="mr-2 h-4 w-4" /> Download</Button>
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{pdf.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{pdf.professor || "Unknown Author"}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[9px] px-1 py-0 bg-card">{pdf.size || "Unknown"}</Badge>
                    <span className="text-[10px] text-muted-foreground">{pdf.pages || 0} pages</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Sidebar - AI Assistant */}
      <div className="w-full xl:w-80 shrink-0">
        <Card className="bg-card/40 border-border/40 h-full flex flex-col sticky top-24">
          <CardContent className="p-4 flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/40">
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">PDF AI Assistant</h3>
                <p className="text-xs text-muted-foreground">Ask questions about any book</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 py-2">
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                Hi! I can help you summarize chapters, explain complex concepts, or find specific information across your library. What do you need?
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="cursor-pointer font-normal">Summarize Chapter 4</Badge>
                <Badge variant="secondary" className="cursor-pointer font-normal">Explain Action Potential</Badge>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/40 relative">
              <Input 
                placeholder="Ask something..." 
                className="pr-10 bg-background"
              />
              <Button size="icon" variant="ghost" className="absolute right-1 top-5 h-8 w-8 text-primary">
                <Sparkles size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
