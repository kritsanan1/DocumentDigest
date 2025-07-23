// Application constants
export const APP_CONFIG = {
  name: "LocalGov Thailand",
  version: "1.0.0",
  description: "ระบบบริการประชาชนออนไลน์ อบต.วังสามหมอ",
  organization: "อบต.วังสามหมอ",
  branding: {
    tourDerWang: "Tour Der Wang",
    primaryColor: "hsl(142, 71%, 45%)", // Thai government green
    secondaryColor: "hsl(207, 90%, 54%)", // Government blue
    accentColor: "hsl(25, 95%, 53%)", // Crocodile orange
  },
} as const;

// API endpoints
export const API_ENDPOINTS = {
  citizens: {
    current: "/api/citizens/current",
    update: (id: number) => `/api/citizens/${id}`,
  },
  services: {
    list: "/api/services",
    create: "/api/services",
    get: (id: number) => `/api/services/${id}`,
    update: (id: number) => `/api/services/${id}`,
    track: (trackingId: string) => `/api/services/track/${trackingId}`,
    stats: "/api/services/stats",
  },
  reports: {
    list: "/api/reports",
  },
  announcements: {
    list: "/api/announcements",
    get: (id: number) => `/api/announcements/${id}`,
  },
  notifications: {
    list: "/api/notifications",
    markRead: (id: number) => `/api/notifications/${id}/read`,
  },
  auth: {
    verifyThaiId: "/api/thai-id/verify",
  },
  qr: {
    generate: "/api/qr/generate",
  },
} as const;

// Service types
export const SERVICE_TYPES = {
  tax: {
    id: "tax",
    title: "ภาษี",
    englishTitle: "Tax",
    icon: "CreditCard",
    color: "green",
    subcategories: {
      property: {
        id: "property-tax",
        title: "ภาษีบ้านและที่ดิน",
        englishTitle: "Property Tax",
      },
      signage: {
        id: "signage-tax",
        title: "ภาษีป้าย",
        englishTitle: "Signage Tax",
      },
    },
  },
  permit: {
    id: "permit",
    title: "ใบอนุญาต",
    englishTitle: "Permit",
    icon: "FileContract",
    color: "blue",
    subcategories: {
      building: {
        id: "building-permit",
        title: "ใบอนุญาตก่อสร้าง",
        englishTitle: "Building Permit",
      },
      business: {
        id: "business-permit",
        title: "ใบอนุญาตประกอบกิจการ",
        englishTitle: "Business License",
      },
    },
  },
  complaint: {
    id: "complaint",
    title: "แจ้งปัญหา",
    englishTitle: "Report Issue",
    icon: "AlertTriangle",
    color: "yellow",
  },
  qr: {
    id: "qr",
    title: "QR Code",
    englishTitle: "QR Code",
    icon: "QrCode",
    color: "purple",
  },
} as const;

// Status types
export const STATUS_TYPES = {
  pending: {
    id: "pending",
    title: "รอดำเนินการ",
    englishTitle: "Pending",
    color: "yellow",
    icon: "Clock",
  },
  processing: {
    id: "processing",
    title: "กำลังดำเนินการ",
    englishTitle: "Processing",
    color: "blue",
    icon: "TrendingUp",
  },
  completed: {
    id: "completed",
    title: "สำเร็จ",
    englishTitle: "Completed",
    color: "green",
    icon: "CheckCircle",
  },
  rejected: {
    id: "rejected",
    title: "ถูกปฏิเสธ",
    englishTitle: "Rejected",
    color: "red",
    icon: "XCircle",
  },
} as const;

// Announcement categories
export const ANNOUNCEMENT_CATEGORIES = {
  news: {
    id: "news",
    title: "ข่าวสาร",
    englishTitle: "News",
    color: "green",
    icon: "Newspaper",
  },
  events: {
    id: "events",
    title: "กิจกรรม",
    englishTitle: "Events",
    color: "purple",
    icon: "Calendar",
  },
  emergency: {
    id: "emergency",
    title: "เร่งด่วน",
    englishTitle: "Emergency",
    color: "red",
    icon: "AlertTriangle",
  },
} as const;

