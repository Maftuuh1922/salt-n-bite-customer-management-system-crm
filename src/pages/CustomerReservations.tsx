import { useState } from 'react';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Reservation, ReservationCreate, EncryptedCustomer } from '@shared/types';
import { format, formatISO } from 'date-fns';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { showNotification } from '@/components/NotificationToast';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
const reservationSchema = z.object({
  reservation_time: z.string().min(1, "Time is required"),
  number_of_guests: z.coerce.number().int().min(1, "Must be at least 1 guest"),
  notes: z.string().optional(),
});
type ReservationFormData = z.infer<typeof reservationSchema>;
export function CustomerReservations() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const queryClient = useQueryClient();
  const { customerId } = useAuth();
  const { data: customer } = useQuery<EncryptedCustomer>({
    queryKey: ['customer', customerId],
    queryFn: () => api(`/api/customers/${customerId}`),
    enabled: !!customerId,
  });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      number_of_guests: 1,
    }
  });
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations', customerId, date],
    queryFn: () => {
      const isoDate = formatISO(date || new Date(), { representation: 'date' });
      return api<Reservation[]>(`/api/reservations/upcoming?date=${isoDate}&customer_id=${customerId}`);
    },
    enabled: !!date && !!customerId,
  });
  const createMutation = useMutation({
    mutationFn: (newReservation: ReservationCreate) => api<Reservation>('/api/reservations', { method: 'POST', body: JSON.stringify(newReservation) }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations', customerId] });
      showNotification('success', 'Reservation created successfully!');
      setIsSheetOpen(false);
      reset();
      api('/api/notifications/whatsapp', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: data.customer_id,
          type: 'reservation',
          message: `Your reservation for ${format(date!, 'PPP')} at ${variables.reservation_time} is confirmed.`
        })
      }).catch(err => console.error("Failed to send notification", err));
    },
    onError: (err) => showNotification('error', 'Failed to create reservation', err instanceof Error ? err.message : 'Unknown error'),
  });
  const onSubmit: SubmitHandler<ReservationFormData> = (data) => {
    if (!customer?.phone_number) {
      showNotification('error', 'Could not find your phone number.');
      return;
    }
    const reservationData: ReservationCreate = {
      ...data,
      customer_phone: atob(customer.phone_number),
      reservation_date: formatISO(date || new Date(), { representation: 'date' }),
      number_of_guests: data.number_of_guests,
    };
    createMutation.mutate(reservationData);
  };
  return (
    <CustomerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12 space-y-8 batik-bg">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">My Reservations</h1>
            <Button onClick={() => setIsSheetOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> New Reservation</Button>
          </div>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>New Reservation</SheetTitle>
                <SheetDescription>Book a table at Salt N Bite.</SheetDescription>
              </SheetHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <div>
                  <Label>Date: {date ? format(date, 'PPP') : 'Select a date'}</Label>
                </div>
                <div>
                  <Label htmlFor="reservation_time">Time</Label>
                  <Input id="reservation_time" type="time" {...register('reservation_time')} />
                  {errors.reservation_time && <p className="text-red-500 text-sm mt-1">{errors.reservation_time.message}</p>}
                </div>
                <div>
                  <Label htmlFor="number_of_guests">Guests</Label>
                  <Input id="number_of_guests" type="number" {...register('number_of_guests')} />
                  {errors.number_of_guests && <p className="text-red-500 text-sm mt-1">{errors.number_of_guests.message}</p>}
                </div>
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input id="notes" {...register('notes')} />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>Book Table</Button>
              </form>
            </SheetContent>
          </Sheet>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <Card>
                <CardContent className="p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md" />
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Reservations for {date ? format(date, 'PPP') : 'today'}</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? <Skeleton className="h-48 w-full" /> : reservations.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Guests</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reservations.map((res, index) => (
                          <motion.tr key={res.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                            <TableCell>{format(new Date(res.reservation_date), 'HH:mm')}</TableCell>
                            <TableCell>{res.number_of_guests}</TableCell>
                            <TableCell><Badge>{res.status}</Badge></TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center text-muted-foreground py-12"><p>No reservations for this date.</p></div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}