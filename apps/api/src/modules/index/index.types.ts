import { PublishedPost } from '../content/content.types';

export type IndexPost = PublishedPost;

export interface SearchItem {
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

export interface SearchResult {
  total: number;
  page: number;
  size: number;
  items: SearchItem[];
}

export interface TagSummary {
  name: string;
  slug: string;
  count: number;
}

export interface TagPostItem {
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

export interface TagPostResponse {
  total: number;
  page: number;
  size: number;
  items: TagPostItem[];
}

export interface TopicSummary {
  name: string;
  slug: string;
  count: number;
}

export interface TopicPostItem {
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

export interface TopicPostResponse {
  total: number;
  page: number;
  size: number;
  items: TopicPostItem[];
}

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
