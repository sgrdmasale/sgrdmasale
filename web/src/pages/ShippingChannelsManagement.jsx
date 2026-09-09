import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, AlertCircle, Loader2 } from 'lucide-react';

const ShippingChannelsManagement = () => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    channel_type: '',
    api_key: '',
    is_active: true,
    configuration: ''
  });

  const fetchChannels = async () => {
    setLoading(true);
    try {
      let filterStr = '';
      if (searchTerm) {
        filterStr = `name ~ "${searchTerm}" || channel_type ~ "${searchTerm}"`;
      }
      
      const records = await pb.collection('shipping_channels').getFullList({
        filter: filterStr,
        sort: '-created',
        $autoCancel: false
      });
      setChannels(records);
    } catch (error) {
      toast.error('Failed to load shipping channels');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChannels();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleOpenModal = (channel = null) => {
    if (channel) {
      setEditingChannel(channel);
      setFormData({
        name: channel.name,
        channel_type: channel.channel_type,
        api_key: channel.api_key,
        is_active: channel.is_active,
        configuration: channel.configuration ? JSON.stringify(channel.configuration, null, 2) : ''
      });
    } else {
      setEditingChannel(null);
      setFormData({
        name: '',
        channel_type: '',
        api_key: '',
        is_active: true,
        configuration: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let parsedConfig = null;
    if (formData.configuration.trim()) {
      try {
        parsedConfig = JSON.parse(formData.configuration);
      } catch (err) {
        toast.error('Configuration must be valid JSON');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const payload = {
        name: formData.name,
        channel_type: formData.channel_type,
        api_key: formData.api_key,
        is_active: formData.is_active,
        configuration: parsedConfig
      };

      if (editingChannel) {
        await pb.collection('shipping_channels').update(editingChannel.id, payload, { $autoCancel: false });
        toast.success('Shipping channel updated');
      } else {
        await pb.collection('shipping_channels').create(payload, { $autoCancel: false });
        toast.success('Shipping channel created');
      }
      
      setIsModalOpen(false);
      fetchChannels();
    } catch (error) {
      toast.error(error.message || 'Failed to save shipping channel');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this shipping channel? This action cannot be undone.')) {
      try {
        await pb.collection('shipping_channels').delete(id, { $autoCancel: false });
        toast.success('Shipping channel deleted');
        fetchChannels();
      } catch (error) {
        toast.error('Failed to delete channel');
      }
    }
  };

  const toggleStatus = async (channel) => {
    try {
      await pb.collection('shipping_channels').update(channel.id, {
        is_active: !channel.is_active
      }, { $autoCancel: false });
      toast.success(`Channel ${channel.is_active ? 'disabled' : 'enabled'} successfully`);
      fetchChannels();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const maskApiKey = (key) => {
    if (!key) return '';
    if (key.length <= 8) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="space-y-6">
      <Helmet><title>Shipping Channels - Admin</title></Helmet>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Shipping Channels</h1>
          <p className="text-muted-foreground mt-1">Manage API integrations with shipping providers.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="rounded-xl shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Channel
        </Button>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search channels..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-xl border-border/60 bg-muted/20"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border/50 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="p-4 font-semibold text-muted-foreground">Name</th>
                  <th className="p-4 font-semibold text-muted-foreground">Type</th>
                  <th className="p-4 font-semibold text-muted-foreground">API Key</th>
                  <th className="p-4 font-semibold text-muted-foreground">Status</th>
                  <th className="p-4 font-semibold text-right text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : channels.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 text-muted-foreground">
                        <AlertCircle className="w-10 h-10 opacity-20" />
                        <p className="font-medium text-base">No shipping channels found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  channels.map(channel => (
                    <tr key={channel.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="p-4 font-bold text-foreground">{channel.name}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-secondary text-secondary-foreground">
                          {channel.channel_type}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground font-mono text-xs">{maskApiKey(channel.api_key)}</td>
                      <td className="p-4">
                        <button 
                          onClick={() => toggleStatus(channel)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                            channel.is_active 
                              ? 'bg-success/10 text-success hover:bg-success/20' 
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {channel.is_active ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(channel)} className="hover:bg-primary/10 hover:text-primary">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(channel.id)} className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingChannel ? 'Edit Shipping Channel' : 'Add Shipping Channel'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label className="text-foreground font-semibold">Channel Name *</Label>
                <Input 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. ShipRocket Main"
                  className="rounded-xl border-border/60"
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label className="text-foreground font-semibold">Type/Provider *</Label>
                <Input 
                  required 
                  value={formData.channel_type} 
                  onChange={e => setFormData({...formData, channel_type: e.target.value})} 
                  placeholder="e.g. shiprocket, delhivery"
                  className="rounded-xl border-border/60"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-foreground font-semibold">API Key / Token *</Label>
                <Input 
                  required 
                  type="password"
                  value={formData.api_key} 
                  onChange={e => setFormData({...formData, api_key: e.target.value})} 
                  placeholder="Enter secure API token"
                  className="rounded-xl border-border/60"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-foreground font-semibold flex items-center justify-between">
                  <span>Configuration (JSON)</span>
                  <span className="text-xs text-muted-foreground font-normal">Optional</span>
                </Label>
                <Textarea 
                  value={formData.configuration} 
                  onChange={e => setFormData({...formData, configuration: e.target.value})} 
                  placeholder='{"environment": "production", "default_weight": 0.5}'
                  className="min-h-[120px] font-mono text-sm rounded-xl border-border/60 bg-muted/20" 
                />
              </div>
              <div className="space-y-2 col-span-2 flex items-center gap-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <Label htmlFor="isActive" className="text-foreground font-semibold cursor-pointer">
                  Enable this shipping channel immediately
                </Label>
              </div>
            </div>
            
            <DialogFooter className="pt-4 border-t border-border/50">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-semibold">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl shadow-sm font-semibold">
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingChannel ? 'Update Channel' : 'Create Channel'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShippingChannelsManagement;