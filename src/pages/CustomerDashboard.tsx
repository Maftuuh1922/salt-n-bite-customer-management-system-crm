import { useQuery } from '@tanstack/react-query';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PromoCard } from '@/components/PromoCard';
import { api } from '@/lib/api-client';
import type { Customer, Transaction, Promo } from '@shared/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
export function CustomerDashboard() {
  const { customerId } = useAuth();
  const { data: customer, isLoading: loadingCustomer } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => api<Customer>(`/api/customers/${customerId}`),
    enabled: !!customerId,
  });
  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['transactions', customerId],
    queryFn: () => api<Transaction[]>(`/api/customers/${customerId}/transactions`),
    enabled: !!customerId,
  });
  const { data: promos, isLoading: loadingPromos } = useQuery({
    queryKey: ['promos', customerId],
    queryFn: () => api<Promo[]>(`/api/promos?customer_id=${customerId}`),
    enabled: !!customerId,
  });
  if (loadingCustomer || !customer) {
    return (
      <CustomerLayout container>
        <div className="space-y-8">
          <Skeleton className="h-48 w-full" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </CustomerLayout>
    );
  }
  return (
    <CustomerLayout container>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Welcome back, {customer.name.split(' ')[0]}!</h1>
          <p className="text-muted-foreground">Here's a summary of your activity at Salt N Bite.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Your Loyalty Status</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">{customer.loyalty_points}</div>
              <p className="text-muted-foreground mb-4">Points</p>
              <Badge>{customer.membership_level} Member</Badge>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your last 5 transactions.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/customer/profile">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loadingTransactions ? <Skeleton className="h-48" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.slice(0, 5).map(tx => (
                      <TableRow key={tx.id}>
                        <TableCell>{format(new Date(tx.transaction_date), 'd MMM yyyy')}</TableCell>
                        <TableCell>Rp {tx.total_amount.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-right text-green-600">+{tx.loyalty_points_earned}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Promos For You</h2>
          {loadingPromos ? <Skeleton className="h-64" /> : promos?.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {promos.filter(p => p.is_active).map(p => <PromoCard key={p.id} promo={p} />)}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12 border rounded-lg"><p>No active promos available for you right now.</p></div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}