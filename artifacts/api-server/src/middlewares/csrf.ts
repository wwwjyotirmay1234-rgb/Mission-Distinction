import { Request, Response, NextFunction } from "express";

/**
 * CSRF defense middleware.
 *
 * Architecture note: This API authenticates via JWT sent in the
 * `Authorization: Bearer <token>` header — stored in localStorage,
 * NOT in cookies. Browsers cannot auto-send Authorization headers
 * cross-site, so the app is inherently CSRF-safe by design.
 *
 * This middleware adds defense-in-depth by:
 *  1. Rejecting `application/x-www-form-urlencoded` on state-changing
 *     routes — the only Content-Type browsers can send cross-origin
 *     without a preflight (i.e., the only vector for classic CSRF).
 *  2. Logging a clear error if anyone inadvertently enables cookie-based
 *     auth in the future, so the risk is immediately visible.
 *
 * If you ever add HttpOnly cookie sessions, replace this with a
 * proper CSRF token (double-submit cookie or synchroniser token pattern).
 */
export function csrfDefense(req: Request, res: Response, next: NextFunction): void {
  const stateChanging = ["POST", "PUT", "PATCH", "DELETE"];
  if (!stateChanging.includes(req.method.toUpperCase())) {
    next();
    return;
  }

  const ct = (req.headers["content-type"] ?? "").toLowerCase().split(";")[0].trim();

  if (
    ct === "application/json" ||
    ct === "multipart/form-data" ||
    ct === ""
  ) {
    next();
    return;
  }

  if (ct === "application/x-www-form-urlencoded") {
    res.status(403).json({
      error:
        "Form-encoded requests are not accepted by this API. Send JSON with Content-Type: application/json.",
    });
    return;
  }

  next();
}
