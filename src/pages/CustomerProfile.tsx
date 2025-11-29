import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star, Gift, Phone, Mail, Calendar, DollarSign, PlusCircle } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Customer, Transaction } from '@shared/types';
import { format } from 'date-fns';
export function CustomerProfile() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) return;
    Promise.all([
      api<Customer>(`/api/customers/${id}`),
      api<Transaction[]>(`/api/customers/${id}/transactions`),
    ])
      .then(([customerData, transactionsData]) => {
        setCustomer(customerData);
        setTransactions(transactionsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);
  const getInitials = (name: string) => {
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}` : name.substring(0, 2);
  };
  if (loading || !customer) {
    return (
      <AppLayout container>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="md:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout container>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={customer.avatarUrl} />
                <AvatarFallback className="text-3xl">{getInitials(customer.name)}</AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold">{customer.name}</h2>
              <Badge>{customer.membership_level}</Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center gap-2"><Phone className="h-4 w-4" /><span>{customer.phone_number}</span></div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4" /><span>{customer.email || 'No email'}</span></div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>Joined {format(new Date(customer.registration_date), 'd MMM yyyy')}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Loyalty Points</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-5xl font-bold text-primary">{customer.loyalty_points}</div>
              <p className="text-muted-foreground">points</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="mt-4 w-full"><PlusCircle className="mr-2 h-4 w-4" /> Adjust Points</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adjust Loyalty Points</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="points" className="text-right">Points</Label>
                      <Input id="points" type="number" defaultValue={customer.loyalty_points} className="col-span-3" />
                    </div>
                    <Button>Save Changes</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Tabs defaultValue="transactions">
            <TabsList>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="reservations">Reservations</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>
            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Points Earned</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map(tx => (
                        <TableRow key={tx.id}>
                          <TableCell>{format(new Date(tx.transaction_date), 'd MMM yyyy')}</TableCell>
                          <TableCell>Rp {tx.total_amount.toLocaleString('id-ID')}</TableCell>
                          <TableCell>{tx.payment_method}</TableCell>
                          <TableCell className="text-green-600">+{tx.loyalty_points_earned}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reservations">
              <Card>
                <CardHeader><CardTitle>Reservation History</CardTitle></CardHeader>
                <CardContent className="text-center text-muted-foreground py-12">
                  <p>No reservation history available.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="feedback">
              <Card>
                <CardHeader><CardTitle>Feedback History</CardTitle></CardHeader>
                <CardContent className="text-center text-muted-foreground py-12">
                  <p>No feedback history available.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}