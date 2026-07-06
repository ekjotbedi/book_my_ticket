// Request validation middleware powered by Zod. Pass a schema for the part of
// the request you want to validate (body/params/query).

import { ApiError } from "../utils/ApiError.js";

export const validate = (schema, source = "body") => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    return next(ApiError.badRequest("Validation failed", details));
  }
  req[source] = result.data;
  next();
};
