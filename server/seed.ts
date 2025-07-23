import { db } from "./db";
import { citizens, services, reports, announcements, notifications } from "@shared/schema";

async function seedDatabase() {
  try {
    console.log("🌱 Seeding database...");

    // Check if data already exists
    const existingCitizens = await db.select().from(citizens).limit(1);
    if (existingCitizens.length > 0) {
      console.log("✅ Database already seeded, skipping...");
      return;
    }

    // Seed Citizens
    const [citizen] = await db.insert(citizens).values({
      thaiId: "1234567890123",
      firstName: "กฤษนันทน์",
      lastName: "นำแปง",
      address: "123 ถ.ราชดำเนิน แขวงบางขุนพรหม เขตพระนคร กทม. 10200",
      phone: "0812345678",
      email: "kritsanan@email.com",
      isVerified: true,
      biometricEnabled: true,
    }).returning();

    // Seed Services
    await db.insert(services).values([
      {
        citizenId: citizen.id,
        serviceType: "tax",
        title: "ชำระภาษีบ้านและที่ดิน",
        description: "ชำระภาษีบ้านและที่ดินประจำปี 2567",
        status: "completed",
        trackingId: "TAX-2024-001",
        amount: 250000, // 2,500 baht in satang
      },
      {
        citizenId: citizen.id,
        serviceType: "permit",
        title: "ขออนุญาตก่อสร้าง",
        description: "ขออนุญาตต่อเติมอาคาร",
        status: "processing",
        trackingId: "PERMIT-2024-002",
      }
    ]);

    // Seed Reports
    await db.insert(reports).values([
      {
        category: "finance",
        title: "งบประมาณรายรับ-รายจ่าย",
        year: 2024,
        month: 12,
        data: {
          income: [8500000, "รายได้จากภาษี"],
          expenses: [7200000, "รายจ่ายดำเนินงาน"],
          balance: [1300000, "เงินคงเหลือ"]
        }
      },
      {
        category: "services",
        title: "สถิติการให้บริการ",
        year: 2024,
        month: 12,
        data: {
          totalServices: [1250, "จำนวนบริการทั้งหมด"],
          taxPayments: [450, "ชำระภาษี"],
          permits: [320, "ขออนุญาต"],
          complaints: [180, "ร้องเรียน"]
        }
      }
    ]);

    // Seed Announcements
    await db.insert(announcements).values([
      {
        category: "emergency",
        title: "แจ้งเตือนภัยแล้ง",
        content: "ขอให้ประชาชนใช้น้ำอย่างประหยัดในช่วงฤดูแล้ง อบต.กำลังดำเนินการขุดบ่อน้ำเพิ่มเติม",
        summary: "แจ้งเตือนภัยแล้งและมาตรการประหยัดน้ำ",
        priority: "high",
        isActive: true,
        publishedAt: new Date(),
      },
      {
        category: "news",
        title: "โครงการพัฒนาถนนในชุมชน",
        content: "อบต.วังสามหมอ ร่วมกับ Tour Der Wang จัดโครงการซ่อมแซมถนนในชุมชน เริ่มดำเนินการ 1 กุมภาพันธ์ 2568",
        summary: "โครงการพัฒนาโครงสร้างพื้นฐาน",
        priority: "normal",
        isActive: true,
        publishedAt: new Date(),
      }
    ]);

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

export { seedDatabase };