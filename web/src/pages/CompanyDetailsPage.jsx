import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const CompanyDetailsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recordId, setRecordId] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: '',
    gst_number: '03aoips3078q1z9',
    fssai_number: '12124001000047',
    website_url: ''
  });
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const records = await pb.collection('company_settings').getFullList({ $autoCancel: false });
        if (records.length > 0) {
          const data = records[0];
          setRecordId(data.id);
          setFormData({
            company_name: data.company_name || '',
            company_email: data.company_email || '',
            company_phone: data.company_phone || '',
            company_address: data.company_address || '',
            gst_number: data.gst_number || '03aoips3078q1z9',
            fssai_number: data.fssai_number || '12124001000047',
            website_url: data.website_url || ''
          });
        }
      } catch (error) {
        console.error('Error fetching company details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanyDetails();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (logoFile) data.append('logo', logoFile);

      if (recordId) {
        await pb.collection('company_settings').update(recordId, data, { $autoCancel: false });
      } else {
        const newRecord = await pb.collection('company_settings').create(data, { $autoCancel: false });
        setRecordId(newRecord.id);
      }
      toast.success('Company details saved successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to save company details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <Helmet><title>Company Details - Admin</title></Helmet>
      
      <h1 className="admin-page-title">Company Details</h1>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input required value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input type="email" required value={formData.company_email} onChange={e => setFormData({...formData, company_email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input required value={formData.company_phone} onChange={e => setFormData({...formData, company_phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input type="url" value={formData.website_url} onChange={e => setFormData({...formData, website_url: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>GST Number *</Label>
                <Input required value={formData.gst_number} onChange={e => setFormData({...formData, gst_number: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>FSSAI Number *</Label>
                <Input required value={formData.fssai_number} onChange={e => setFormData({...formData, fssai_number: e.target.value})} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Full Address *</Label>
              <textarea 
                required
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.company_address} 
                onChange={e => setFormData({...formData, company_address: e.target.value})} 
              />
            </div>

            <div className="space-y-2">
              <Label>Company Logo (Max 20MB)</Label>
              <Input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} />
            </div>

            <Button type="submit" disabled={saving} className="mt-4">
              {saving ? 'Saving...' : 'Save Details'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyDetailsPage;