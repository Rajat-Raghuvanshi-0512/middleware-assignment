import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { conversations } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const GET = async () => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt));

    return Response.json({
      conversations: data,
    });
  } catch (error) {
    console.error("Error listing conversations:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};
