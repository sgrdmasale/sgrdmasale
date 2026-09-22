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

const EnquiriesManagement = () => {
  const { toast } = useToast();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEnquiries = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch ALL enquiries without filtering
      const records = await pb.collection('contact_submissions').getFullList({
        sort: '-created',
        $autoCancel: false
      });

      console.log('Fetched enquiries:', records);
      setEnquiries(records);
    } catch (err) {
      console.error('Error fetching enquiries:', err);
      setError(err.message || 'Failed to load enquiries');
      toast({ title: 'Error', description: 'Failed to load enquiries.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleStatusChange = async (enquiryId, value) => {
    try {
      await pb.collection('contact_submissions').update(enquiryId, { status: value }, { $autoCancel: false });
      toast({ title: 'Success', description: `Enquiry status updated to ${value}` });

      // Update local state to reflect changes immediately
      setEnquiries(prev => prev.map(o => o.id === enquiryId ? { ...o, status: value } : o));

      if (selectedEnquiry && selectedEnquiry.id === enquiryId) {
        setSelectedEnquiry(prev => ({ ...prev, status: value }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error', description: 'Failed to update enquiry status' });
    }
  };

  const handleDelete = async (enquiryId) => {
    if (!window.confirm('Are you sure you want to delete this enquiry? This action cannot be undone.')) {
      return;
    }

    try {
      await pb.collection('contact_submissions').delete(enquiryId, { $autoCancel: false });
      toast({ title: 'Success', description: 'Enquiry deleted successfully' });
      setEnquiries(prev => prev.filter(o => o.id !== enquiryId));
    } catch (error) {
      console.error('Error deleting enquiry:', error);
      toast({ title: 'Error', description: 'Failed to delete enquiry' });
    }
  };

  const handleViewEnquiry = (enquiry) => {
    console.log('[DEBUG] Viewing enquiry details for:', enquiry.id);
    console.log('[DEBUG] Full enquiry object:', enquiry);

    setSelectedEnquiry(enquiry);
    setIsModalOpen(true);
  };

  const filteredEnquiries = enquiries.filter(e =>
    e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Enquiries Management - Admin</title></Helmet>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Enquiries Management</h1>
          <p className="text-muted-foreground mt-1">View and manage customer enquiries from the contact form.</p>
        </div>
        <Button onClick={fetchEnquiries} variant="outline" disabled={loading}>
          Refresh Enquiries
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, subject, or message..."
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
              <Button onClick={fetchEnquiries} variant="outline">Try Again</Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Contact</TableHead>
                    <TableHead className="font-semibold">Subject</TableHead>
                    <TableHead className="font-semibold">Message</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32 mb-1" /><Skeleton className="h-3 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20 rounded-md" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredEnquiries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        {searchTerm ? 'No enquiries found matching your search.' : 'No enquiries have been submitted yet.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEnquiries.map(enquiry => (
                      <TableRow key={enquiry.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {new Date(enquiry.created).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{enquiry.name}</span>
                            <span className="text-xs text-muted-foreground">{enquiry.email}</span>
                            <span className="text-xs text-muted-foreground">{enquiry.phone || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={enquiry.subject || 'No Subject'}>
                          {enquiry.subject || 'No Subject'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={enquiry.message || ''}>
                          {enquiry.message ? enquiry.message.substring(0, 100) + (enquiry.message.length > 100 ? '...' : '') : ''}
                        </TableCell>
                        <TableCell>
                          <select
                            className="text-xs border border-input bg-background rounded-md p-1.5 font-medium outline-none focus:ring-2 focus:ring-ring transition-colors"
                            value={enquiry.status || 'new'}
                            onChange={(e) => handleStatusChange(enquiry.id, e.target.value)}
                          >
                            <option value="new">New</option>
                            <option value="read">Read</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-muted-foreground hover:text-foreground"
                              onClick={() => handleViewEnquiry(enquiry)}
                            >
                              <Eye className="w-4 h-4 mr-1.5" /> View
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(enquiry.id)}
                              title="Delete Enquiry"
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
            <DialogTitle className="text-xl">Enquiry Details: {selectedEnquiry?.name}</DialogTitle>
          </DialogHeader>
          {selectedEnquiry && (
            <div className="space-y-6 mt-4">
              <div className="p-5 bg-muted/30 border border-border/50 rounded-xl">
                <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
                  Contact Information
                </h3>
                <div className="space-y-2.5 text-muted-foreground">
                  <p className="flex justify-between"><span className="font-medium text-foreground">Name:</span> <span>{selectedEnquiry.name}</span></p>
                  <p className="flex justify-between"><span className="font-medium text-foreground">Email:</span> <span>{selectedEnquiry.email}</span></p>
                  <p className="flex justify-between"><span className="font-medium text-foreground">Phone:</span> <span>{selectedEnquiry.phone || 'Not provided'}</span></p>
                  <p className="flex justify-between"><span className="font-medium text-foreground">Date:</span> <span>{new Date(selectedEnquiry.created).toLocaleString()}</span></p>
                </div>
              </div>

              <div className="p-5 bg-muted/30 border border-border/50 rounded-xl">
                <h3 className="font-semibold mb-4 text-foreground">Subject</h3>
                <p className="text-muted-foreground">{selectedEnquiry.subject || 'No subject provided'}</p>
              </div>

              <div className="p-5 bg-muted/30 border border-border/50 rounded-xl">
                <h3 className="font-semibold mb-4 text-foreground">Message</h3>
                <p className="whitespace-pre-line text-muted-foreground">{selectedEnquiry.message || 'No message provided'}</p>
              </div>

              <div className="p-5 bg-muted/30 border border-border/50 rounded-xl">
                <h3 className="font-semibold mb-4 text-foreground">Status</h3>
                <p className="text-muted-foreground">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedEnquiry.status === 'new' ? 'bg-blue-100 text-blue-800' : selectedEnquiry.status === 'read' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    {selectedEnquiry.status.charAt(0).toUpperCase() + selectedEnquiry.status.slice(1)}
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

export default EnquiriesManagement;