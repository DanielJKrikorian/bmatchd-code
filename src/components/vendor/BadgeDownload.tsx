import React, { useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'react-hot-toast';

interface BadgeDownloadProps {
  businessName: string;
}

const BadgeDownload: React.FC<BadgeDownloadProps> = ({ businessName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load the badge image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "https://rtzrhxxdqmnpydskixso.supabase.co/storage/v1/object/public/public_1//Featured_Logo.png";
    
    img.onload = () => {
      // Calculate aspect ratio
      const aspectRatio = img.width / img.height;
      
      // Set canvas size to maintain aspect ratio at a larger size
      canvas.width = 400; // Increased base width
      canvas.height = 400 / aspectRatio;
      
      // Draw the badge image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  }, [businessName]);

  const handleDownload = () => {
    if (!canvasRef.current) return;

    try {
      const link = document.createElement('a');
      link.download = 'bmatchd-pro-badge.png';
      link.href = canvasRef.current.toDataURL('image/png', 1.0);
      link.click();
      toast.success('Badge downloaded successfully');
    } catch (error) {
      console.error('Error downloading badge:', error);
      toast.error('Failed to download badge');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <canvas
        ref={canvasRef}
        className="rounded shadow-sm"
        style={{ 
          maxWidth: '100%',
          height: 'auto',
          width: '300px' // Display size (will maintain aspect ratio)
        }}
      />
      <Button onClick={handleDownload} size="sm" variant="outline">
        <Download className="w-4 h-4 mr-2" />
        Download
      </Button>
    </div>
  );
};

export default BadgeDownload;