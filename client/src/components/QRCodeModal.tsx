import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, Printer } from "lucide-react";
import QRCode from "react-qr-code";
import { useState, useEffect } from "react";
import { formatDate, formatTime } from "@/lib/utils";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrValue: string;
  classInfo?: {
    subject: string;
    group: string;
    classroom: string;
    date?: Date;
    startTime?: Date;
    endTime?: Date;
  };
}

export default function QRCodeModal({
  isOpen,
  onClose,
  qrValue,
  classInfo
}: QRCodeModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  
  // Generate a downloadable data URL for the QR code
  useEffect(() => {
    if (!qrValue) return;
    
    // Delay to ensure the QR code is rendered
    const timer = setTimeout(() => {
      const svg = document.getElementById("qr-code-svg");
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          const pngFile = canvas.toDataURL("image/png");
          setQrCodeUrl(pngFile);
        };
        
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [qrValue]);
  
  const handleDownload = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `qr-code-${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handlePrint = () => {
    if (!qrCodeUrl) return;
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code</title>
            <style>
              body { 
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                font-family: Arial, sans-serif;
              }
              .info {
                text-align: center;
                margin-bottom: 20px;
              }
              img {
                max-width: 300px;
              }
            </style>
          </head>
          <body>
            <div class="info">
              <h2>${classInfo?.subject || 'Занятие'}</h2>
              <p>Группа ${classInfo?.group || ''}, Аудитория ${classInfo?.classroom || ''}</p>
              <p>${classInfo?.date ? formatDate(classInfo.date) : ''} ${classInfo?.startTime ? formatTime(classInfo.startTime) : ''}-${classInfo?.endTime ? formatTime(classInfo.endTime) : ''}</p>
            </div>
            <img src="${qrCodeUrl}" alt="QR Code" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-gray-800">QR-код занятия</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="text-center mb-4">
          <div className="text-sm text-gray-500 mb-1">{classInfo?.subject || 'Занятие'}</div>
          <div className="font-medium">
            {classInfo?.group ? `Группа ${classInfo.group}, ` : ''} 
            {classInfo?.classroom ? `Аудитория ${classInfo.classroom}` : ''}
          </div>
          <div className="text-sm text-gray-500">
            {classInfo?.date ? formatDate(classInfo.date) : ''}
            {classInfo?.startTime && classInfo?.endTime ? `, ${formatTime(classInfo.startTime)}-${formatTime(classInfo.endTime)}` : ''}
          </div>
        </div>
        
        <div className="flex justify-center mb-6">
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
            {qrValue ? (
              <QRCode
                id="qr-code-svg"
                value={qrValue}
                size={200}
                level="H"
                className="mx-auto"
              />
            ) : (
              <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400 text-6xl">QR</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <Button 
            className="w-full" 
            onClick={handleDownload}
            disabled={!qrCodeUrl}
          >
            <Download className="mr-2 h-4 w-4" />
            Скачать QR-код
          </Button>
          <Button 
            className="w-full" 
            variant="outline" 
            onClick={handlePrint}
            disabled={!qrCodeUrl}
          >
            <Printer className="mr-2 h-4 w-4" />
            Распечатать
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
