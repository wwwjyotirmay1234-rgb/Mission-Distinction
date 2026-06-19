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
import { BookOpen, Plus, ChevronLeft, Trash2, RotateCcw, CheckCircle2, X, Brain } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", "General"];

interface Deck { id: number; subject: string; title: string; cardCount: number; createdAt: string; }
interface Flashcard { id: number; deckId: number; front: string; back: string; nextReview: string; ease: number; interval: number; repetitions: number; }

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function isDue(card: Flashcard) {
  return new Date(card.nextReview) <= new Date();
}

function ReviewSession({ cards, deckId, onDone }: { cards: Flashcard[]; deckId: number; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const queryClient = useQueryClient();

  const reviewMutation = useMutation({
    mutationFn: ({ cardId, quality }: { cardId: number; quality: number }) =>
      apiFetch(`/api/flashcards/cards/${cardId}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quality }) }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deck-cards", deckId] });
      const next = idx + 1;
      if (next >= cards.length) { setDone(true); } else { setIdx(next); setFlipped(false); }
    },
  });

  if (done || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <div className="text-center">
          <p className="text-xl font-bold">Session complete!</p>
          <p className="text-muted-foreground text-sm mt-1">You reviewed {cards.length} card{cards.length !== 1 ? "s" : ""}.</p>
        </div>
        <Button onClick={onDone} className="gap-2"><ChevronLeft size={16} /> Back to Deck</Button>
      </div>
    );
  }

  const card = cards[idx];
  const grades = [
    { label: "Again", quality: 0, cls: "border-red-500/40 text-red-400 hover:bg-red-500/10" },
    { label: "Hard", quality: 1, cls: "border-orange-500/40 text-orange-400 hover:bg-orange-500/10" },
    { label: "Good", quality: 2, cls: "border-blue-500/40 text-blue-400 hover:bg-blue-500/10" },
    { label: "Easy", quality: 3, cls: "border-green-500/40 text-green-400 hover:bg-green-500/10" },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Card {idx + 1} of {cards.length}</p>
        <div className="h-2 flex-1 mx-4 rounded-full bg-border/40 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((idx) / cards.length) * 100}%` }} />
        </div>
        <Button variant="ghost" size="sm" onClick={onDone}><X size={16} /></Button>
      </div>

      <div
        className={`relative min-h-[220px] rounded-2xl border cursor-pointer select-none transition-all duration-300 ${flipped ? "border-primary/40 bg-primary/5" : "border-border/40 bg-card/40"}`}
        onClick={() => setFlipped(v => !v)}
      >
        <div className="p-8 flex flex-col items-center justify-center min-h-[220px] text-center">
          {!flipped ? (
            <>
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Front</p>
              <p className="text-lg font-semibold leading-relaxed">{card.front}</p>
              <p className="text-xs text-muted-foreground mt-4">Tap to reveal answer</p>
            </>
          ) : (
            <>
              <p className="text-xs text-primary mb-3 uppercase tracking-wider">Answer</p>
              <p className="text-base leading-relaxed">{card.back}</p>
            </>
          )}
        </div>
      </div>

      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {grades.map(g => (
            <Button key={g.quality} variant="outline" className={`text-xs ${g.cls}`} disabled={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate({ cardId: card.id, quality: g.quality })}>
              {g.label}
            </Button>
          ))}
        </div>
      )}
      {!flipped && <p className="text-center text-xs text-muted-foreground">Rate how well you remembered after flipping</p>}
    </div>
  );
}

