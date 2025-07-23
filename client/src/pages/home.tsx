import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  FileText, 
  AlertTriangle, 
  QrCode,
  CheckCircle,
  Clock,
  TrendingUp 
} from "lucide-react";
import { useLocation } from "wouter";

const quickServices = [
  {
    id: "tax",
    icon: CreditCard,
    title: "ชำระภาษี",
    subtitle: "Tax Payment",
    color: "bg-green-500/20 text-green-600",
    path: "/services"
  },
  {
    id: "permit",
    icon: FileText,
    title: "ขออนุญาต",
    subtitle: "Permits",
    color: "bg-blue-500/20 text-blue-600",
    path: "/services"
  },
  {
    id: "complaint",
    icon: AlertTriangle,
    title: "แจ้งปัญหา",
    subtitle: "Report Issue",
    color: "bg-yellow-500/20 text-yellow-600",
    path: "/services"
  },
  {
    id: "qr",
    icon: QrCode,
    title: "QR Code",
    subtitle: "Quick Access",
    color: "bg-purple-500/20 text-purple-600",
    path: "/services"
  },
];

export default function Home() {
  const [, setLocation] = useLocation();

  const { data: services } = useQuery<any[]>({
    queryKey: ["/api/services"],
    select: (data: any[]) => data?.slice(0, 3) || [],
  });

  const { data: serviceStats } = useQuery<any>({
    queryKey: ["/api/services/stats"],
  });

  const { data: announcements } = useQuery<any[]>({
    queryKey: ["/api/announcements"],
    select: (data: any[]) => data?.slice(0, 2) || [],
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div 
      className="p-4 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Quick Services */}
      <motion.section variants={itemVariants}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          บริการด่วน
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {quickServices.map((service) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="service-card glass-effect p-4 text-center cursor-pointer border-0"
                  onClick={() => setLocation(service.path)}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${service.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-medium text-gray-800 dark:text-white text-sm">
                    {service.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {service.subtitle}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Statistics Dashboard */}
      <motion.section variants={itemVariants}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          สถิติการใช้บริการ
        </h3>
        <Card className="glass-effect p-4 border-0">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {serviceStats?.completed || 0}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                บริการสำเร็จ
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {serviceStats?.processing || 0}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                กำลังดำเนินการ
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {serviceStats?.pending || 0}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                รอดำเนินการ
              </p>
            </div>
          </div>
          
          {/* Progress Chart */}
          <div className="mt-4 h-20">
            <svg className="w-full h-full" viewBox="0 0 100 20">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{stopColor: "hsl(142, 71%, 45%)", stopOpacity: 0.8}} />
                  <stop offset="100%" style={{stopColor: "hsl(207, 90%, 54%)", stopOpacity: 0.8}} />
                </linearGradient>
              </defs>
              <motion.path 
                d="M 5 15 Q 25 8 45 12 T 95 10" 
                stroke="url(#chartGradient)" 
                strokeWidth="2" 
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
              <motion.circle 
                cx="25" cy="10" r="2" fill="hsl(142, 71%, 45%)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              />
              <motion.circle 
                cx="45" cy="12" r="2" fill="hsl(207, 90%, 54%)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, duration: 0.3 }}
              />
              <motion.circle 
                cx="75" cy="11" r="2" fill="hsl(142, 71%, 45%)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.9, duration: 0.3 }}
              />
            </svg>
          </div>
        </Card>
      </motion.section>

      {/* Recent Activity */}
      <motion.section variants={itemVariants}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          กิจกรรมล่าสุด
        </h3>
        <div className="space-y-3">
          {services?.map((service: any, index: number) => (
            <motion.div
              key={service.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-effect p-4 flex items-center space-x-3 border-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  service.status === 'completed' 
                    ? 'bg-green-500/20' 
                    : service.status === 'processing'
                    ? 'bg-blue-500/20'
                    : 'bg-yellow-500/20'
                }`}>
                  {service.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : service.status === 'processing' ? (
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800 dark:text-white text-sm">
                    {service.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {new Date(service.createdAt).toLocaleDateString('th-TH')}
                  </p>
                </div>
                <Badge 
                  className={`text-xs ${
                    service.status === 'completed' 
                      ? 'bg-green-500/20 text-green-600 border-green-200' 
                      : service.status === 'processing'
                      ? 'bg-blue-500/20 text-blue-600 border-blue-200'
                      : 'bg-yellow-500/20 text-yellow-600 border-yellow-200'
                  }`}
                >
                  {service.status === 'completed' 
                    ? 'สำเร็จ' 
                    : service.status === 'processing'
                    ? 'กำลังดำเนินการ'
                    : 'รอดำเนินการ'
                  }
                </Badge>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* News Feed */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            ข่าวสารท้องถิ่น
          </h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/announcements")}
            className="text-primary"
          >
            ดูทั้งหมด
          </Button>
        </div>
        <div className="space-y-4">
          {announcements?.map((announcement: any, index: number) => (
            <motion.div
              key={announcement.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-effect rounded-xl overflow-hidden border-0">
                {announcement.imageUrl && (
                  <img 
                    src={announcement.imageUrl} 
                    alt={announcement.title}
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="p-4">
                  <Badge 
                    className={`mb-2 text-xs ${
                      announcement.category === 'emergency' 
                        ? 'bg-red-500/20 text-red-600 border-red-200'
                        : announcement.category === 'events'
                        ? 'bg-purple-500/20 text-purple-600 border-purple-200'
                        : 'bg-green-500/20 text-green-600 border-green-200'
                    }`}
                  >
                    {announcement.category === 'emergency' 
                      ? 'เร่งด่วน'
                      : announcement.category === 'events'
                      ? 'กิจกรรม'
                      : 'ข่าวสาร'
                    }
                  </Badge>
                  <h4 className="font-medium text-gray-800 dark:text-white">
                    {announcement.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {announcement.summary}
                  </p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-500">
                      {new Date(announcement.publishedAt).toLocaleDateString('th-TH')}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-xs text-primary font-medium"
                    >
                      อ่านเพิ่มเติม
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
