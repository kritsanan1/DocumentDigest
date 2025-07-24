import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Wifi, 
  Battery, 
  Bell, 
  MapPin, 
  Camera, 
  Mic, 
  Share2, 
  Download,
  QrCode,
  CreditCard,
  FileText,
  Calendar,
  Users,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface DeviceInfo {
  isMobile: boolean;
  isOnline: boolean;
  battery: number;
  platform: string;
  language: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

interface PWAFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'available' | 'unavailable' | 'requesting';
  action: () => void;
}

export function AdvancedFeatures() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isOnline: navigator.onLine,
    battery: 100,
    platform: navigator.platform,
    language: navigator.language,
  });
  
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const { toast } = useToast();

  useEffect(() => {
    // Check if mobile
    setDeviceInfo(prev => ({
      ...prev,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    }));

    // Battery API
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setDeviceInfo(prev => ({
          ...prev,
          battery: Math.round(battery.level * 100)
        }));
      });
    }

    // PWA Install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check if already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Online/offline detection
    const handleOnline = () => setDeviceInfo(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setDeviceInfo(prev => ({ ...prev, isOnline: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        toast({
          title: 'แอปติดตั้งสำเร็จ',
          description: 'Tour Der Wang ได้ถูกติดตั้งในอุปกรณ์ของคุณแล้ว',
        });
      }
      setInstallPrompt(null);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast({
          title: 'การแจ้งเตือนเปิดใช้งานแล้ว',
          description: 'คุณจะได้รับการแจ้งเตือนสำคัญจากระบบ',
        });
        
        // Send test notification
        new Notification('Tour Der Wang', {
          body: 'การแจ้งเตือนทำงานปกติ',
          icon: '/favicon.ico',
        });
      }
    } catch (error) {
      toast({
        title: 'ไม่สามารถเปิดการแจ้งเตือนได้',
        description: 'กรุณาตรวจสอบการตั้งค่าเบราว์เซอร์',
        variant: 'destructive',
      });
    }
  };

  const requestLocation = async () => {
    setLocationStatus('requesting');
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocoding (mock for now)
      const address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)} - อบต.วังสามหมอ`;
      
      setDeviceInfo(prev => ({
        ...prev,
        location: {
          lat: latitude,
          lng: longitude,
          address,
        },
      }));
      
      setLocationStatus('granted');
      toast({
        title: 'ตำแหน่งพบแล้ว',
        description: address,
      });
    } catch (error) {
      setLocationStatus('denied');
      toast({
        title: 'ไม่สามารถระบุตำแหน่งได้',
        description: 'กรุณาอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์',
        variant: 'destructive',
      });
    }
  };

  const shareApp = async () => {
    const shareData = {
      title: 'Tour Der Wang - อบต.วังสามหมอ',
      text: 'แอปบริการประชาชนครบครัน พร้อมยืนยันตัวตนด้วยเทคโนโลยีรัฐบาล',
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: 'แชร์สำเร็จ',
          description: 'ขอบคุณที่แนะนำแอปของเรา',
        });
      } else {
        // Fallback for browsers without Web Share API
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: 'คัดลอกลิงก์แล้ว',
          description: 'นำไปแชร์ให้เพื่อนได้เลย',
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const pwaFeatures: PWAFeature[] = [
    {
      id: 'install',
      name: 'ติดตั้งแอป',
      description: 'ติดตั้งเป็นแอปในมือถือ',
      icon: Download,
      status: isInstalled ? 'unavailable' : (installPrompt ? 'available' : 'unavailable'),
      action: handleInstallPWA,
    },
    {
      id: 'notifications',
      name: 'การแจ้งเตือน',
      description: 'รับแจ้งเตือนสำคัญ',
      icon: Bell,
      status: notificationPermission === 'granted' ? 'unavailable' : 'available',
      action: requestNotificationPermission,
    },
    {
      id: 'location',
      name: 'ตำแหน่งที่ตั้ง',
      description: 'ใช้บริการตามพื้นที่',
      icon: MapPin,
      status: locationStatus === 'granted' ? 'unavailable' : 'available',
      action: requestLocation,
    },
    {
      id: 'share',
      name: 'แชร์แอป',
      description: 'แนะนำให้เพื่อน',
      icon: Share2,
      status: 'available',
      action: shareApp,
    },
  ];

  const deviceFeatures = [
    {
      label: 'อุปกรณ์',
      value: deviceInfo.isMobile ? 'มือถือ' : 'เดสก์ท็อป',
      icon: Smartphone,
    },
    {
      label: 'สถานะเน็ต',
      value: deviceInfo.isOnline ? 'เชื่อมต่อแล้ว' : 'ออฟไลน์',
      icon: Wifi,
      color: deviceInfo.isOnline ? 'text-green-600' : 'text-red-600',
    },
    {
      label: 'แบตเตอรี่',
      value: `${deviceInfo.battery}%`,
      icon: Battery,
    },
    {
      label: 'ตำแหน่ง',
      value: deviceInfo.location ? deviceInfo.location.address : 'ไม่ได้อนุญาต',
      icon: MapPin,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          ฟีเจอร์ขั้นสูง
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          เทคโนโลยีสมัยใหม่สำหรับการให้บริการที่ดีที่สุด
        </p>
      </div>

      <Tabs defaultValue="device" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="device">อุปกรณ์</TabsTrigger>
          <TabsTrigger value="pwa">PWA</TabsTrigger>
          <TabsTrigger value="features">ฟีเจอร์</TabsTrigger>
        </TabsList>

        <TabsContent value="device" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5" />
                <span>ข้อมูลอุปกรณ์</span>
              </CardTitle>
              <CardDescription>
                ตรวจสอบสถานะและความสามารถของอุปกรณ์
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deviceFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${feature.color || 'text-gray-600 dark:text-gray-300'}`} />
                      <span className="font-medium">{feature.label}</span>
                    </div>
                    <span className={`${feature.color || 'text-gray-900 dark:text-white'}`}>
                      {feature.value}
                    </span>
                  </div>
                );
              })}
              
              {deviceInfo.battery < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>แบตเตอรี่</span>
                    <span>{deviceInfo.battery}%</span>
                  </div>
                  <Progress value={deviceInfo.battery} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pwa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progressive Web App (PWA)</CardTitle>
              <CardDescription>
                เปิดใช้งานฟีเจอร์แอปสมัยใหม่
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {pwaFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={feature.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium">{feature.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={feature.action}
                          disabled={feature.status === 'unavailable' || feature.status === 'requesting'}
                          variant={feature.status === 'available' ? 'default' : 'outline'}
                          size="sm"
                        >
                          {feature.status === 'available' && 'เปิดใช้'}
                          {feature.status === 'unavailable' && 'ใช้งานแล้ว'}
                          {feature.status === 'requesting' && 'กำลังขอ...'}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {isInstalled && (
                <Alert className="mt-4">
                  <Download className="w-4 h-4" />
                  <AlertDescription>
                    แอปได้ถูกติดตั้งในอุปกรณ์ของคุณแล้ว สามารถเข้าใช้งานได้จากหน้าจอหลัก
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode className="w-5 h-5" />
                  <span>QR Code Scanner</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  สแกน QR Code เพื่อเข้าถึงบริการต่างๆ
                </p>
                <Button className="w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  เปิดกล้อง
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>PromptPay</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  ชำระผ่าน PromptPay สะดวกรวดเร็ว
                </p>
                <Button className="w-full" variant="outline">
                  <QrCode className="w-4 h-4 mr-2" />
                  สร้าง QR ชำระเงิน
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>ออฟไลน์โหมด</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  เข้าถึงข้อมูลพื้นฐานแม้ไม่มีเน็ต
                </p>
                <Badge variant={deviceInfo.isOnline ? 'default' : 'secondary'}>
                  {deviceInfo.isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  ติดตามการใช้งานและประสิทธิภาพ
                </p>
                <Button className="w-full" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  ดูสถิติ
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}