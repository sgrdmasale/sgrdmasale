import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

const AdminPanelLinks = () => {
  // In a real environment, these would be dynamic based on the deployment
  const previewUrl = window.location.origin;
  const publishedUrl = window.location.origin.replace('preview', 'www'); // Mock published URL

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('URL copied to clipboard');
  };

  const LinkCard = ({ title, description, url, isPrimary }) => (
    <Card className={`overflow-hidden ${isPrimary ? 'border-primary/50 shadow-md' : ''}`}>
      <CardHeader className={`${isPrimary ? 'bg-primary/5' : 'bg-muted/30'} pb-4`}>
        <CardTitle className="text-lg flex items-center gap-2">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="bg-white p-3 rounded-xl shadow-sm border">
            <QRCodeSVG value={url} size={120} level="M" includeMargin={false} />
            <p className="text-center text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
              <Smartphone className="w-3 h-3" /> Scan to open
            </p>
          </div>
          
          <div className="flex-1 space-y-4 w-full">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Direct URL</label>
              <div className="flex items-center gap-2 bg-muted p-2 rounded-lg border">
                <code className="text-sm flex-1 truncate px-2">{url}</code>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(url)} className="h-8 w-8 shrink-0">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Button className="w-full sm:w-auto" variant={isPrimary ? 'default' : 'outline'} onClick={() => window.open(url, '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" /> Open Link
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Quick Access Links</h3>
        <p className="text-sm text-muted-foreground">Use these links and QR codes to quickly access your store from any device.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LinkCard 
          title="Published Store" 
          description="The live URL accessible to your customers."
          url={publishedUrl}
          isPrimary={true}
        />
        <LinkCard 
          title="Preview Environment" 
          description="The staging URL for testing changes before publishing."
          url={previewUrl}
          isPrimary={false}
        />
      </div>
    </div>
  );
};

export default AdminPanelLinks;