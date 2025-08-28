"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IconMessagePlus, IconUser } from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";

interface CompanyCommentsProps {
  comments: Array<{
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    author: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }>;
  onAddComment?: (content: string) => Promise<void>;
}

export function CompanyComments({
  comments,
  onAddComment,
}: CompanyCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !onAddComment) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconMessagePlus className="h-5 w-5" />
          Comments
          <Badge variant="outline" className="ml-auto">
            {comments.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Comment Form */}
        {onAddComment && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Comment"}
              </Button>
            </div>
          </form>
        )}

        {comments.length > 0 && onAddComment && <Separator />}

        {/* Comments List */}
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={comment.author.image ?? undefined}
                    alt={comment.author.name ?? "User"}
                  />
                  <AvatarFallback>
                    {comment.author.name ? (
                      comment.author.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    ) : (
                      <IconUser className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.author.name ?? "Anonymous"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(comment.createdAt, {
                        addSuffix: true,
                      })}
                    </span>
                    {comment.createdAt.getTime() !==
                      comment.updatedAt.getTime() && (
                      <span className="text-xs text-muted-foreground">
                        (edited)
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center text-sm italic">
            No comments yet. Be the first to add one!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
