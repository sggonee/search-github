import { createGitHubSearchUserRepository } from '@/features/github/searchUsers/repository';
import { createSearchUsersService } from '@/features/github/searchUsers/service';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q') ?? '';

  const repo = createGitHubSearchUserRepository();
  const searchUsers = createSearchUsersService(repo);

  const result = await searchUsers(q);
  return Response.json(result);
}
