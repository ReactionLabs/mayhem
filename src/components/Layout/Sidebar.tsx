import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Rocket,
  Wallet, 
  Settings, 
  Menu,
  X,
  BarChart2,
  User,
  TrendingUp
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';

const navItems = [
  { href: '/', label: 'Explore', icon: Home },
  { href: '/launchpad', label: 'Launchpad', icon: Rocket },
  { href: '/portfolio', label: 'Portfolio', icon: Wallet },
  { href: '/liquidity', label: 'Liquidity', icon: TrendingUp },
];

export const Sidebar = () => {
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Button
          size="icon"
          className="rounded-full h-12 w-12 shadow-lg bg-primary"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo area - aligns with Header logo */}
          <div className="h-16 flex items-center px-2 mb-4">
             <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400">
               Menu
             </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="mt-auto pt-4 border-t border-border space-y-2">
             {/* Placeholder for settings or other bottom links */}
             <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
               <Settings className="w-5 h-5" />
               <span>Settings</span>
             </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};

