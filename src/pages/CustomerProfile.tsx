import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Star, Phone, Mail, Calendar } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Customer, Transaction, Feedback, EncryptedCustomer, FeedbackCreate } from '@shared/types';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { showNotification } from '@/components/NotificationToast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
const decrypt = (str: string | undefined) => str ? atob(str) : 'N/A';
const feedbackSchema = z.object({
  transaction_id: z.string().min(1, "Please select a transaction"),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});
type FeedbackFormData = z.infer<typeof feedbackSchema>;
export function CustomerProfile() {
  const { customerId } = useAuth();
  const queryClient = useQueryClient();
  const [isFeedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => api<EncryptedCustomer>(`/api/customers/${customerId}`),
    enabled: !!customerId,
  });
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transactions', customerId],
    queryFn: () => api<Transaction[]>(`/api/customers/${customerId}/transactions`),
    enabled: !!customerId,
  });
  const { data: feedback, isLoading: isLoadingFeedback } = useQuery({
    queryKey: ['feedback', customerId],
    queryFn: () => api<Feedback[]>(`/api/feedback/${customerId}`),
    enabled: !!customerId,
  });
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { rating: 3 },
  });
  const createFeedbackMutation = useMutation({
    mutationFn: (data: FeedbackCreate) => api('/api/feedback', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback', customerId] });
      showNotification('success', 'Thank you for your feedback!');
      setFeedbackDialogOpen(false);
      reset();
    },
    onError: () => showNotification('error', 'Failed to submit feedback.'),
  });
  const onFeedbackSubmit = (data: FeedbackFormData) => {
    if (!customerId) return;
    createFeedbackMutation.mutate({ customer_id: customerId, ...data });
  };
  const getInitials = (name: string) => {
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}` : name.substring(0, 2);
  };
  if (isLoadingCustomer) {
    return (
      <CustomerLayout container>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-32 w-full" /></div>
          <div className="md:col-span-2"><Skeleton className="h-96 w-full" /></div>
        </div>
      </CustomerLayout>
    );
  }
  if (!customer) {
    return <CustomerLayout container><div className="text-center py-20">Customer not found.</div></CustomerLayout>;
  }
  return (
    <CustomerLayout container>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="items-center text-center">
              <Avatar className="w-24 h-24 mb-4"><AvatarImage src={customer.avatarUrl} /><AvatarFallback className="text-3xl">{getInitials(customer.name)}</AvatarFallback></Avatar>
              <h2 className="text-2xl font-bold">{customer.name}</h2>
              <Badge>{customer.membership_level}</Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center gap-2"><Phone className="h-4 w-4" /><span>{decrypt(customer.phone_number)}</span></div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4" /><span>{decrypt(customer.email)}</span></div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>Joined {format(new Date(customer.registration_date), 'd MMM yyyy')}</span></div>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Tabs defaultValue="transactions">
            <TabsList><TabsTrigger value="transactions">Transactions</TabsTrigger><TabsTrigger value="reservations">Reservations</TabsTrigger><TabsTrigger value="feedback">Feedback</TabsTrigger></TabsList>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <TabsContent value="transactions">
                <Card>
                  <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
                  <CardContent>
                    {isLoadingTransactions ? <Skeleton className="h-64 w-full" /> : (
                      <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Payment</TableHead><TableHead>Points Earned</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {transactions?.map(tx => (
                            <TableRow key={tx.id}><TableCell>{format(new Date(tx.transaction_date), 'd MMM yyyy')}</TableCell><TableCell>Rp {tx.total_amount.toLocaleString('id-ID')}</TableCell><TableCell>{tx.payment_method}</TableCell><TableCell className="text-green-600">+{tx.loyalty_points_earned}</TableCell></TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="reservations">
                <Card><CardHeader><CardTitle>Reservation History</CardTitle></CardHeader><CardContent className="text-center text-muted-foreground py-12"><p>No reservation history available.</p></CardContent></Card>
              </TabsContent>
              <TabsContent value="feedback">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Feedback History</CardTitle>
                    <Dialog open={isFeedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
                      <DialogTrigger asChild><Button variant="outline"><Star className="mr-2 h-4 w-4" />Submit Feedback</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Submit Feedback</DialogTitle><DialogDescription>Share your experience with us.</DialogDescription></DialogHeader>
                        <form onSubmit={handleSubmit(onFeedbackSubmit)} className="space-y-4">
                          <div>
                            <Label>Transaction</Label>
                            <Controller name="transaction_id" control={control} render={({ field }) => (
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger><SelectValue placeholder="Select a recent transaction" /></SelectTrigger>
                                <SelectContent>
                                  {transactions?.map(tx => <SelectItem key={tx.id} value={tx.id}>Txn on {format(new Date(tx.transaction_date), 'd MMM yyyy')} - Rp {tx.total_amount.toLocaleString('id-ID')}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            )} />
                            {errors.transaction_id && <p className="text-red-500 text-sm mt-1">{errors.transaction_id.message}</p>}
                          </div>
                          <div>
                            <Label>Rating</Label>
                            <Controller name="rating" control={control} render={({ field }) => (
                              <div className="flex items-center gap-2">
                                <Slider defaultValue={[3]} min={1} max={5} step={1} onValueChange={(value) => field.onChange(value[0])} />
                                <span className="font-bold text-primary w-4">{field.value}</span>
                              </div>
                            )} />
                          </div>
                          <div>
                            <Label>Comment (Optional)</Label>
                            <Controller name="comment" control={control} render={({ field }) => <Textarea {...field} />} />
                          </div>
                          <DialogFooter><Button type="submit" disabled={createFeedbackMutation.isPending}>Submit</Button></DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {isLoadingFeedback ? <Skeleton className="h-64 w-full" /> : feedback && feedback.length > 0 ? (
                      <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Rating</TableHead><TableHead>Comment</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {feedback.map(f => (
                            <TableRow key={f.id}>
                              <TableCell>{format(new Date(f.feedback_date), 'd MMM yyyy')}</TableCell>
                              <TableCell><div className="flex gap-0.5">{Array.from({ length: f.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div></TableCell>
                              <TableCell className="text-muted-foreground">{f.comment}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center text-muted-foreground py-12"><p>No feedback history available.</p></div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </motion.div>
          </Tabs>
        </div>
      </div>
    </CustomerLayout>
  );
}