// src/app/actions/debug-actions.ts
'use server';

import { getUserDataForWeeklyReview } from "@/ai/tools/get-user-data";
import { generateOnDemandReport, GenerateOnDemandReportInput, GenerateOnDemandReportOutput } from "@/ai/flows/generate-on-demand-report";
import { z } from "zod";

const DebugDataParams = z.object({
    userId: z.string(),
});

/**
 * A server action to safely call the server-only getUserDataForWeeklyReview tool
 * from a client component.
 */
export async function fetchDebugData(params: z.infer<typeof DebugDataParams>): Promise<any> {
    try {
        const validatedParams = DebugDataParams.parse(params);
        const data = await getUserDataForWeeklyReview({ userId: validatedParams.userId });
        return data;
    } catch (error) {
        console.error("Error in fetchDebugData server action:", error);
        if (error instanceof z.ZodError) {
            throw new Error("Invalid parameters provided to the debug action.");
        }
        throw new Error("An error occurred on the server while fetching debug data.");
    }
}


/**
 * A server action to generate a report from a provided JSON object of user data.
 * This is used for testing the prompt with controlled data.
 */
export async function generateReportFromData(params: { userData: any, geminiApiKey?: string }): Promise<GenerateOnDemandReportOutput> {
    try {
        // Here, we directly call the report generation flow with the provided data.
        // This bypasses the live data fetching for testing purposes.
        const result = await generateOnDemandReport({
            userData: params.userData,
            geminiApiKey: params.geminiApiKey,
        });
        return result;
    } catch (error) {
         console.error("Error in generateReportFromData server action:", error);
         throw new Error("An error occurred on the server while generating the report from data.");
    }
}