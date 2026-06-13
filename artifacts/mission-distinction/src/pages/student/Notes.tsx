import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useListNotes, getListNotesQueryKey } from "@workspace/api-client-react";
import { Search, Filter, FileText, Download, Sparkles, BookMarked, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentNotes() {
  const [search, setSearch] = useState("");
  
  const { data: notesData, isLoading } = useListNotes(
    { search: search || undefined },
    { query: { queryKey: getListNotesQueryKey({ search: search || undefined }) } }
  );

  const categories = [
    { name: "Anatomy", color: "border-blue-500/30 text-blue-400 bg-blue-500/10" },
    { name: "Physiology", color: "border-red-500/30 text-red-400 bg-red-500/10" },
    { name: "Biochemistry", color: "border-green-500/30 text-green-400 bg-green-500/10" },
    { name: "Renal System", color: "border-purple-500/30 text-purple-400 bg-purple-500/10" },
    { name: "Blood & CBC", color: "border-red-500/30 text-red-400 bg-red-500/10" },
    { name: "Pharmacology", color: "border-orange-500/30 text-orange-400 bg-orange-500/10" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Notes Library</h1>
          <p className="text-muted-foreground">High-yield notes crafted for distinction.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search notes..." 
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

      {/* Smart Features */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Button variant="outline" className="h-auto py-4 bg-card/40 border-border/40 hover:bg-card flex-col gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium">AI Summary</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 bg-card/40 border-border/40 hover:bg-card flex-col gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          <span className="text-xs font-medium">Flashcards</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 bg-card/40 border-border/40 hover:bg-card flex-col gap-2">
          <BookMarked className="h-5 w-5 text-orange-500" />
          <span className="text-xs font-medium">Bookmarks</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 bg-card/40 border-border/40 hover:bg-card flex-col gap-2">
          <Share2 className="h-5 w-5 text-green-500" />
          <span className="text-xs font-medium">Export Notes</span>
        </Button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 snap-x hide-scrollbar">
        <Badge variant="secondary" className="px-4 py-2 cursor-pointer shrink-0 snap-start bg-primary text-primary-foreground">All Subjects</Badge>
        {categories.map((c, i) => (
          <Badge key={i} variant="outline" className={`px-4 py-2 cursor-pointer shrink-0 snap-start border hover:bg-muted ${c.color.split(' ').slice(0,2).join(' ')}`}>
            {c.name}
          </Badge>
        ))}
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
        ) : !notesData?.notes || notesData.notes.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-dashed rounded-xl text-muted-foreground">
            No notes found. Try adjusting your search.
          </div>
        ) : (
          notesData.notes.map((note) => {
            const cat = categories.find(c => c.name.toLowerCase() === note.subject.toLowerCase()) || categories[0];
            return (
              <Card key={note.id} className="bg-card/40 border-border/40 hover:border-primary/30 transition-colors group flex flex-col">
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant="outline" className={`text-[10px] uppercase tracking-wider px-2 border ${cat.color}`}>{note.subject}</Badge>
                    <button className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                      <BookMarked size={16} />
                    </button>
                  </div>
                  <h3 className="font-semibold text-base mb-2 line-clamp-2">{note.title}</h3>
                  <p className="text-xs text-muted-foreground mt-auto mb-4 flex items-center gap-4">
                    <span className="flex items-center gap-1"><FileText size={12} /> {Math.ceil(note.content.length / 1000)} pages</span>
                    <span className="flex items-center gap-1"><Download size={12} /> {note.downloadCount} dl</span>
                  </p>
                  <Button className="w-full text-xs" variant="secondary">Read Note</Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
