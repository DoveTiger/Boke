export type PostStatus = 'draft' | 'published';

export interface PostFrontmatter {
  title: string;
  slug: string;
  date: string;
  updated?: string;
  summary: string;
  tags: string[];
  topics: string[];
  pinned?: boolean;
  status: PostStatus;
  lang?: string;
}

export interface PublishedPost {
  title: string;
  slug: string;
  date: string;
  updated?: string;
  summary: string;
  tags: string[];
  topics: string[];
  pinned: boolean;
  lang: string;
  content: string;
}
