import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useListQuizzes, getListQuizzesQueryKey } from "@workspace/api-client-react";
import { Play, Clock, CheckCircle, Brain, Target, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentQuiz() {
  const [activeTab, setActiveTab] = useState("all");
  
  const { data: quizzesData, isLoading } = useListQuizzes(
    { subject: activeTab === "all" ? undefined : activeTab },
    { query: { queryKey: getListQuizzesQueryKey({ subject: activeTab === "all" ? undefined : activeTab }) } }
  );

  const featured = [
    { title: "NEET PG Grand Test 12", questions: 300, time: 210, icon: Target, color: "text-blue-500", bg: "bg-blue-500/20" },
    { title: "Cardiology Quick Revision", questions: 50, time: 45, icon: Brain, color: "text-red-500", bg: "bg-red-500/20" },
    { title: "Biochemistry Rapid MCQs", questions: 100, time: 90, icon: Award, color: "text-purple-500", bg: "bg-purple-500/20" }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Quiz Center</h1>
        <p className="text-muted-foreground">Test your knowledge and track your performance.</p>
      </div>

      {/* Featured Quizzes Carousel */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Featured Quizzes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featured.map((quiz, i) => (
            <Card key={i} className="bg-card/40 border-border/50 hover:border-primary/50 transition-all overflow-hidden relative group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-primary/10" />
              <CardContent className="p-6 relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${quiz.bg} ${quiz.color}`}>
                  <quiz.icon size={24} />
                </div>
                <h3 className="font-bold text-lg mb-2">{quiz.title}</h3>
                <div className="flex gap-4 text-xs text-muted-foreground mb-6">
                  <span className="flex items-center gap-1"><CheckCircle size={14} /> {quiz.questions} Qs</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {quiz.time} mins</span>
                </div>
                <Button className="w-full group-hover:bg-primary">
                  Start Now <Play className="w-4 h-4 ml-2 fill-current" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Browse By Category */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Browse by Category</h2>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50 border border-border/50 h-auto p-1 flex-wrap justify-start">
            <TabsTrigger value="all">All Quizzes</TabsTrigger>
            <TabsTrigger value="Anatomy">Anatomy</TabsTrigger>
            <TabsTrigger value="Physiology">Physiology</TabsTrigger>
            <TabsTrigger value="Biochemistry">Biochemistry</TabsTrigger>
            <TabsTrigger value="NEET PG">NEET PG</TabsTrigger>
            <TabsTrigger value="University Exams">University Exams</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
              ) : !quizzesData?.quizzes || quizzesData.quizzes.length === 0 ? (
                <div className="col-span-2 p-12 text-center border border-dashed rounded-xl text-muted-foreground">
                  No quizzes found for this category.
                </div>
              ) : (
                quizzesData.quizzes.map((quiz) => (
                  <Card key={quiz.id} className="bg-card/30 border-border/40 hover:bg-card/50 transition-colors">
                    <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{quiz.subject}</Badge>
                          <Badge variant="outline" className={`
                            ${quiz.difficulty === 'easy' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                              quiz.difficulty === 'hard' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                              'bg-orange-500/10 text-orange-500 border-orange-500/20'}
                          `}>
                            {quiz.difficulty}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-base">{quiz.title}</h4>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><CheckCircle size={14} /> {quiz.questionCount} Questions</span>
                          <span className="flex items-center gap-1"><Clock size={14} /> {quiz.durationMinutes || 0} mins</span>
                        </div>
                      </div>
                      <Button variant="secondary" className="w-full sm:w-auto shrink-0 mt-2 sm:mt-0">Start Quiz</Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
