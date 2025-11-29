import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'react-use';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { CustomerCard } from '@/components/CustomerCard';
import { api } from '@/lib/api-client';
import type { Customer, MembershipLevel } from '@shared/types';
import { Search } from 'lucide-react';
const MEMBERSHIP_LEVELS: MembershipLevel[] = ['Bronze', 'Silver', 'Gold', 'Platinum'];
export function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [membershipFilter, setMembershipFilter] = useState<MembershipLevel | 'all'>('all');
  const [page, setPage] = useState(1);
  const limit = 12;
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);
  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', debouncedSearchTerm, membershipFilter, page],
    queryFn: () => api<Customer[]>('/api/customers'),
    placeholderData: (prev) => prev,
  });
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers
      .filter(customer => {
        const matchesSearch = debouncedSearchTerm
          ? customer.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            customer.phone_number.includes(debouncedSearchTerm)
          : true;
        const matchesFilter = membershipFilter !== 'all' ? customer.membership_level === membershipFilter : true;
        return matchesSearch && matchesFilter;
      });
  }, [customers, debouncedSearchTerm, membershipFilter]);
  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return filteredCustomers.slice(start, end);
  }, [filteredCustomers, page, limit]);
  const totalPages = Math.ceil(filteredCustomers.length / limit);
  return (
    <AppLayout container>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Search, filter, and manage your customer base.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={membershipFilter} onValueChange={(value: MembershipLevel | 'all') => setMembershipFilter(value)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by membership" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Memberships</SelectItem>
              {MEMBERSHIP_LEVELS.map(level => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} className="h-[220px] rounded-lg" />
            ))}
          </div>
        ) : paginatedCustomers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedCustomers.map(customer => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border rounded-lg">
            <h3 className="text-xl font-semibold">No Customers Found</h3>
            <p className="text-muted-foreground mt-2">Try adjusting your search or filter criteria.</p>
          </div>
        )}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }} />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink href="#" isActive={page === i + 1} onClick={(e) => { e.preventDefault(); setPage(i + 1); }}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage(p => Math.min(totalPages, p + 1)); }} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </AppLayout>
  );
}