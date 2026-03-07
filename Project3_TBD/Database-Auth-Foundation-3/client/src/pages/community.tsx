import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users, Swords, Trophy, Share2, Search, UserPlus, UserMinus,
  Check, X, Copy, ExternalLink, Crown, Gamepad2
} from "lucide-react";
import { BADGE_CATALOG } from "@shared/badges";
import type { Friendship, Challenge, Achievement, User } from "@shared/schema";

const GAME_TYPES = [
  { value: "cascade_count", label: "Cascade Count" },
  { value: "flash", label: "Flash" },
  { value: "siteswap", label: "Siteswap" },
  { value: "balance", label: "Balance" },
  { value: "sequence", label: "Sequence" },
  { value: "height_challenge", label: "Height Challenge" },
];

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function FriendsTab({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data: friendships = [], isLoading: friendshipsLoading } = useQuery<Friendship[]>({
    queryKey: ["/api/friends", userId],
  });

  const { data: searchResults = [] } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users/search", `?q=${debouncedQuery}&excludeId=${userId}`],
    enabled: debouncedQuery.length >= 2,
  });

  const [friendUsers, setFriendUsers] = useState<Record<string, any>>({});

  useEffect(() => {
    const ids = new Set<string>();
    friendships.forEach((f) => {
      if (f.requesterId !== userId) ids.add(f.requesterId);
      if (f.receiverId !== userId) ids.add(f.receiverId);
    });
    ids.forEach(async (id) => {
      if (friendUsers[id]) return;
      try {
        const res = await fetch(`/api/user/${id}`, { credentials: "include" });
        if (res.ok) {
          const u = await res.json();
          setFriendUsers((prev) => ({ ...prev, [id]: u }));
        }
      } catch {}
    });
  }, [friendships, userId]);

  const pendingIncoming = friendships.filter(
    (f) => f.receiverId === userId && f.status === "pending"
  );
  const acceptedFriends = friendships.filter((f) => f.status === "accepted");

  const addFriend = async (targetId: string) => {
    try {
      await apiRequest("POST", "/api/friends", {
        requesterId: userId,
        receiverId: targetId,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends", userId] });
      toast({ title: "Friend request sent!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const respondFriend = async (id: number, status: "accepted" | "declined") => {
    try {
      await apiRequest("PATCH", `/api/friends/${id}`, { status });
      queryClient.invalidateQueries({ queryKey: ["/api/friends", userId] });
      toast({ title: status === "accepted" ? "Friend accepted!" : "Request declined" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const removeFriend = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/friends/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/friends", userId] });
      toast({ title: "Friend removed" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
          <Search className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">Find Friends</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-users"
          />
          {debouncedQuery.length >= 2 && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((u: any) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 rounded-md bg-muted/50 p-3"
                  data-testid={`card-search-result-${u.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium text-primary">
                        {u.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" data-testid={`text-search-username-${u.id}`}>
                        {u.username}
                      </p>
                      <p className="text-xs text-muted-foreground">Level {u.level || 1}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addFriend(u.id)}
                    data-testid={`button-add-friend-${u.id}`}
                  >
                    <UserPlus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              ))}
            </div>
          )}
          {debouncedQuery.length >= 2 && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground" data-testid="text-no-search-results">No users found</p>
          )}
        </CardContent>
      </Card>

      {pendingIncoming.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
            <Users className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingIncoming.map((f) => {
              const otherUser = friendUsers[f.requesterId];
              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded-md bg-muted/50 p-3"
                  data-testid={`card-pending-request-${f.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium text-primary">
                        {otherUser?.username?.charAt(0).toUpperCase() || "?"}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate" data-testid={`text-pending-username-${f.id}`}>
                      {otherUser?.username || "Loading..."}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => respondFriend(f.id, "accepted")}
                      data-testid={`button-accept-friend-${f.id}`}
                    >
                      <Check className="w-4 h-4 mr-1" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => respondFriend(f.id, "declined")}
                      data-testid={`button-decline-friend-${f.id}`}
                    >
                      <X className="w-4 h-4 mr-1" /> Decline
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
          <Users className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">Friends</CardTitle>
        </CardHeader>
        <CardContent>
          {friendshipsLoading ? (
            <p className="text-sm text-muted-foreground">Loading friends...</p>
          ) : acceptedFriends.length > 0 ? (
            <div className="space-y-2">
              {acceptedFriends.map((f) => {
                const otherId = f.requesterId === userId ? f.receiverId : f.requesterId;
                const otherUser = friendUsers[otherId];
                return (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-3 rounded-md bg-muted/50 p-3"
                    data-testid={`card-friend-${f.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-primary">
                          {otherUser?.username?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" data-testid={`text-friend-username-${f.id}`}>
                          {otherUser?.username || "Loading..."}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-xs">
                            <Crown className="w-3 h-3 mr-1" />
                            Lvl {otherUser?.level || 1}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {otherUser?.currentStreak || 0} day streak
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeFriend(f.id)}
                      data-testid={`button-remove-friend-${f.id}`}
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <Users className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground" data-testid="text-no-friends">No friends yet. Search and add some!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ChallengesTab({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState("");
  const [selectedGameType, setSelectedGameType] = useState("");
  const [targetScore, setTargetScore] = useState("");
  const [scoreInputs, setScoreInputs] = useState<Record<number, string>>({});

  const { data: friendships = [] } = useQuery<Friendship[]>({
    queryKey: ["/api/friends", userId],
  });

  const { data: challengesList = [], isLoading: challengesLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges", userId],
  });

  const [challengeUsers, setChallengeUsers] = useState<Record<string, any>>({});

  const acceptedFriends = friendships.filter((f) => f.status === "accepted");

  useEffect(() => {
    const ids = new Set<string>();
    friendships.forEach((f) => {
      if (f.requesterId !== userId) ids.add(f.requesterId);
      if (f.receiverId !== userId) ids.add(f.receiverId);
    });
    challengesList.forEach((c) => {
      if (c.senderId !== userId) ids.add(c.senderId);
      if (c.receiverId !== userId) ids.add(c.receiverId);
    });
    ids.forEach(async (id) => {
      if (challengeUsers[id]) return;
      try {
        const res = await fetch(`/api/user/${id}`, { credentials: "include" });
        if (res.ok) {
          const u = await res.json();
          setChallengeUsers((prev) => ({ ...prev, [id]: u }));
        }
      } catch {}
    });
  }, [friendships, challengesList, userId]);

  const pendingChallenges = challengesList.filter(
    (c) => c.receiverId === userId && c.status === "pending"
  );
  const activeChallenges = challengesList.filter((c) => c.status === "active");
  const completedChallenges = challengesList.filter((c) => c.status === "completed");

  const createChallenge = async () => {
    if (!selectedFriend || !selectedGameType || !targetScore) return;
    try {
      await apiRequest("POST", "/api/challenges", {
        senderId: userId,
        receiverId: selectedFriend,
        gameType: selectedGameType,
        targetScore: parseInt(targetScore),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges", userId] });
      toast({ title: "Challenge sent!" });
      setShowForm(false);
      setSelectedFriend("");
      setSelectedGameType("");
      setTargetScore("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const respondChallenge = async (id: number, status: "active" | "declined") => {
    try {
      await apiRequest("PATCH", `/api/challenges/${id}`, { status });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges", userId] });
      toast({ title: status === "active" ? "Challenge accepted!" : "Challenge declined" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const submitScore = async (challenge: Challenge) => {
    const scoreStr = scoreInputs[challenge.id];
    if (!scoreStr) return;
    const score = parseInt(scoreStr);
    if (isNaN(score)) return;

    const isSender = challenge.senderId === userId;
    const update: any = isSender
      ? { senderScore: score }
      : { receiverScore: score };

    const otherScore = isSender ? challenge.receiverScore : challenge.senderScore;
    if (otherScore !== null && otherScore !== undefined) {
      update.status = "completed";
    }

    try {
      await apiRequest("PATCH", `/api/challenges/${challenge.id}`, update);
      queryClient.invalidateQueries({ queryKey: ["/api/challenges", userId] });
      setScoreInputs((prev) => ({ ...prev, [challenge.id]: "" }));
      toast({ title: "Score submitted!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const getGameLabel = (type: string) =>
    GAME_TYPES.find((g) => g.value === type)?.label || type;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-semibold" data-testid="text-challenges-heading">Challenges</h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          data-testid="button-new-challenge"
        >
          <Swords className="w-4 h-4 mr-2" /> New Challenge
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Friend</label>
              <Select value={selectedFriend} onValueChange={setSelectedFriend}>
                <SelectTrigger data-testid="select-challenge-friend">
                  <SelectValue placeholder="Choose a friend" />
                </SelectTrigger>
                <SelectContent>
                  {acceptedFriends.map((f) => {
                    const otherId = f.requesterId === userId ? f.receiverId : f.requesterId;
                    const otherUser = challengeUsers[otherId];
                    return (
                      <SelectItem key={otherId} value={otherId}>
                        {otherUser?.username || otherId}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Game Type</label>
              <Select value={selectedGameType} onValueChange={setSelectedGameType}>
                <SelectTrigger data-testid="select-challenge-game-type">
                  <SelectValue placeholder="Choose game type" />
                </SelectTrigger>
                <SelectContent>
                  {GAME_TYPES.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Score</label>
              <Input
                type="number"
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
                placeholder="Enter target score"
                data-testid="input-challenge-target-score"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={createChallenge}
                disabled={!selectedFriend || !selectedGameType || !targetScore}
                data-testid="button-send-challenge"
              >
                Send Challenge
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                data-testid="button-cancel-challenge"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {pendingChallenges.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
            <Swords className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Incoming Challenges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingChallenges.map((c) => {
              const senderUser = challengeUsers[c.senderId];
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-md bg-muted/50 p-3 flex-wrap"
                  data-testid={`card-pending-challenge-${c.id}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium" data-testid={`text-challenge-sender-${c.id}`}>
                      {senderUser?.username || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getGameLabel(c.gameType)} - Target: {c.targetScore}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => respondChallenge(c.id, "active")}
                      data-testid={`button-accept-challenge-${c.id}`}
                    >
                      <Check className="w-4 h-4 mr-1" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => respondChallenge(c.id, "declined")}
                      data-testid={`button-decline-challenge-${c.id}`}
                    >
                      <X className="w-4 h-4 mr-1" /> Decline
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {activeChallenges.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
            <Gamepad2 className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Active Challenges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeChallenges.map((c) => {
              const isSender = c.senderId === userId;
              const myScore = isSender ? c.senderScore : c.receiverScore;
              const theirScore = isSender ? c.receiverScore : c.senderScore;
              const otherId = isSender ? c.receiverId : c.senderId;
              const otherUser = challengeUsers[otherId];
              const hasSubmitted = myScore !== null && myScore !== undefined;

              return (
                <div
                  key={c.id}
                  className="rounded-md bg-muted/50 p-3 space-y-2"
                  data-testid={`card-active-challenge-${c.id}`}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-medium">
                        vs {otherUser?.username || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getGameLabel(c.gameType)} - Target: {c.targetScore}
                      </p>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <span data-testid={`text-my-score-${c.id}`}>
                        You: {myScore ?? "-"}
                      </span>
                      <span data-testid={`text-their-score-${c.id}`}>
                        Them: {theirScore ?? "-"}
                      </span>
                    </div>
                  </div>
                  {!hasSubmitted && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Your score"
                        value={scoreInputs[c.id] || ""}
                        onChange={(e) =>
                          setScoreInputs((prev) => ({
                            ...prev,
                            [c.id]: e.target.value,
                          }))
                        }
                        data-testid={`input-submit-score-${c.id}`}
                      />
                      <Button
                        size="sm"
                        onClick={() => submitScore(c)}
                        disabled={!scoreInputs[c.id]}
                        data-testid={`button-submit-score-${c.id}`}
                      >
                        Submit
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {completedChallenges.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
            <Trophy className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Completed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {completedChallenges.map((c) => {
              const isSender = c.senderId === userId;
              const myScore = isSender ? c.senderScore : c.receiverScore;
              const theirScore = isSender ? c.receiverScore : c.senderScore;
              const otherId = isSender ? c.receiverId : c.senderId;
              const otherUser = challengeUsers[otherId];
              const iWon = (myScore ?? 0) > (theirScore ?? 0);
              const tied = (myScore ?? 0) === (theirScore ?? 0);

              return (
                <div
                  key={c.id}
                  className={`flex items-center justify-between gap-3 rounded-md p-3 flex-wrap ${
                    iWon ? "bg-green-500/10" : tied ? "bg-muted/50" : "bg-red-500/10"
                  }`}
                  data-testid={`card-completed-challenge-${c.id}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">
                        vs {otherUser?.username || "Unknown"}
                      </p>
                      {iWon && (
                        <Badge variant="secondary" className="text-xs">
                          <Crown className="w-3 h-3 mr-1" /> Winner
                        </Badge>
                      )}
                      {tied && (
                        <Badge variant="outline" className="text-xs">Tied</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getGameLabel(c.gameType)} - Target: {c.targetScore}
                    </p>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <span data-testid={`text-final-my-score-${c.id}`}>
                      You: {myScore ?? 0}
                    </span>
                    <span data-testid={`text-final-their-score-${c.id}`}>
                      Them: {theirScore ?? 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {challengesLoading && (
        <p className="text-sm text-muted-foreground">Loading challenges...</p>
      )}
      {!challengesLoading && challengesList.length === 0 && (
        <div className="text-center py-6">
          <Swords className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground" data-testid="text-no-challenges">
            No challenges yet. Challenge a friend!
          </p>
        </div>
      )}
    </div>
  );
}

function LeaderboardsTab({ userId }: { userId: string }) {
  const [selectedGameType, setSelectedGameType] = useState("cascade_count");
  const [friendsOnly, setFriendsOnly] = useState(false);

  const { data: leaderboardData = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/leaderboard", selectedGameType],
  });

  const { data: friendships = [] } = useQuery<Friendship[]>({
    queryKey: ["/api/friends", userId],
  });

  const friendIds = new Set<string>();
  friendships
    .filter((f) => f.status === "accepted")
    .forEach((f) => {
      friendIds.add(f.requesterId);
      friendIds.add(f.receiverId);
    });

  const displayData = friendsOnly
    ? leaderboardData.filter(
        (entry) => friendIds.has(entry.userId) || entry.userId === userId
      )
    : leaderboardData;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {GAME_TYPES.map((g) => (
          <Button
            key={g.value}
            variant={selectedGameType === g.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedGameType(g.value)}
            className="toggle-elevate"
            data-testid={`button-leaderboard-${g.value}`}
          >
            {g.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant={friendsOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setFriendsOnly(!friendsOnly)}
          className="toggle-elevate"
          data-testid="button-friends-only-toggle"
        >
          <Users className="w-4 h-4 mr-1" />
          Friends Only
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
          <Trophy className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">
            {GAME_TYPES.find((g) => g.value === selectedGameType)?.label} Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading leaderboard...</p>
          ) : displayData.length > 0 ? (
            <div className="space-y-1">
              <div className="grid grid-cols-[2rem_1fr_4rem_4rem_5rem] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                <span>#</span>
                <span>Player</span>
                <span>Score</span>
                <span>Time</span>
                <span>Date</span>
              </div>
              {displayData.map((entry, index) => {
                const isMe = entry.userId === userId;
                return (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-[2rem_1fr_4rem_4rem_5rem] gap-2 px-3 py-2 rounded-md text-sm ${
                      isMe ? "bg-primary/10 font-medium" : "bg-muted/30"
                    }`}
                    data-testid={`row-leaderboard-${entry.id}`}
                  >
                    <span className="font-medium" data-testid={`text-rank-${entry.id}`}>
                      {index + 1}
                    </span>
                    <span className="truncate" data-testid={`text-lb-username-${entry.id}`}>
                      {entry.user?.username || "Unknown"}
                      {isMe && " (You)"}
                    </span>
                    <span data-testid={`text-lb-score-${entry.id}`}>{entry.score}</span>
                    <span className="text-muted-foreground" data-testid={`text-lb-time-${entry.id}`}>
                      {entry.timeSeconds ? `${entry.timeSeconds}s` : "-"}
                    </span>
                    <span className="text-muted-foreground text-xs" data-testid={`text-lb-date-${entry.id}`}>
                      {entry.createdAt
                        ? new Date(entry.createdAt).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <Trophy className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground" data-testid="text-no-leaderboard">
                No scores yet for this game type
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ShareTab({ userId }: { userId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: sessions = [] } = useQuery<any[]>({
    queryKey: ["/api/sessions", userId],
  });

  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements", userId],
  });

  const statsText = `Just Juggle Stats: Level ${user?.level || 1} | ${user?.xp || 0} XP | ${user?.coins || 0} Coins | ${user?.currentStreak || 0} day streak | ${sessions.length} sessions completed`;

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard!" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  }, [toast]);

  const shareViaApi = useCallback(async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {}
    } else {
      toast({ title: "Share not supported on this device", variant: "destructive" });
    }
  }, [toast]);

  const getBadgeInfo = (badgeName: string) =>
    BADGE_CATALOG.find((b) => b.id === badgeName);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
          <Share2 className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">Share Your Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted/50 p-4">
            <p className="text-sm" data-testid="text-share-stats">{statsText}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => copyToClipboard(statsText)}
              data-testid="button-copy-stats"
            >
              <Copy className="w-4 h-4 mr-2" /> Copy
            </Button>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <Button
                variant="outline"
                onClick={() => shareViaApi(statsText)}
                data-testid="button-share-stats"
              >
                <ExternalLink className="w-4 h-4 mr-2" /> Share
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
          <Trophy className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">Share Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          {achievements.length > 0 ? (
            <div className="space-y-2">
              {achievements.map((a) => {
                const badgeInfo = getBadgeInfo(a.badgeName);
                const achievementText = `I earned "${badgeInfo?.name || a.badgeName}" on Just Juggle! ${badgeInfo?.description || ""}`;
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-md bg-muted/50 p-3 flex-wrap"
                    data-testid={`card-achievement-${a.id}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium" data-testid={`text-badge-name-${a.id}`}>
                        {badgeInfo?.name || a.badgeName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {badgeInfo?.description || ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(achievementText)}
                      data-testid={`button-share-achievement-${a.id}`}
                    >
                      <Copy className="w-4 h-4 mr-1" /> Share
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <Trophy className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground" data-testid="text-no-achievements">
                No achievements earned yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-community-title">
          Community
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Connect with friends, compete, and share your progress
        </p>
      </div>

      <Tabs defaultValue="friends" className="space-y-6">
        <TabsList data-testid="tabs-community">
          <TabsTrigger value="friends" data-testid="tab-friends">
            <Users className="w-4 h-4 mr-2" /> Friends
          </TabsTrigger>
          <TabsTrigger value="challenges" data-testid="tab-challenges">
            <Swords className="w-4 h-4 mr-2" /> Challenges
          </TabsTrigger>
          <TabsTrigger value="leaderboards" data-testid="tab-leaderboards">
            <Trophy className="w-4 h-4 mr-2" /> Leaderboards
          </TabsTrigger>
          <TabsTrigger value="share" data-testid="tab-share">
            <Share2 className="w-4 h-4 mr-2" /> Share
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          <FriendsTab userId={user.id} />
        </TabsContent>

        <TabsContent value="challenges">
          <ChallengesTab userId={user.id} />
        </TabsContent>

        <TabsContent value="leaderboards">
          <LeaderboardsTab userId={user.id} />
        </TabsContent>

        <TabsContent value="share">
          <ShareTab userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
