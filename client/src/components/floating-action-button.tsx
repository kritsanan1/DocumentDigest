import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FloatingActionButton() {
  const [isPressed, setIsPressed] = useState(false);
  const { toast } = useToast();

  const handleEmergencyCall = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 200);
    
    toast({
      title: "การติดต่อฉุกเฉิน",
      description: "กำลังเชื่อมต่อไปยัง 191",
      duration: 3000,
    });
  };

  return (
    <Button
      onClick={handleEmergencyCall}
      className={`fixed bottom-20 right-4 w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full shadow-lg flex items-center justify-center text-white animate-pulse-soft transition-transform duration-200 ${
        isPressed ? "scale-95" : "scale-100"
      }`}
    >
      <Phone className="w-6 h-6" />
    </Button>
  );
}
