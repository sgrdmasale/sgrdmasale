import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast.js';
import { Search, Eye, Trash2, AlertCircle } from 'lucide-react';

const PartnershipsManagement = () => {
  const { toast } = useToast();
  const [partnerships, setPartnerships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartnership, setSelectedPartnership] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPartnerships = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch ALL partnership inquiries without filtering
      const records = await pb.collection('partnership_inquiries').getFullList({
        sort: '-created',
        $autoCancel: false
      });

      console.log('Fetched partnership inquiries:', records);
      setPartnerships(records);
    } catch (err) {
      console.error('Error fetching partnership inquiries:', err);
      setError(err.message || 'Failed to load partnership inquiries');
      toast({ title: 'Error', description: 'Failed to load partnership inquiries.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerships();
  }, []);

  const handleStatusChange = async (partnershipId, value) => {
    try {
      await pb.collection('partnership_inquiries').update(partnershipId, { status: value }, { $autoCancel: false });
      toast({ title: 'Success', description: `Partnership inquiry status updated to ${value}` });

      // Update local state to reflect changes immediately
      setPartnerships(prev => prev.map(o => o.id === partnershipId ? { ...o, status: value } : o));

      if (selectedPartnership && selectedPartnership.id === partnershipId) {
        setSelectedPartnership(prev => ({ ...prev, status: value }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error', description: 'Failed to update partnership inquiry status' });
    }
  };

  const handleDelete = async (partnershipId) => {
    if (!window.confirm('Are you sure you want to delete this partnership inquiry? This action cannot be undone.')) {
      return;
    }

    try {
      await pb.collection('partnership_inquiries').delete(partnershipId, { $autoCancel: false });
      toast({ title: 'Success', description: 'Partnership inquiry deleted successfully' });
      setPartnerships(prev => prev.filter(o => o.id !== partnershipId));
    } catch (error) {
      console.error('Error deleting partnership inquiry:', error);
      toast({ title: 'Error', description: 'Failed to delete partnership inquiry' });
    }
  };

  const handleViewPartnership = (partnership) => {
    console.log('[DEBUG] Viewing partnership details for:', partnership.id);
    console.log('[DEBUG] Full partnership object:', partnership);

    setSelectedPartnership(partnership);
    setIsModalOpen(true);
  };

  const filteredPartnerships = partnerships.filter(p =>
    p.business_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.contact_person_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.requirements?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Partnership Inquiries Management - Admin</title></Helmet>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Partnership Inquiries Management</h1>
          <p className="text-muted-foreground mt-1">View and manage partnership inquiries from the Partner With Us form.</p>
        </div>
        <Button onClick={fetchPartnerships} variant="outline" disabled={loading}>
          Refresh Inquiries
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by business type, company name, contact person, email, or requirements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-muted/30"
            />
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-8 text-center bg-destructive/10 rounded-xl border border-destructive/20 my-4">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
              <p className="text-destructive font-medium mb-4">{error}</p>
              <Button onClick={fetchPartnerships} variant="outline">Try Again</Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Business Type</TableHead>
                    <TableHead className="font-semibold">Company</TableHead>
                    <TableHead className="font-semibold">Contact Person</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20 rounded-md" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredPartnerships.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        {searchTerm ? 'No partnership inquiries found matching your search.' : 'No partnership inquiries have been submitted yet.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPartnerships.map(partnership => (
                      <TableRow key={partnership.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {new Date(partnership.created).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {partnership.business_type || 'Not specified'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={partnership.company_name || 'No Company Name'}>
                          {partnership.company_name || 'No Company Name'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={partnership.contact_person_name || 'No Contact Person'}>
                          {partnership.contact_person_name || 'No Contact Person'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={partnership.email || 'No Email'}>
                          {partnership.email || 'No Email'}
                        </TableCell>
                        <TableCell>
                          <select
                            className="text-xs border border-input bg-background rounded-md p-1.5 font-medium outline-none focus:ring-2 focus:ring-ring transition-colors"
                            value={partnership.status || 'new'}
                            onChange={(e) => handleStatusChange(partnership.id, e.target.value)}
                          >
                            <option value="new">New</option>
                            <option value="read">Read</option>
                            <option value="in_progress">In Progress</option>
                            <option value="quoted">Quoted</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-muted-foreground hover:text-foreground"
                              onClick={() => handleViewPartnership(partnership)}
                            >
                              <Eye className="w-4 h-4 mr-1.5" /> View
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(partnership.id)}
                              title="Delete Partnership Inquiry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Partnership Inquiry Details: {selectedPartnership?.company_name}</DialogTitle>
          </DialogHeader>
          {selectedPartnership && (
            <div className="space-y-6 mt-4">
              <div className="p-5 bg-muted/30 border border-border/50 rounded-xl">
                <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
                  Contact Information
                </h3>
                <div className="space-y-2.5 text-muted-foreground">
                  <p className="flex justify-between"><span className="font-medium text-foreground">Business Type:</span> <span>{selectedPartnership.business_type}</span></p>
                  <p className="flex justify-between"><span className="font-medium text-foreground">Company Name:</span> <span>{selectedPartnership.company_name}</span></p>
                  <p className="flex justify-between"><span className="font-medium text-foreground">Contact Person:</span> <span>{selectedPartnership.contact_person_name}</span></p>
                  <p className="flex justify-between"><span className="font-medium text-foreground">Email:</span> <span>{selectedPartnership.email}</span></p>
                  <p className="flex justify-between"><span className="font-medium text-foreground">Phone:</span> <span>{selectedPartnership.phone || 'Not provided'}</span></p>
                  <p className="flex justify-between"><span className="font-medium text-foreground">Date:</span> <span>{new Date(selectedPartnership.created).toLocaleString()}</span></p>
                </div>
              </div>

              <div className="p-5 bg-muted/30 border border-border/50 rounded-xl">
                <h3 className="font-semibold mb-4 text-foreground">Requirements</h3>
                <p className="whitespace-pre-line text-muted-foreground">{selectedPartnership.requirements || 'No requirements provided'}</p>
              </div>

              <div className="p-5 bg-muted/30 border border-border/50 rounded-xl">
                <h3 className="font-semibold mb-4 text-foreground">Status</h3>
                <p className="text-muted-foreground">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedPartnership.status === 'new' ? 'bg-blue-100 text-blue-800' : selectedPartnership.status === 'read' ? 'bg-yellow-100 text-yellow-800' : selectedPartnership.status === 'in_progress' ? 'bg-indigo-100 text-indigo-800' : selectedPartnership.status === 'quoted' ? 'bg-purple-100 text-purple-800' : selectedPartnership.status === 'negotiation' ? 'bg-pink-100 text-pink-800' : selectedPartnership.status === 'won' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {selectedPartnership.status.charAt(0).toUpperCase() + selectedPartnership.status.slice(1).replace('_', ' ')}
                  </span>
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnershipsManagement;