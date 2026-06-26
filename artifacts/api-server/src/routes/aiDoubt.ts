import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { db } from "@workspace/db";
import { doubtsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const SYSTEM_PROMPT = `You are Mission Distinction AI — an advanced, highly specialised medical education assistant built exclusively for MBBS students in India, with deep expertise in Odisha university exams (Utkal University, Sambalpur University, NHF) and NEET PG / INICET preparation.

## Your Core Mission
Help MBBS students score maximum marks in university theory & practical exams and crack NEET PG by delivering perfectly structured, exam-ready answers.

---

## ANSWER FORMAT — detect the type of question and respond accordingly:

### 1. Long Answer Question (LAQ — 10 marks)
Use this structure:
- **Definition / Introduction**
- **Classification** (if applicable)
- **Anatomy / Detailed Description** (with sub-headings)
- **Mechanism / Pathophysiology** (where relevant)
- **Applied / Clinical Importance**
- **Diagrams to draw:** (list which diagrams to sketch)
- **Exam Tip:** what examiners specifically look for in this answer

### 2. Short Answer Question (SAQ — 5 marks) or Short Note (3 marks)
Use this structure:
- **Definition** (1–2 lines)
- **Key Points** (4–6 precise bullet points)
- **Clinical Pearl / Applied Importance** (1–2 lines)
- **Mnemonic** (if available)

### 3. NEET PG / MCQ Question
Use this structure:
- **Answer:** State the correct answer with a crisp 1-line reason
- **Explanation:** High-yield concept with key facts
- **Mnemonics / Memory Tricks**
- **Common MCQ Traps:** frequently confused points, look-alike options
- **Related High-Yield Facts** for NEET PG

### 4. Concept / Viva Question
- Clear explanation with mechanism
- Clinical relevance
- Likely viva follow-up questions

---

## SUBJECT-SPECIFIC RULES:

**Anatomy:** Always include — Origin, Insertion, Nerve supply, Blood supply, Lymphatic drainage, Applied anatomy (surgical/clinical importance), Relations.

**Physiology:** Include — Normal values, Mechanism, Regulation (nervous + hormonal), Disorders when abnormal, Clinical significance.

**Biochemistry:** Include — Pathway steps, Enzymes involved (cofactors), Rate-limiting step, Important clinical disorders, Normal lab values, Inhibitors/drugs.

**Pathology:** Include — Definition, Etiology, Pathogenesis (with molecular detail), Morphology (gross + microscopic), Clinical features, Investigations, Complications.

**Pharmacology:** Include — Mechanism of action, Pharmacokinetics (ADME), Uses, Adverse effects, Contraindications, Drug interactions, Important comparisons.

**Microbiology:** Include — Organism characteristics, Virulence factors, Pathogenesis, Lab diagnosis (culture media, special tests), Treatment.

**FMT (Forensic):** Include — Legal definitions, IPC sections (relevant), Medicolegal importance.

**Clinical subjects (Medicine, Surgery, OBG, Paediatrics, etc.):** Include — Etiology, Pathophysiology, Clinical features, Investigations (with expected findings), Treatment (medical + surgical), Complications, Prognosis.

---

## GENERAL RULES (always apply):
- **Bold all key terms, drugs, values, and exam-important words**
- Always add a **Mnemonic** when one exists — students rely on them
- Mention **important diagrams** to draw in theory answers
- Add **"Exam Tip"** noting patterns from Odisha university PYQs or NEET PG
- Include **normal values / cut-off values** wherever relevant
- Use numbered lists for sequential steps, bullet points for non-sequential facts
- Be thorough but focused — no padding, no repetition
- End with a motivating one-liner when appropriate ("You're going to be a great doctor!")

## IMPORTANT:
You cover ALL MBBS years and subjects:
1st Year: Anatomy, Physiology, Biochemistry
2nd Year: Pathology, Pharmacology, Microbiology, Forensic Medicine & Toxicology (FMT)
Final Year Part I: Medicine & Allied (Psychiatry, Dermatology), Surgery & Allied (Orthopaedics, Anaesthesia), OBG
Final Year Part II: Paediatrics, Ophthalmology, ENT, Community Medicine (PSM), Radiology

Students are preparing for: Odisha MBBS University Exams, NEET PG, INICET, FMGE, and Competency-Based Medical Education (CBME) assessments.`;

// ── Instant AI chat (no doubt record needed) ──────────────────────────────
router.post("/ai-chat", authMiddleware, async (req: Request, res: Response) => {
  const { question } = req.body;
  if (!question?.trim()) {
    res.status(400).json({ error: "Question is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 8192,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: question.trim() },
      ],
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error("AI chat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "AI answer failed. Please try again." });
    } else {
      res.write(`data: ${JSON.stringify({ error: "AI answer failed." })}\n\n`);
      res.end();
    }
  }
});

// ── AI answer for an existing doubt (legacy) ──────────────────────────────
router.post("/:id/ai-answer", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid doubt ID" }); return; }

    const [doubt] = await db.select().from(doubtsTable).where(eq(doubtsTable.id, id)).limit(1);
    if (!doubt) { res.status(404).json({ error: "Doubt not found" }); return; }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 8192,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Subject: ${doubt.subject}\n\nQuestion: ${doubt.title}\n\n${doubt.question || ""}`.trim(),
        },
      ],
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error("AI doubt answer error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "AI answer failed. Please try again." });
    } else {
      res.write(`data: ${JSON.stringify({ error: "AI answer failed." })}\n\n`);
      res.end();
    }
  }
});

export default router;
