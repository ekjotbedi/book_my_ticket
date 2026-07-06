import { z } from "zod";
import * as bookingService from "../services/bookingService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createBookingSchema = z.object({
  sessionId: z.coerce.number().int().positive(),
  seatIds: z.array(z.coerce.number().int().positive()).min(1).max(10),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createBooking = asyncHandler(async (req, res) => {
  const booking = bookingService.createBooking({
    userId: req.user.id,
    sessionId: req.body.sessionId,
    seatIds: req.body.seatIds,
  });
  res.status(201).json(booking);
});

export const myBookings = asyncHandler(async (req, res) => {
  res.json(bookingService.listMyBookings(req.user.id));
});

export const cancelBooking = asyncHandler(async (req, res) => {
  res.json(bookingService.cancelBooking(req.params.id, req.user.id));
});
