export interface TeamMember {
  slug: string;
  name: string;
  role: string;
  bio: string;
  expertise: string[];
  linkedin?: string;
}

export const teamMembers: TeamMember[] = [
  {
    slug: "arun-gupta",
    name: "Arun Gupta",
    role: "Founder & CEO",
    bio: "Arun founded TRUSTIFICATE with a vision to eliminate document fraud globally. With over a decade of experience in enterprise SaaS and digital identity, he leads the company's strategy and partnerships. His passion for building trust-first infrastructure drives every product decision at TRUSTIFICATE.",
    expertise: ["Digital Identity", "Enterprise SaaS", "Strategic Partnerships", "Product Vision"],
  },
  {
    slug: "vivek-shankhdhar",
    name: "Vivek Shankhdhar",
    role: "Head of Operations",
    bio: "Vivek oversees all operational aspects of TRUSTIFICATE, from customer onboarding to compliance frameworks. With a background in operations management and institutional partnerships, he ensures that every credential issued through TRUSTIFICATE meets the highest standards of reliability and trust.",
    expertise: ["Operations Management", "Compliance", "Institutional Partnerships", "Process Optimization"],
  },
  {
    slug: "shobhit-jaiswal",
    name: "Shobhit Jaiswal",
    role: "Head of Technology",
    bio: "Shobhit leads the engineering team at TRUSTIFICATE, architecting the platform's verification infrastructure and security systems. With deep expertise in distributed systems and cryptographic verification, he ensures TRUSTIFICATE remains at the cutting edge of credential technology.",
    expertise: ["Distributed Systems", "Cryptographic Verification", "Platform Architecture", "Security Engineering"],
  },
];

export const getTeamMemberBySlug = (slug: string) =>
  teamMembers.find((m) => m.slug === slug);

