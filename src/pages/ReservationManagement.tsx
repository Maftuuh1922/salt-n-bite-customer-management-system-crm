import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
export function ReservationManagement() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return (
    <AppLayout container>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Reservation Management</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button><PlusCircle className="mr-2 h-4 w-4" /> New Reservation</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>New Reservation</SheetTitle>
                <SheetDescription>Create a new reservation for a customer.</SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="customer" className="text-right">Customer</Label>
                  <Input id="customer" placeholder="Search by phone..." className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Date</Label>
                  <Input id="date" type="date" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="time" className="text-right">Time</Label>
                  <Input id="time" type="time" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="guests" className="text-right">Guests</Label>
                  <Input id="guests" type="number" className="col-span-3" />
                </div>
                <Button className="w-full">Create Reservation</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md"
                />
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Reservations for {date ? date.toLocaleDateString() : 'today'}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>19:00</TableCell>
                      <TableCell>Budi Santoso</TableCell>
                      <TableCell>4</TableCell>
                      <TableCell><Badge>Confirmed</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>20:30</TableCell>
                      <TableCell>Citra Lestari</TableCell>
                      <TableCell>2</TableCell>
                      <TableCell><Badge>Confirmed</Badge></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}