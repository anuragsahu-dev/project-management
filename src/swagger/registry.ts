import {
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// Register Cookie-based Authentication
// Note: OpenAPI doesn't have native cookie auth, so we use apiKey in cookie
registry.registerComponent("securitySchemes", "cookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "accessToken",
  description: "JWT token stored in HTTP-only cookie",
});
