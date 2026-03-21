import { PublicLayout } from "@/components/PublicLayout";
import { Link } from "react-router-dom";
import { teamMembers } from "@/data/teamData";
import { ArrowRight } from "lucide-react";
import { posts } from "@/data/blogPosts";

export default function Team() {
  return (
    <PublicLayout>
      <section className="py-20 lg:py-28 bg-brand-hero">
        <div className="container max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">Our Team</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The people building the trust layer for digital credentials.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {teamMembers.map((member) => {
              const memberPosts = posts.filter(
                (p) => p.author.name === member.name
              );
              return (
                <Link
                  key={member.slug}
                  to={`/team/${member.slug}`}
                  className="group p-6 rounded-xl border bg-card hover:shadow-lg transition-all duration-200 hover:border-primary/30"
                >
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl mb-4">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                    {member.name}
                  </h2>
                  <p className="text-sm text-primary/80 font-medium mb-3">{member.role}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {member.bio}
                  </p>
                  {memberPosts.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-3">
                      {memberPosts.length} article{memberPosts.length > 1 ? "s" : ""} published
                    </p>
                  )}
                  <span className="inline-flex items-center text-xs font-medium text-primary mt-4 group-hover:gap-2 gap-1 transition-all">
                    View Profile <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
