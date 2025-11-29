import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { PromoCard } from '@/components/PromoCard';
import { api } from '@/lib/api-client';
import type { Promo } from '@shared/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { showNotification } from '@/components/NotificationToast';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
const promoSchema = z.object({
  promo_name: z.string().min(3, 'Name must be at least 3 characters'),
  promo_type: z.enum(['event', 'birthday', 'membership']),
  description: z.string().min(10, 'Description is too short'),
  start_date: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
  end_date: z.string().optional(),
});
type PromoFormData = z.infer<typeof promoSchema>;
export function PromoManagement() {
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const { data: promos = [], isLoading } = useQuery<Promo[]>({
    queryKey: ['promos'],
    queryFn: () => api('/api/promos'),
  });
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PromoFormData>({
    resolver: zodResolver(promoSchema),
  });
  const createMutation = useMutation({
    mutationFn: (newPromo: PromoFormData) => api<Promo>('/api/promos', { method: 'POST', body: JSON.stringify(newPromo) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promos'] });
      showNotification('success', 'Promo created successfully!');
      setIsSheetOpen(false);
      reset();
    },
    onError: () => showNotification('error', 'Failed to create promo.'),
  });
  const updateMutation = useMutation({
    mutationFn: (updatedPromo: Promo) => api<Promo>(`/api/promos/${updatedPromo.id}`, { method: 'PUT', body: JSON.stringify(updatedPromo) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promos'] });
      showNotification('success', 'Promo updated successfully!');
      setIsSheetOpen(false);
      reset();
      setEditingPromo(null);
    },
    onError: () => showNotification('error', 'Failed to update promo.'),
  });
  const deleteMutation = useMutation({
    mutationFn: (promoId: string) => api(`/api/promos/${promoId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promos'] });
      showNotification('success', 'Promo deleted successfully!');
    },
    onError: () => showNotification('error', 'Failed to delete promo.'),
  });
  const onSubmit = (data: PromoFormData) => {
    if (editingPromo) {
      updateMutation.mutate({ ...editingPromo, ...data });
    } else {
      createMutation.mutate(data);
    }
  };
  const handleEdit = (promo: Promo) => {
    setEditingPromo(promo);
    setValue('promo_name', promo.promo_name);
    setValue('promo_type', promo.promo_type);
    setValue('description', promo.description);
    setValue('start_date', promo.start_date.split('T')[0]);
    setValue('end_date', promo.end_date ? promo.end_date.split('T')[0] : '');
    setIsSheetOpen(true);
  };
  const handleCreateNew = () => {
    setEditingPromo(null);
    reset();
    setIsSheetOpen(true);
  };
  const activePromos = promos.filter(p => p.is_active);
  const inactivePromos = promos.filter(p => !p.is_active);
  return (
    <AppLayout container>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Promo Management</h1>
          <Button onClick={handleCreateNew}><PlusCircle className="mr-2 h-4 w-4" /> Create Promo</Button>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{editingPromo ? 'Edit Promo' : 'Create New Promo'}</SheetTitle>
              <SheetDescription>Fill in the details for the promotion.</SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('promo_name')} />
                {errors.promo_name && <p className="text-red-500 text-sm mt-1">{errors.promo_name.message}</p>}
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select onValueChange={(value) => setValue('promo_type', value as any)} defaultValue={editingPromo?.promo_type}>
                  <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="membership">Membership</SelectItem>
                  </SelectContent>
                </Select>
                {errors.promo_type && <p className="text-red-500 text-sm mt-1">{errors.promo_type.message}</p>}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register('description')} />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input id="start_date" type="date" {...register('start_date')} />
                  {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date.message}</p>}
                </div>
                <div>
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input id="end_date" type="date" {...register('end_date')} />
                  {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date.message}</p>}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingPromo ? 'Save Changes' : 'Create Promo'}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Active Promos</h2>
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
            </div>
          ) : activePromos.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activePromos.map(promo => (
                <div key={promo.id} className="relative group">
                  <PromoCard promo={promo} />
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="outline" onClick={() => handleEdit(promo)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="icon" variant="destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the promo.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(promo.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12 border rounded-lg"><p>No active promos. Create one to get started!</p></div>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Inactive Promos</h2>
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
            </div>
          ) : inactivePromos.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {inactivePromos.map(promo => (
                <div key={promo.id} className="relative group">
                  <PromoCard promo={promo} />
                   <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="outline" onClick={() => handleEdit(promo)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="icon" variant="destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the promo.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(promo.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12 border rounded-lg"><p>No inactive promos.</p></div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}