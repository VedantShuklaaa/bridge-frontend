import { z } from "zod";

/**
 * The live stream pushes the **v1** transaction shape, not v2.
 *
 * TODO(verify): no real stream message has been captured yet. Until one is,
 * only `hash` is required and every other field is allowed and ignored. Parse
 * each socket message with this schema and drop failures; never throw inside
 * the socket handler.
 */
export const liveMessageSchema = z.object({
  hash: z.string().min(1),
});

export type LiveMessage = z.infer<typeof liveMessageSchema>;
