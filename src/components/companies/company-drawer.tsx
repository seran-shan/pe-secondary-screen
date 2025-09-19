"use client";

import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  IconExternalLink,
  IconCalendar,
  IconBuilding,
  IconMessageCircle,
  IconSend,
  IconLoader2,
} from "@tabler/icons-react";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import type { RouterOutputs } from "@/trpc/react";
import { pusherClient } from "@/lib/pusher.client";

type Company = RouterOutputs["company"]["getAll"][0];

export function CompanyDrawer(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: Company | null;
}) {
  const { open, onOpenChange, data } = props;
  const { data: session } = useSession();
  const [newComment, setNewComment] = React.useState("");
  const utils = api.useUtils();

  const { data: comments } = api.comment.getAllByCompanyId.useQuery(
    { companyId: data?.id ?? "" },
    { enabled: !!data?.id },
  );

  React.useEffect(() => {
    if (!data?.id) return;

    const channel = pusherClient.subscribe(`company-${data.id}`);
    const onNewComment = () => {
      void utils.comment.getAllByCompanyId.invalidate({ companyId: data.id });
    };

    channel.bind("new-comment", onNewComment);

    return () => {
      channel.unbind("new-comment", onNewComment);
      pusherClient.unsubscribe(`company-${data.id}`);
    };
  }, [data?.id, utils]);

  const createComment = api.comment.create.useMutation({
    onSuccess: () => {
      setNewComment("");
      void utils.comment.getAllByCompanyId.invalidate({ companyId: data?.id });
    },
  });

  const handleAddComment = () => {
    if (newComment.trim() && data?.id && session?.user?.id) {
      createComment.mutate({
        companyId: data.id,
        content: newComment.trim(),
      });
    }
  };

  if (!data) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="max-h-[95vh] w-[400px] sm:w-[500px]">
        <DrawerHeader className="space-y-2">
          <DrawerTitle className="flex items-center gap-3 text-xl">
            {data.asset}
            <Badge variant="outline" className="text-xs">
              {data.sponsor.name}
            </Badge>
          </DrawerTitle>
          <DrawerDescription className="text-sm">
            Portfolio company details and activity
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconBuilding className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {data.status && (
                    <Badge
                      variant={
                        data.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {data.status === "ACTIVE" ? "Active" : "Exited"}
                    </Badge>
                  )}
                  {data.sector && (
                    <Badge variant="outline">{data.sector}</Badge>
                  )}
                </div>

                {data.description && (
                  <div>
                    <h4 className="font-medium">Description</h4>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {data.description}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                  {data.dateInvested && (
                    <div className="flex items-center gap-2">
                      <IconCalendar className="h-4 w-4" />
                      <span>
                        Invested:{" "}
                        {new Date(data.dateInvested).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {data.webpage && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="hover:bg-primary hover:text-primary-foreground h-8 w-fit gap-2 text-xs font-medium transition-all"
                    >
                      <a
                        href={data.webpage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <IconExternalLink className="h-3.5 w-3.5" />
                        Visit website
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconMessageCircle className="h-5 w-5" />
                  Comments ({comments?.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Comment */}
                {session?.user && (
                  <div className="space-y-3">
                    <Label htmlFor="comment" className="text-sm font-medium">
                      Add a comment
                    </Label>
                    <div className="space-y-3">
                      <Textarea
                        id="comment"
                        placeholder="Share your thoughts..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={createComment.isPending}
                        className="min-h-[80px] resize-none"
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddComment}
                          disabled={
                            !newComment.trim() || createComment.isPending
                          }
                          size="sm"
                          className="w-fit"
                        >
                          {createComment.isPending ? (
                            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <IconSend className="mr-2 h-4 w-4" />
                          )}
                          {createComment.isPending
                            ? "Adding..."
                            : "Add Comment"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Comments List */}
                <div className="space-y-4">
                  {comments && comments.length > 0 ? (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-muted/50 flex gap-3 rounded-lg border p-3"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={comment.author.image ?? undefined}
                          />
                          <AvatarFallback>
                            {comment.author.name?.charAt(0) ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">
                              {comment.author.name ?? "Unknown User"}
                            </span>
                            <span className="text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground text-sm">
                        No comments yet. Be the first to share your thoughts!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DrawerFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
