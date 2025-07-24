import { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-mobile';
import { 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Smartphone, 
  Tablet, 
  Monitor,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

interface ResponsiveBreakpoint {
  name: string;
  width: number;
  icon: React.ComponentType<any>;
  description: string;
}

interface SwipeGesture {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  threshold: number;
}

export function MobileResponsive({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [swipeGesture, setSwipeGesture] = useState<SwipeGesture | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controls = useAnimation();

  const breakpoints: ResponsiveBreakpoint[] = [
    {
      name: 'Mobile',
      width: 375,
      icon: Smartphone,
      description: 'มือถือ (375px)',
    },
    {
      name: 'Tablet',
      width: 768,
      icon: Tablet,
      description: 'แท็บเล็ต (768px)',
    },
    {
      name: 'Desktop',
      width: 1200,
      icon: Monitor,
      description: 'เดสก์ท็อป (1200px+)',
    },
  ];

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener('resize', handleOrientationChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    handleOrientationChange();

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setSwipeGesture({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      threshold: 50,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeGesture) return;
    
    const touch = e.touches[0];
    setSwipeGesture(prev => prev ? {
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
    } : null);
  };

  const handleTouchEnd = () => {
    if (!swipeGesture) return;

    const deltaX = swipeGesture.currentX - swipeGesture.startX;
    const deltaY = swipeGesture.currentY - swipeGesture.startY;

    // Horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeGesture.threshold) {
      if (deltaX > 0) {
        // Swipe right
        controls.start({ x: 20 }).then(() => controls.start({ x: 0 }));
      } else {
        // Swipe left
        controls.start({ x: -20 }).then(() => controls.start({ x: 0 }));
      }
    }

    setSwipeGesture(null);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  const getCurrentBreakpoint = () => {
    const width = window.innerWidth;
    if (width < 768) return breakpoints[0];
    if (width < 1024) return breakpoints[1];
    return breakpoints[2];
  };

  const ResponsiveContainer = ({ children }: { children: React.ReactNode }) => {
    return (
      <motion.div
        animate={controls}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`
          relative min-h-screen transition-all duration-300 ease-in-out
          ${isMobile ? 'px-4 py-2' : isTablet ? 'px-6 py-4' : 'px-8 py-6'}
          ${orientation === 'landscape' && isMobile ? 'py-1' : ''}
        `}
      >
        {children}
      </motion.div>
    );
  };

  const MobileNavigation = () => {
    if (!isMobile) return null;

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="flex justify-around py-2">
          <Button variant="ghost" size="sm" className="flex-1 flex flex-col items-center py-3">
            <Smartphone className="w-4 h-4 mb-1" />
            <span className="text-xs">หน้าหลัก</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 flex flex-col items-center py-3">
            <Menu className="w-4 h-4 mb-1" />
            <span className="text-xs">บริการ</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 flex flex-col items-center py-3">
            <Tablet className="w-4 h-4 mb-1" />
            <span className="text-xs">รายงาน</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 flex flex-col items-center py-3">
            <Monitor className="w-4 h-4 mb-1" />
            <span className="text-xs">โปรไฟล์</span>
          </Button>
        </div>
      </div>
    );
  };

  const ResponsiveDebugInfo = () => {
    const currentBreakpoint = getCurrentBreakpoint();
    const CurrentIcon = currentBreakpoint.icon;

    return (
      <div className="fixed top-4 right-4 z-50">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm" className="p-2">
              <CurrentIcon className="w-4 h-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>ข้อมูลการแสดงผล</DrawerTitle>
              <DrawerDescription>
                ตรวจสอบการตอบสนองของหน้าจอ
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium">อุปกรณ์</h3>
                  <div className="flex items-center space-x-2">
                    <CurrentIcon className="w-5 h-5" />
                    <span>{currentBreakpoint.name}</span>
                  </div>
                  <Badge variant="outline">
                    {window.innerWidth} x {window.innerHeight}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">การวางแนว</h3>
                  <Badge variant={orientation === 'portrait' ? 'default' : 'secondary'}>
                    {orientation === 'portrait' ? 'แนวตั้ง' : 'แนวนอน'}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button onClick={toggleFullscreen} size="sm" variant="outline">
                      <Maximize2 className="w-4 h-4 mr-2" />
                      {isFullscreen ? 'ออกจากเต็มจอ' : 'เต็มจอ'}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Breakpoints</h3>
                <div className="grid grid-cols-3 gap-2">
                  {breakpoints.map((bp, index) => {
                    const BpIcon = bp.icon;
                    const isActive = currentBreakpoint.name === bp.name;
                    return (
                      <div
                        key={index}
                        className={`p-3 border rounded-lg text-center ${
                          isActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <BpIcon className={`w-5 h-5 mx-auto mb-2 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div className="text-sm font-medium">{bp.name}</div>
                        <div className="text-xs text-gray-500">{bp.width}px</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">ฟีเจอร์มือถือ</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Touch Support:</span>
                    <Badge variant={isMobile ? 'default' : 'secondary'}>
                      {isMobile ? 'ใช่' : 'ไม่'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>PWA:</span>
                    <Badge variant="default">พร้อม</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Orientation:</span>
                    <Badge variant="outline">{orientation}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Fullscreen:</span>
                    <Badge variant={isFullscreen ? 'default' : 'secondary'}>
                      {isFullscreen ? 'ใช่' : 'ไม่'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  };

  return (
    <ResponsiveContainer>
      {children}
      <MobileNavigation />
      <ResponsiveDebugInfo />
    </ResponsiveContainer>
  );
}

// Hook for responsive font sizes
export function useResponsiveFontSize() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');

  return {
    title: isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl',
    subtitle: isMobile ? 'text-sm' : isTablet ? 'text-base' : 'text-lg',
    body: isMobile ? 'text-xs' : isTablet ? 'text-sm' : 'text-base',
    caption: isMobile ? 'text-xs' : 'text-sm',
  };
}

// Hook for responsive spacing
export function useResponsiveSpacing() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');

  return {
    padding: isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-6',
    margin: isMobile ? 'm-2' : isTablet ? 'm-3' : 'm-4',
    gap: isMobile ? 'gap-2' : isTablet ? 'gap-3' : 'gap-4',
    section: isMobile ? 'space-y-3' : isTablet ? 'space-y-4' : 'space-y-6',
  };
}

// Hook for responsive grid
export function useResponsiveGrid() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');

  return {
    cols1: 'grid-cols-1',
    cols2: isMobile ? 'grid-cols-1' : 'grid-cols-2',
    cols3: isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3',
    cols4: isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-3' : 'grid-cols-4',
  };
}