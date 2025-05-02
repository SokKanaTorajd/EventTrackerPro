import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, LayoutDashboard, Calendar, Users, Mail, Settings } from "lucide-react";
import { AvatarWithFallback, getInitials } from "@/components/ui/avatar-with-fallback";
import { User } from "@shared/schema";

interface SidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  user: User | null;
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isMobile?: boolean;
}

function NavItem({ href, icon, children, isMobile }: NavItemProps) {
  const [location] = useLocation();
  const isActive = location === href || location.startsWith(`${href}/`);
  
  return (
    <Link href={href}>
      <a
        className={cn(
          "group flex items-center px-2 py-2 font-medium rounded-md",
          isMobile ? "text-base" : "text-sm",
          isActive
            ? "bg-gray-900 text-white"
            : "text-gray-300 hover:bg-gray-700 hover:text-white"
        )}
      >
        <div
          className={cn(
            "mr-3 h-6 w-6",
            isActive ? "text-gray-300" : "text-gray-400"
          )}
        >
          {icon}
        </div>
        {children}
      </a>
    </Link>
  );
}

export function Sidebar({ isMobile, isOpen, onClose, user }: SidebarProps) {
  const { logout } = useAuth();
  
  // Mobile sidebar
  if (isMobile) {
    if (!isOpen) return null;
    
    return (
      <div className="md:hidden fixed inset-0 flex z-40">
        {/* Overlay */}
        <div className="fixed inset-0" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
        
        {/* Sidebar */}
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-800">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Sidebar content */}
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <span className="text-white font-semibold text-xl">EventManager</span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              <NavItem href="/" icon={<LayoutDashboard />} isMobile>
                Dashboard
              </NavItem>
              <NavItem href="/events" icon={<Calendar />} isMobile>
                Events
              </NavItem>
              <NavItem href="/participants" icon={<Users />} isMobile>
                Participants
              </NavItem>
              <NavItem href="/email-templates" icon={<Mail />} isMobile>
                Email Templates
              </NavItem>
              <NavItem href="/settings" icon={<Settings />} isMobile>
                Settings
              </NavItem>
            </nav>
          </div>
          
          {/* User profile */}
          {user && (
            <div className="flex-shrink-0 flex bg-gray-700 p-4">
              <div className="flex-shrink-0 group block w-full">
                <div className="flex items-center">
                  <div>
                    <AvatarWithFallback 
                      alt={user.name}
                      fallback={getInitials(user.name)}
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-white">{user.name}</p>
                    <div className="flex space-x-2">
                      <p className="text-sm font-medium text-gray-400 group-hover:text-gray-300">
                        {user.email}
                      </p>
                      <button 
                        onClick={logout}
                        className="text-sm font-medium text-gray-400 hover:text-white"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Desktop sidebar
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-gray-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <span className="text-white font-semibold text-xl">EventManager</span>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              <NavItem href="/" icon={<LayoutDashboard />}>
                Dashboard
              </NavItem>
              <NavItem href="/events" icon={<Calendar />}>
                Events
              </NavItem>
              <NavItem href="/participants" icon={<Users />}>
                Participants
              </NavItem>
              <NavItem href="/email-templates" icon={<Mail />}>
                Email Templates
              </NavItem>
              <NavItem href="/settings" icon={<Settings />}>
                Settings
              </NavItem>
            </nav>
          </div>
          
          {/* User profile */}
          {user && (
            <div className="flex-shrink-0 flex bg-gray-700 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div>
                    <AvatarWithFallback 
                      alt={user.name}
                      fallback={getInitials(user.name)}
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <div className="flex space-x-2">
                      <p className="text-xs font-medium text-gray-300 group-hover:text-gray-200">
                        {user.email}
                      </p>
                      <button 
                        onClick={logout}
                        className="text-xs font-medium text-gray-300 hover:text-white"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
