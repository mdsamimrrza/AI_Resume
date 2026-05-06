import { Router } from "express";
import healthRouter from "./health.js";
import resumeRouter from "./resume/index.js";

const router = Router();

router.use(healthRouter);
router.use(resumeRouter);

export default router;