// Report categories
export const REPORT_CATEGORIES = {
  finance: {
    id: "finance",
    title: "การเงิน",
    englishTitle: "Finance",
    icon: "PieChart",
  },
  services: {
    id: "services",
    title: "บริการ",
    englishTitle: "Services",
    icon: "BarChart3",
  },
  community: {
    id: "community",
    title: "ชุมชน",
    englishTitle: "Community",
    icon: "Users",
  },
} as const;

// Language options
export const LANGUAGES = {
  th: {
    code: "th",
    name: "ไทย",
    flag: "🇹🇭",
  },
  en: {
    code: "en",
    name: "English",
    flag: "🇺🇸",
  },
} as const;

// Thai ID validation
export const THAI_ID_REGEX = /^[0-9]{13}$/;

// Phone number validation (Thai format)
export const THAI_PHONE_REGEX = /^(0[6-9]\d{8}|0[2-5]\d{7})$/;

// File upload limits
export const FILE_UPLOAD = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
} as const;

// WebSocket configuration
export const WEBSOCKET_CONFIG = {
  reconnectInterval: 5000, // 5 seconds
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000, // 30 seconds
} as const;

// Thai provinces for address validation
export const THAI_PROVINCES = [
  "กรุงเทพมหานคร",
  "สมุทรปราการ",
  "นนทบุรี",
  "ปทุมธานี",
  "พระนครศรีอยุธยา",
  "อ่างทอง",
  "ลพบุรี",
  "สิงห์บุรี",
  "ชัยนาท",
  "สระบุรี",
  "ชลบุรี",
  "ระยอง",
  "จันทบุรี",
  "ตราด",
  "ฉะเชิงเทรา",
  "ปราจีนบุรี",
  "นครนายก",
  "สระแก้ว",
  "นครราชสีมา",
  "บุรีรัมย์",
  "สุรินทร์",
  "ศรีสะเกษ",
  "อุบลราชธานี",
  "ยโสธร",
  "ชัยภูมิ",
  "อำนาจเจริญ",
  "หนองบัวลำภู",
  "ขอนแก่น",
  "อุดรธานี",
  "เลย",
  "หนองคาย",
  "มหาสารคาม",
  "ร้อยเอ็ด",
  "กาฬสินธุ์",
  "สกลนคร",
  "นครพนม",
  "มุกดาหาร",
  "เชียงใหม่",
  "ลำพูน",
  "ลำปาง",
  "อุตรดิตถ์",
  "แพร่",
  "น่าน",
  "พะเยา",
  "เชียงราย",
  "แม่ฮ่องสอน",
  "นครสวรรค์",
  "อุทัยธานี",
  "กำแพงเพชร",
  "ตาก",
  "สุโขทัย",
  "พิษณุโลก",
  "พิจิตร",
  "เพชรบูรณ์",
  "ราชบุรี",
  "กาญจนบุรี",
  "สุพรรณบุรี",
  "นครปฐม",
  "สมุทรสาคร",
  "สมุทรสงคราม",
  "เพชรบุรี",
  "ประจวบคีรีขันธ์",
  "นครศรีธรรมราช",
  "กระบี่",
  "พังงา",
  "ภูเก็ต",
  "สุราษฎร์ธานี",
  "ระนอง",
  "ชุมพร",
  "สงขลา",
  "สตูล",
  "ตรัง",
  "พัทลุง",
  "ปัตตานี",
  "ยะลา",
  "นราธิวาส",
  "บึงกาฬ",
] as const;

// Emergency contact numbers
export const EMERGENCY_CONTACTS = {
  police: "191",
  fire: "199",
  medical: "1669",
  tourist: "1155",
  local: "1337", // Local government hotline
} as const;

// Date formats
export const DATE_FORMATS = {
  thai: {
    short: "dd/MM/yyyy",
    long: "d MMMM yyyy",
    datetime: "d MMMM yyyy HH:mm",
  },
  english: {
    short: "MM/dd/yyyy",
    long: "MMMM d, yyyy",
    datetime: "MMMM d, yyyy HH:mm",
  },
} as const;

// Currency formatting
export const CURRENCY = {
  code: "THB",
  symbol: "฿",
  locale: "th-TH",
} as const;

// Social media sharing
export const SOCIAL_MEDIA = {
  facebook: "https://www.facebook.com/sharer/sharer.php?u=",
  twitter: "https://twitter.com/intent/tweet?url=",
  line: "https://social-plugins.line.me/lineit/share?url=",
} as const;
