// src/app/actions/debug-actions.ts
'use server';

import { getUserDataForWeeklyReview } from "@/ai/tools/get-user-data";
import { z } from "zod";

const DebugDataParams = z.object({
    userId: z.string(),
});

/**
 * A server action to safely call the server-only getUserDataForWeeklyReview tool
 * from a client component.
 */
export async function fetchDebugData(params: z.infer<typeof DebugDataParams>) {
    try {
        const validatedParams = DebugDataParams.parse(params);
        const data = await getUserDataForWeeklyReview({ userId: validatedParams.userId });
        return data;
    } catch (error) {
        console.error("Error in fetchDebugData server action:", error);
        // It's better to re-throw or return a structured error
        // so the client can handle it gracefully.
        if (error instanceof z.ZodError) {
            throw new Error("Invalid parameters provided to the debug action.");
        }
        throw new Error("An error occurred on the server while fetching debug data.");
    }
}
