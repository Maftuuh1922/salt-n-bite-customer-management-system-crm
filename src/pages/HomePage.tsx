import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Hero } from '@/components/Hero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart, Gift, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import type { DashboardStats } from '@shared/types';
import { setAuthToken } from '@/lib/auth';
const FeatureCard = ({ icon, title, description, link }: { icon: React.ElementType, title: string, description: string, link: string }) => {
  const Icon = icon;
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
      className="h-full"
    >
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
        <div className="p-6 pt-0">
          <Button variant="outline" asChild>
            <Link to={link}>
              Go to {title} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
export function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    // Prefill demo auth token for Phase 1
    setAuthToken('demo-admin-jwt');
    api<DashboardStats>('/api/dashboard/stats')
      .then(data => {
        setStats(data);
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setAuthToken(null); // Clear token after fetching stats
      });
  }, []);
  const heroStats = {
    totalCustomers: loading || !stats ? 0 : stats.totalCustomers,
    todaysVisits: loading || !stats ? 0 : stats.todaysVisits,
    activePromos: loading || !stats ? 0 : stats.activePromos,
  };
  return (
    <div className="bg-background text-foreground batik-bg">
      <ThemeToggle className="fixed top-4 right-4" />
      <Hero stats={heroStats} />
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-16 md:py-24">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-display">Get Started</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Access the portal as an administrator or a customer.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" onClick={() => { setAuthToken('demo-admin-jwt'); navigate('/dashboard'); }}>
                  Admin Portal <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/customer/login')}>
                  Customer Portal <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="py-16 md:py-24 lg:py-32">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-display">Core Features</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to build stronger customer relationships and drive growth.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-8 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-4/5" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                <>
                  <FeatureCard
                    icon={BarChart}
                    title="Dashboard"
                    description="Get a real-time overview of your customer activity, sales, and engagement metrics."
                    link="/dashboard"
                  />
                  <FeatureCard
                    icon={Users}
                    title="Customer Profiles"
                    description="Access detailed customer histories, including transactions, visits, and loyalty status."
                    link="/customers"
                  />
                  <FeatureCard
                    icon={Gift}
                    title="Promo Management"
                    description="Create, manage, and track the performance of your promotional events and loyalty programs."
                    link="/promos"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Salt N Bite. Built with ❤️ at Cloudflare.</p>
        </div>
      </footer>
      <Toaster richColors closeButton />
    </div>
  );
}