function DeckView({ deckId, onBack }: { deckId: number; onBack: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["deck-cards", deckId],
    queryFn: async () => {
      const r = await apiFetch(`/api/flashcards/decks/${deckId}/cards`);
      return r.json() as Promise<{ deck: Deck; cards: Flashcard[] }>;
    },
  });

  const addMutation = useMutation({
    mutationFn: () => apiFetch(`/api/flashcards/decks/${deckId}/cards`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ front, back }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["deck-cards", deckId] }); queryClient.invalidateQueries({ queryKey: ["flashcard-decks"] }); setShowAdd(false); setFront(""); setBack(""); toast.success("Card added!"); },
    onError: () => toast.error("Failed to add card"),
  });

  const deleteMutation = useMutation({
    mutationFn: (cardId: number) => apiFetch(`/api/flashcards/cards/${cardId}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["deck-cards", deckId] }); queryClient.invalidateQueries({ queryKey: ["flashcard-decks"] }); },
  });

  const dueCards = data?.cards.filter(isDue) ?? [];

  if (reviewing && dueCards.length > 0) return <ReviewSession cards={dueCards} deckId={deckId} onDone={() => { setReviewing(false); queryClient.invalidateQueries({ queryKey: ["deck-cards", deckId] }); }} />;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={onBack}><ChevronLeft size={16} /> All Decks</Button>
      </div>

      {isLoading ? <Skeleton className="h-20 w-full" /> : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{data?.deck.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">{data?.deck.subject}</Badge>
                <span className="text-xs text-muted-foreground">{data?.deck.cardCount} cards</span>
                {dueCards.length > 0 && <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">{dueCards.length} due</Badge>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Card</Button>
              {dueCards.length > 0 && <Button size="sm" className="gap-1.5" onClick={() => setReviewing(true)}><Brain size={14} /> Review ({dueCards.length})</Button>}
            </div>
          </div>

          {data?.cards.length === 0 ? (
            <div className="py-12 text-center border border-dashed rounded-xl text-muted-foreground text-sm">
              <BookOpen size={28} className="mx-auto mb-3 opacity-30" />
              No cards yet. Add your first card to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {data?.cards.map(card => (
                <Card key={card.id} className={`border ${isDue(card) ? "border-green-500/20 bg-green-500/5" : "border-border/40 bg-card/30"}`}>
                  <CardContent className="p-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{card.front}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{card.back}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isDue(card) && <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20">Due</Badge>}
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(card.id)}><Trash2 size={13} /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border/60">
          <DialogHeader><DialogTitle>Add Flashcard</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Front (Question / Term)</label>
              <Textarea value={front} onChange={e => setFront(e.target.value)} placeholder="e.g. What is the action of acetylcholine at the NMJ?" className="bg-background/50 border-border/50 min-h-[80px]" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Back (Answer)</label>
              <Textarea value={back} onChange={e => setBack(e.target.value)} placeholder="e.g. Causes depolarisation of motor end plate by binding to nicotinic receptors" className="bg-background/50 border-border/50 min-h-[80px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button disabled={!front.trim() || !back.trim() || addMutation.isPending} onClick={() => addMutation.mutate()}>{addMutation.isPending ? "Adding…" : "Add Card"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function StudentFlashcards() {
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ subject: "Anatomy", title: "" });
  const queryClient = useQueryClient();

  const { data: decks = [], isLoading } = useQuery<Deck[]>({
    queryKey: ["flashcard-decks"],
    queryFn: () => apiFetch("/api/flashcards/decks").then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: () => apiFetch("/api/flashcards/decks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["flashcard-decks"] }); setShowCreate(false); setForm({ subject: "Anatomy", title: "" }); toast.success("Deck created!"); },
    onError: () => toast.error("Failed to create deck"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/flashcards/decks/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["flashcard-decks"] }); toast.success("Deck deleted"); },
  });

  if (selectedDeckId) return <DeckView deckId={selectedDeckId} onBack={() => setSelectedDeckId(null)} />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen size={22} className="text-primary" /> Flashcards</h1>
          <p className="text-muted-foreground text-sm mt-1">Spaced repetition — the most effective way to remember.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 shrink-0"><Plus size={16} /> New Deck</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : decks.length === 0 ? (
        <div className="py-16 text-center border border-dashed rounded-xl text-muted-foreground">
          <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No decks yet. Create your first deck to start studying.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {decks.map(deck => (
            <Card key={deck.id} className="bg-card/30 border-border/40 hover:bg-card/50 transition-colors cursor-pointer group" onClick={() => setSelectedDeckId(deck.id)}>
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
                  <span className="text-xs text-muted-foreground">{timeAgo(deck.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border/60">
          <DialogHeader><DialogTitle>Create Deck</DialogTitle></DialogHeader>
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
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Cranial Nerves" className="bg-background/50 border-border/50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button disabled={!form.title.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>{createMutation.isPending ? "Creating…" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
