import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ForumPost, ForumComment, User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Plus,
  ArrowLeft,
  Send,
  Trash2,
  Clock,
  User as UserIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const categoryColors: Record<string, string> = {
  tips: "bg-green-600 text-white",
  questions: "bg-blue-600 text-white",
  "show-off": "bg-purple-600 text-white",
  general: "bg-gray-600 text-white",
};

const categoryLabels: Record<string, string> = {
  tips: "Tips",
  questions: "Questions",
  "show-off": "Show Off",
  general: "General",
};

function UserBadge({ userId }: { userId: string }) {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user", userId],
  });

  if (isLoading) return <Skeleton className="h-4 w-24 inline-block" />;
  if (!user) return <span className="text-muted-foreground text-sm">Unknown</span>;

  return (
    <span className="inline-flex items-center gap-1 text-sm" data-testid={`user-badge-${userId}`}>
      <UserIcon className="w-3 h-3 text-muted-foreground" />
      <span className="font-medium">{user.username}</span>
      <Badge variant="outline" className="text-xs no-default-hover-elevate no-default-active-elevate">
        Lv {user.level}
      </Badge>
    </span>
  );
}

function CommentCount({ postId }: { postId: number }) {
  const { data: comments } = useQuery<ForumComment[]>({
    queryKey: ["/api/forum/posts", postId, "comments"],
  });

  return (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground" data-testid={`comment-count-${postId}`}>
      <MessageSquare className="w-3 h-3" />
      {comments?.length ?? 0}
    </span>
  );
}

function PostDetail({
  postId,
  onBack,
}: {
  postId: number;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentContent, setCommentContent] = useState("");

  const { data: post, isLoading: postLoading } = useQuery<ForumPost>({
    queryKey: ["/api/forum/posts", postId],
  });

  const { data: comments, isLoading: commentsLoading } = useQuery<ForumComment[]>({
    queryKey: ["/api/forum/posts", postId, "comments"],
  });

  const createComment = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/forum/comments", {
        postId,
        userId: user.id,
        content: commentContent,
      });
    },
    onSuccess: () => {
      setCommentContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts", postId, "comments"] });
      toast({ title: "Comment added" });
    },
    onError: () => {
      toast({ title: "Failed to add comment", variant: "destructive" });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest("DELETE", `/api/forum/comments/${commentId}?userId=${user?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts", postId, "comments"] });
      toast({ title: "Comment deleted" });
    },
  });

  if (postLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={onBack} data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <p className="mt-4 text-muted-foreground">Post not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <Button variant="ghost" onClick={onBack} data-testid="button-back">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to posts
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="space-y-2">
              <CardTitle data-testid="text-post-title">{post.title}</CardTitle>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={`${categoryColors[post.category]} no-default-hover-elevate no-default-active-elevate`} data-testid={`badge-category-${post.id}`}>
                  {categoryLabels[post.category] || post.category}
                </Badge>
                <UserBadge userId={post.userId} />
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(post.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap" data-testid="text-post-content">{post.content}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg" data-testid="text-comments-heading">
          Comments ({comments?.length ?? 0})
        </h3>

        <div className="flex gap-2">
          <Textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1"
            data-testid="input-comment"
          />
          <Button
            onClick={() => createComment.mutate()}
            disabled={!commentContent.trim() || createComment.isPending}
            data-testid="button-submit-comment"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {commentsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-3">
            {comments.map((comment) => (
              <Card key={comment.id} data-testid={`card-comment-${comment.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <UserBadge userId={comment.userId} />
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap" data-testid={`text-comment-content-${comment.id}`}>
                        {comment.content}
                      </p>
                    </div>
                    {comment.userId === user?.id && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteComment.mutate(comment.id)}
                        disabled={deleteComment.isPending}
                        data-testid={`button-delete-comment-${comment.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm" data-testid="text-no-comments">No comments yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}

export default function ForumPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");

  const postsQueryKey = activeCategory === "all"
    ? ["/api/forum/posts"]
    : [`/api/forum/posts?category=${activeCategory}`];

  const { data: posts, isLoading } = useQuery<ForumPost[]>({
    queryKey: postsQueryKey,
  });

  const createPost = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/forum/posts", {
        userId: user.id,
        title,
        content,
        category,
      });
    },
    onSuccess: () => {
      setTitle("");
      setContent("");
      setCategory("general");
      setShowForm(false);
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === "string" && key.startsWith("/api/forum/posts");
      }});
      toast({ title: "Post created" });
    },
    onError: () => {
      toast({ title: "Failed to create post", variant: "destructive" });
    },
  });

  const deletePost = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("DELETE", `/api/forum/posts/${postId}?userId=${user.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === "string" && key.startsWith("/api/forum/posts");
      }});
      toast({ title: "Post deleted" });
    },
  });

  if (selectedPostId !== null) {
    return (
      <PostDetail
        postId={selectedPostId}
        onBack={() => setSelectedPostId(null)}
      />
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-forum-title">Forum</h1>
          <p className="text-muted-foreground text-sm">Discuss, share, and learn with the community</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          data-testid="button-new-post"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {showForm && (
        <Card data-testid="card-new-post-form">
          <CardContent className="p-4 space-y-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              data-testid="input-post-title"
            />
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              data-testid="input-post-content"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-40" data-testid="select-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tips">Tips</SelectItem>
                  <SelectItem value="questions">Questions</SelectItem>
                  <SelectItem value="show-off">Show Off</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => createPost.mutate()}
                disabled={!title.trim() || !content.trim() || createPost.isPending}
                data-testid="button-submit-post"
              >
                {createPost.isPending ? "Posting..." : "Post"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList data-testid="tabs-category-filter">
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          <TabsTrigger value="tips" data-testid="tab-tips">Tips</TabsTrigger>
          <TabsTrigger value="questions" data-testid="tab-questions">Questions</TabsTrigger>
          <TabsTrigger value="show-off" data-testid="tab-show-off">Show Off</TabsTrigger>
          <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="hover-elevate" data-testid={`card-post-${post.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2 flex-1 min-w-0">
                    <button
                      onClick={() => setSelectedPostId(post.id)}
                      className="text-left font-semibold hover:underline"
                      data-testid={`link-post-${post.id}`}
                    >
                      {post.title}
                    </button>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className={`${categoryColors[post.category]} no-default-hover-elevate no-default-active-elevate`} data-testid={`badge-category-${post.id}`}>
                        {categoryLabels[post.category] || post.category}
                      </Badge>
                      <UserBadge userId={post.userId} />
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(post.createdAt)}
                      </span>
                      <CommentCount postId={post.id} />
                    </div>
                  </div>
                  {post.userId === user?.id && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePost.mutate(post.id);
                      }}
                      disabled={deletePost.isPending}
                      data-testid={`button-delete-post-${post.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground" data-testid="text-no-posts">No posts yet. Start a discussion!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}