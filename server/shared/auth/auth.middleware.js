/**
 * Middleware to check if user is authenticated
 */
exports.isAuthenticated = (req, res, next) => {
  // Optional debug logging (can be toggled)
  if (process.env.DEBUG_AUTH === "true") {
    console.log("🔍 AUTH CHECK:");
    console.log("   Path:", req.path);
    console.log("   Session ID:", req.session?.id);
    console.log("   User ID:", req.session?.userId);
  }

  if (req.session && req.session.userId) {
    req.userId = req.session.userId;
    return next();
  }

  return res.status(401).json({
    message: "Unauthorized",
    debug: process.env.NODE_ENV === "development"
      ? {
          hasSession: !!req.session,
          sessionId: req.session?.id,
          hasUserId: !!req.session?.userId,
        }
      : undefined,
  });
};