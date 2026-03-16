import { useParams, Link, Navigate, useLocation } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { docPages, getDocNavigation } from "@/data/docsData";
import { Book, ChevronRight, ArrowLeft, ArrowRight, Code, Copy, Check } from "lucide-react";
import { MascotInline } from "@/components/Mascot";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 rounded bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function renderDocContent(content: string) {
  const lines = content.trim().split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks
    if (line.trim().startsWith("```")) {
      const lang = line.trim().replace("```", "");
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const code = codeLines.join("\n");
      elements.push(
        <div key={elements.length} className="relative my-4 group">
          {lang && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-t-md border border-b-0 border-border">
              <Code className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-mono">{lang}</span>
            </div>
          )}
          <pre className={cn("bg-muted/50 border border-border p-4 overflow-x-auto text-sm font-mono", lang ? "rounded-b-md" : "rounded-md")}>
            <code>{code}</code>
          </pre>
          <CopyButton text={code} />
        </div>
      );
      continue;
    }

    // Tables
    if (line.includes("|") && line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2) {
        const headers = tableLines[0].split("|").filter(Boolean).map((h) => h.trim());
        const rows = tableLines.slice(2).map((r) => r.split("|").filter(Boolean).map((c) => c.trim()));
        elements.push(
          <div key={elements.length} className="my-4 overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-md">
              <thead>
                <tr className="bg-muted/50">
                  {headers.map((h, j) => (
                    <th key={j} className="text-left px-3 py-2 font-medium text-foreground border-b border-border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, j) => (
                  <tr key={j} className="border-b border-border last:border-0">
                    {row.map((cell, k) => (
                      <td key={k} className="px-3 py-2 text-muted-foreground">
                        {cell.startsWith("`") && cell.endsWith("`") ? (
                          <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">{cell.slice(1, -1)}</code>
                        ) : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Headers
    if (line.startsWith("# ")) {
      elements.push(<h1 key={elements.length} className="text-3xl font-bold text-foreground mt-8 mb-4">{line.slice(2)}</h1>);
      i++; continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h2 key={elements.length} className="text-xl font-semibold text-foreground mt-8 mb-3">{line.slice(3)}</h2>);
      i++; continue;
    }
    if (line.startsWith("### ")) {
      elements.push(<h3 key={elements.length} className="text-lg font-medium text-foreground mt-6 mb-2">{line.slice(4)}</h3>);
      i++; continue;
    }

    // Blockquotes
    if (line.startsWith("> ")) {
      elements.push(
        <div key={elements.length} className="border-l-4 border-warning bg-warning/5 pl-4 py-2 my-4 text-sm text-foreground">
          {line.slice(2).replace("âš ï¸ ", "")}
        </div>
      );
      i++; continue;
    }

    // List items
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={elements.length} className="list-disc pl-6 my-3 space-y-1">
          {items.map((item, j) => (
            <li key={j} className="text-sm text-muted-foreground">{renderInlineContent(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered lists
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={elements.length} className="list-decimal pl-6 my-3 space-y-1">
          {items.map((item, j) => (
            <li key={j} className="text-sm text-muted-foreground">{renderInlineContent(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty lines
    if (line.trim() === "") { i++; continue; }

    // Paragraphs
    elements.push(<p key={elements.length} className="text-sm text-muted-foreground my-2 leading-relaxed">{renderInlineContent(line)}</p>);
    i++;
  }

  return elements;
}

function renderInlineContent(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      return <Link key={i} to={linkMatch[2]} className="text-primary hover:underline">{linkMatch[1]}</Link>;
    }
    return part;
  });
}

export default function DocsPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigation = getDocNavigation();
  
  // Default to introduction
  const currentSlug = slug || "introduction";
  const page = docPages.find((p) => p.slug === currentSlug);
  
  const sortedPages = docPages.sort((a, b) => a.order - b.order);
  const currentIndex = sortedPages.findIndex((p) => p.slug === currentSlug);
  const prevPage = currentIndex > 0 ? sortedPages[currentIndex - 1] : null;
  const nextPage = currentIndex < sortedPages.length - 1 ? sortedPages[currentIndex + 1] : null;

  useEffect(() => {
    if (page) {
      document.title = page.metaTitle;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", page.metaDescription);
    }
  }, [page]);

  if (slug && !page) return <Navigate to="/docs" replace />;

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <MascotInline className="h-6 w-6" />
                <Book className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">API Documentation</span>
              </div>
              <ScrollArea className="h-[calc(100vh-12rem)]">
                <nav className="space-y-6">
                  {navigation.map((group) => (
                    <div key={group.category}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.category}</p>
                      <ul className="space-y-1">
                        {group.pages.map((p) => (
                          <li key={p.slug}>
                            <Link
                              to={`/docs/${p.slug}`}
                              className={cn(
                                "block px-3 py-1.5 text-sm rounded-md transition-colors",
                                p.slug === currentSlug
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              )}
                            >
                              {p.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </nav>
              </ScrollArea>
            </div>
          </aside>

          {/* Mobile nav */}
          <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
            <details className="bg-card border border-border rounded-lg shadow-lg">
              <summary className="px-4 py-3 text-sm font-medium cursor-pointer flex items-center gap-2">
                <Book className="h-4 w-4 text-primary" />
                <span>Navigation</span>
                <ChevronRight className="h-4 w-4 ml-auto" />
              </summary>
              <div className="px-4 pb-4 max-h-64 overflow-y-auto">
                {navigation.map((group) => (
                  <div key={group.category} className="mt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{group.category}</p>
                    {group.pages.map((p) => (
                      <Link
                        key={p.slug}
                        to={`/docs/${p.slug}`}
                        className={cn(
                          "block px-2 py-1 text-sm rounded",
                          p.slug === currentSlug ? "text-primary font-medium" : "text-muted-foreground"
                        )}
                      >
                        {p.title}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </details>
          </div>

          {/* Content */}
          <main className="flex-1 min-w-0 max-w-3xl">
            {page && (
              <>
                <Badge variant="outline" className="mb-4 text-xs">{page.category}</Badge>
                <article className="prose-sm">
                  {renderDocContent(page.content)}
                </article>

                <Separator className="my-8" />

                {/* Prev/Next */}
                <div className="flex justify-between gap-4">
                  {prevPage ? (
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/docs/${prevPage.slug}`}>
                        <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                        {prevPage.title}
                      </Link>
                    </Button>
                  ) : <div />}
                  {nextPage && (
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/docs/${nextPage.slug}`}>
                        {nextPage.title}
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {page && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "TechArticle",
              name: page.metaTitle,
              description: page.metaDescription,
              url: `https://trustificate.clicktory.in/docs/${page.slug}`,
            }),
          }}
        />
      )}
    </PublicLayout>
  );
}

