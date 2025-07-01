import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navigationHubs } from '@/constants/navigation';

interface HubLayoutProps {
  children: ReactNode;
  hubName?: string;
  showSubNavigation?: boolean;
  className?: string;
}

export function HubLayout({ 
  children, 
  hubName, 
  showSubNavigation = false, 
  className 
}: HubLayoutProps) {
  const location = useLocation();

  // Find the current hub based on the path or hubName
  const currentHub = hubName 
    ? navigationHubs.find(hub => hub.name === hubName)
    : navigationHubs.find(hub => location.pathname.startsWith(hub.href) || 
        hub.subItems.some(item => location.pathname === item.href));

  const currentSubItem = currentHub?.subItems.find(item => location.pathname === item.href);

  const renderBreadcrumbs = () => {
    if (!currentHub) return null;

    return (
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link
          to="/"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Home className="w-4 h-4" />
          Home
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link
          to={currentHub.href}
          className="hover:text-foreground transition-colors"
        >
          {currentHub.name}
        </Link>
        {currentSubItem && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">{currentSubItem.name}</span>
          </>
        )}
      </nav>
    );
  };

  const renderSubNavigation = () => {
    if (!showSubNavigation || !currentHub) return null;

    return (
      <div className="mb-6">
        <div className="border-b border-border">
          <nav className="flex space-x-8 overflow-x-auto">
            {currentHub.subItems
              .filter(item => item.available) // Only show available items in sub-navigation
              .map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap",
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
          </nav>
        </div>
      </div>
    );
  };

  const renderHubHeader = () => {
    if (!currentHub || currentSubItem) return null;

    const HubIcon = currentHub.icon;

    return (
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-sm">
            <HubIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {currentHub.name}
            </h1>
            <p className="text-lg text-muted-foreground mt-1">
              {currentHub.description}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderBreadcrumbs()}
        {renderHubHeader()}
        {renderSubNavigation()}
        <div className="pb-6">
          {children}
        </div>
      </div>
    </div>
  );
} 