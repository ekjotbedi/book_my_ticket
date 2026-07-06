import { z } from "zod";
import * as eventService from "../services/eventService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listEvents = asyncHandler(async (_req, res) => {
  res.json(eventService.listEvents());
});

export const getEvent = asyncHandler(async (req, res) => {
  res.json(eventService.getEvent(req.params.id));
});

export const getSession = asyncHandler(async (req, res) => {
  res.json(eventService.getSessionWithSeats(req.params.id));
});
