import { auth } from '@clerk/nextjs/server';
import { getUserMemory } from '@/lib/memory';
import type { ProfileAPI, ErrorResponse } from '@/types/api';

export const GET = async (): Promise<Response> => {
  try {
    const { userId } = await auth();
    if (!userId) {
      const errorResponse: ErrorResponse = { error: 'Unauthorized' };
      return Response.json(errorResponse, { status: 401 });
    }

    const profile = await getUserMemory(userId);

    const response: ProfileAPI.GetResponse = {
      profile: profile
        ? {
            ...profile,
            createdAt: profile.createdAt?.toISOString() ?? null,
            updatedAt: profile.updatedAt?.toISOString() ?? null,
          }
        : null,
    };

    return Response.json(response);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    return Response.json(errorResponse, { status: 500 });
  }
};

