import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, FileSpreadsheet, Calendar as CalendarIcon } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { addDays, format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { showNotification } from '@/components/NotificationToast';
import type { AggregatedReport, ReportType } from '@shared/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
export function Reporting() {
  const [reportType, setReportType] = useState<ReportType>('customer-activity');
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [reportData, setReportData] = useState<AggregatedReport | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (date?.from && date?.to) {
      setLoading(true);
      const params = new URLSearchParams({
        start: date.from.toISOString(),
        end: date.to.toISOString(),
      });
      api<AggregatedReport>(`/api/reports/${reportType}?${params.toString()}`)
        .then(setReportData)
        .catch(() => showNotification('error', 'Failed to load report data.'))
        .finally(() => setLoading(false));
    }
  }, [reportType, date]);
  const exportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    const tableData = reportData.data.map(d => Object.values(d));
    const tableHeaders = Object.keys(reportData.data[0] || {});
    doc.text(`Report: ${reportType}`, 14, 16);
    doc.text(`Period: ${format(date?.from!, 'LLL dd, y')} - ${format(date?.to!, 'LLL dd, y')}`, 14, 22);
    (doc as any).autoTable({
      startY: 30,
      head: [tableHeaders],
      body: tableData,
    });
    doc.save(`${reportType}_report.pdf`);
    showNotification('success', 'PDF Exported', 'Your report has been downloaded.');
  };
  const exportExcel = () => {
    if (!reportData) return;
    const ws = XLSX.utils.json_to_sheet(reportData.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${reportType}_report.xlsx`);
    showNotification('success', 'Excel Exported', 'Your report has been downloaded.');
  };
  return (
    <AppLayout container>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Reporting</h1>
            <p className="text-muted-foreground">Analyze performance and export your data.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn("w-full sm:w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={exportPDF}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
            <Button variant="outline" onClick={exportExcel}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>
          </div>
        </div>
        <Tabs value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
          <TabsList>
            <TabsTrigger value="customer-activity">Customer Activity</TabsTrigger>
            <TabsTrigger value="promo-effectiveness" disabled>Promo Effectiveness</TabsTrigger>
            <TabsTrigger value="loyalty-usage" disabled>Loyalty Usage</TabsTrigger>
          </TabsList>
          <TabsContent value="customer-activity">
            <Card>
              <CardHeader>
                <CardTitle>Daily Customer Visits</CardTitle>
                <CardDescription>Total number of customer visits within the selected period.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : reportData && reportData.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={reportData.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="visits" fill="#F38020" name="Visits" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    No data available for this period.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}