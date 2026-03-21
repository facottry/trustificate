import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import { posts } from "@/data/blogPosts";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Twitter, Linkedin, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { PUBLIC_URL } from "@/lib/apiClient";

function BlogJsonLd({ post }: { post: typeof posts[0] }) {
  const url = `${PUBLIC_URL}/blog/${post.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: new Date(post.date).toISOString(),
    author: {
      "@type": "Person",
      name: post.author.name,
      url: `https://trustificate.clicktory.in/team/${post.author.slug}`,
    },
    publisher: {
      "@type": "Organization",
      name: "TRUSTIFICATE",
      url: "https://trustificate.clicktory.in",
    },
    mainEntityOfPage: url,
    articleSection: post.category,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = posts.find((p) => p.slug === slug);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} | TRUSTIFICATE Blog`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", post.excerpt);
      } else {
        const meta = document.createElement("meta");
        meta.name = "description";
        meta.content = post.excerpt;
        document.head.appendChild(meta);
      }
    }
    return () => {
      document.title = "TRUSTIFICATE";
    };
  }, [post]);

  if (!post) {
    return (
      <PublicLayout>
        <div className="container max-w-3xl py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <Button asChild><Link to="/blog">Back to Blog</Link></Button>
        </div>
      </PublicLayout>
    );
  }

  const related = posts.filter((p) => p.slug !== slug && p.category === post.category).slice(0, 3);
  const shareUrl = `${PUBLIC_URL}/blog/${slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied!");
  };

  const renderContent = (content: string) => {
    return content.split("\n\n").map((block, i) => {
      const trimmed = block.trim();
      if (trimmed.startsWith("## ")) {
        return <h2 key={i} className="text-xl font-bold mt-8 mb-3">{trimmed.slice(3)}</h2>;
      }
      if (trimmed.startsWith("### ")) {
        return <h3 key={i} className="text-lg font-semibold mt-6 mb-2">{trimmed.slice(4)}</h3>;
      }
      if (trimmed.startsWith("> ")) {
        return (
          <blockquote key={i} className="border-l-4 border-primary pl-4 my-6 italic text-muted-foreground">
            {trimmed.slice(2)}
          </blockquote>
        );
      }
      if (trimmed.startsWith("```")) {
        const code = trimmed.replace(/```\w*\n?/g, "").trim();
        return (
          <pre key={i} className="bg-muted rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono">
            <code>{code}</code>
          </pre>
        );
      }
      if (trimmed.startsWith("|")) {
        const rows = trimmed.split("\n").filter((r) => !r.match(/^\|[\s-|]+\|$/));
        return (
          <div key={i} className="overflow-x-auto my-6">
            <table className="w-full text-sm border">
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className={ri === 0 ? "bg-muted font-semibold" : "border-t"}>
                    {row.split("|").filter(Boolean).map((cell, ci) => (
                      <td key={ci} className="px-3 py-2">{cell.trim()}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("1. ")) {
        const items = trimmed.split("\n");
        const ordered = trimmed.startsWith("1.");
        const Tag = ordered ? "ol" : "ul";
        return (
          <Tag key={i} className={`my-4 space-y-1.5 pl-6 ${ordered ? "list-decimal" : "list-disc"}`}>
            {items.map((item, ii) => (
              <li key={ii} className="text-muted-foreground leading-relaxed">
                {item.replace(/^[-\d.]+\s*/, "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").split(/<strong>|<\/strong>/).map((part, pi) =>
                  pi % 2 === 1 ? <strong key={pi} className="text-foreground">{part}</strong> : part
                )}
              </li>
            ))}
          </Tag>
        );
      }
      const parts = trimmed.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-muted-foreground leading-relaxed my-3">
          {parts.map((part, pi) =>
            pi % 2 === 1 ? <strong key={pi} className="text-foreground">{part}</strong> : part
          )}
        </p>
      );
    });
  };

  return (
    <PublicLayout>
      <BlogJsonLd post={post} />
      <article className="py-16 lg:py-24">
        <div className="container max-w-3xl">
          <Button variant="ghost" size="sm" className="mb-8" onClick={() => navigate("/blog")}>
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Blog
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">{post.category}</span>
            <span className="text-xs text-muted-foreground">{post.date}</span>
            <span className="text-xs text-muted-foreground">{post.readTime}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6 leading-tight">{post.title}</h1>

          <div className="flex items-center gap-3 mb-8 pb-8 border-b">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {post.author.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <Link to={`/team/${post.author.slug}`} className="text-sm font-medium hover:text-primary transition-colors">
                {post.author.name}
              </Link>
              <p className="text-xs text-muted-foreground">{post.author.role}</p>
            </div>
          </div>

          <div className="prose-TRUSTIFICATE">{renderContent(post.content)}</div>

          {/* CTA Banner */}
          <div className="mt-12 p-6 rounded-xl bg-primary/5 border border-primary/20 text-center">
            <h3 className="text-lg font-semibold mb-2">Ready to issue verifiable certificates?</h3>
            <p className="text-sm text-muted-foreground mb-4">Start generating tamper-proof, instantly verifiable credentials for free.</p>
            <Button asChild>
              <Link to="/signup">Get Started Free</Link>
            </Button>
          </div>

          <div className="mt-12 pt-8 border-t">
            <p className="text-sm font-medium mb-3">Share this article</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer">
                  <Twitter className="mr-1.5 h-3.5 w-3.5" /> Twitter
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="mr-1.5 h-3.5 w-3.5" /> LinkedIn
                </a>
              </Button>
              <Button variant="outline" size="sm" onClick={copyLink}>
                <LinkIcon className="mr-1.5 h-3.5 w-3.5" /> Copy Link
              </Button>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-16 pt-8 border-t">
              <h2 className="text-xl font-bold mb-6">Related Articles</h2>
              <div className="grid gap-6 sm:grid-cols-3">
                {related.map((r) => (
                  <Link key={r.slug} to={`/blog/${r.slug}`} className="group">
                    <span className="text-xs font-medium text-primary">{r.category}</span>
                    <h3 className="text-sm font-semibold mt-1 mb-1.5 group-hover:text-primary transition-colors leading-snug">
                      {r.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{r.date}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </PublicLayout>
  );
}

