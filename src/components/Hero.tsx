import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Users, Tag, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
const StatPill = ({ icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) => {
  const Icon = icon;
  return (
    <div className="flex items-center space-x-2">
      <div className="bg-white/10 p-2 rounded-full">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex flex-col items-start">
        <span className="text-sm font-bold text-white">{value}</span>
        <span className="text-xs text-white/70">{label}</span>
      </div>
    </div>
  );
};
export function Hero({ stats }: { stats: { totalCustomers: number; todaysVisits: number; activePromos: number } }) {
  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-br from-[#F38020] to-[#b3510a] text-white">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="py-24 md:py-32 lg:py-40 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-white">
              Salt N Bite Customer Management
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-white/80">
              An integrated solution for POS, reservations, and loyalty to delight your customers and grow your business.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 flex flex-wrap justify-center gap-6 md:gap-12"
          >
            <StatPill icon={Users} label="Total Customers" value={stats.totalCustomers} />
            <StatPill icon={Calendar} label="Today's Visits" value={stats.todaysVisits} />
            <StatPill icon={Tag} label="Active Promos" value={stats.activePromos} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}