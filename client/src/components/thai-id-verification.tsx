import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Shield, Smartphone, Camera, QrCode, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface VerificationRequest {
  method: 'ndid' | 'dopa' | 'ekyc' | 'thaid_app';
  citizenData: {
    citizenId: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
  };
  biometricData?: {
    faceImage: string;
    livenessCheck: boolean;
    antiSpoofing: boolean;
  };
  requestId?: string;
  callbackUrl?: string;
}

interface VerificationResult {
  success: boolean;
  requestId: string;
  method: string;
  identityAssuranceLevel: 'IAL1' | 'IAL2' | 'IAL3';
  verifiedData?: {
    citizenId: string;
    firstName: string;
    lastName: string;
    isVerified: boolean;
    verificationTimestamp: string;
  };
  biometricScore?: number;
  errors?: string[];
  metadata?: {
    provider: string;
    transactionId: string;
    blockchainHash?: string;
    dopaReferenceId?: string;
  };
}

const ThaiIdVerification: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'select' | 'form' | 'verify' | 'result'>('select');
  const [selectedMethod, setSelectedMethod] = useState<VerificationRequest['method']>('ndid');
  const [formData, setFormData] = useState({
    citizenId: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
  });
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initiate verification mutation
  const initiateVerification = useMutation({
    mutationFn: async (request: VerificationRequest) => {
      const response = await fetch('/api/auth/thai-id/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (result: VerificationResult) => {
      setVerificationResult(result);
      setCurrentStep('result');
      
      if (result.success && result.method === 'ndid') {
        // Start polling for NDID results
        setIsPolling(true);
        pollVerificationStatus(result.requestId);
      }
      
      toast({
        title: result.success ? 'ยืนยันตัวตนสำเร็จ' : 'เกิดข้อผิดพลาด',
        description: result.success 
          ? `การยืนยันตัวตนผ่าน ${result.method.toUpperCase()} เรียบร้อยแล้ว`
          : result.errors?.join(', ') || 'ไม่สามารถยืนยันตัวตนได้',
        variant: result.success ? 'default' : 'destructive',
      });
    },
    onError: (error) => {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเริ่มการยืนยันตัวตนได้',
        variant: 'destructive',
      });
    },
  });

  // Generate ThaID deep link mutation
  const generateDeepLink = useMutation({
    mutationFn: async (data: { citizenId: string; requestId: string }) => {
      const response = await fetch('/api/auth/thai-id/deeplink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (result: any) => {
      if (result.deepLink) {
        window.location.href = result.deepLink;
      }
    },
  });

  // Polling for verification status
  const pollVerificationStatus = async (requestId: string) => {
    const maxAttempts = 30; // 5 minutes
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/auth/thai-id/status/${requestId}`);
        const status = await response.json();

        if (status.status === 'completed') {
          setVerificationResult(prev => prev ? { ...prev, ...status } : status);
          setIsPolling(false);
          toast({
            title: 'ยืนยันตัวตนสำเร็จ',
            description: 'การยืนยันตัวตนผ่าน NDID เสร็จสิ้นแล้ว',
          });
          return;
        }

        if (status.status === 'failed' || status.status === 'expired') {
          setIsPolling(false);
          toast({
            title: 'การยืนยันตัวตนล้มเหลว',
            description: status.message || 'กรุณาลองใหม่อีกครั้ง',
            variant: 'destructive',
          });
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000); // Check every 10 seconds
        } else {
          setIsPolling(false);
          toast({
            title: 'หมดเวลาการยืนยัน',
            description: 'กรุณาลองใหม่อีกครั้ง',
            variant: 'destructive',
          });
        }
      } catch (error) {
        setIsPolling(false);
        console.error('Error checking verification status:', error);
      }
    };

    checkStatus();
  };

  // Thai ID validation
  const validateThaiId = (id: string): boolean => {
    if (id.length !== 13) return false;
    
    const digits = id.split('').map(Number);
    const sum = digits.slice(0, 12).reduce((acc, digit, index) => acc + digit * (13 - index), 0);
    const checksum = (11 - (sum % 11)) % 10;
    
    return checksum === digits[12];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateThaiId(formData.citizenId)) {
      toast({
        title: 'เลขบัตรประชาชนไม่ถูกต้อง',
        description: 'กรุณาตรวจสอบเลขบัตรประชาชน 13 หลัก',
        variant: 'destructive',
      });
      return;
    }

    const request: VerificationRequest = {
      method: selectedMethod,
      citizenData: {
        citizenId: formData.citizenId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth || undefined,
      },
      requestId: crypto.randomUUID(),
    };

    if (selectedMethod === 'thaid_app') {
      generateDeepLink.mutate({
        citizenId: formData.citizenId,
        requestId: request.requestId!,
      });
    } else {
      setCurrentStep('verify');
      initiateVerification.mutate(request);
    }
  };

  const getMethodInfo = (method: string) => {
    switch (method) {
      case 'ndid':
        return {
          icon: Shield,
          name: 'NDID Blockchain',
          description: 'ยืนยันตัวตนผ่านระบบ Blockchain ที่ปลอดภัยสูงสุด',
          level: 'IAL3',
          color: 'bg-blue-500',
        };
      case 'dopa':
        return {
          icon: Shield,
          name: 'DOPA Digital ID',
          description: 'ยืนยันตัวตนผ่านฐานข้อมูลกรมการปกครอง',
          level: 'IAL2',
          color: 'bg-green-500',
        };
      case 'ekyc':
        return {
          icon: Camera,
          name: 'eKYC Biometric',
          description: 'ยืนยันตัวตนด้วยการสแกนใบหน้าและเอกสาร',
          level: 'IAL2',
          color: 'bg-purple-500',
        };
      case 'thaid_app':
        return {
          icon: Smartphone,
          name: 'ThaID App',
          description: 'ยืนยันตัวตนผ่านแอป ThaID บนมือถือ',
          level: 'IAL2',
          color: 'bg-orange-500',
        };
      default:
        return {
          icon: Shield,
          name: 'Unknown',
          description: '',
          level: 'IAL1',
          color: 'bg-gray-500',
        };
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'expired':
        return <AlertTriangle className="h-6 w-6 text-orange-500" />;
      default:
        return <Shield className="h-6 w-6 text-blue-500" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ยืนยันตัวตนด้วยบัตรประชาชน
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          ยืนยันตัวตนเพื่อเข้าใช้บริการออนไลน์ของ อบต.วังสามหมอ
        </p>
      </div>

      <AnimatePresence mode="wait">
        {currentStep === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle>เลือกวิธีการยืนยันตัวตน</CardTitle>
                <CardDescription>
                  กรุณาเลือกวิธีการยืนยันตัวตนที่ต้องการใช้
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(['ndid', 'dopa', 'ekyc', 'thaid_app'] as const).map((method) => {
                  const info = getMethodInfo(method);
                  const Icon = info.icon;
                  
                  return (
                    <div
                      key={method}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedMethod === method
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedMethod(method)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full ${info.color} text-white`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{info.name}</h3>
                            <Badge variant="secondary">{info.level}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {info.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <Button 
                  onClick={() => setCurrentStep('form')} 
                  className="w-full"
                  size="lg"
                >
                  ดำเนินการต่อ
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentStep === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>กรอกข้อมูลส่วนตัว</CardTitle>
                <CardDescription>
                  กรุณากรอกข้อมูลให้ตรงกับบัตรประชาชน
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="citizenId">เลขบัตรประชาชน</Label>
                    <Input
                      id="citizenId"
                      placeholder="1234567890123"
                      value={formData.citizenId}
                      onChange={(e) => setFormData(prev => ({ ...prev, citizenId: e.target.value }))}
                      maxLength={13}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">ชื่อ</Label>
                      <Input
                        id="firstName"
                        placeholder="กฤษนันทน์"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">นามสกุล</Label>
                      <Input
                        id="lastName"
                        placeholder="นำแปง"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">วันเดือนปีเกิด (ไม่บังคับ)</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep('select')}
                      className="flex-1"
                    >
                      ย้อนกลับ
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={initiateVerification.isPending || generateDeepLink.isPending}
                    >
                      {initiateVerification.isPending || generateDeepLink.isPending
                        ? 'กำลังดำเนินการ...'
                        : 'ยืนยันตัวตน'
                      }
                    </Button>
                  </div>
                </form>
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
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                  </div>
                  <h3 className="text-lg font-semibold">กำลังยืนยันตัวตน</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    กรุณารอสักครู่ ระบบกำลังตรวจสอบข้อมูลของท่าน
                  </p>
                  {isPolling && (
                    <p className="text-sm text-blue-600">
                      กำลังรอการยืนยันจาก NDID...
                    </p>
                  )}
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
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(verificationResult.success ? 'completed' : 'failed')}
                  <CardTitle>
                    {verificationResult.success ? 'ยืนยันตัวตนสำเร็จ' : 'การยืนยันตัวตนล้มเหลว'}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {verificationResult.success ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <h4 className="font-semibold text-green-800 dark:text-green-200">
                        ข้อมูลที่ยืนยันแล้ว
                      </h4>
                      <div className="mt-2 space-y-1 text-sm">
                        <p><strong>ชื่อ:</strong> {verificationResult.verifiedData?.firstName}</p>
                        <p><strong>นามสกุล:</strong> {verificationResult.verifiedData?.lastName}</p>
                        <p><strong>เลขบัตรประชาชน:</strong> {verificationResult.verifiedData?.citizenId}</p>
                        <p><strong>ระดับความน่าเชื่อถือ:</strong> {verificationResult.identityAssuranceLevel}</p>
                        {verificationResult.biometricScore && (
                          <p><strong>คะแนนชีวมาตร:</strong> {verificationResult.biometricScore}%</p>
                        )}
                      </div>
                    </div>

                    {verificationResult.metadata && (
                      <div className="text-xs text-gray-500 space-y-1">
                        <p><strong>ผู้ให้บริการ:</strong> {verificationResult.metadata.provider}</p>
                        <p><strong>Transaction ID:</strong> {verificationResult.metadata.transactionId}</p>
                        {verificationResult.metadata.blockchainHash && (
                          <p><strong>Blockchain Hash:</strong> {verificationResult.metadata.blockchainHash.slice(0, 20)}...</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <h4 className="font-semibold text-red-800 dark:text-red-200">
                      ข้อผิดพลาด
                    </h4>
                    <div className="mt-2 text-sm">
                      {verificationResult.errors?.map((error, index) => (
                        <p key={index}>• {error}</p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentStep('select');
                      setVerificationResult(null);
                      setFormData({ citizenId: '', firstName: '', lastName: '', dateOfBirth: '' });
                    }}
                    className="flex-1"
                  >
                    ยืนยันใหม่
                  </Button>
                  {verificationResult.success && (
                    <Button
                      onClick={() => window.location.href = '/'}
                      className="flex-1"
                    >
                      เข้าสู่ระบบ
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThaiIdVerification;