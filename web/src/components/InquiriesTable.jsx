import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, MailOpen } from 'lucide-react';
import { toast } from 'sonner';

const InquiriesTable = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const pageSize = 10;

  const fetchInquiries = async () => {
    setLoading(true);
    setError(null);
    try {
      let filterStr = '';
      const filters = [];
      
      if (search) {
        filters.push(`(name ~ "${search}" || email ~ "${search}")`);
      }
      if (statusFilter !== 'all') {
        filters.push(`status = "${statusFilter}"`);
      }
      
      if (filters.length > 0) {
        filterStr = filters.join(' && ');
      }

      const result = await pb.collection('contact_submissions').getList(page, pageSize, {
        sort: '-created',
        filter: filterStr,
        $autoCancel: false
      });

      setInquiries(result.items);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalItems);
    } catch (err) {
      console.error('Error fetching inquiries:', err);
      setError('Failed to load inquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchInquiries();
    }, 300);
    return () => clearTimeout(debounce);
  }, [page, search, statusFilter]);

  const updateStatus = async (id, newStatus) => {
    try {
      await pb.collection('contact_submissions').update(id, { status: newStatus }, { $autoCancel: false });
      toast.success(`Inquiry marked as ${newStatus}`);
      fetchInquiries();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      read: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    };
    const style = styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}>{status || 'New'}</span>;
  };

  if (error) {
    return (
      <div className="p-8 text-center bg-destructive/10 rounded-xl border border-destructive/20">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
        <p className="text-destructive font-medium mb-4">{error}</p>
        <Button onClick={fetchInquiries} variant="outline">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="admin-table-container">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Date</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : inquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No inquiries found.
                </TableCell>
              </TableRow>
            ) : (
              inquiries.map((inq) => (
                <TableRow key={inq.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(inq.created).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{inq.name}</span>
                      <span className="text-xs text-muted-foreground">{inq.email}</span>
                      <span className="text-xs text-muted-foreground">{inq.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={inq.subject}>
                    {inq.subject || 'No Subject'}
                  </TableCell>
                  <TableCell>{getStatusBadge(inq.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {inq.status !== 'read' && inq.status !== 'resolved' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-2 text-xs"
                          onClick={() => updateStatus(inq.id, 'read')}
                        >
                          <MailOpen className="w-3 h-3 mr-1" /> Read
                        </Button>
                      )}
                      {inq.status !== 'resolved' && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="h-8 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => updateStatus(inq.id, 'resolved')}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Resolve
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {inquiries.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalItems)} of {totalItems} inquiries
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-2">Page {page} of {totalPages || 1}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading || totalPages === 0}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InquiriesTable;