"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  IconExternalLink,
  IconCalendar,
  IconBuilding,
  IconTag,
  IconMessageCircle,
  IconSend,
  IconEye,
  IconBell,
  IconBellRinging,
  IconEdit,
  IconTrash,
  IconX,
  IconDeviceFloppy,
  IconLoader2,
} from "@tabler/icons-react";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";

export type CompanyDetail = {
  id: string;
  company: string;
  sponsor: string;
  dateInvested?: string;
  sector?: string;
  size?: string;
  score?: number;
  signals?: string[];
  status?: string;
  webpage?: string;
  note?: string;
  location?: string;
  financials?: string;
  nextSteps?: string;
  comments?: Array<{
    id: string;
    content: string;
    author: {
      id: string;
      name?: string | null;
      image?: string | null;
    };
    createdAt: string;
  }>;
  watchersCount?: number;
  isWatched?: boolean;
};

export function CompanyDrawer(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: CompanyDetail | null;
}) {
  const { open, onOpenChange, data } = props;
  const { data: session } = useSession();
  const router = useRouter();
  const [newComment, setNewComment] = React.useState("");
  const [isWatched, setIsWatched] = React.useState(data?.isWatched ?? false);
  const [editingComment, setEditingComment] = React.useState<{
    id: string;
    content: string;
  } | null>(null);
  const [optimisticComments, setOptimisticComments] = React.useState<
    CompanyDetail["comments"]
  >([]);

  React.useEffect(() => {
    // Always sync with server data, clear any stale optimistic updates
    setOptimisticComments(data?.comments ?? []);
  }, [data?.comments]);

  const createComment = api.comment.create.useMutation({
    onMutate: async (newComment) => {
      if (!session?.user) return;

      const optimisticComment = {
        id: `optimistic-${Date.now()}`,
        content: newComment.content,
        author: {
          id: session.user.id,
          name: session.user.name ?? session.user.email ?? "User",
          image: session.user.image ?? null,
        },
        createdAt: new Date().toISOString(),
      };

      setOptimisticComments((prev) => [optimisticComment, ...(prev ?? [])]);
      setNewComment("");
    },
    onSuccess: (newComment) => {
      setOptimisticComments((prev) => {
        const withoutOptimistic = (prev ?? []).filter(
          (c) => !c.id.startsWith("optimistic-"),
        );
        const realComment = {
          id: newComment.id,
          content: newComment.content,
          author: {
            id: newComment.author.id,
            name: newComment.author.name ?? newComment.author.email ?? "User",
            image: newComment.author.image,
          },
          createdAt: newComment.createdAt.toISOString(),
        };
        return [realComment, ...withoutOptimistic];
      });
      // Also refresh server data for consistency
      router.refresh();
    },
    onError: (err, variables) => {
      // Remove failed optimistic comment and restore text
      setOptimisticComments((prev) =>
        (prev ?? []).filter((c) => !c.id.startsWith("optimistic-")),
      );
      setNewComment(variables.content);
    },
  });

  const updateComment = api.comment.update.useMutation({
    onMutate: async (updatedComment) => {
      // Optimistic update
      setOptimisticComments(
        (prev) =>
          prev?.map((comment) =>
            comment.id === updatedComment.id
              ? { ...comment, content: updatedComment.content }
              : comment,
          ) ?? [],
      );
      setEditingComment(null);
    },
    onSuccess: () => {
      // Server refresh to get latest data
      router.refresh();
    },
    onError: () => {
      // Revert to server state on error
      router.refresh();
    },
  });

  const deleteComment = api.comment.delete.useMutation({
    onMutate: async (variables) => {
      // Optimistic removal
      setOptimisticComments(
        (prev) => prev?.filter((comment) => comment.id !== variables.id) ?? [],
      );
    },
    onSuccess: () => {
      // Server refresh to get latest data
      router.refresh();
    },
    onError: () => {
      // Revert to server state on error
      router.refresh();
    },
  });

  React.useEffect(() => {
    setIsWatched(data?.isWatched ?? false);
  }, [data?.isWatched]);

  const handleAddComment = () => {
    if (newComment.trim() && data?.id && session?.user?.id) {
      createComment.mutate({
        companyId: data.id,
        content: newComment,
      });
    }
  };

  const handleUpdateComment = () => {
    if (editingComment?.content.trim()) {
      updateComment.mutate({
        id: editingComment.id,
        content: editingComment.content,
      });
    }
  };

  const toggleWatch = () => {
    setIsWatched(!isWatched);
    // Here you would typically call an API to update the watch status
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={"right"}>
      <DrawerContent className="w-4/5">
        <div className="flex h-full flex-col">
          {/* Header */}
          <DrawerHeader className="from-primary/5 to-primary/10 border-b bg-gradient-to-r">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <DrawerTitle className="text-left text-2xl font-bold">
                  {data?.company ?? "Company"}
                </DrawerTitle>
                <DrawerDescription className="flex items-center gap-2 text-left text-base">
                  <IconBuilding className="size-4" />
                  {data?.sponsor ? `${data.sponsor}` : "No sponsor"}
                  {data?.location && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span>{data.location}</span>
                    </>
                  )}
                </DrawerDescription>
                <div className="flex items-center gap-2">
                  {data?.status && (
                    <Badge
                      variant={
                        data.status === "Active" ? "default" : "secondary"
                      }
                    >
                      {data.status}
                    </Badge>
                  )}
                  {data?.sector && (
                    <Badge variant="outline">
                      <IconTag className="mr-1 size-3" />
                      {data.sector}
                    </Badge>
                  )}
                  {data?.score && (
                    <Badge variant="secondary">Score: {data.score}/100</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={isWatched ? "default" : "outline"}
                  size="sm"
                  onClick={toggleWatch}
                  className="gap-2"
                >
                  {isWatched ? (
                    <>
                      <IconBellRinging className="size-4" />
                      Watching
                    </>
                  ) : (
                    <>
                      <IconBell className="size-4" />
                      Watch
                    </>
                  )}
                </Button>
                {data?.watchersCount ? (
                  <span className="text-muted-foreground text-sm">
                    {data.watchersCount} watcher
                    {data.watchersCount !== 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>
            </div>
          </DrawerHeader>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="space-y-6 p-6">
              {/* Quick Info Grid */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconEye className="size-5" />
                    Quick Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <InfoCard
                      icon={<IconCalendar className="size-4" />}
                      label="Date Invested"
                      value={
                        data?.dateInvested ? formatDate(data.dateInvested) : "-"
                      }
                    />
                    <InfoCard
                      icon={<IconTag className="size-4" />}
                      label="Sector"
                      value={data?.sector ?? "-"}
                    />
                    <InfoCard
                      icon={<IconBuilding className="size-4" />}
                      label="Size"
                      value={data?.size ?? "-"}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Financial Information */}
              {data?.financials && (
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {data.financials}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Next Steps */}
              {data?.nextSteps && (
                <Card>
                  <CardHeader>
                    <CardTitle>Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {data.nextSteps}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Signals */}
              {data?.signals && data.signals.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Market Signals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {data.signals.map((signal, index) => (
                        <Badge key={index} variant="outline" className="gap-1">
                          <span className="size-2 rounded-full bg-green-500" />
                          {signal}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {data?.note && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {data.note}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Comments Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconMessageCircle className="size-5" />
                    Comments ({optimisticComments?.length ?? 0})
                  </CardTitle>
                  <CardDescription>
                    Collaborate with your team on this portfolio company
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Comment */}
                  {session?.user ? (
                    <div className="space-y-2">
                      <Label htmlFor="new-comment">Add a comment</Label>
                      <div className="flex gap-2">
                        <Textarea
                          id="new-comment"
                          placeholder="Share your thoughts, analysis, or updates..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              if (
                                newComment.trim() &&
                                !createComment.isPending
                              ) {
                                handleAddComment();
                              }
                            }
                          }}
                          className="max-h-[36px] min-h-[36px] flex-1 resize-none"
                          rows={1}
                        />
                        <Button
                          onClick={handleAddComment}
                          disabled={
                            !newComment.trim() ||
                            createComment.isPending ||
                            !session?.user?.id
                          }
                          size="sm"
                          className="self-end"
                        >
                          {createComment.isPending ? (
                            <IconLoader2 className="size-4 animate-spin" />
                          ) : (
                            <IconSend className="size-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-4 text-center">
                      <p className="text-muted-foreground text-sm">
                        Please sign in to add comments
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Comments List */}
                  <div className="space-y-4">
                    {optimisticComments && optimisticComments.length > 0 ? (
                      optimisticComments.map((comment) => (
                        <div
                          key={comment.id}
                          className={`flex gap-3 rounded-lg p-3 transition-opacity ${
                            comment.id.startsWith("optimistic-")
                              ? "bg-muted/20 opacity-70"
                              : "hover:bg-muted/30"
                          }`}
                        >
                          <Avatar className="size-8 flex-shrink-0">
                            {comment.author.image && (
                              <AvatarImage
                                src={comment.author.image}
                                alt={comment.author.name ?? "User"}
                              />
                            )}
                            <AvatarFallback className="text-xs font-medium">
                              {comment.author.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-medium">
                                  {comment.author.name}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </div>
                              {session?.user?.id === comment.author.id && (
                                <div className="flex items-center gap-1">
                                  {editingComment?.id === comment.id ? (
                                    <>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={handleUpdateComment}
                                        disabled={updateComment.isPending}
                                      >
                                        {updateComment.isPending ? (
                                          <IconLoader2 className="size-3 animate-spin" />
                                        ) : (
                                          <IconDeviceFloppy className="size-3" />
                                        )}
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setEditingComment(null)}
                                      >
                                        <IconX className="size-3" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() =>
                                          setEditingComment({
                                            id: comment.id,
                                            content: comment.content,
                                          })
                                        }
                                      >
                                        <IconEdit className="size-3" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() =>
                                          deleteComment.mutate({
                                            id: comment.id,
                                          })
                                        }
                                        disabled={
                                          deleteComment.isPending &&
                                          deleteComment.variables?.id ===
                                            comment.id
                                        }
                                      >
                                        {deleteComment.isPending &&
                                        deleteComment.variables?.id ===
                                          comment.id ? (
                                          <IconLoader2 className="size-3 animate-spin" />
                                        ) : (
                                          <IconTrash className="size-3" />
                                        )}
                                      </Button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="mt-1">
                              {editingComment?.id === comment.id ? (
                                <Textarea
                                  value={editingComment.content}
                                  onChange={(e) =>
                                    setEditingComment({
                                      ...editingComment,
                                      content: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      if (
                                        editingComment.content.trim() &&
                                        !updateComment.isPending
                                      ) {
                                        handleUpdateComment();
                                      }
                                    }
                                    if (e.key === "Escape") {
                                      setEditingComment(null);
                                    }
                                  }}
                                  className="text-sm"
                                  rows={2}
                                />
                              ) : (
                                <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                                  {comment.content}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground py-8 text-center">
                        <IconMessageCircle className="mx-auto mb-2 size-8 opacity-50" />
                        <p>No comments yet</p>
                        <p className="text-xs">
                          Be the first to share your thoughts
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          {/* Footer */}
          <DrawerFooter className="bg-muted/30 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {data?.webpage && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={data.webpage}
                      target="_blank"
                      rel="noreferrer"
                      className="gap-2"
                    >
                      <IconExternalLink className="size-4" />
                      Visit Website
                    </a>
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex flex-col">
        <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {label}
        </span>
        <span className="font-semibold">{value}</span>
      </div>
    </div>
  );
}
