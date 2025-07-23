import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Calendar, 
  Bookmark, 
  Share2,
  Eye 
} from "lucide-react";

export default function Announcements() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);

  const { data: announcements } = useQuery({
    queryKey: ["/api/announcements", selectedCategory !== "all" ? selectedCategory : undefined],
  });

  const toggleBookmark = (id: number) => {
    setBookmarkedIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const shareAnnouncement = (announcement: any) => {
    if (navigator.share) {
      navigator.share({
        title: announcement.title,
        text: announcement.summary,
        url: window.location.href
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(`${announcement.title}\n${announcement.summary}\n${window.location.href}`);
    }
  };

  const emergencyAnnouncements = announcements?.filter((a: any) => a.category === "emergency") || [];
  const regularAnnouncements = announcements?.filter((a: any) => a.category !== "emergency") || [];

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

  const categoryTabs = [
    { id: "all", label: "ทั้งหมด" },
    { id: "news", label: "ข่าวสาร" },
    { id: "events", label: "กิจกรรม" },
    { id: "emergency", label: "เร่งด่วน" },
  ];

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
        ประกาศและข่าวสาร
      </motion.h2>
      
      {/* Emergency Alerts */}
      {emergencyAnnouncements.length > 0 && (
        <motion.div variants={itemVariants}>
          {emergencyAnnouncements.map((announcement: any) => (
            <motion.div
              key={announcement.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4"
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">
                    {announcement.title}
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                    {announcement.summary}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {new Date(announcement.publishedAt).toLocaleString('th-TH')}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Filter Tabs */}
      <motion.div variants={itemVariants}>
        <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
          {categoryTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={selectedCategory === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(tab.id)}
              className={`flex-1 text-xs transition-all duration-200 ${
                selectedCategory === tab.id
                  ? "bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Announcements List */}
      <motion.div className="space-y-4" variants={itemVariants}>
        {regularAnnouncements
          .filter((announcement: any) => 
            selectedCategory === "all" || announcement.category === selectedCategory
          )
          .map((announcement: any, index: number) => (
            <motion.div
              key={announcement.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-effect rounded-xl overflow-hidden border-0">
                {announcement.imageUrl && (
                  <div className="relative">
                    <img 
                      src={announcement.imageUrl} 
                      alt={announcement.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleBookmark(announcement.id)}
                        className="glass-effect rounded-lg p-2 text-white hover:bg-white/20"
                      >
                        <Bookmark 
                          className={`w-4 h-4 ${
                            bookmarkedIds.includes(announcement.id) 
                              ? "fill-current text-yellow-400" 
                              : ""
                          }`} 
                        />
                      </Button>
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
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
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                        {announcement.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {announcement.summary || announcement.content}
                      </p>
                    </div>
                    {!announcement.imageUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleBookmark(announcement.id)}
                        className="ml-3 p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Bookmark 
                          className={`w-4 h-4 ${
                            bookmarkedIds.includes(announcement.id) 
                              ? "fill-current text-yellow-500" 
                              : ""
                          }`} 
                        />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(announcement.publishedAt).toLocaleDateString('th-TH')}
                      </div>
                      <div className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {Math.floor(Math.random() * 1000) + 100}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => shareAnnouncement(announcement)}
                        className="text-xs text-gray-600 dark:text-gray-400 hover:text-primary font-medium p-1"
                      >
                        <Share2 className="w-3 h-3 mr-1" />
                        แชร์
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-xs text-primary font-medium p-1"
                      >
                        อ่านเต็ม
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
      </motion.div>

      {/* Load More */}
      {regularAnnouncements.length > 0 && (
        <motion.div 
          className="text-center"
          variants={itemVariants}
        >
          <Button 
            variant="outline"
            className="glass-effect px-6 py-3 text-primary border-primary/20 hover:bg-primary/10"
          >
            โหลดเพิ่มเติม
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
