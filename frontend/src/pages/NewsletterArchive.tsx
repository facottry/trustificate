import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/PublicLayout';
import NewsletterCTA from '@/components/NewsletterCTA';
import { fetchPublicNewsletters } from '@/lib/publicNewsletter';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NewsletterArchive() {
  useEffect(() => {
    document.title = 'Newsletter Archive | Trustificate';
    return () => { document.title = 'TRUSTIFICATE'; };
  }, []);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['public-newsletters'],
    queryFn: fetchPublicNewsletters,
  });

  const newsletters = data?.data ?? [];

  return (
    <PublicLayout>
      <section className="py-20 lg:py-28">
        <div className="container max-w-4xl">
          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">Newsletter</h1>
            <p className="text-lg text-muted-foreground">
              Stay up to date with the latest from Trustificate. Browse our past updates below.
            </p>
          </div>

          <div className="mb-12 p-6 rounded-lg border bg-muted/30 text-left">
            <h2 className="text-lg font-semibold mb-3">Subscribe to our newsletter</h2>
            <NewsletterCTA />
          </div>

          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {isError && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Failed to load newsletters.</p>
              <Button variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
          )}

          {!isLoading && !isError && newsletters.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No newsletters yet. Check back soon!</p>
          )}

          {!isLoading && !isError && newsletters.length > 0 && (
            <div className="space-y-0 divide-y text-left">
              {newsletters.map((n) => (
                <article key={n._id} className="py-8 first:pt-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(n.sentAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <Link to={`/newsletter/${n.slug || n._id}`}>
                    <h2 className="text-lg font-semibold mb-2 hover:text-primary transition-colors">{n.subject}</h2>
                  </Link>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {n.body.length > 200 ? n.body.slice(0, 200) + '…' : n.body}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
