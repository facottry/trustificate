import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  polishDraft, sendNewsletter, fetchNewsletterHistory, type Newsletter,
} from "@/lib/newsletter";

const composeSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

type ComposeForm = z.infer<typeof composeSchema>;

export default function SuperAdminNewsletter() {
  const queryClient = useQueryClient();
  const [isPolishing, setIsPolishing] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<ComposeForm>({
    resolver: zodResolver(composeSchema),
    defaultValues: { subject: "", body: "" },
  });

  const sendMutation = useMutation({
    mutationFn: (data: ComposeForm) => sendNewsletter(data.subject, data.body),
    onSuccess: () => {
      toast.success("Newsletter sent successfully");
      reset();
      queryClient.invalidateQueries({ queryKey: ["newsletter-history"] });
    },
    onError: () => {
      toast.error("Failed to send newsletter");
    },
  });

  async function handlePolish() {
    const body = getValues("body");
    if (!body) {
      toast.error("Body is required to polish");
      return;
    }
    setIsPolishing(true);
    try {
      const res = await polishDraft(body);
      if (res.data?.polishedText) {
        setValue("body", res.data.polishedText);
      }
    } catch {
      toast.error("AI assistance is currently unavailable");
    } finally {
      setIsPolishing(false);
    }
  }

  const {
    data: newsletters = [],
    isLoading: historyLoading,
    isError: historyError,
    refetch: retryHistory,
  } = useQuery({
    queryKey: ["newsletter-history"],
    queryFn: () => fetchNewsletterHistory().then((r) => r.data ?? []),
  });

  const isBusy = sendMutation.isPending || isPolishing;

  return (
    <SuperAdminLayout title="Newsletter">
      <div className="space-y-6">
        {/* Compose Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compose</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((data) => sendMutation.mutate(data))} className="space-y-4">
              <div>
                <Input
                  placeholder="Subject"
                  {...register("subject")}
                  disabled={isBusy}
                />
                {errors.subject && (
                  <p className="text-xs text-destructive mt-1">{errors.subject.message}</p>
                )}
              </div>
              <div>
                <Textarea
                  placeholder="Write your newsletter body here..."
                  rows={6}
                  {...register("body")}
                  disabled={isBusy}
                />
                {errors.body && (
                  <p className="text-xs text-destructive mt-1">{errors.body.message}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePolish}
                  disabled={isBusy}
                >
                  {isPolishing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  AI Polish
                </Button>
                <Button type="submit" disabled={isBusy}>
                  {sendMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send Newsletter
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* History Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {historyLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : historyError ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <p className="text-sm text-muted-foreground">Failed to load history</p>
                <Button variant="outline" size="sm" onClick={() => retryHistory()}>
                  Retry
                </Button>
              </div>
            ) : newsletters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                No newsletters sent yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Subject</TableHead>
                      <TableHead className="text-xs">Body Preview</TableHead>
                      <TableHead className="text-xs">Sender</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Recipients</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {newsletters.map((newsletter: Newsletter) => (
                      <TableRow key={newsletter._id}>
                        <TableCell className="text-sm font-medium">{newsletter.subject}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {newsletter.body.length > 80
                            ? newsletter.body.slice(0, 80) + "…"
                            : newsletter.body}
                        </TableCell>
                        <TableCell className="text-xs">{newsletter.sentBy.displayName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(newsletter.sentAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs">{newsletter.recipientCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
