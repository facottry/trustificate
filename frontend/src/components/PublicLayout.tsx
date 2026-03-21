import { Link, useNavigate } from "react-router-dom";
import { Search, Menu, Linkedin, Twitter, Youtube, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MascotInline } from "@/components/Mascot";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const navLinks = [
  { label: "Product", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Newsletter", href: "/newsletter" },
  { label: "About", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

const footerLinks = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Verify Credential", href: "/verify" },
    { label: "API Documentation", href: "/docs" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Team", href: "/team" },
    { label: "Careers", href: "/careers" },
    { label: "Blog", href: "/blog" },
    { label: "Testimonials", href: "/testimonials" },
  ],
  Resources: [
    { label: "Contact Support", href: "/contact" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
};

const socialLinks = [
  { icon: Linkedin, href: "https://linkedin.com/company/TRUSTIFICATE", label: "LinkedIn" },
  { icon: Twitter, href: "https://twitter.com/TRUSTIFICATE", label: "Twitter" },
  { icon: Youtube, href: "https://youtube.com/@TRUSTIFICATE", label: "YouTube" },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = user?.displayName ? getInitials(user.displayName) : "?";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <Logo size="sm" />
              <MascotInline className="h-5 w-5 group-hover:animate-[wave_0.8s_ease-in-out_1]" />
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link key={link.label} to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <nav className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/verify"><Search className="mr-1.5 h-3.5 w-3.5" /> Verify</Link>
            </Button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2">
                    {initials}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { signOut(); navigate("/"); }}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button size="sm" variant="ghost" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </nav>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-6 mt-8">
                  <nav className="flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.label}>
                        <Link to={link.href} className="text-sm font-medium text-foreground hover:text-primary transition-colors">{link.label}</Link>
                      </SheetClose>
                    ))}
                  </nav>
                  <div className="border-t pt-4 flex flex-col gap-3">
                    <SheetClose asChild>
                      <Button variant="outline" size="sm" asChild><Link to="/verify"><Search className="mr-1.5 h-3.5 w-3.5" /> Verify</Link></Button>
                    </SheetClose>
                    {user ? (
                      <>
                        <div className="flex items-center gap-2 px-1 py-1">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
                            {initials}
                          </span>
                          <span className="text-sm font-medium truncate">{user.displayName}</span>
                        </div>
                        <SheetClose asChild>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to="/dashboard"><LayoutDashboard className="mr-1.5 h-3.5 w-3.5" /> Dashboard</Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
                            <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign Out
                          </Button>
                        </SheetClose>
                      </>
                    ) : (
                      <>
                        <SheetClose asChild>
                          <Button variant="ghost" size="sm" asChild><Link to="/login">Sign In</Link></Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button size="sm" asChild><Link to="/signup">Get Started</Link></Button>
                        </SheetClose>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-card">
        <div className="container py-16">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <Logo size="sm" />
                <MascotInline className="h-4 w-4" />
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mb-6">
                Enterprise-grade credential infrastructure. Trusted by leading institutions to issue, manage, and verify digital credentials at scale.
              </p>
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">{category}</h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t">
          <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} TRUSTIFICATE, Inc. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
              <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/contact" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

