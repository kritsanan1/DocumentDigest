import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Users, 
  BarChart3, 
  Megaphone, 
  User 
} from "lucide-react";

const navItems = [
  { path: "/", icon: Home, label: "หน้าหลัก", englishLabel: "Home" },
  { path: "/services", icon: Users, label: "บริการ", englishLabel: "Services" },
  { path: "/reports", icon: BarChart3, label: "รายงาน", englishLabel: "Reports" },
  { path: "/announcements", icon: Megaphone, label: "ประกาศ", englishLabel: "Announcements" },
  { path: "/profile", icon: User, label: "โปรไฟล์", englishLabel: "Profile" },
];

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center py-2 px-4 h-auto space-y-1 ${
                isActive 
                  ? "text-primary" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
              <div 
                className={`w-4 h-1 rounded-full transition-all duration-300 ${
                  isActive ? "bg-primary" : "bg-transparent"
                }`} 
              />
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
