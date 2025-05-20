import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X, RefreshCw } from "lucide-react";
import { QrReader } from "react-qr-reader";
import { useState } from "react";
import { useQRCode } from "@/hooks/useQRCode";
import { useToast } from "@/hooks/use-toast";

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

  const handleScan = async (data: any) => {
    if (!data || !scanning) return;
    
    try {
      setScanning(false);
      
      if (typeof data === 'string') {
        await markAttendance(data);
        
        // Notify success
        toast({
          title: "Успех!",
          description: "Посещение успешно отмечено",
        });
        
        // Call success callback
        if (onSuccess) onSuccess();
        
        // Close modal
        onClose();
      } else if (data.text) {
        await markAttendance(data.text);
        
        // Notify success
        toast({
          title: "Успех!",
          description: "Посещение успешно отмечено",
        });
        
        // Call success callback
        if (onSuccess) onSuccess();
        
        // Close modal
        onClose();
      }
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

  const handleError = (err: any) => {
    console.error("QR Scanner error:", err);
    toast({
      title: "Ошибка сканирования",
      description: "Не удалось получить доступ к камере",
      variant: "destructive",
    });
  };

  const toggleCamera = () => {
    setFacingMode(facingMode === "environment" ? "user" : "environment");
  };

  const startScanning = () => {
    setScanning(true);
  };

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
            {scanning ? (
              <QrReader
                scanDelay={500}
                constraints={{ 
                  facingMode,
                  aspectRatio: 1
                }}
                onResult={handleScan}
                onError={handleError}
                className="w-full h-full object-cover"
                videoStyle={{ width: '100%', height: '100%' }}
                videoContainerStyle={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div className="bg-gray-900 w-full h-full flex items-center justify-center">
                <div className="text-white text-sm">Нажмите кнопку для начала сканирования</div>
              </div>
            )}
            <div className="absolute inset-0 border-2 border-white opacity-50 rounded"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-lg"></div>
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
