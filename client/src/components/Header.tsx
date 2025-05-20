import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, getRoleLabel } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { School, LogOut, Menu } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Success',
        description: 'Logged out successfully',
      });
      window.location.href = '/login';
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        variant: 'destructive',
      });
    }
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <School className="text-primary mr-2 h-6 w-6" />
          <h1 className="text-xl font-medium text-gray-800">AttendTrack</h1>
        </div>
        
        {user && (
          <div className="flex items-center" id="userInfoSection">
            <div className="hidden sm:flex items-center mr-4" id="userInfo">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback className="bg-primary text-white">
                  {getInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm text-gray-700">{`${user.lastName} ${user.firstName}`}</span>
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-primary text-white">
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout} 
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
        
        {/* Mobile menu button - shown on small screens */}
        <div className="sm:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      {/* Mobile menu - shown when toggled */}
      {mobileMenuOpen && user && (
        <div className="sm:hidden bg-white py-2 px-4 shadow-md">
          <div className="flex items-center mb-2">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarFallback className="bg-primary text-white">
                {getInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm text-gray-700">{`${user.lastName} ${user.firstName}`}</div>
              <div className="text-xs text-gray-500">{getRoleLabel(user.role)}</div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleLogout} 
            className="w-full text-gray-500 hover:text-gray-700 justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Выйти
          </Button>
        </div>
      )}
    </header>
  );
}
