import { useAuth } from '@/hooks/useAuth';
import SubscribeForm from '@/components/SubscribeForm';
import { CheckCircle } from 'lucide-react';

export default function NewsletterCTA() {
  const { user, loading } = useAuth();

  if (loading) return null;

  // Logged-in and subscribed → welcome message
  if (user && user.newsletterSubscribed !== false) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <p className="text-sm">You're subscribed! We'll keep you posted on the latest updates.</p>
      </div>
    );
  }

  // Anonymous or logged-in but not subscribed → subscribe form
  return <SubscribeForm />;
}
