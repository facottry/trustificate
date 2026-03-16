import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Gift, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "TRUSTIFICATE_announcement_dismissed";

function isDismissedToday(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;
  const dismissedDate = new Date(stored).toDateString();
  return dismissedDate === new Date().toDateString();
}

export function AnnouncementModal() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isDismissedToday()) {
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setOpen(false);
  }

  function handleCTA() {
    handleClose();
    navigate("/pricing");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogContent className="sm:max-w-md border-2 border-orange-400/50 bg-gradient-to-br from-background via-background to-orange-50/30 dark:to-orange-950/10">
        <DialogHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-3">
            <Gift className="h-7 w-7 text-white" />
          </div>
          <DialogTitle className="text-xl">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Special Launch Offer
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            We're celebrating our launch with an exclusive offer for early adopters.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-orange-300/50 bg-orange-50/50 dark:bg-orange-950/20 p-4 text-center">
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 text-xs mb-2">
              <Sparkles className="h-3 w-3 mr-1" /> LIMITED TIME
            </Badge>
            <p className="text-2xl font-bold text-foreground mt-1">100% OFF</p>
            <p className="text-sm text-muted-foreground mt-1">
              All paid plans â€” use coupon code
            </p>
            <code className="inline-block mt-2 px-4 py-1.5 rounded-md bg-foreground text-background font-mono font-bold text-lg tracking-wider">
              FREE_100
            </code>
          </div>

          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-orange-500">âœ“</span>
              All plans already 50% off during launch
            </li>
            <li className="flex items-center gap-2">
              <span className="text-orange-500">âœ“</span>
              Coupon brings your checkout total to â‚¹0
            </li>
            <li className="flex items-center gap-2">
              <span className="text-orange-500">âœ“</span>
              Full transaction recorded â€” real plan activation
            </li>
          </ul>

          <div className="flex gap-2 pt-1">
            <Button className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0" onClick={handleCTA}>
              Claim Offer <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

