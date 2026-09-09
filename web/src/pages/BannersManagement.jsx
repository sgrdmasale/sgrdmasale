import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, ArrowUp, ArrowDown, FileImage as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BulkUploadBannersModal from '@/components/BulkUploadBannersModal';

const BannersManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('banners').getFullList({
        sort: 'display_order',
        $autoCancel: false
      });
      setBanners(records);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast({
        title: "Error fetching banners",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;
    
    try {
      await pb.collection('banners').delete(id, { $autoCancel: false });
      setBanners(prev => prev.filter(b => b.id !== id));
      toast({ title: "Banner deleted successfully" });
    } catch (error) {
      toast({
        title: "Error deleting banner",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleActiveStatus = async (banner) => {
    try {
      const updated = await pb.collection('banners').update(banner.id, {
        is_active: !banner.is_active
      }, { $autoCancel: false });
      
      setBanners(prev => prev.map(b => b.id === banner.id ? updated : b));
      toast({ title: `Banner marked as ${updated.is_active ? 'Active' : 'Inactive'}` });
    } catch (error) {
      toast({
        title: "Status update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const moveBanner = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === banners.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const currentBanner = banners[index];
    const targetBanner = banners[targetIndex];

    try {
      // Optimistically update UI
      const newBanners = [...banners];
      
      // Swap display_order values
      const currentOrder = currentBanner.display_order;
      const targetOrder = targetBanner.display_order;

      newBanners[index] = { ...currentBanner, display_order: targetOrder };
      newBanners[targetIndex] = { ...targetBanner, display_order: currentOrder };
      
      // Re-sort and update state
      setBanners(newBanners.sort((a, b) => a.display_order - b.display_order));

      // Persist to database
      await Promise.all([
        pb.collection('banners').update(currentBanner.id, { display_order: targetOrder }, { $autoCancel: false }),
        pb.collection('banners').update(targetBanner.id, { display_order: currentOrder }, { $autoCancel: false })
      ]);
    } catch (error) {
      toast({
        title: "Reordering failed",
        description: "Failed to update banner order in database. Refreshing...",
        variant: "destructive"
      });
      fetchBanners(); // Revert on failure
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Helmet><title>Manage Banners - Admin Portal</title></Helmet>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="admin-page-title mb-1">Banner Management</h1>
          <p className="text-muted-foreground">Upload and organize images for the homepage carousel.</p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)} className="shrink-0 shadow-sm">
          <Upload className="w-4 h-4 mr-2" />
          Bulk Upload
        </Button>
      </div>

      {banners.length === 0 ? (
        <div className="bg-card border border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No banners found</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            You haven't uploaded any banners yet. Use the bulk upload tool to add images to your homepage carousel.
          </p>
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload First Banners
          </Button>
        </div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
          <div className="divide-y divide-border">
            {banners.map((banner, index) => (
              <div key={banner.id} className="p-4 flex flex-col md:flex-row gap-6 items-start md:items-center hover:bg-muted/30 transition-colors">
                
                {/* Image Preview */}
                <div className="w-full md:w-64 h-24 shrink-0 bg-muted rounded-lg overflow-hidden border">
                  {banner.image ? (
                    <img 
                      src={pb.files.getUrl(banner, banner.image)} 
                      alt={banner.title}
                      className={`w-full h-full object-cover transition-opacity ${!banner.is_active ? 'opacity-50 grayscale' : ''}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base truncate mb-1">{banner.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Order: {banner.display_order}</span>
                    <span className="flex items-center gap-2">
                      <Switch 
                        checked={banner.is_active} 
                        onCheckedChange={() => toggleActiveStatus(banner)}
                        id={`active-${banner.id}`}
                      />
                      <Label htmlFor={`active-${banner.id}`} className={`cursor-pointer ${banner.is_active ? 'text-primary' : ''}`}>
                        {banner.is_active ? 'Active' : 'Hidden'}
                      </Label>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col gap-1 mr-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8" 
                      disabled={index === 0}
                      onClick={() => moveBanner(index, 'up')}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8" 
                      disabled={index === banners.length - 1}
                      onClick={() => moveBanner(index, 'down')}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="h-10 w-px bg-border mx-2"></div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10"
                    onClick={() => handleDelete(banner.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BulkUploadBannersModal 
        isOpen={isUploadModalOpen} 
        onOpenChange={setIsUploadModalOpen} 
        onSuccess={fetchBanners}
      />
    </div>
  );
};

export default BannersManagement;