import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  visible: boolean;
  onClose?: () => void;
}

export default function Toast({
  message,
  type = "success",
  visible,
  onClose
}: ToastProps) {
  if (!visible) return null;
  
  // Auto-close after 3 seconds
  if (visible && onClose) {
    setTimeout(() => {
      onClose();
    }, 3000);
  }
  
  const IconComponent = {
    success: CheckCircle,
    error: XCircle,
    info: AlertCircle
  }[type];
  
  const bgColor = {
    success: "bg-success",
    error: "bg-destructive",
    info: "bg-info"
  }[type];
  
  return (
    <div className={cn(
      "fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center text-white",
      bgColor
    )}>
      <IconComponent className="mr-2 h-5 w-5" />
      <span>{message}</span>
    </div>
  );
}
