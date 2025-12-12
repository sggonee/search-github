import { createGitHubSearchUserRepository } from '@/features/github/searchUsers/repository';
import { createSearchUsersService } from '@/features/github/searchUsers/service';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page') ?? '1';

  const repo = createGitHubSearchUserRepository();
  const searchUsers = createSearchUsersService(repo);

  try {
    const result = await searchUsers({ ...Object.fromEntries(searchParams), page });
    return Response.json(result);
  } catch (error: any) {
    const message = error?.message || 'Internal Server Error';
    return new Response(message, error);
  }
}
