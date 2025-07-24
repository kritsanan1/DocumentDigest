import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Database, 
  Cloud, 
  Zap, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  RotateCcw,
  BarChart3,
  MapPin,
  CreditCard,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';

interface APIStatus {
  service: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error' | 'testing';
  lastChecked: string;
  responseTime: number;
  endpoint: string;
  description: string;
  icon: React.ComponentType<any>;
  features: string[];
}

interface RealTimeData {
  weather: {
    temperature: number;
    humidity: number;
    description: string;
    location: string;
  };
  population: {
    total: number;
    households: number;
    area: string;
  };
  services: {
    active: number;
    completed: number;
    pending: number;
  };
  traffic: {
    currentUsers: number;
    peakTime: string;
    avgResponseTime: number;
  };
}

export function RealAPIIntegrations() {
  const [apiStatuses, setApiStatuses] = useState<APIStatus[]>([]);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null);
  const { toast } = useToast();

  const governmentAPIs: APIStatus[] = [
    {
      service: 'ndid',
      name: 'NDID Blockchain',
      status: 'disconnected',
      lastChecked: new Date().toISOString(),
      responseTime: 0,
      endpoint: 'https://ndid-api.gov.th/v1',
      description: 'ระบบยืนยันตัวตน Blockchain ของรัฐบาล',
      icon: Shield,
      features: ['Identity Verification', 'Digital Signature', 'Consent Management'],
    },
    {
      service: 'dopa',
      name: 'D.DOPA Database',
      status: 'disconnected',
      lastChecked: new Date().toISOString(),
      responseTime: 0,
      endpoint: 'https://dopa-api.gov.th/v2',
      description: 'ฐานข้อมูลทะเบียนราษฎรกลาง',
      icon: Database,
      features: ['Citizen Registry', 'Address Verification', 'Status Check'],
    },
    {
      service: 'thaid',
      name: 'ThaID Platform',
      status: 'disconnected',
      lastChecked: new Date().toISOString(),
      responseTime: 0,
      endpoint: 'https://thaid-api.gov.th/v1',
      description: 'แพลตฟอร์มยืนยันตัวตนดิจิทัลแห่งชาติ',
      icon: Cloud,
      features: ['Mobile Authentication', 'Biometric Verification', 'QR Code'],
    },
  ];

  const externalAPIs: APIStatus[] = [
    {
      service: 'weather',
      name: 'OpenWeatherMap',
      status: 'disconnected',
      lastChecked: new Date().toISOString(),
      responseTime: 0,
      endpoint: 'https://api.openweathermap.org/data/2.5',
      description: 'ข้อมูลสภาพอากาศแบบเรียลไทม์',
      icon: Cloud,
      features: ['Current Weather', 'Forecast', 'Alerts'],
    },
    {
      service: 'maps',
      name: 'Google Maps API',
      status: 'disconnected',
      lastChecked: new Date().toISOString(),
      responseTime: 0,
      endpoint: 'https://maps.googleapis.com/maps/api',
      description: 'บริการแผนที่และการนำทาง',
      icon: MapPin,
      features: ['Geocoding', 'Places API', 'Directions'],
    },
    {
      service: 'payment',
      name: 'PromptPay API',
      status: 'disconnected',
      lastChecked: new Date().toISOString(),
      responseTime: 0,
      endpoint: 'https://api.promptpay.io/v1',
      description: 'ระบบชำระเงินดิจิทัล PromptPay',
      icon: CreditCard,
      features: ['QR Generation', 'Payment Status', 'Transaction History'],
    },
  ];

  useEffect(() => {
    setApiStatuses([...governmentAPIs, ...externalAPIs]);
    checkAllAPIs();
    
    // Set up real-time data polling
    const interval = setInterval(() => {
      updateRealTimeData();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const checkAPIStatus = useMutation({
    mutationFn: async (api: APIStatus) => {
      const startTime = Date.now();
      
      try {
        // Simulate API check by calling our backend
        const response = await fetch(`/api/external/check/${api.service}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: api.endpoint }),
        });
        
        const responseTime = Date.now() - startTime;
        const result = await response.json();
        
        return {
          ...api,
          status: response.ok ? 'connected' : 'error',
          responseTime,
          lastChecked: new Date().toISOString(),
          testResult: result,
        };
      } catch (error) {
        return {
          ...api,
          status: 'error',
          responseTime: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    onSuccess: (result) => {
      setApiStatuses(prev => 
        prev.map(api => api.service === result.service ? result : api)
      );
      setTestResults(prev => ({
        ...prev,
        [result.service]: result.testResult || result.error,
      }));
    },
  });

  const checkAllAPIs = async () => {
    const allAPIs = [...governmentAPIs, ...externalAPIs];
    for (const api of allAPIs) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Stagger requests
      checkAPIStatus.mutate(api);
    }
  };

  const updateRealTimeData = async () => {
    try {
      const response = await fetch('/api/realtime/dashboard');
      if (response.ok) {
        const data = await response.json();
        setRealTimeData(data);
      }
    } catch (error) {
      console.error('Failed to fetch real-time data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 dark:text-green-400';
      case 'testing': return 'text-yellow-600 dark:text-yellow-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return CheckCircle;
      case 'testing': return RotateCcw;
      case 'error': return XCircle;
      default: return AlertTriangle;
    }
  };

  const testSpecificAPI = async (service: string) => {
    const api = apiStatuses.find(a => a.service === service);
    if (api) {
      // Set testing status
      setApiStatuses(prev => 
        prev.map(a => a.service === service ? { ...a, status: 'testing' } : a)
      );
      
      checkAPIStatus.mutate(api);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          การเชื่อมต่อ API จริง
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          ตรวจสอบสถานะการเชื่อมต่อกับระบบภายนอกแบบเรียลไทม์
        </p>
      </div>

      <Tabs defaultValue="government" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="government">รัฐบาล</TabsTrigger>
          <TabsTrigger value="external">ภายนอก</TabsTrigger>
          <TabsTrigger value="realtime">เรียลไทม์</TabsTrigger>
          <TabsTrigger value="testing">ทดสอบ</TabsTrigger>
        </TabsList>

        <TabsContent value="government" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">API ของรัฐบาลไทย</h3>
            <Button onClick={checkAllAPIs} disabled={checkAPIStatus.isPending}>
              <RotateCcw className="w-4 h-4 mr-2" />
              ตรวจสอบทั้งหมด
            </Button>
          </div>
          
          <div className="grid gap-4">
            {apiStatuses.filter(api => governmentAPIs.some(gov => gov.service === api.service)).map((api) => {
              const Icon = api.icon;
              const StatusIcon = getStatusIcon(api.status);
              
              return (
                <Card key={api.service} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{api.name}</CardTitle>
                          <CardDescription>{api.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={`w-5 h-5 ${getStatusColor(api.status)}`} />
                        <Badge variant={api.status === 'connected' ? 'default' : 'secondary'}>
                          {api.status === 'connected' && 'เชื่อมต่อแล้ว'}
                          {api.status === 'testing' && 'กำลังทดสอบ'}
                          {api.status === 'error' && 'ข้อผิดพลาด'}
                          {api.status === 'disconnected' && 'ไม่เชื่อมต่อ'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Response Time</div>
                        <div className="font-semibold">{api.responseTime}ms</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Last Checked</div>
                        <div className="font-semibold text-xs">
                          {new Date(api.lastChecked).toLocaleTimeString('th-TH')}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Endpoint</div>
                        <div className="font-semibold text-xs truncate">
                          {api.endpoint.split('/').pop()}
                        </div>
                      </div>
                      <div className="text-center">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => testSpecificAPI(api.service)}
                          disabled={checkAPIStatus.isPending}
                        >
                          <Zap className="w-4 h-4 mr-1" />
                          ทดสอบ
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium">ฟีเจอร์ที่รองรับ:</div>
                      <div className="flex flex-wrap gap-1">
                        {api.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {testResults[api.service] && (
                      <Alert className="mt-4">
                        <AlertTriangle className="w-4 h-4" />
                        <AlertDescription className="text-xs">
                          <pre className="overflow-x-auto">
                            {JSON.stringify(testResults[api.service], null, 2)}
                          </pre>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="external" className="space-y-4">
          <h3 className="text-lg font-semibold">API บริการภายนอก</h3>
          
          <div className="grid gap-4">
            {apiStatuses.filter(api => externalAPIs.some(ext => ext.service === api.service)).map((api) => {
              const Icon = api.icon;
              const StatusIcon = getStatusIcon(api.status);
              
              return (
                <Card key={api.service} className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{api.name}</CardTitle>
                          <CardDescription>{api.description}</CardDescription>
                        </div>
                      </div>
                      <StatusIcon className={`w-5 h-5 ${getStatusColor(api.status)}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        อัพเดทล่าสุด: {new Date(api.lastChecked).toLocaleString('th-TH')}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => testSpecificAPI(api.service)}
                        disabled={checkAPIStatus.isPending}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        ทดสอบ
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <h3 className="text-lg font-semibold">ข้อมูลเรียลไทม์</h3>
          
          {realTimeData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cloud className="w-5 h-5" />
                    <span>สภาพอากาศ</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">{realTimeData.weather.temperature}°C</div>
                    <div className="text-gray-600">{realTimeData.weather.description}</div>
                    <div className="text-sm text-gray-500">
                      ความชื้น: {realTimeData.weather.humidity}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>บริการ</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>ใช้งาน</span>
                      <span className="font-semibold text-green-600">
                        {realTimeData.services.active}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>เสร็จสิ้น</span>
                      <span className="font-semibold text-blue-600">
                        {realTimeData.services.completed}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>รอดำเนินการ</span>
                      <span className="font-semibold text-yellow-600">
                        {realTimeData.services.pending}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="w-5 h-5" />
                    <span>ประชากร</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {realTimeData.population.total.toLocaleString()}
                    </div>
                    <div className="text-gray-600">
                      {realTimeData.population.households.toLocaleString()} ครัวเรือน
                    </div>
                    <div className="text-sm text-gray-500">
                      พื้นที่: {realTimeData.population.area}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>การเข้าใช้</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-green-600">
                      {realTimeData.traffic.currentUsers}
                    </div>
                    <div className="text-gray-600">ผู้ใช้ออนไลน์</div>
                    <div className="text-sm text-gray-500">
                      เวลาพีค: {realTimeData.traffic.peakTime}
                    </div>
                    <div className="text-sm text-gray-500">
                      Response: {realTimeData.traffic.avgResponseTime}ms
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
                </div>
                <p className="text-gray-500 mt-4">กำลังโหลดข้อมูลเรียลไทม์...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <h3 className="text-lg font-semibold">ทดสอบการเชื่อมต่อ</h3>
          
          <Card>
            <CardHeader>
              <CardTitle>API Testing Suite</CardTitle>
              <CardDescription>
                ทดสอบความถูกต้องและประสิทธิภาพของ API ทั้งหมด
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={checkAllAPIs} disabled={checkAPIStatus.isPending}>
                  <Shield className="w-4 h-4 mr-2" />
                  ทดสอบ Government APIs
                </Button>
                <Button onClick={checkAllAPIs} disabled={checkAPIStatus.isPending} variant="outline">
                  <Globe className="w-4 h-4 mr-2" />
                  ทดสอบ External APIs
                </Button>
                <Button onClick={updateRealTimeData} variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  รีเฟรชข้อมูล
                </Button>
              </div>

              <div className="space-y-2">
                <Label>API Response Times</Label>
                <div className="space-y-2">
                  {apiStatuses.map((api) => (
                    <div key={api.service} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{api.name}</span>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={Math.min((api.responseTime / 1000) * 100, 100)} 
                          className="w-20 h-2" 
                        />
                        <span className="text-xs text-gray-500">{api.responseTime}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {checkAPIStatus.isPending && (
                <Alert>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <AlertDescription>
                    กำลังทดสอบการเชื่อมต่อ API... กรุณารอสักครู่
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}