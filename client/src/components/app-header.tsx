import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun, Globe, Bell } from "lucide-react";
import crocodileLogo from "@assets/f349f291-74b9-4c48-a5ea-fd9345040602_1753311937383.png";

export default function AppHeader() {
  const { theme, toggleTheme } = useTheme();
  const [language, setLanguage] = useState<"th" | "en">("th");

  const { data: citizen } = useQuery({
    queryKey: ["/api/citizens/current"],
  });

  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    select: (data) => data?.filter((n: any) => !n.isRead) || [],
  });

  const toggleLanguage = () => {
    setLanguage(language === "th" ? "en" : "th");
  };

  return (
    <header className="gradient-bg text-white shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Tour Der Wang Logo */}
            <div className="w-12 h-12 crocodile-logo rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src={crocodileLogo} 
                alt="Tour Der Wang Logo" 
                className="w-10 h-10 object-contain filter brightness-0 invert"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold font-inter">LocalGov Thailand</h1>
              <p className="text-xs opacity-90">
                {language === "th" ? "บริการเปิดใช้งาน" : "Services Active"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="glass-effect rounded-lg px-3 py-1 text-xs text-white hover:bg-white/20"
            >
              <Globe className="w-3 h-3 mr-1" />
              {language.toUpperCase()}
            </Button>
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="glass-effect rounded-lg p-2 text-white hover:bg-white/20"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </Button>
            
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="glass-effect rounded-lg p-2 text-white hover:bg-white/20 relative"
            >
              <Bell className="w-4 h-4" />
              {notifications?.length > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-red-500 text-white border-none animate-pulse-soft">
                  {notifications.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>
        
        {/* Personalized Welcome */}
        {citizen && (
          <div className="mt-4 glass-effect rounded-xl p-4 animate-slide-up">
            <div className="flex items-center space-x-3">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150" 
                alt="User Avatar" 
                className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
              />
              <div>
                <p className="text-sm opacity-90">
                  {language === "th" ? "ยินดีต้อนรับ" : "Welcome"}
                </p>
                <h2 className="text-lg font-semibold">
                  {citizen.firstName} {citizen.lastName}
                </h2>
                <p className="text-xs opacity-75">ID: {citizen.thaiId}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
