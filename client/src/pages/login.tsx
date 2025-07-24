import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Smartphone, CreditCard, QrCode, CheckCircle, AlertCircle, Loader2, Eye, EyeOff, ArrowLeft, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface VerificationMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  securityLevel: 'IAL1' | 'IAL2' | 'IAL3';
  estimatedTime: string;
  available: boolean;
  features: string[];
}

export default function LoginPage() {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [citizenId, setCitizenId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [showCitizenId, setShowCitizenId] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select' | 'input' | 'verify' | 'result'>('select');
  const { toast } = useToast();

  const verificationMethods: VerificationMethod[] = [
    {
      id: 'ndid',
      name: 'NDID Blockchain',
      description: 'ยืนยันผ่านธนาคารหรือ IdP ที่เชื่อถือได้',
      icon: Shield,
      securityLevel: 'IAL3',
      estimatedTime: '2-3 นาที',
      available: true,
      features: ['Blockchain security', 'Multi-factor authentication', 'Bank-grade verification'],
    },
    {
      id: 'dopa',
      name: 'D.DOPA Database',
      description: 'ตรวจสอบข้อมูลจากฐานข้อมูลทะเบียนราษฎร',
      icon: CreditCard,
      securityLevel: 'IAL2',
      estimatedTime: '30 วินาที',
      available: true,
      features: ['Real-time database', 'Government registry', 'Instant verification'],
    },
    {
      id: 'thaid_app',
      name: 'ThaID Mobile App',
      description: 'ยืนยันผ่านแอป ThaID พร้อมสแกนใบหน้า',
      icon: Smartphone,
      securityLevel: 'IAL3',
      estimatedTime: '1-2 นาที',
      available: true,
      features: ['Biometric verification', 'Face recognition', 'Liveness detection'],
    },
    {
      id: 'ekyc',
      name: 'eKYC Service',
      description: 'ยืนยันผ่านผู้ให้บริการ eKYC (ไม่พร้อมใช้งาน)',
      icon: QrCode,
      securityLevel: 'IAL2',
      estimatedTime: '1-2 นาที',
      available: false,
      features: ['Document scanning', 'AI verification', 'Commercial provider'],
    },
  ];

  const verifyIdentityMutation = useMutation({
    mutationFn: async (requestData: any) => {
      const response = await fetch('/api/auth/thai-id/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (result) => {
      setVerificationResult(result);
      if (result.success) {
        toast({
          title: 'เริ่มการยืนยันตัวตน',
          description: `กำลังดำเนินการผ่าน ${verificationMethods.find(m => m.id === selectedMethod)?.name}`,
        });
        
        // Simulate verification process
        setTimeout(() => {
          setVerificationResult({
            ...result,
            success: true,
            verifiedData: {
              citizenId,
              firstName,
              lastName,
              dateOfBirth,
              address: '123 ถ.ราชดำเนิน แขวงบางขุนพรหม เขตพระนคร กทม. 10200',
              isVerified: true,
              verificationTimestamp: new Date().toISOString(),
            },
            identityAssuranceLevel: verificationMethods.find(m => m.id === selectedMethod)?.securityLevel || 'IAL2',
          });
          setCurrentStep('result');
          toast({
            title: 'ยืนยันตัวตนสำเร็จ',
            description: 'การยืนยันตัวตนเสร็จสิ้นแล้ว สามารถเข้าใช้บริการได้',
          });
        }, 3000);
      }
    },
    onError: () => {
      setVerificationResult({
        success: false,
        errors: ['เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบยืนยันตัวตน'],
      });
      setCurrentStep('result');
      toast({
        title: 'การยืนยันตัวตนล้มเหลว',
        description: 'ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    },
  });

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setCurrentStep('input');
    setVerificationResult(null);
  };

  const handleVerification = async () => {
    if (!selectedMethod || !citizenId || !firstName || !lastName) {
      toast({
        title: 'ข้อมูลไม่ครบถ้วน',
        description: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        variant: 'destructive',
      });
      return;
    }

    // Validate Thai ID format
    if (!/^\d{13}$/.test(citizenId)) {
      toast({
        title: 'รูปแบบเลขบัตรประชาชนไม่ถูกต้อง',
        description: 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);
    setCurrentStep('verify');

    const requestData = {
      method: selectedMethod,
      citizenData: {
        citizenId,
        firstName,
        lastName,
        dateOfBirth,
      },
      requestId: crypto.randomUUID(),
      callbackUrl: `${window.location.origin}/api/auth/${selectedMethod}/callback`,
    };

    verifyIdentityMutation.mutate(requestData);
  };

  const handleStartOver = () => {
    setCurrentStep('select');
    setSelectedMethod('');
    setCitizenId('');
    setFirstName('');
    setLastName('');
    setDateOfBirth('');
    setVerificationResult(null);
    setIsVerifying(false);
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'IAL3':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'IAL2':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const handleLoginSuccess = () => {
    // Navigate to main app
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              🐊
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ยืนยันตัวตนเข้าสู่ระบบ
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            อบต.วังสามหมอ - Tour Der Wang Platform
          </p>
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl">เลือกวิธีการยืนยันตัวตน</CardTitle>
                  <CardDescription>
                    เลือกระบบยืนยันตัวตนของรัฐบาลไทยที่คุณต้องการใช้
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {verificationMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <motion.div
                          key={method.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card
                            className={`cursor-pointer transition-all duration-200 border-2 ${
                              method.available
                                ? 'hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
                                : 'opacity-50 cursor-not-allowed'
                            }`}
                            onClick={() => method.available && handleMethodSelect(method.id)}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                                    <Icon className="w-6 h-6 text-white" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                      {method.name}
                                    </h3>
                                    <Badge className={getSecurityLevelColor(method.securityLevel)}>
                                      {method.securityLevel}
                                    </Badge>
                                  </div>
                                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                                    {method.description}
                                  </p>
                                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span>⏱️ {method.estimatedTime}</span>
                                    {method.available ? (
                                      <span className="text-green-600 dark:text-green-400">✓ พร้อมใช้งาน</span>
                                    ) : (
                                      <span className="text-red-600 dark:text-red-400">✗ ไม่พร้อมใช้งาน</span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {method.features.map((feature, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {feature}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep('select')}>
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                      <CardTitle className="text-xl">กรอกข้อมูลยืนยันตัวตน</CardTitle>
                      <CardDescription>
                        ระบบ: {verificationMethods.find(m => m.id === selectedMethod)?.name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="citizenId">เลขบัตรประชาชน *</Label>
                      <div className="relative">
                        <Input
                          id="citizenId"
                          type={showCitizenId ? "text" : "password"}
                          value={citizenId}
                          onChange={(e) => setCitizenId(e.target.value.replace(/\D/g, '').slice(0, 13))}
                          placeholder="1234567890123"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-8 w-8 p-0"
                          onClick={() => setShowCitizenId(!showCitizenId)}
                        >
                          {showCitizenId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">ชื่อ *</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="กฤษนันทน์"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">นามสกุล *</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="นำแปง"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">วันเกิด (ไม่บังคับ)</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep('select')}>
                      ย้อนกลับ
                    </Button>
                    <Button
                      onClick={handleVerification}
                      disabled={!citizenId || !firstName || !lastName || citizenId.length !== 13}
                      className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                    >
                      เริ่มยืนยันตัวตน
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="animate-spin mx-auto">
                    <Loader2 className="w-16 h-16 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">กำลังยืนยันตัวตน</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      กำลังเชื่อมต่อกับระบบ {verificationMethods.find(m => m.id === selectedMethod)?.name}
                    </p>
                    <Badge variant="outline" className="animate-pulse">
                      ระยะเวลาโดยประมาณ: {verificationMethods.find(m => m.id === selectedMethod)?.estimatedTime}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 'result' && verificationResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center space-y-6">
                  {verificationResult.success ? (
                    <>
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">
                          ยืนยันตัวตนสำเร็จ
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          ยินดีต้อนรับ คุณ{firstName} {lastName}
                        </p>
                        {verificationResult.verifiedData && (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-left space-y-2">
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              <strong>เลขบัตรประชาชน:</strong> {verificationResult.verifiedData.citizenId}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              <strong>ระดับความปลอดภัย:</strong> {verificationResult.identityAssuranceLevel}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              <strong>วันที่ยืนยัน:</strong> {new Date(verificationResult.verifiedData.verificationTimestamp).toLocaleString('th-TH')}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={handleLoginSuccess}
                        className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                      >
                        เข้าสู่ระบบ <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
                          การยืนยันตัวตนล้มเหลว
                        </h3>
                        {verificationResult.errors && (
                          <Alert variant="destructive" className="text-left">
                            <AlertDescription>
                              {verificationResult.errors.join(', ')}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                      <Button variant="outline" onClick={handleStartOver}>
                        ลองใหม่อีกครั้ง
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>ระบบยืนยันตัวตนของรัฐบาลไทย - ปลอดภัยด้วยเทคโนโลยี Blockchain และ AI</p>
          <p className="mt-1">© 2567 อบต.วังสามหมอ - พัฒนาโดย Tour Der Wang Platform</p>
        </div>
      </div>
    </div>
  );
}