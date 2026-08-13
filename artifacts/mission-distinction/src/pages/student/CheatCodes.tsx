import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BookOpen, Lightbulb, Zap, ListChecks, Table2, Search, ChevronDown, ChevronRight, Loader2, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import StudentFlashcards from "./Flashcards";
import StudentMnemonics from "./Mnemonics";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery } from "@tanstack/react-query";

const SUBJECTS = ["All", "Anatomy", "Physiology", "Biochemistry"];

type RevisionItem = {
  id: number;
  book_id: number;
  subject: string;
  chapter: string;
  type: "one_liner" | "table";
  title: string | null;
  content: string;
};

function useRevisionItems(type: "one_liner" | "table") {
  return useQuery<RevisionItem[]>({
    queryKey: ["revision-items", type],
    queryFn: async () => {
      const res = await apiFetch(`/api/revision-items?type=${type}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 5 * 60_000,
  });
}

function MarkdownTable({ content }: { content: string }) {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return <pre className="text-xs whitespace-pre-wrap">{content}</pre>;
  const header = lines[0].split("|").filter(c => c.trim());
  const rows = lines.slice(2).map(l => l.split("|").filter(c => c.trim()));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-muted/50">
            {header.map((h, i) => (
              <th key={i} className="border border-border/40 px-2 py-1.5 text-left font-semibold">{h.trim()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="even:bg-muted/20">
              {row.map((cell, ci) => (
                <td key={ci} className="border border-border/40 px-2 py-1.5">{cell.trim()}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OneLinersTab() {
  const [subject, setSubject] = useState("All");
  const [search, setSearch] = useState("");
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set());
  const { data, isLoading, isError } = useRevisionItems("one_liner");

  const items = (data || []).filter(item => {
    const matchSubject = subject === "All" || item.subject === subject;
    const matchSearch = !search || item.content.toLowerCase().includes(search.toLowerCase()) || item.chapter.toLowerCase().includes(search.toLowerCase());
    return matchSubject && matchSearch;
  });

  const byChapter: Record<string, RevisionItem[]> = {};
  for (const item of items) {
    if (!byChapter[item.chapter]) byChapter[item.chapter] = [];
    byChapter[item.chapter].push(item);
  }
  const chapters = Object.keys(byChapter).sort();

  const toggleChapter = (ch: string) => {
    setOpenChapters(prev => {
      const next = new Set(prev);
      next.has(ch) ? next.delete(ch) : next.add(ch);
      return next;
    });
  };

  if (isError) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center opacity-60">
      <WifiOff size={32} />
      <p className="text-sm text-muted-foreground">Could not load one-liners.</p>
    </div>
  );

  if (isLoading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={24} className="animate-spin text-amber-400" />
    </div>
  );

  if (!data || data.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center opacity-60">
      <ListChecks size={40} />
      <div>
        <p className="font-semibold">No one-liners yet</p>
        <p className="text-sm text-muted-foreground mt-1">No content added yet. Check back soon!</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search one-liners…" className="pl-8 bg-muted/30 border-border/50 h-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-36 h-9 bg-muted/30 border-border/50 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">No matching one-liners.</div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{items.length} one-liners across {chapters.length} chapters</p>
          {chapters.map(chapter => {
            const isOpen = openChapters.has(chapter);
            const chItems = byChapter[chapter];
            return (
              <div key={chapter} className="border border-border/40 rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => toggleChapter(chapter)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isOpen ? <ChevronDown size={14} className="shrink-0 text-amber-400" /> : <ChevronRight size={14} className="shrink-0 text-muted-foreground" />}
                    <span className="font-medium text-sm truncate">{chapter}</span>
                  </div>
                  <Badge variant="outline" className="shrink-0 ml-2 text-[10px] bg-amber-500/10 border-amber-500/30 text-amber-400">{chItems.length}</Badge>
                </button>
                {isOpen && (
                  <ul className="divide-y divide-border/30">
                    {chItems.map(item => (
                      <li key={item.id} className="px-4 py-2.5 text-sm hover:bg-muted/10 flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5 shrink-0">•</span>
                        <span>{item.content}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KeyTablesTab() {
  const [subject, setSubject] = useState("All");
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useRevisionItems("table");

  const items = (data || []).filter(item => {
    const matchSubject = subject === "All" || item.subject === subject;
    const matchSearch = !search
      || (item.title || "").toLowerCase().includes(search.toLowerCase())
      || item.chapter.toLowerCase().includes(search.toLowerCase())
      || item.content.toLowerCase().includes(search.toLowerCase());
    return matchSubject && matchSearch;
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center opacity-60">
      <WifiOff size={32} />
      <p className="text-sm text-muted-foreground">Could not load tables.</p>
    </div>
  );

  if (isLoading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={24} className="animate-spin text-blue-400" />
    </div>
  );

  if (!data || data.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center opacity-60">
      <Table2 size={40} />
      <div>
        <p className="font-semibold">No tables yet</p>
        <p className="text-sm text-muted-foreground mt-1">No content added yet. Check back soon!</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search tables…" className="pl-8 bg-muted/30 border-border/50 h-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-36 h-9 bg-muted/30 border-border/50 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">No matching tables.</div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">{items.length} tables from AI-extracted books</p>
          {items.map(item => (
            <Card key={item.id} className="bg-muted/20 border-border/40 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/30 bg-muted/30 flex items-center gap-2 flex-wrap">
                <Table2 size={14} className="text-blue-400 shrink-0" />
                <span className="font-semibold text-sm">{item.title || "Table"}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 border-border/50 text-muted-foreground ml-auto shrink-0">{item.chapter}</Badge>
              </div>
              <CardContent className="p-3">
                <MarkdownTable content={item.content} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CheatCodes() {
  const [tab, setTab] = useState("flashcards");

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Zap size={20} className="text-primary" /> Cheat Codes
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Flashcards, mnemonics, one-liners &amp; key tables — your fastest revision toolkit.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <ScrollArea className="w-full" type="scroll">
          <TabsList className="inline-flex w-auto min-w-full bg-muted/30 border border-border/30">
            <TabsTrigger value="flashcards" className="gap-1.5 text-xs sm:text-sm"><BookOpen size={13} /> Flashcards</TabsTrigger>
            <TabsTrigger value="mnemonics" className="gap-1.5 text-xs sm:text-sm"><Lightbulb size={13} /> Mnemonics</TabsTrigger>
            <TabsTrigger value="oneliners" className="gap-1.5 text-xs sm:text-sm"><ListChecks size={13} className="text-amber-400" /> One-Liners</TabsTrigger>
            <TabsTrigger value="tables" className="gap-1.5 text-xs sm:text-sm"><Table2 size={13} className="text-blue-400" /> Key Tables</TabsTrigger>
          </TabsList>
        </ScrollArea>
        <TabsContent value="flashcards" className="mt-4">
          <StudentFlashcards hideHeader />
        </TabsContent>
        <TabsContent value="mnemonics" className="mt-4">
          <StudentMnemonics hideHeader />
        </TabsContent>
        <TabsContent value="oneliners" className="mt-4">
          <OneLinersTab />
        </TabsContent>
        <TabsContent value="tables" className="mt-4">
          <KeyTablesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
