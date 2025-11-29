import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PromoCard } from '@/components/PromoCard';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import type { Promo, Customer } from '@shared/types';
import { showNotification } from '@/components/NotificationToast';
export function CustomerPromos() {
  const { customerId } = useAuth();
  const queryClient = useQueryClient();
  const { data: customer, isLoading: loadingCustomer } = useQuery<Customer>({
    queryKey: ['customer', customerId],
    queryFn: () => api(`/api/customers/${customerId}`),
    enabled: !!customerId,
  });
  const { data: promos, isLoading: loadingPromos } = useQuery<Promo[]>({
    queryKey: ['promos', customerId],
    queryFn: () => api(`/api/promos?customer_id=${customerId}`),
    enabled: !!customerId,
  });
  const handleRedeem = () => {
    showNotification('success', 'Promo Redeemed!', 'Your points will be updated on your next transaction.');
    queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
  };
  return (
    <CustomerLayout container>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Promos & Points</h1>
          <p className="text-muted-foreground">Discover offers available for you.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Your Loyalty Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCustomer || !customer ? (
              <Skeleton className="h-12 w-48" />
            ) : (
              <div className="flex items-baseline gap-4">
                <span className="text-5xl font-bold text-primary">{customer.loyalty_points}</span>
                <span className="text-muted-foreground">Points</span>
              </div>
            )}
          </CardContent>
        </Card>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Available Promos</h2>
          {loadingPromos ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
            </div>
          ) : promos?.filter(p => p.is_active).length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {promos.filter(p => p.is_active).map(promo => (
                <div key={promo.id} className="relative group">
                  <PromoCard promo={promo} />
                  <div className="absolute bottom-4 right-4">
                    <button onClick={handleRedeem} className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-semibold">
                      Redeem
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12 border rounded-lg"><p>No promos available for you right now.</p></div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}