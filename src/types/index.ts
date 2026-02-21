export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  contentHtml: string;
  status: "draft" | "published";
  positionX: number;
  positionY: number;
  createdAt: string;
  updatedAt: string;
  outgoingLinks?: ArticleLink[];
  incomingLinks?: ArticleLink[];
}

export interface ArticleLink {
  id: string;
  sourceId: string;
  targetId: string;
  createdAt: string;
}
