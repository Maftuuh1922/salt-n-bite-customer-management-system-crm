import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Tag, Zap } from "lucide-react";
import { Promo } from "@shared/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
export function PromoCard({ promo, showRedeemButton = false, onRedeem }: { promo: Promo, showRedeemButton?: boolean, onRedeem?: (promoId: string) => void }) {
  const promoTypeColors = {
    event: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    birthday: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    membership: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  };
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{promo.promo_name}</CardTitle>
          <Badge className={cn("capitalize", promoTypeColors[promo.promo_type])}>{promo.promo_type}</Badge>
        </div>
        <CardDescription>{promo.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{format(new Date(promo.start_date), "d MMM yyyy")} - {format(new Date(promo.end_date), "d MMM yyyy")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          <span className={promo.is_active ? "text-green-600 font-medium" : "text-red-600"}>
            {promo.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </CardContent>
      {showRedeemButton && (
        <CardFooter>
          <Button size="sm" className="w-full" onClick={() => onRedeem?.(promo.id)}>
            Redeem for 50 Points
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}