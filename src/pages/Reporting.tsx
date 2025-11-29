import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, FileSpreadsheet, Calendar as CalendarIcon } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { showNotification } from '@/components/NotificationToast';
import type { AggregatedReport, ReportType, ReportData } from '@shared/types';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { useQuery } from '@tanstack/react-query';
// A type guard to check if data is for customer activity
function isCustomerActivityData(data: ReportData): data is { date: string; visits: number }[] {
  return Array.isArray(data) && data.length > 0 && 'visits' in data[0];
}
export function Reporting() {
  const [reportType, setReportType] = useState<ReportType>('customer-activity');
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const { data: reportData, isLoading, isError } = useQuery({
    queryKey: ['report', reportType, date],
    queryFn: () => {
      if (!date?.from || !date?.to) throw new Error('Date range is required');
      const params = new URLSearchParams({
        start: date.from.toISOString(),
        end: date.to.toISOString(),
      });
      return api<AggregatedReport>(`/api/reports/${reportType}?${params.toString()}`);
    },
    enabled: !!date?.from && !!date?.to,
  });
  useEffect(() => {
    if (isError) {
      showNotification('error', 'Failed to load report data.');
    }
  }, [isError]);
  const exportPDF = () => {
    if (!reportData || reportData.data.length === 0) {
      showNotification('warning', 'No data to export.');
      return;
    }
    const doc = new jsPDF();
    const tableHeaders = Object.keys(reportData.data[0] || {});
    const tableData = reportData.data.map(d => Object.values(d));
    doc.text(`Report: ${reportType}`, 14, 16);
    doc.text(`Period: ${format(date?.from ?? new Date(), 'LLL dd, y')} - ${format(date?.to ?? new Date(), 'LLL dd, y')}`, 14, 22);
    // Basic table drawing without autoTable
    let y = 30;
    doc.setFont('helvetica', 'bold');
    doc.text(tableHeaders.join(' | '), 14, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    tableData.forEach(row => {
      doc.text(row.map(cell => String(cell)).join(' | '), 14, y);
      y += 7;
    });
    doc.save(`${reportType}_report.pdf`);
    showNotification('success', 'PDF Exported', 'Your report has been downloaded.');
  };
  const exportExcel = () => {
    if (!reportData || reportData.data.length === 0) {
      showNotification('warning', 'No data to export.');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(reportData.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${reportType}_report.xlsx`);
    showNotification('success', 'Excel Exported', 'Your report has been downloaded.');
  };
  const renderReportContent = () => {
    if (isLoading) return <Skeleton className="h-[400px] w-full" />;
    if (!reportData || reportData.data.length === 0) {
      return <div className="h-[400px] flex items-center justify-center text-muted-foreground">No data available for this period.</div>;
    }
    if (reportType === 'customer-activity' && isCustomerActivityData(reportData.data)) {
      return (
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
      );
    }
    // Fallback to a generic table for other report types
    return (
      <Table>
        <TableHeader><TableRow>{Object.keys(reportData.data[0]).map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{reportData.data.map((row, i) => <TableRow key={i}>{Object.values(row).map((cell, j) => <TableCell key={j}>{String(cell)}</TableCell>)}</TableRow>)}</TableBody>
      </Table>
    );
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
                <Button id="date" variant={"outline"} className={cn("w-full sm:w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (date.to ? (<>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</>) : format(date.from, "LLL dd, y")) : (<span>Pick a date</span>)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end"><Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} /></PopoverContent>
            </Popover>
            <Button variant="outline" onClick={exportPDF}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
            <Button variant="outline" onClick={exportExcel}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>
          </div>
        </div>
        <Tabs value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
          <TabsList>
            <TabsTrigger value="customer-activity">Customer Activity</TabsTrigger>
            <TabsTrigger value="promo-effectiveness">Promo Effectiveness</TabsTrigger>
            <TabsTrigger value="loyalty-usage">Loyalty Usage</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>
          <TabsContent value={reportType}>
            <Card>
              <CardHeader>
                <CardTitle>Report Data</CardTitle>
                <CardDescription>Data for {reportType.replace('-', ' ')}</CardDescription>
              </CardHeader>
              <CardContent>{renderReportContent()}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}