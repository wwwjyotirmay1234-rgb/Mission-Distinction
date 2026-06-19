import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Trash2, Sparkles, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry", "NEET PG", "General"];

interface Deck { id: number; subject: string; title: string; cardCount: number; createdAt: string; }
interface Flashcard { id: number; front: string; back: string; }

function DeckManager({ deckId, deckTitle, onBack }: { deckId: number; deckTitle: string; onBack: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showAiGen, setShowAiGen] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCards, setAiCards] = useState<{ front: string; back: string }[]>([]);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-deck-cards", deckId],
    queryFn: async () => {
      const r = await apiFetch(`/api/admin/content/flashcard-decks/${deckId}/cards`);
      return r.json() as Promise<{ deck: Deck; cards: Flashcard[] }>;
    },
  });

  const addMutation = useMutation({
    mutationFn: () => apiFetch(`/api/admin/content/flashcard-decks/${deckId}/cards`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ front, back }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-deck-cards", deckId] }); queryClient.invalidateQueries({ queryKey: ["admin-flashcard-decks"] }); setShowAdd(false); setFront(""); setBack(""); toast.success("Card added!"); },
  });

  const bulkAddMutation = useMutation({
    mutationFn: async (cards: { front: string; back: string }[]) => {
      for (const card of cards) {
        await apiFetch(`/api/admin/content/flashcard-decks/${deckId}/cards`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(card) });
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-deck-cards", deckId] }); queryClient.invalidateQueries({ queryKey: ["admin-flashcard-decks"] }); setShowAiGen(false); setAiCards([]); setAiTopic(""); toast.success(`${aiCards.length} cards added!`); },
  });

  const deleteMutation = useMutation({
    mutationFn: (cardId: number) => apiFetch(`/api/admin/content/flashcard-cards/${cardId}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-deck-cards", deckId] }); queryClient.invalidateQueries({ queryKey: ["admin-flashcard-decks"] }); },
  });

  async function generateAiCards() {
    if (!aiTopic.trim() || !data?.deck) return;
    setAiLoading(true);
    try {
      const res = await apiFetch("/api/ai/flashcards", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: data.deck.subject, topic: aiTopic, count: 8 }),
      });
      if (!res.ok) { toast.error("AI generation failed"); return; }
      const result = await res.json();
      setAiCards(result.cards ?? []);
      toast.success(`${result.cards?.length ?? 0} flashcards generated!`);
    } catch { toast.error("AI generation failed"); }
    finally { setAiLoading(false); }
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={onBack}><ChevronLeft size={16} /> All Decks</Button>
      </div>

      {isLoading ? <Skeleton className="h-20 w-full" /> : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{data?.deck.title}</h2>
                <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30 gap-1"><Shield size={9} /> Official</Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">{data?.deck.subject}</Badge>
                <span className="text-xs text-muted-foreground">{data?.deck.cardCount} cards</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAiGen(true)}><Sparkles size={14} /> AI Cards</Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Card</Button>
            </div>
          </div>

          {data?.cards.length === 0 ? (
            <div className="py-12 text-center border border-dashed rounded-xl text-muted-foreground text-sm">
              <BookOpen size={28} className="mx-auto mb-3 opacity-30" />
              No cards yet. Add cards manually or use AI to generate them.
            </div>
          ) : (
            <div className="space-y-2">
              {data?.cards.map(card => (
                <Card key={card.id} className="border-border/40 bg-card/30">
                  <CardContent className="p-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{card.front}</p>
                      <p className="text-xs text-muted-foreground mt-1">{card.back}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => deleteMutation.mutate(card.id)}><Trash2 size={13} /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border/60">
          <DialogHeader><DialogTitle>Add Card</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Front (Question)</label>
              <Textarea value={front} onChange={e => setFront(e.target.value)} placeholder="e.g. Name the rotator cuff muscles" className="bg-background/50 border-border/50 min-h-[80px]" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Back (Answer)</label>
              <Textarea value={back} onChange={e => setBack(e.target.value)} placeholder="e.g. Supraspinatus, Infraspinatus, Teres Minor, Subscapularis (SITS)" className="bg-background/50 border-border/50 min-h-[80px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button disabled={!front.trim() || !back.trim() || addMutation.isPending} onClick={() => addMutation.mutate()}>{addMutation.isPending ? "Adding…" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAiGen} onOpenChange={v => { setShowAiGen(v); if (!v) { setAiCards([]); setAiTopic(""); } }}>
        <DialogContent className="bg-card border-border/60 sm:max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles size={16} className="text-primary" /> AI Flashcard Generator</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Topic</label>
              <div className="flex gap-2">
                <Input value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="e.g. Brachial Plexus…" className="bg-background/50 border-border/50" />
                <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                  onClick={generateAiCards} disabled={aiLoading || !aiTopic.trim()}>
                  <Sparkles size={13} /> {aiLoading ? "…" : "Generate"}
                </Button>
              </div>
            </div>
            {aiCards.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {aiCards.map((c, i) => (
                  <div key={i} className="bg-background/40 rounded-lg p-3 text-sm">
                    <p className="font-medium">{c.front}</p>
                    <p className="text-muted-foreground text-xs mt-1">{c.back}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAiGen(false); setAiCards([]); setAiTopic(""); }}>Cancel</Button>
            {aiCards.length > 0 && (
              <Button disabled={bulkAddMutation.isPending} onClick={() => bulkAddMutation.mutate(aiCards)}>
                {bulkAddMutation.isPending ? "Adding…" : `Add ${aiCards.length} Cards`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminFlashcards() {
  const [selectedDeck, setSelectedDeck] = useState<{ id: number; title: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ subject: "Anatomy", title: "" });
  const queryClient = useQueryClient();

  const { data: decks = [], isLoading } = useQuery<Deck[]>({
    queryKey: ["admin-flashcard-decks"],
    queryFn: () => apiFetch("/api/admin/content/flashcard-decks").then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: () => apiFetch("/api/admin/content/flashcard-decks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }).then(r => r.json()),
    onSuccess: (deck) => { queryClient.invalidateQueries({ queryKey: ["admin-flashcard-decks"] }); setShowCreate(false); setForm({ subject: "Anatomy", title: "" }); setSelectedDeck({ id: deck.id, title: deck.title }); toast.success("Deck created!"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/content/flashcard-decks/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-flashcard-decks"] }); toast.success("Deck deleted"); },
  });

  if (selectedDeck) return <DeckManager deckId={selectedDeck.id} deckTitle={selectedDeck.title} onBack={() => setSelectedDeck(null)} />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen size={22} className="text-primary" /> Official Flashcard Decks</h1>
          <p className="text-muted-foreground text-sm mt-1">Create study decks visible to all students — use AI to populate cards quickly.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 shrink-0"><Plus size={16} /> New Deck</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : decks.length === 0 ? (
        <div className="py-16 text-center border border-dashed rounded-xl text-muted-foreground">
          <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No official decks yet. Create one and add cards with AI.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {decks.map(deck => (
            <Card key={deck.id} className="bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer group" onClick={() => setSelectedDeck({ id: deck.id, title: deck.title })}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{deck.title}</p>
                    <Badge variant="outline" className="text-[10px] mt-1 bg-primary/10 text-primary border-primary/20">{deck.subject}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={e => { e.stopPropagation(); deleteMutation.mutate(deck.id); }}><Trash2 size={13} /></Button>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-muted-foreground">{deck.cardCount} card{deck.cardCount !== 1 ? "s" : ""}</span>
                  <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30 gap-1"><Shield size={9} /> Official</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border/60">
          <DialogHeader><DialogTitle>Create Official Deck</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
              <Select value={form.subject} onValueChange={v => setForm(p => ({ ...p, subject: v }))}>
                <SelectTrigger className="bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Deck Title</label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Rotator Cuff Muscles" className="bg-background/50 border-border/50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button disabled={!form.title.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>{createMutation.isPending ? "Creating…" : "Create Deck"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
