import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { Mascot } from "@/components/Mascot";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PublicLayout>
      <section className="py-24 lg:py-32">
        <div className="container max-w-lg text-center">
          <Mascot mood="notFound" size="xl" message="This page seems to have wandered off…" />
          <h1 className="text-5xl font-bold mb-4 mt-6">404</h1>
          <p className="text-lg text-muted-foreground mb-2">Page not found</p>
          <p className="text-sm text-muted-foreground mb-8">
            The page <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{location.pathname}</code> doesn't exist or has been moved.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link to="/">
                <Home className="mr-1.5 h-3.5 w-3.5" /> Home
              </Link>
            </Button>
            <Button asChild>
              <Link to="/verify">
                Verify a Document
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default NotFound;
