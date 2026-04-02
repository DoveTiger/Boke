export interface PostSummary {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  topics: string[];
  date: string;
  updated?: string;
  pinned: boolean;
  lang: string;
}

export interface PostDetail extends PostSummary {
  content: string;
}

export interface PostRelationsResponse {
  previous: PostSummary | null;
  next: PostSummary | null;
  related: PostSummary[];
}

export interface PostListResponse {
  total: number;
  page: number;
  size: number;
  items: PostSummary[];
}

export interface SearchResult {
  total: number;
  page: number;
  size: number;
  items: PostSummary[];
}

export interface TagSummary {
  name: string;
  slug: string;
  count: number;
}

export interface TopicSummary {
  name: string;
  slug: string;
  count: number;
}

export interface TagPostResponse {
  total: number;
  page: number;
  size: number;
  items: PostSummary[];
}

export interface TopicPostResponse {
  total: number;
  page: number;
  size: number;
  items: PostSummary[];
}
