import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQRCode } from "@/hooks/useQRCode";
import { useToast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onSuccess
}: QRScannerModalProps) {
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [scanning, setScanning] = useState(false);
  const { markAttendance, isLoading } = useQRCode();
  const { toast } = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-scanner-container";

  // Handle scan success
  const handleScanSuccess = async (decodedText: string) => {
    if (!decodedText || !scanning) return;
    
    try {
      setScanning(false);
      // Stop scanner
      if (scannerRef.current) {
        await scannerRef.current.stop();
      }
      
      await markAttendance(decodedText);
      
      // Notify success
      toast({
        title: "Успех!",
        description: "Посещение успешно отмечено",
      });
      
      // Call success callback
      if (onSuccess) onSuccess();
      
      // Close modal
      onClose();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отметить посещение",
        variant: "destructive",
      });
      // Re-enable scanning
      setScanning(true);
    }
  };

  const handleScanError = (err: any) => {
    console.error("QR Scanner error:", err);
    // Only show error toast if it's a fatal error
    if (!scanning) {
      toast({
        title: "Ошибка сканирования",
        description: "Не удалось получить доступ к камере",
        variant: "destructive",
      });
    }
  };

  const toggleCamera = async () => {
    if (scannerRef.current && scanning) {
      await scannerRef.current.stop();
      setScanning(false);
    }
    setFacingMode(facingMode === "environment" ? "user" : "environment");
  };

  const startScanning = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
    }
    
    try {
      const cameraId = facingMode === "environment" 
        ? { facingMode: "environment" } 
        : { facingMode: "user" };
      
      scannerRef.current = new Html5Qrcode(scannerContainerId);
      await scannerRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: 250,
          aspectRatio: 1,
        },
        handleScanSuccess,
        handleScanError
      );
      setScanning(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      toast({
        title: "Ошибка",
        description: "Не удалось запустить сканер QR-кода",
        variant: "destructive",
      });
    }
  };

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen && scannerRef.current) {
      scannerRef.current.stop().catch(console.error);
      setScanning(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-gray-800">Сканировать QR-код</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="text-center mb-4">
          <p className="text-gray-600">Наведите камеру на QR-код преподавателя</p>
        </div>
        
        <div className="flex justify-center mb-6">
          <div className="relative w-64 h-64 overflow-hidden rounded-lg">
            <div id={scannerContainerId} className="w-full h-full">
              {!scanning && (
                <div className="bg-gray-900 w-full h-full flex items-center justify-center">
                  <div className="text-white text-sm">Нажмите кнопку для начала сканирования</div>
                </div>
              )}
            </div>
            <div className="absolute inset-0 border-2 border-white opacity-50 rounded pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-lg pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-lg pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-lg pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-lg pointer-events-none"></div>
          </div>
        </div>
        
        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={startScanning}
            disabled={scanning || isLoading}
          >
            <Camera className="mr-2 h-4 w-4" />
            {scanning ? "Сканирование..." : "Начать сканирование"}
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={toggleCamera}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Сменить камеру
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
