import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle } from 'lucide-react';
import { PromoCard } from '@/components/PromoCard';
import { api } from '@/lib/api-client';
import type { Promo } from '@shared/types';
export function PromoManagement() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<Promo[]>('/api/promos/active')
      .then(setPromos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  return (
    <AppLayout container>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Promo Management</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button><PlusCircle className="mr-2 h-4 w-4" /> Create Promo</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Create New Promo</SheetTitle>
                <SheetDescription>Fill in the details for the new promotion.</SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">Type</Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="membership">Membership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <Textarea id="description" className="col-span-3" />
                </div>
                <Button className="w-full">Create Promo</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Active Promos</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)
            ) : (
              promos.map(promo => <PromoCard key={promo.id} promo={promo} />)
            )}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Inactive Promos</h2>
           <div className="text-center text-muted-foreground py-12 border rounded-lg">
              <p>No inactive promos.</p>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}