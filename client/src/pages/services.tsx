import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Coins, 
  File, 
  Smartphone, 
  ChevronRight,
  QrCode,
  IdCard,
  Building,
  Store,
  CreditCard,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Services() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({
    title: "",
    description: "",
    amount: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
  });

  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: any) => {
      const response = await apiRequest("POST", "/api/services", serviceData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setSelectedService(null);
      setServiceForm({ title: "", description: "", amount: "" });
      toast({
        title: "คำขอสำเร็จ",
        description: `รหัสติดตาม: ${data.trackingId}`,
      });
    },
    onError: () => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งคำขอได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    },
  });

  const generateQrMutation = useMutation({
    mutationFn: async (qrData: any) => {
      const response = await apiRequest("POST", "/api/qr/generate", qrData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "QR Code สร้างสำเร็จ",
        description: `รหัสติดตาม: ${data.service.trackingId}`,
      });
    },
  });

  const handleServiceSubmit = (serviceType: string) => {
    if (!serviceForm.title.trim()) {
      toast({
        title: "กรุณากรอกข้อมูล",
        description: "กรุณากรอกหัวข้อบริการ",
        variant: "destructive",
      });
      return;
    }

    createServiceMutation.mutate({
      citizenId: 1,
      serviceType,
      title: serviceForm.title,
      description: serviceForm.description,
      amount: serviceForm.amount ? parseInt(serviceForm.amount) * 100 : null, // Convert to satang
    });
  };

  const handleQrGenerate = () => {
    generateQrMutation.mutate({
      serviceType: "payment",
      amount: serviceForm.amount ? parseInt(serviceForm.amount) * 100 : 10000,
      description: "QR Code Payment",
    });
  };

  const handleIdScan = () => {
    toast({
      title: "สแกนบัตรประชาชน",
      description: "กำลังเปิดกล้องสำหรับสแกนบัตรประชาชน",
    });
  };

  const filteredServices = services?.filter((service: any) => 
    service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
      <motion.h2 
        className="text-xl font-bold text-gray-800 dark:text-white"
        variants={itemVariants}
      >
        บริการประชาชน
      </motion.h2>
      
      {/* Search and Filter */}
      <motion.div variants={itemVariants}>
        <Card className="glass-effect p-4 border-0">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="ค้นหาบริการ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/50 dark:bg-gray-700/50 border-white/20"
            />
          </div>
        </Card>
      </motion.div>

      {/* Service Categories */}
      <motion.div className="grid grid-cols-1 gap-4" variants={itemVariants}>
        
        {/* Tax Services */}
        <Card className="glass-effect p-4 border-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center">
              <Coins className="w-5 h-5 text-green-600 mr-2" />
              บริการภาษี
            </h3>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => setSelectedService("property-tax")}
              className="p-3 h-auto text-left justify-start bg-white/50 dark:bg-gray-700/50 border-white/20"
            >
              <div>
                <div className="font-medium text-sm text-gray-800 dark:text-white">
                  ภาษีบ้านและที่ดิน
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Property Tax
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedService("signage-tax")}
              className="p-3 h-auto text-left justify-start bg-white/50 dark:bg-gray-700/50 border-white/20"
            >
              <div>
                <div className="font-medium text-sm text-gray-800 dark:text-white">
                  ภาษีป้าย
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Signage Tax
                </div>
              </div>
            </Button>
          </div>
        </Card>

        {/* Permit Services */}
        <Card className="glass-effect p-4 border-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center">
              <File className="w-5 h-5 text-blue-600 mr-2" />
              การขออนุญาต
            </h3>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => setSelectedService("building-permit")}
              className="w-full p-3 h-auto text-left justify-start bg-white/50 dark:bg-gray-700/50 border-white/20"
            >
              <Building className="w-4 h-4 mr-2 text-blue-600" />
              <div>
                <div className="font-medium text-sm text-gray-800 dark:text-white">
                  ใบอนุญาตก่อสร้าง
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Building Permit
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedService("business-permit")}
              className="w-full p-3 h-auto text-left justify-start bg-white/50 dark:bg-gray-700/50 border-white/20"
            >
              <Store className="w-4 h-4 mr-2 text-blue-600" />
              <div>
                <div className="font-medium text-sm text-gray-800 dark:text-white">
                  ใบอนุญาตประกอบกิจการ
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Business License
                </div>
              </div>
            </Button>
          </div>
        </Card>

        {/* Digital Services */}
        <Card className="glass-effect p-4 border-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center">
              <Smartphone className="w-5 h-5 text-purple-600 mr-2" />
              บริการดิจิทัล
            </h3>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={handleQrGenerate}
              disabled={generateQrMutation.isPending}
              className="w-full p-3 h-auto text-left justify-between bg-white/50 dark:bg-gray-700/50 border-white/20"
            >
              <div className="flex items-center">
                <QrCode className="w-4 h-4 mr-2 text-purple-600" />
                <div>
                  <div className="font-medium text-sm text-gray-800 dark:text-white">
                    สร้าง QR Code
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Quick Payment
                  </div>
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={handleIdScan}
              className="w-full p-3 h-auto text-left justify-between bg-white/50 dark:bg-gray-700/50 border-white/20"
            >
              <div className="flex items-center">
                <IdCard className="w-4 h-4 mr-2 text-purple-600" />
                <div>
                  <div className="font-medium text-sm text-gray-800 dark:text-white">
                    สแกนบัตรประชาชน
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    ID Card Scanner
                  </div>
                </div>
              </div>
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Service Form Modal */}
      {selectedService && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedService(null)}
        >
          <Card 
            className="w-full max-w-md bg-white dark:bg-gray-800 border-0 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-2">
                {selectedService.includes('tax') ? (
                  <CreditCard className="w-5 h-5 text-green-600" />
                ) : (
                  <FileText className="w-5 h-5 text-blue-600" />
                )}
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {selectedService === "property-tax" && "ชำระภาษีบ้านและที่ดิน"}
                  {selectedService === "signage-tax" && "ชำระภาษีป้าย"}
                  {selectedService === "building-permit" && "ขออนุญาตก่อสร้าง"}
                  {selectedService === "business-permit" && "ขออนุญาตประกอบกิจการ"}
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    หัวข้อ
                  </label>
                  <Input
                    value={serviceForm.title}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="กรอกหัวข้อบริการ"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    รายละเอียด
                  </label>
                  <Textarea
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="กรอกรายละเอียดเพิ่มเติม"
                    className="mt-1"
                    rows={3}
                  />
                </div>
                
                {selectedService.includes('tax') && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      จำนวนเงิน (บาท)
                    </label>
                    <Input
                      type="number"
                      value={serviceForm.amount}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedService(null)}
                  className="flex-1"
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={() => handleServiceSubmit(selectedService.split('-')[0])}
                  disabled={createServiceMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {createServiceMutation.isPending ? "กำลังส่ง..." : "ส่งคำขอ"}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Recent Requests */}
      <motion.div variants={itemVariants}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          คำขอล่าสุด
        </h3>
        <div className="space-y-3">
          {filteredServices.map((service: any, index: number) => (
            <motion.div
              key={service.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-effect p-4 border-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-white text-sm">
                      {service.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {service.trackingId}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      สร้างเมื่อ: {new Date(service.createdAt).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      className={`text-xs mb-2 ${
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
                        : 'รอตรวจสอบ'
                      }
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="block text-xs text-green-600 font-medium"
                    >
                      ติดตาม
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
