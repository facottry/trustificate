import { useParams, Link } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { getTeamMemberBySlug } from "@/data/teamData";
import { posts } from "@/data/blogPosts";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BadgeCheck } from "lucide-react";

export default function TeamMember() {
  const { slug } = useParams();
  const member = getTeamMemberBySlug(slug || "");

  if (!member) {
    return (
      <PublicLayout>
        <div className="container max-w-3xl py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Team member not found</h1>
          <Button asChild>
            <Link to="/team">Back to Team</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const memberPosts = posts.filter((p) => p.author.name === member.name);

  return (
    <PublicLayout>
      <article className="py-16 lg:py-24">
        <div className="container max-w-3xl">
          <Button variant="ghost" size="sm" className="mb-8" asChild>
            <Link to="/team">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Team
            </Link>
          </Button>

          <div className="flex items-start gap-6 mb-8">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl flex-shrink-0">
              {member.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{member.name}</h1>
              <p className="text-primary font-medium mt-1">{member.role}</p>
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed text-base mb-8">
            {member.bio}
          </p>

          {/* Expertise */}
          <div className="mb-12">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-3">Areas of Expertise</h2>
            <div className="flex flex-wrap gap-2">
              {member.expertise.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                >
                  <BadgeCheck className="h-3 w-3" />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Articles by this member */}
          {memberPosts.length > 0 && (
            <div className="border-t pt-8">
              <h2 className="text-xl font-bold mb-6">
                Articles by {member.name.split(" ")[0]}
              </h2>
              <div className="space-y-0 divide-y">
                {memberPosts.map((post) => (
                  <div key={post.slug} className="py-6 first:pt-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-medium text-primary">{post.category}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{post.date}</span>
                    </div>
                    <Link to={`/blog/${post.slug}`}>
                      <h3 className="text-base font-semibold hover:text-primary transition-colors mb-1">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">{post.excerpt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </PublicLayout>
  );
}
