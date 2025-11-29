import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
const sampleData = [
  { name: 'Jan', customers: 40, revenue: 2400 },
  { name: 'Feb', customers: 30, revenue: 1398 },
  { name: 'Mar', customers: 20, revenue: 9800 },
  { name: 'Apr', customers: 27, revenue: 3908 },
  { name: 'May', customers: 18, revenue: 4800 },
  { name: 'Jun', customers: 23, revenue: 3800 },
  { name: 'Jul', customers: 34, revenue: 4300 },
];
export function Reporting() {
  return (
    <AppLayout container>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Reporting</h1>
          <div className="flex gap-2">
            <Button variant="outline"><FileText className="mr-2 h-4 w-4" /> Export PDF</Button>
            <Button variant="outline"><FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel</Button>
          </div>
        </div>
        <Tabs defaultValue="customer-activity">
          <TabsList>
            <TabsTrigger value="customer-activity">Customer Activity</TabsTrigger>
            <TabsTrigger value="promo-effectiveness">Promo Effectiveness</TabsTrigger>
            <TabsTrigger value="loyalty-usage">Loyalty Usage</TabsTrigger>
          </TabsList>
          <TabsContent value="customer-activity">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Customer Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={sampleData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="customers" fill="#F38020" name="New Customers" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="promo-effectiveness">
            <Card>
              <CardHeader>
                <CardTitle>Promo Effectiveness</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground py-20">
                <p>Promo effectiveness data will be shown here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="loyalty-usage">
            <Card>
              <CardHeader>
                <CardTitle>Loyalty Points Usage</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground py-20">
                <p>Loyalty points usage data will be shown here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}