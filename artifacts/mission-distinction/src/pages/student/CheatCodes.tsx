import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BookOpen, Lightbulb, Zap } from "lucide-react";
import StudentFlashcards from "./Flashcards";
import StudentMnemonics from "./Mnemonics";

export default function CheatCodes() {
  const [tab, setTab] = useState("flashcards");

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Zap size={20} className="text-primary" /> Cheat Codes
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Flashcards & mnemonics — your fastest revision toolkit.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-sm">
          <TabsTrigger value="flashcards" className="gap-1.5"><BookOpen size={14} /> Flashcards</TabsTrigger>
          <TabsTrigger value="mnemonics" className="gap-1.5"><Lightbulb size={14} /> Mnemonics</TabsTrigger>
        </TabsList>
        <TabsContent value="flashcards" className="mt-4">
          <StudentFlashcards hideHeader />
        </TabsContent>
        <TabsContent value="mnemonics" className="mt-4">
          <StudentMnemonics hideHeader />
        </TabsContent>
      </Tabs>
    </div>
  );
}
