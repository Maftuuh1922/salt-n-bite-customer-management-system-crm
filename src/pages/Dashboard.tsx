import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart as BarChartIcon, Users, Tag, DollarSign, ArrowUpRight } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, Line, LineChart as RechartsLineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { api } from '@/lib/api-client';
import type { DashboardStats, Customer, Transaction, CustomerGroup } from '@shared/types';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
const StatCard = ({ title, value, icon, change }: { title: string; value: string | number; icon: React.ElementType; change?: string }) => {
  const Icon = icon;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && <p className="text-xs text-muted-foreground">{change}</p>}
      </CardContent>
    </Card>
  );
};
const COLORS = ['#F38020', '#F9A826', '#6B4226', '#D97706'];
export function Dashboard() {
  const { isAdmin } = useAuth();
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => api<DashboardStats>('/api/dashboard/stats'),
  });
  const { data: groups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['customerGroups'],
    queryFn: () => api<CustomerGroup[]>('/api/customers/group'),
  });
  const getInitials = (name: string) => {
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}` : name.substring(0, 2);
  };
  if (isLoadingStats || !stats) {
    return (
      <AppLayout container>
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28" /> <Skeleton className="h-28" />
            <Skeleton className="h-28" /> <Skeleton className="h-28" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-80" /> <Skeleton className="h-80" />
          </div>
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout container>
      <motion.div
        className="space-y-8"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1 } }
        }}
      >
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
        >
          <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
            <StatCard title="Total Revenue" value={`Rp ${stats.totalRevenue.toLocaleString('id-ID')}`} icon={DollarSign} change="+20.1% from last month" />
          </motion.div>
          <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
            <StatCard title="Total Customers" value={stats.totalCustomers} icon={Users} change="+180.1% from last month" />
          </motion.div>
          <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
            <StatCard title="Today's Visits" value={stats.todaysVisits} icon={BarChartIcon} change="+19% from last month" />
          </motion.div>
          <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
            <StatCard title="Active Promos" value={stats.activePromos} icon={Tag} />
          </motion.div>
        </motion.div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader><CardTitle>Customer Activity</CardTitle></CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <RechartsLineChart data={stats.customerActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip />
                  <Line type="monotone" dataKey="visits" stroke="#F38020" activeDot={{ r: 8 }} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentTransactions.map((tx: Transaction) => {
                  const customer = stats.topCustomers.find(c => c.id === tx.customer_id);
                  return (
                    <div key={tx.id} className="flex items-center">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={customer?.avatarUrl} alt="Avatar" />
                        <AvatarFallback>{customer ? getInitials(customer.name) : 'AN'}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{customer?.name || 'Anonymous'}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(tx.transaction_date), 'd MMM yyyy, HH:mm')}</p>
                      </div>
                      <div className="ml-auto font-medium">+Rp {tx.total_amount.toLocaleString('id-ID')}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2"><CardTitle>Top Customers</CardTitle></div>
              <Button asChild size="sm" className="ml-auto gap-1">
                <Link to="/customers">View All <ArrowUpRight className="h-4 w-4" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead className="hidden sm:table-cell">Membership</TableHead><TableHead className="text-right">Total Spent</TableHead></TableRow></TableHeader>
                <TableBody>
                  {stats.topCustomers.map((customer: Customer) => (
                    <TableRow key={customer.id} className="hover:bg-accent transition-colors">
                      <TableCell><div className="font-medium">{customer.name}</div><div className="hidden text-sm text-muted-foreground md:inline">{customer.email}</div></TableCell>
                      <TableCell className="hidden sm:table-cell"><Badge variant="outline">{customer.membership_level}</Badge></TableCell>
                      <TableCell className="text-right">Rp {customer.total_spent.toLocaleString('id-ID')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Membership Distribution</CardTitle></CardHeader>
            <CardContent>
              {isLoadingGroups ? <Skeleton className="h-64 w-full" /> :
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={groups} dataKey="count" nameKey="level" cx="50%" cy="50%" outerRadius={100} label>
                      {groups?.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              }
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AppLayout>
  );
}