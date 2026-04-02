import type {
  PostDetail,
  PostListResponse,
  PostRelationsResponse,
  SearchResult,
  TagPostResponse,
  TagSummary,
  TopicPostResponse,
  TopicSummary,
} from '~/types/api';

export async function fetchPosts(page = 1, size = 10): Promise<PostListResponse> {
  return useApiFetch<PostListResponse>(`/posts?page=${page}&size=${size}`);
}

export async function fetchPostBySlug(slug: string): Promise<PostDetail> {
  return useApiFetch<PostDetail>(`/posts/${slug}`);
}

export async function fetchPostRelations(slug: string): Promise<PostRelationsResponse> {
  return useApiFetch<PostRelationsResponse>(`/posts/${slug}/relations`);
}

export async function fetchSearch(query: string, page = 1, size = 10): Promise<SearchResult> {
  return useApiFetch<SearchResult>(`/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`);
}

export async function fetchTags(): Promise<TagSummary[]> {
  return useApiFetch<TagSummary[]>('/tags');
}

export async function fetchTagPosts(slug: string, page = 1, size = 10, query?: string): Promise<TagPostResponse> {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  if (query?.trim()) {
    searchParams.set('q', query.trim());
  }

  return useApiFetch<TagPostResponse>(`/tags/${encodeURIComponent(slug)}/posts?${searchParams.toString()}`);
}

export async function fetchTopics(): Promise<TopicSummary[]> {
  return useApiFetch<TopicSummary[]>('/topics');
}

export async function fetchTopicPosts(slug: string, page = 1, size = 10): Promise<TopicPostResponse> {
  return useApiFetch<TopicPostResponse>(`/topics/${encodeURIComponent(slug)}/posts?page=${page}&size=${size}`);
}

function runtimeApiBase(): string {
  const config = useRuntimeConfig();
  return config.public.apiBase as string;
}

async function useApiFetch<T>(path: string): Promise<T> {
  return $fetch<T>(`${runtimeApiBase()}${path}`, {
    retry: 2,
    retryDelay: 250,
    timeout: 8_000,
  });
}
