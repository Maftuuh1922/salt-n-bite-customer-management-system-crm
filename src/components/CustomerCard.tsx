import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, TrendingUp, DollarSign, Star } from "lucide-react";
import { Customer } from "@shared/types";
import { Link } from "react-router-dom";
export function CustomerCard({ customer }: { customer: Customer }) {
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
  };
  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar>
          <AvatarImage src={customer.avatarUrl} alt={customer.name} />
          <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{customer.name}</h3>
          <p className="text-sm text-muted-foreground">{customer.phone_number}</p>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 text-sm pt-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>{customer.total_visits} visits</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <DollarSign className="h-4 w-4" />
          <span>Rp {customer.total_spent.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Star className="h-4 w-4" />
          <span>{customer.loyalty_points} pts</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{customer.membership_level}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to={`/customers/${customer.id}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}