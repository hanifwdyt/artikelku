"use client";

import CosmicBackground from "@/components/CosmicBackground";

const endpoints = [
  {
    method: "GET",
    path: "/api/auth/status",
    auth: false,
    description: "Check authentication status and whether a password has been set up.",
    response: `{
  "hasPassword": true,
  "isAuthenticated": false
}`,
    curl: `curl http://localhost:3000/api/auth/status`,
  },
  {
    method: "POST",
    path: "/api/auth/setup",
    auth: false,
    description: "Set up the initial password. Only works if no password has been set yet.",
    body: `{ "password": "your-password" }`,
    response: `{ "success": true }`,
    curl: `curl -X POST http://localhost:3000/api/auth/setup \\
  -H "Content-Type: application/json" \\
  -d '{"password": "your-password"}'`,
  },
  {
    method: "POST",
    path: "/api/auth/login",
    auth: false,
    description: "Authenticate with your password. Returns a session cookie.",
    body: `{ "password": "your-password" }`,
    response: `{ "success": true }`,
    curl: `curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"password": "your-password"}' \\
  -c cookies.txt`,
  },
  {
    method: "POST",
    path: "/api/auth/logout",
    auth: true,
    description: "Clear the session cookie and log out.",
    response: `{ "success": true }`,
    curl: `curl -X POST http://localhost:3000/api/auth/logout -b cookies.txt`,
  },
  {
    method: "GET",
    path: "/api/articles",
    auth: false,
    description: "List all articles. Unauthenticated users only see published articles.",
    response: `[
  {
    "id": "clx...",
    "title": "My Article",
    "slug": "my-article",
    "content": "{}",
    "contentHtml": "",
    "status": "published",
    "positionX": 100,
    "positionY": 200,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
]`,
    curl: `curl http://localhost:3000/api/articles`,
  },
  {
    method: "POST",
    path: "/api/articles",
    auth: true,
    description: "Create a new article. A unique slug is auto-generated from the title.",
    body: `{
  "title": "My Article",
  "positionX": 100,
  "positionY": 200
}`,
    response: `{
  "id": "clx...",
  "title": "My Article",
  "slug": "my-article",
  "status": "draft",
  ...
}`,
    curl: `curl -X POST http://localhost:3000/api/articles \\
  -H "Content-Type: application/json" \\
  -b cookies.txt \\
  -d '{"title": "My Article", "positionX": 100, "positionY": 200}'`,
  },
  {
    method: "GET",
    path: "/api/articles/:slug",
    auth: false,
    description: "Get a single article by slug. Unauthenticated users can only access published articles.",
    response: `{
  "id": "clx...",
  "title": "My Article",
  "slug": "my-article",
  "content": "{...}",
  "contentHtml": "<p>...</p>",
  "status": "published",
  ...
}`,
    curl: `curl http://localhost:3000/api/articles/my-article`,
  },
  {
    method: "PUT",
    path: "/api/articles/:slug",
    auth: true,
    description: "Update an article. All fields are optional — only provided fields are updated.",
    body: `{
  "title": "Updated Title",
  "content": "{...}",
  "contentHtml": "<p>...</p>",
  "status": "published",
  "positionX": 150,
  "positionY": 250
}`,
    response: `{ "id": "clx...", "title": "Updated Title", ... }`,
    curl: `curl -X PUT http://localhost:3000/api/articles/my-article \\
  -H "Content-Type: application/json" \\
  -b cookies.txt \\
  -d '{"title": "Updated Title", "status": "published"}'`,
  },
  {
    method: "DELETE",
    path: "/api/articles/:slug",
    auth: true,
    description: "Delete an article permanently.",
    response: `{ "success": true }`,
    curl: `curl -X DELETE http://localhost:3000/api/articles/my-article -b cookies.txt`,
  },
  {
    method: "POST",
    path: "/api/upload",
    auth: true,
    description: "Upload an image file. Returns the public URL.",
    response: `{ "url": "/uploads/1234567890-abc123.png" }`,
    curl: `curl -X POST http://localhost:3000/api/upload \\
  -b cookies.txt \\
  -F "file=@image.png"`,
  },
  {
    method: "GET",
    path: "/api/links",
    auth: true,
    description: "List all article connections (links between articles).",
    response: `[
  {
    "id": "clx...",
    "sourceId": "clx...",
    "targetId": "clx...",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
]`,
    curl: `curl http://localhost:3000/api/links -b cookies.txt`,
  },
  {
    method: "POST",
    path: "/api/links",
    auth: true,
    description: "Create a connection between two articles.",
    body: `{
  "sourceId": "article-id-1",
  "targetId": "article-id-2"
}`,
    response: `{
  "id": "clx...",
  "sourceId": "article-id-1",
  "targetId": "article-id-2",
  "createdAt": "2026-01-01T00:00:00.000Z"
}`,
    curl: `curl -X POST http://localhost:3000/api/links \\
  -H "Content-Type: application/json" \\
  -b cookies.txt \\
  -d '{"sourceId": "article-id-1", "targetId": "article-id-2"}'`,
  },
  {
    method: "DELETE",
    path: "/api/links/:id",
    auth: true,
    description: "Remove a connection between two articles.",
    response: `{ "success": true }`,
    curl: `curl -X DELETE http://localhost:3000/api/links/link-id -b cookies.txt`,
  },
];

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-stone-600/40 text-stone-300 border-stone-500/30",
    POST: "bg-amber-600/20 text-amber-300 border-amber-500/30",
    PUT: "bg-amber-600/20 text-amber-300 border-amber-500/30",
    DELETE: "bg-red-600/20 text-red-300 border-red-500/30",
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs font-mono font-medium rounded border ${colors[method] || colors.GET}`}
    >
      {method}
    </span>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-[#0a0a12] border border-stone-500/15 rounded-lg p-4 overflow-x-auto text-sm font-[family-name:var(--font-mono)] text-stone-300 leading-relaxed">
      {children}
    </pre>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen relative">
      <CosmicBackground />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="mb-16 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-stone-300 to-amber-200 bg-clip-text text-transparent font-[family-name:var(--font-playfair)]">
            nulis API
          </h1>
          <p className="text-stone-400 text-lg max-w-xl mx-auto">
            REST API documentation for the cosmic writing canvas.
            All endpoints return JSON responses.
          </p>
        </header>

        {/* Navigation */}
        <nav className="mb-16 bg-[#1a1917]/60 backdrop-blur-sm border border-stone-500/15 rounded-xl p-6">
          <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4 font-[family-name:var(--font-playfair)]">
            Endpoints
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {endpoints.map((ep, i) => (
              <a
                key={i}
                href={`#endpoint-${i}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-700/20 transition-colors group"
              >
                <MethodBadge method={ep.method} />
                <span className="text-sm text-stone-400 group-hover:text-stone-200 font-mono transition-colors">
                  {ep.path}
                </span>
                {ep.auth && (
                  <span className="text-[10px] text-amber-400/60 ml-auto">
                    AUTH
                  </span>
                )}
              </a>
            ))}
          </div>
        </nav>

        {/* Endpoints */}
        <div className="space-y-12">
          {endpoints.map((ep, i) => (
            <section
              key={i}
              id={`endpoint-${i}`}
              className="bg-[#1a1917]/60 backdrop-blur-sm border border-stone-500/15 rounded-xl p-6 scroll-mt-8"
            >
              <div className="flex items-center gap-3 mb-3">
                <MethodBadge method={ep.method} />
                <code className="text-lg text-stone-200 font-[family-name:var(--font-mono)]">
                  {ep.path}
                </code>
                {ep.auth && (
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                    Requires Auth
                  </span>
                )}
              </div>

              <p className="text-stone-400 text-sm mb-4">{ep.description}</p>

              {ep.body && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                    Request Body
                  </h4>
                  <CodeBlock>{ep.body}</CodeBlock>
                </div>
              )}

              <div className="mb-4">
                <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                  Response
                </h4>
                <CodeBlock>{ep.response}</CodeBlock>
              </div>

              <div>
                <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                  Example
                </h4>
                <CodeBlock>{ep.curl}</CodeBlock>
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-stone-600 text-sm">
          <p>
            nulis &mdash; A cosmic canvas for writing and connecting ideas.
          </p>
        </footer>
      </div>
    </div>
  );
}
