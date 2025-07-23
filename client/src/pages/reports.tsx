import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  PieChart, 
  BarChart3, 
  Download,
  TrendingUp,
  DollarSign,
  Users,
  FileBarChart
} from "lucide-react";

export default function Reports() {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: reports } = useQuery({
    queryKey: ["/api/reports", selectedCategory !== "all" ? selectedCategory : undefined, parseInt(selectedYear)],
  });

  const { data: serviceStats } = useQuery({
    queryKey: ["/api/services/stats"],
  });

  const financeReport = reports?.find((report: any) => report.category === "finance");
  const serviceReport = reports?.find((report: any) => report.category === "services");

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

  const CircularProgress = ({ percentage, color, size = 80 }: { percentage: number; color: string; size?: number }) => {
    const radius = (size - 8) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg 
          className="transform -rotate-90" 
          width={size} 
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            initial={{ strokeDasharray: "0 1000" }}
            animate={{ strokeDasharray }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-800 dark:text-white">
            {percentage}%
          </span>
        </div>
      </div>
    );
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
        รายงานและสถิติ
      </motion.h2>
      
      {/* Filter Options */}
      <motion.div variants={itemVariants}>
        <Card className="glass-effect p-4 border-0">
          <div className="grid grid-cols-2 gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-white/20">
                <SelectValue placeholder="เลือกปี" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">ปี 2567</SelectItem>
                <SelectItem value="2023">ปี 2566</SelectItem>
                <SelectItem value="2022">ปี 2565</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-white/20">
                <SelectValue placeholder="ประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="finance">การเงิน</SelectItem>
                <SelectItem value="services">บริการ</SelectItem>
                <SelectItem value="community">ชุมชน</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      </motion.div>

      {/* Financial Overview */}
      {financeReport && (
        <motion.div variants={itemVariants}>
          <Card className="glass-effect p-4 border-0">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
              <PieChart className="w-5 h-5 text-green-600 mr-2" />
              ภาพรวมการเงิน
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(financeReport.data.income / 1000000).toFixed(1)}M
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  รายได้ (บาท)
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(financeReport.data.expenses / 1000000).toFixed(1)}M
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  รายจ่าย (บาท)
                </p>
              </div>
            </div>
            
            {/* Progress Rings */}
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <CircularProgress 
                  percentage={Math.round((financeReport.data.income / (financeReport.data.income + financeReport.data.expenses)) * 100)} 
                  color="hsl(142, 71%, 45%)" 
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">รายได้</p>
              </div>
              <div className="text-center">
                <CircularProgress 
                  percentage={Math.round((financeReport.data.expenses / (financeReport.data.income + financeReport.data.expenses)) * 100)} 
                  color="hsl(207, 90%, 54%)" 
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">รายจ่าย</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Service Statistics */}
      {serviceReport && (
        <motion.div variants={itemVariants}>
          <Card className="glass-effect p-4 border-0">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
              สถิติการใช้บริการ
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">ชำระภาษี</span>
                <div className="flex items-center space-x-2">
                  <Progress 
                    value={85} 
                    className="w-20 h-2"
                  />
                  <span className="text-sm font-medium text-gray-800 dark:text-white min-w-[2rem]">
                    {serviceStats?.tax || 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">ขออนุญาต</span>
                <div className="flex items-center space-x-2">
                  <Progress 
                    value={65} 
                    className="w-20 h-2"
                  />
                  <span className="text-sm font-medium text-gray-800 dark:text-white min-w-[2rem]">
                    {serviceStats?.permit || 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">แจ้งปัญหา</span>
                <div className="flex items-center space-x-2">
                  <Progress 
                    value={45} 
                    className="w-20 h-2"
                  />
                  <span className="text-sm font-medium text-gray-800 dark:text-white min-w-[2rem]">
                    {serviceStats?.complaint || 0}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-lg font-bold text-gray-800 dark:text-white">
                  {serviceReport.data.completion_rate * 100}%
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">อัตราสำเร็จ</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-lg font-bold text-gray-800 dark:text-white">
                  {serviceReport.data.total_services}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">บริการทั้งหมด</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="text-lg font-bold text-gray-800 dark:text-white">
                  {serviceReport.data.satisfaction_score}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">คะแนนความพึงพอใจ</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Download Reports */}
      <motion.div variants={itemVariants}>
        <Card className="glass-effect p-4 border-0">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
            ดาวน์โหลดรายงาน
          </h3>
          <div className="space-y-3">
            <Button 
              className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-600 border-green-200 dark:border-green-800"
              variant="outline"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <FileBarChart className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium text-sm">รายงานการเงิน</div>
                    <div className="text-xs opacity-75">Financial Report (PDF)</div>
                  </div>
                </div>
                <Download className="w-4 h-4" />
              </div>
            </Button>
            <Button 
              className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 border-blue-200 dark:border-blue-800"
              variant="outline"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium text-sm">รายงานการบริการ</div>
                    <div className="text-xs opacity-75">Service Report (Excel)</div>
                  </div>
                </div>
                <Download className="w-4 h-4" />
              </div>
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
