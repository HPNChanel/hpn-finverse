import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';
import { useToast } from '@/hooks/use-toast';
import { 
  Menu, 
  X, 
  LogOut, 
  Settings, 
  User,
  ChevronDown,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// NavigationMenu not available, using DropdownMenu instead
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ErrorHandler } from '@/utils/errorHandler';
import { navigationHubs, quickAccessItems, type NavigationHub, type NavigationSubItem } from '@/constants/navigation';

export function NavigationBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const { getAvatarSrc } = useAvatarUrl({ avatarUrl: user?.avatar_url });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been safely logged out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      ErrorHandler.logError(error, 'Logout');
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isHubActive = (hub: NavigationHub) => {
    return location.pathname.startsWith(hub.href) || 
           hub.subItems.some(item => location.pathname === item.href);
  };

  const isSubItemActive = (item: NavigationSubItem) => {
    return location.pathname === item.href;
  };

  const handleSubItemClick = (item: NavigationSubItem, e: React.MouseEvent) => {
    if (!item.available) {
      e.preventDefault();
      toast({
        title: "Coming Soon",
        description: `${item.name} is not available yet. Stay tuned for updates!`,
        variant: "default",
      });
    } else {
      setMobileMenuOpen(false);
    }
  };

  const renderDesktopNavigation = () => (
    <div className="hidden lg:flex items-center gap-1">
      {/* Quick Access */}
      {quickAccessItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
              isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
          >
            <Icon className="w-4 h-4 mr-2" />
            {item.name}
          </Link>
        );
      })}

      {/* Hub Navigation */}
      {navigationHubs.map((hub) => {
        const HubIcon = hub.icon;
        const isActive = isHubActive(hub);
        
        return (
          <DropdownMenu key={hub.name}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "gap-2 text-sm font-medium h-10 px-4 py-2",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <HubIcon className="w-4 h-4" />
                {hub.name}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[400px]" align="start">
              <div className="p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-1">{hub.name}</h4>
                  <p className="text-xs text-muted-foreground">{hub.description}</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {hub.subItems.map((item) => {
                    const ItemIcon = item.icon;
                    const isSubActive = isSubItemActive(item);
                    
                    return (
                      <TooltipProvider key={item.name}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              to={item.href}
                              onClick={(e) => handleSubItemClick(item, e)}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                                item.available 
                                  ? "hover:bg-accent cursor-pointer" 
                                  : "opacity-50 pointer-events-none cursor-not-allowed",
                                isSubActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                              )}
                            >
                              <div className={cn(
                                "p-2 rounded-md",
                                item.available ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                              )}>
                                <ItemIcon className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{item.name}</span>
                                  {!item.available && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Soon
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {item.description}
                                </p>
                              </div>
                            </Link>
                          </TooltipTrigger>
                          {!item.available && (
                            <TooltipContent>
                              <p>Coming Soon - {item.name}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </div>
  );

  const renderMobileNavigation = () => (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-16 left-0 right-0 z-50 bg-background border-b border-border shadow-lg lg:hidden">
            <div className="max-h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Quick Access in Mobile */}
                {quickAccessItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg transition-colors",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-accent text-muted-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}

                {/* Hub Navigation in Mobile */}
                {navigationHubs.map((hub) => {
                  const HubIcon = hub.icon;
                  const isActive = isHubActive(hub);
                  
                  return (
                    <div key={hub.name} className="space-y-2">
                      <Link
                        to={hub.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg font-medium transition-colors",
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-accent text-foreground"
                        )}
                      >
                        <HubIcon className="w-5 h-5" />
                        <span>{hub.name}</span>
                      </Link>
                      
                      {/* Sub-items */}
                      <div className="ml-4 space-y-1">
                        {hub.subItems.map((item) => {
                          const ItemIcon = item.icon;
                          const isSubActive = isSubItemActive(item);
                          
                          return (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={(e) => handleSubItemClick(item, e)}
                              className={cn(
                                "flex items-center gap-3 p-2 rounded-md text-sm transition-colors",
                                item.available 
                                  ? "hover:bg-accent cursor-pointer" 
                                  : "opacity-50 pointer-events-none cursor-not-allowed",
                                isSubActive 
                                  ? "bg-accent text-accent-foreground" 
                                  : "text-muted-foreground"
                              )}
                            >
                              <ItemIcon className="w-4 h-4" />
                              <span>{item.name}</span>
                              {!item.available && (
                                <Badge variant="secondary" className="text-xs">
                                  Soon
                                </Badge>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left Section - Logo and Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="text-xl font-bold text-foreground hidden sm:block">Finverse</span>
            </Link>
            
            {renderDesktopNavigation()}
          </div>

          {/* Right Section - User Menu and Mobile Menu */}
          <div className="flex items-center gap-4">
            {renderMobileNavigation()}
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={getAvatarSrc()} 
                        alt={user.name || user.email} 
                      />
                      <AvatarFallback className="text-sm">
                        {getUserInitials(user.name || user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1.5 py-1">
                      <p className="text-sm font-medium leading-relaxed break-words" 
                         title={user.name || user.email}>
                        {user.name || user.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground break-all" 
                         title={user.email}>
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="w-full cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="w-full cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 