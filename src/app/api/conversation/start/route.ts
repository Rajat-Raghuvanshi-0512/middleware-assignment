import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { conversations } from "@/db/schema";

export const POST = async () => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [row] = await db.insert(conversations).values({ userId }).returning();

    return Response.json({ conversationId: row.id });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};
