import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

// Put this in front of a route that reads req.body. It checks the body against the schema.
// A good body replaces req.body with the parsed value; a bad one is answered with 400.
//
// Example: a post body must be 1 to 2,000 characters.
//
//   const createPostBody = z.object({ body: z.string().min(1).max(2000) });
//
//   postsRouter.post(
//     "/",
//     requireLogin,
//     requirePermission("posts.create"),
//     validateBody(createPostBody),
//     createPost,
//   );
//
// A bad body gets back, for example:
//   { "error": "Invalid request", "problems": [{ "field": "body", "message": "..." }] }
export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: "Invalid request",
        problems: result.error.issues.map((issue) => ({
          field: issue.path.map(String).join("."),
          message: issue.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
