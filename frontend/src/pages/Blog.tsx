import { useState, useEffect, useMemo } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import { Link } from "react-router-dom";
import { posts, categories } from "@/data/blogPosts";

const POSTS_PER_PAGE = 10;

export default function Blog() {
  const [active, setActive] = useState("All");
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);

  useEffect(() => {
    document.title = "Blog | TRUSTIFICATE Certificate Generation & Verification Insights";
    const meta = document.querySelector('meta[name="description"]');
    const desc = "Expert insights on certificate generation, digital credential verification, compliance, and document automation from the TRUSTIFICATE team.";
    if (meta) {
      meta.setAttribute("content", desc);
    } else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
    return () => { document.title = "TRUSTIFICATE"; };
  }, []);

  const filtered = useMemo(
    () => active === "All" ? posts : posts.filter((p) => p.category === active),
    [active]
  );

  useEffect(() => {
    setVisibleCount(POSTS_PER_PAGE);
  }, [active]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <PublicLayout>
      <section className="py-20 lg:py-28">
        <div className="container max-w-4xl">
          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">Blog</h1>
            <p className="text-lg text-muted-foreground">
              Insights on certificate generation, digital credential verification, and document automation.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap mb-10">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  c === active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            {filtered.length} article{filtered.length !== 1 ? "s" : ""}
            {active !== "All" ? ` in ${active}` : ""}
          </p>

          <div className="space-y-0 divide-y">
            {visible.map((post) => (
              <article key={post.slug} className="py-8 first:pt-0">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-primary">{post.category}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{post.date}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{post.readTime}</span>
                </div>
                <Link to={`/blog/${post.slug}`}>
                  <h2 className="text-lg font-semibold mb-2 hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                </Link>
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">{post.excerpt}</p>
                <Link to={`/team/${post.author.slug}`} className="text-xs font-medium text-primary hover:underline">
                  {post.author.name}
                </Link>
              </article>
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-10">
              <button
                onClick={() => setVisibleCount((c) => c + POSTS_PER_PAGE)}
                className="px-6 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Load More Articles
              </button>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}

