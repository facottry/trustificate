import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PublicLayout } from '@/components/PublicLayout';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function NewsletterConfirm() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');

  useEffect(() => {
    document.title = 'Newsletter Subscription Confirmed | Trustificate';
    return () => { document.title = 'TRUSTIFICATE'; };
  }, []);

  return (
    <PublicLayout>
      <section className="py-20 lg:py-28">
        <div className="container max-w-lg text-center">
          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
              <h1 className="text-3xl font-bold mb-4">You're subscribed!</h1>
              <p className="text-muted-foreground mb-8">
                Your newsletter subscription is now active. You'll receive our latest updates straight to your inbox.
              </p>
            </>
          )}
          {status === 'already' && (
            <>
              <Clock className="h-16 w-16 text-blue-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold mb-4">Already confirmed</h1>
              <p className="text-muted-foreground mb-8">
                Your subscription was already confirmed. No further action needed.
              </p>
            </>
          )}
          {status !== 'success' && status !== 'already' && (
            <>
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-6" />
              <h1 className="text-3xl font-bold mb-4">Invalid or expired link</h1>
              <p className="text-muted-foreground mb-8">
                This confirmation link is invalid or has expired. Please try subscribing again.
              </p>
            </>
          )}
          <Link to="/newsletter" className="text-primary hover:underline text-sm">
            Browse our newsletter archive
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
