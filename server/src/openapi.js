// Minimal OpenAPI 3 description served at /api/docs via swagger-ui-express.
// Enough for a clean, clickable "technical demonstration" of the API.

export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Event Ticket Booking API",
    version: "1.0.0",
    description:
      "REST API for browsing events and booking seats. Seat booking is " +
      "concurrency-safe: a UNIQUE constraint plus a SQL transaction prevent " +
      "the same seat from ever being booked twice.",
  },
  servers: [{ url: "/api" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: { required: true },
        responses: { 201: { description: "Created" }, 409: { description: "Email taken" } },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in and receive a JWT",
        responses: { 200: { description: "OK" }, 401: { description: "Invalid credentials" } },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Current user",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/events": {
      get: { tags: ["Events"], summary: "List events", responses: { 200: { description: "OK" } } },
    },
    "/events/{id}": {
      get: {
        tags: ["Events"],
        summary: "Event detail with sessions + availability",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "OK" }, 404: { description: "Not found" } },
      },
    },
    "/sessions/{id}": {
      get: {
        tags: ["Events"],
        summary: "Session detail with seat map",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "OK" }, 404: { description: "Not found" } },
      },
    },
    "/bookings": {
      post: {
        tags: ["Bookings"],
        summary: "Book one or more seats (atomic, concurrency-safe)",
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: "Booked" },
          409: { description: "Seat already booked" },
          400: { description: "Validation error" },
        },
      },
    },
    "/bookings/me": {
      get: {
        tags: ["Bookings"],
        summary: "My tickets",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/bookings/{id}": {
      delete: {
        tags: ["Bookings"],
        summary: "Cancel a booking (frees the seats)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Cancelled" }, 404: { description: "Not found" } },
      },
    },
  },
};
