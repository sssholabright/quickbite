import { z } from "zod";

export const dashboardFiltersSchema = z.object({
    dateRange: z.object({
        start: z.string().datetime(),
        end: z.string().datetime()
    }).optional(),
    timezone: z.string().optional()
});

export const activityFeedQuerySchema = z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    offset: z.string().regex(/^\d+$/).transform(Number).optional()
});