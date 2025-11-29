import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PromoCard } from '@/components/PromoCard';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import type { Promo, Customer } from '@shared/types';
import { showNotification } from '@/components/NotificationToast';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
export function CustomerPromos() {
  const { customerId } = useAuth();
  const queryClient = useQueryClient();
  const { data: customer, isLoading: loadingCustomer } = useQuery<Customer>({
    queryKey: ['customer', customerId],
    queryFn: () => api(`/api/customers/${customerId}`),
    enabled: !!customerId
  });
  const { data: promos, isLoading: loadingPromos } = useQuery<Promo[]>({
    queryKey: ['promos', customerId],
    queryFn: () => api(`/api/promos?customer_id=${customerId}`),
    enabled: !!customerId
  });
  const handleRedeem = async (promoId: string) => {
    try {
      await api(`/api/promos/redeem?promo_id=${promoId}&customer_id=${customerId}`, { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      showNotification('success', 'Promo Redeemed!', 'Your points have been updated.');
    } catch (error) {
      showNotification('error', 'Redemption Failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };
  const pointsToNextLevel = {
    'Bronze': 500,
    'Silver': 2000,
    'Gold': 5000,
    'Platinum': Infinity
  };
  const currentPoints = customer?.loyalty_points || 0;
  const nextLevelPoints = pointsToNextLevel[customer?.membership_level || 'Bronze'];
  const progress = Math.min(currentPoints / nextLevelPoints * 100, 100);
  return (
    <CustomerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12 space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Promos & Points</h1>
            <p className="text-muted-foreground">Discover offers available for you.</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Your Loyalty Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCustomer || !customer ?
              <Skeleton className="h-24 w-full" /> :
              <div className="space-y-2">
                  <div className="flex items-baseline gap-4">
                    <span className="text-5xl font-bold text-primary">{customer.loyalty_points}</span>
                    <span className="text-muted-foreground">Points</span>
                  </div>
                  {customer.membership_level !== 'Platinum' &&
                <div>
                      <Progress value={progress} className="w-full" />
                      <p className="text-sm text-muted-foreground mt-2">
                        {nextLevelPoints - currentPoints} points to next level: {customer.membership_level === 'Bronze' ? 'Silver' : 'Gold'}
                      </p>
                    </div>
                }
                </div>
              }
            </CardContent>
          </Card>
          <div>
            <h2 className="text-2xl font-semibold mb-4">Available Promos</h2>
            {loadingPromos ?
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
              </div> :
            promos?.filter((p) => p.is_active).length ?
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {promos.filter((p) => p.is_active).map((promo) =>
                  <PromoCard key={promo.id} promo={promo} showRedeemButton={true} onRedeem={handleRedeem} />
              )}
              </div> :
            <div className="text-center text-muted-foreground py-12 border rounded-lg">
                <h3 className="text-xl font-semibold">No Promos Available</h3>
                <p className="mt-2">Check back later for new offers!</p>
              </div>
            }
          </div>
        </div>
      </div>
    </CustomerLayout>);
}