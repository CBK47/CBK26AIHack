import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Coins, Lock, Check, Palette, Sparkles, Wand2, ShoppingBag } from "lucide-react";
import type { ShopItem, UserPurchase } from "@shared/schema";

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Palette }> = {
  theme: { label: "Themes", icon: Palette },
  feature: { label: "Features", icon: Sparkles },
  trick: { label: "Tricks", icon: Wand2 },
};

const TYPE_ORDER = ["theme", "feature", "trick"];

function parseRequirementLevel(requirement: string | null): number | null {
  if (!requirement) return null;
  const match = requirement.match(/Level\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

export default function ShopPage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [buyingItemId, setBuyingItemId] = useState<number | null>(null);

  const { data: items, isLoading: itemsLoading } = useQuery<ShopItem[]>({
    queryKey: ["/api/shop/items"],
  });

  const { data: purchases, isLoading: purchasesLoading } = useQuery<UserPurchase[]>({
    queryKey: ["/api/shop/purchases", user?.id],
    enabled: !!user?.id,
  });

  const buyMutation = useMutation({
    mutationFn: async (itemId: number) => {
      setBuyingItemId(itemId);
      const res = await apiRequest("POST", "/api/shop/buy", {
        userId: user?.id,
        itemId,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (user && data.user) {
        setUser({ ...user, ...data.user });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/shop/purchases", user?.id] });
      toast({
        title: "Purchase successful",
        description: "Item has been added to your collection.",
      });
      setBuyingItemId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase failed",
        description: error.message,
        variant: "destructive",
      });
      setBuyingItemId(null);
    },
  });

  const purchasedItemIds = new Set(purchases?.map((p) => p.itemId) ?? []);
  const userCoins = user?.coins ?? 0;
  const userLevel = user?.level ?? 1;

  const groupedItems: Record<string, ShopItem[]> = {};
  if (items) {
    for (const item of items) {
      if (!groupedItems[item.type]) {
        groupedItems[item.type] = [];
      }
      groupedItems[item.type].push(item);
    }
  }

  const isLoading = itemsLoading || purchasesLoading;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-shop-title">
            Pro Shop
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Spend your hard-earned coins on themes, features, and tricks.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-4 py-2" data-testid="text-coin-balance">
          <Coins className="w-5 h-5 text-yellow-500" />
          <span className="text-lg font-semibold">{userCoins}</span>
          <span className="text-sm text-muted-foreground">coins</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2].map((j) => (
                  <Skeleton key={j} className="h-40" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <div className="space-y-8">
          {TYPE_ORDER.filter((type) => groupedItems[type]?.length).map((type) => {
            const config = TYPE_CONFIG[type] || { label: type, icon: ShoppingBag };
            const Icon = config.icon;
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold" data-testid={`text-category-${type}`}>
                    {config.label}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedItems[type].map((item) => {
                    const owned = purchasedItemIds.has(item.id);
                    const reqLevel = parseRequirementLevel(item.requirement);
                    const meetsRequirement = reqLevel === null || userLevel >= reqLevel;
                    const canAfford = userCoins >= item.price;
                    const canBuy = !owned && canAfford && meetsRequirement;
                    const isBuying = buyingItemId === item.id && buyMutation.isPending;

                    return (
                      <Card key={item.id} data-testid={`card-shop-item-${item.id}`}>
                        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                          <CardTitle className="text-sm font-semibold leading-tight">
                            {item.name}
                          </CardTitle>
                          {owned && (
                            <Badge variant="secondary" data-testid={`badge-owned-${item.id}`}>
                              <Check className="w-3 h-3 mr-1" />
                              Owned
                            </Badge>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {item.description && (
                            <p className="text-xs text-muted-foreground" data-testid={`text-item-description-${item.id}`}>
                              {item.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Coins className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm font-medium" data-testid={`text-item-price-${item.id}`}>
                                {item.price}
                              </span>
                            </div>
                            {item.requirement && (
                              <Badge
                                variant="outline"
                                data-testid={`badge-requirement-${item.id}`}
                                className={!meetsRequirement ? "text-destructive border-destructive/50" : ""}
                              >
                                <Lock className="w-3 h-3 mr-1" />
                                {item.requirement}
                              </Badge>
                            )}
                          </div>
                          {!owned && (
                            <Button
                              size="sm"
                              className="w-full"
                              disabled={!canBuy || isBuying}
                              onClick={() => buyMutation.mutate(item.id)}
                              data-testid={`button-buy-${item.id}`}
                            >
                              {isBuying
                                ? "Buying..."
                                : !meetsRequirement
                                  ? "Locked"
                                  : !canAfford
                                    ? "Not enough coins"
                                    : "Buy"}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No shop items available yet.</p>
        </div>
      )}
    </div>
  );
}
