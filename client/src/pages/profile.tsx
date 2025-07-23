import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import { 
  User, 
  Edit, 
  CheckCircle, 
  Fingerprint, 
  Bell, 
  Globe, 
  Moon, 
  Sun,
  CreditCard,
  FileText,
  AlertTriangle,
  LogOut,
  Camera,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
  });
  const [settings, setSettings] = useState({
    notifications: true,
    language: "th",
  });

  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: citizen, isLoading } = useQuery({
    queryKey: ["/api/citizens/current"],
    onSuccess: (data) => {
      setEditForm({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email || "",
        address: data.address,
      });
    },
  });

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
    select: (data) => data?.slice(0, 5) || [],
  });

  const updateCitizenMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest("PATCH", `/api/citizens/${citizen.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/citizens/current"] });
      setIsEditing(false);
      toast({
        title: "อัพเดทสำเร็จ",
        description: "ข้อมูลโปรไฟล์ได้รับการอัพเดทเรียบร้อยแล้ว",
      });
    },
    onError: () => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัพเดทข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateCitizenMutation.mutate(editForm);
  };

  const handleBiometricSetup = () => {
    toast({
      title: "ตั้งค่าลายนิ้วมือ",
      description: "กำลังเปิดระบบสแกนลายนิ้วมือ",
    });
  };

  const handleLogout = () => {
    toast({
      title: "ออกจากระบบ",
      description: "กำลังออกจากระบบ...",
    });
    // Implement logout logic here
  };

  const toggleNotifications = () => {
    setSettings(prev => ({ ...prev, notifications: !prev.notifications }));
    toast({
      title: settings.notifications ? "ปิดการแจ้งเตือน" : "เปิดการแจ้งเตือน",
      description: settings.notifications ? "ระบบจะหยุดส่งการแจ้งเตือน" : "ระบบจะส่งการแจ้งเตือนให้คุณ",
    });
  };

  const changeLanguage = (language: string) => {
    setSettings(prev => ({ ...prev, language }));
    toast({
      title: "เปลี่ยนภาษา",
      description: language === "th" ? "เปลี่ยนเป็นภาษาไทยแล้ว" : "Changed to English",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CreditCard className="w-4 h-4 text-green-600" />;
      case "processing":
        return <FileText className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "สำเร็จ";
      case "processing":
        return "กำลังดำเนินการ";
      default:
        return "รอดำเนินการ";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-600 border-green-200";
      case "processing":
        return "bg-blue-500/20 text-blue-600 border-blue-200";
      default:
        return "bg-yellow-500/20 text-yellow-600 border-yellow-200";
    }
  };

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

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-effect rounded-xl p-4 h-20 bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    );
  }

  if (!citizen) {
    return (
      <div className="p-4 text-center">
        <Card className="glass-effect p-8 border-0">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            ไม่พบข้อมูลผู้ใช้
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            กรุณาเข้าสู่ระบบอีกครั้ง
          </p>
        </Card>
      </div>
    );
  }

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
        โปรไฟล์
      </motion.h2>
      
      {/* User Profile Card */}
      <motion.div variants={itemVariants}>
        <Card className="glass-effect p-4 border-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150" 
                  alt="User Profile" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white p-0 hover:bg-primary/80"
                >
                  <Camera className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={editForm.firstName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="ชื่อ"
                        className="text-sm"
                      />
                      <Input
                        value={editForm.lastName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="นามสกุล"
                        className="text-sm"
                      />
                    </div>
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="เบอร์โทรศัพท์"
                      className="text-sm"
                    />
                    <Input
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="อีเมล"
                      className="text-sm"
                    />
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      {citizen.firstName} {citizen.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ID: {citizen.thaiId}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {citizen.phone}
                      </div>
                      {citizen.email && (
                        <div className="flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {citizen.email}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="text-xs"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateCitizenMutation.isPending}
                    className="text-xs bg-green-600 hover:bg-green-700"
                  >
                    {updateCitizenMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Address */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            {isEditing ? (
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                  ที่อยู่
                </Label>
                <Input
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="ที่อยู่"
                  className="text-sm"
                />
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {citizen.address}
                </p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Verification Status */}
      <motion.div variants={itemVariants}>
        <Card className="glass-effect p-4 border-0">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
            สถานะการยืนยันตัวตน
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm text-gray-800 dark:text-white">
                  บัตรประชาชน
                </span>
              </div>
              <Badge className="text-xs bg-green-500/20 text-green-600 border-green-200">
                ยืนยันแล้ว
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm text-gray-800 dark:text-white">
                  หมายเลขโทรศัพท์
                </span>
              </div>
              <Badge className="text-xs bg-green-500/20 text-green-600 border-green-200">
                ยืนยันแล้ว
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Fingerprint className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="text-sm text-gray-800 dark:text-white">
                  ลายนิ้วมือ
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBiometricSetup}
                className="text-xs bg-yellow-500/20 text-yellow-600 border-yellow-200 hover:bg-yellow-500/30"
              >
                ตั้งค่า
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Settings */}
      <motion.div variants={itemVariants}>
        <Card className="glass-effect p-4 border-0">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
            การตั้งค่า
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-800 dark:text-white">
                  การแจ้งเตือน
                </span>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={toggleNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {theme === "light" ? (
                  <Sun className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Moon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
                <span className="text-sm text-gray-800 dark:text-white">
                  โหมดมืด
                </span>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-800 dark:text-white">
                  ภาษา / Language
                </span>
              </div>
              <Select value={settings.language} onValueChange={changeLanguage}>
                <SelectTrigger className="w-20 h-8 text-xs bg-white/50 dark:bg-gray-700/50 border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="th">ไทย</SelectItem>
                  <SelectItem value="en">EN</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Service History */}
      <motion.div variants={itemVariants}>
        <Card className="glass-effect p-4 border-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-white">
              ประวัติการใช้บริการ
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary"
            >
              ดูทั้งหมด
            </Button>
          </div>
          <div className="space-y-3">
            {services?.map((service: any, index: number) => (
              <motion.div
                key={service.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    service.status === 'completed' 
                      ? 'bg-green-500/20' 
                      : service.status === 'processing'
                      ? 'bg-blue-500/20'
                      : 'bg-yellow-500/20'
                  }`}>
                    {getStatusIcon(service.status)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-white">
                      {service.title}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(service.createdAt).toLocaleDateString('th-TH')}
                    </div>
                  </div>
                </div>
                <Badge className={`text-xs ${getStatusColor(service.status)}`}>
                  {getStatusText(service.status)}
                </Badge>
              </motion.div>
            ))}
            
            {!services?.length && (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ยังไม่มีประวัติการใช้บริการ
                </p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Logout */}
      <motion.div variants={itemVariants}>
        <Card className="glass-effect p-4 border-0">
          <Button
            onClick={handleLogout}
            className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800"
            variant="outline"
          >
            <LogOut className="w-4 h-4 mr-2" />
            ออกจากระบบ
          </Button>
        </Card>
      </motion.div>
    </motion.div>
  );
}
