import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/PublicLayout';
import { MailX } from 'lucide-react';

export default function NewsletterUnsubscribed() {
  useEffect(() => {
    document.title = 'Unsubscribed | Trustificate';
    return () => { document.title = 'TRUSTIFICATE'; };
  }, []);

  return (
    <PublicLayout>
      <section className="py-20 lg:py-28 bg-brand-hero">
        <div className="container max-w-lg text-center">
          <MailX className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">You've been unsubscribed</h1>
          <p className="text-muted-foreground mb-8">
            You will no longer receive newsletter emails from Trustificate. If this was a mistake, you can always subscribe again.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/" className="text-primary hover:underline text-sm">Go to homepage</Link>
            <Link to="/newsletter" className="text-primary hover:underline text-sm">Newsletter archive</Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
