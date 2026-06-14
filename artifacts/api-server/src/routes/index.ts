import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import notesRouter from "./notes";
import pdfsRouter from "./pdfs";
import booksRouter from "./books";
import quizzesRouter from "./quizzes";
import communityRouter from "./community";
import announcementsRouter from "./announcements";
import progressRouter from "./progress";
import bookmarksRouter from "./bookmarks";
import calendarRouter from "./calendar";
import dashboardRouter from "./dashboard";
import uploadRouter from "./upload";
import feedbackRouter from "./feedback";
import leaderboardRouter from "./leaderboard";
import doubtsRouter from "./doubts";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/notes", notesRouter);
router.use("/pdfs", pdfsRouter);
router.use("/books", booksRouter);
router.use("/quizzes", quizzesRouter);
router.use("/quiz-attempts", (req, res, next) => {
  req.url = "/attempts/my";
  quizzesRouter(req, res, next);
});
router.use("/community", communityRouter);
router.use("/announcements", announcementsRouter);
router.use("/progress", progressRouter);
router.use("/bookmarks", bookmarksRouter);
router.use("/calendar", calendarRouter);
router.use("/dashboard", dashboardRouter);
router.use("/upload", uploadRouter);
router.use("/feedback", feedbackRouter);
router.use("/leaderboard", leaderboardRouter);
router.use("/doubts", doubtsRouter);

export default router;
