import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PublicLayout } from '@/components/PublicLayout';
import NewsletterCTA from '@/components/NewsletterCTA';
import { fetchPublicNewsletterBySlug } from '@/lib/publicNewsletter';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function NewsletterDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-newsletter', slug],
    queryFn: () => fetchPublicNewsletterBySlug(slug!),
    enabled: !!slug,
  });

  const newsletter = data?.data;

  useEffect(() => {
    if (newsletter) {
      document.title = `${newsletter.subject} | Trustificate Newsletter`;
    }
    return () => { document.title = 'TRUSTIFICATE'; };
  }, [newsletter]);

  return (
    <PublicLayout>
      <section className="py-20 lg:py-28">
        <div className="container max-w-3xl">
          <Link to="/newsletter" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Newsletter Archive
          </Link>

          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {isError && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">Newsletter not found</h2>
              <p className="text-muted-foreground mb-4">This newsletter may have been removed or the link is incorrect.</p>
              <Link to="/newsletter" className="text-primary hover:underline">Browse all newsletters</Link>
            </div>
          )}

          {newsletter && (
            <article>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">{newsletter.subject}</h1>
              <p className="text-sm text-muted-foreground mb-8">
                {new Date(newsletter.sentAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <div className="prose prose-slate max-w-none whitespace-pre-wrap mb-12">
                {newsletter.body}
              </div>
              <div className="p-6 rounded-lg border bg-muted/30">
                <h2 className="text-lg font-semibold mb-3">Subscribe to our newsletter</h2>
                <NewsletterCTA />
              </div>
            </article>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
