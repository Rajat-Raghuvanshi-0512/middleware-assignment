import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { conversations } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
});

export const GET = async (req: Request) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const params = querySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const limit = params.limit ?? 20;
    const page = params.page ?? 1;
    const offset = (page - 1) * limit;

    const data = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [totalResult] = await db
      .select({ count: count() })
      .from(conversations)
      .where(eq(conversations.userId, userId));

    const total = totalResult?.count ?? 0;

    return Response.json({
      conversations: data,
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + data.length < total,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request parameters", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error listing conversations:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};
