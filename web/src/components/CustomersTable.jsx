import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Eye, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const CustomersTable = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 50;

  const fetchCustomers = async (page = 1) => {
    setLoading(true);
    setError(null);
    console.log(`[CustomersTable] Fetching customers page ${page}...`);
    
    try {
      // Fetch all users without server-side filters to ensure we get everyone
      const result = await pb.collection('users').getList(page, itemsPerPage, {
        sort: '-created',
        $autoCancel: false,
      });

      console.log(`[CustomersTable] Fetch successful. Retrieved ${result.items.length} records out of ${result.totalItems} total.`);
      if (result.items.length > 0) {
        console.log('[CustomersTable] Sample record:', {
          id: result.items[0].id,
          email: result.items[0].email,
          name: result.items[0].name,
          role: result.items[0].role
        });
      }

      setCustomers(result.items);
      setTotalPages(result.totalPages);
      setCurrentPage(page);
    } catch (err) {
      console.error('[CustomersTable] Error fetching customers:', err);
      
      // Check for specific PocketBase rule violations (403 Forbidden)
      if (err.status === 403) {
        const ruleErrorMsg = 'Permission Denied: The PocketBase "listRule" for the users collection is restricting access. It is currently set to "id = @request.auth.id", which prevents admins from listing all users.';
        console.error(`[CustomersTable] RULE ISSUE DETECTED: ${ruleErrorMsg}`);
        setError(ruleErrorMsg);
        toast.error('Database permission error detected');
      } else {
        setError(err.message || 'Failed to load customers. Please try again.');
        toast.error('Failed to load customers');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, []);

  const handleRefresh = () => {
    fetchCustomers(currentPage);
    toast.success('Refreshing customer list...');
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchCustomers(newPage);
    }
  };

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Client-side filtering
  const filteredCustomers = customers.filter((customer) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = customer.name?.toLowerCase().includes(query);
    const emailMatch = customer.email?.toLowerCase().includes(query);
    return nameMatch || emailMatch;
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-destructive/5 border border-destructive/20 rounded-lg p-6">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <div className="text-center max-w-2xl">
          <h3 className="text-lg font-semibold text-destructive mb-2">Access Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground bg-background p-4 rounded border text-left font-mono">
            <strong>Diagnostic Info:</strong><br/>
            The users collection listRule is currently: "id = @request.auth.id"<br/>
            This means users can only see their own record. To fix this, the listRule needs to be updated to allow admin access (e.g., "id = @request.auth.id || @request.auth.collectionName = 'admin'").
          </p>
        </div>
        <Button onClick={() => fetchCustomers(currentPage)} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Fetch
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or email (current page)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">
            {searchQuery ? 'No customers found matching your search on this page.' : 'No customers found in the database.'}
          </p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {customer.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="font-medium">
                      {customer.name || 'N/A'}
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{formatDate(customer.created)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={customer.role === 'admin' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {customer.role || 'customer'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(customer)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Customer Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Customer ID</p>
                      <p className="text-base font-mono bg-muted px-2 py-1 rounded-md inline-block text-sm">
                        {selectedCustomer.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Role</p>
                      <Badge variant={selectedCustomer.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                        {selectedCustomer.role || 'customer'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Name</p>
                      <p className="text-base font-medium">{selectedCustomer.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                      <p className="text-base">{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Registration Date</p>
                      <p className="text-base">{formatDateTime(selectedCustomer.created)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Last Updated</p>
                      <p className="text-base">{formatDateTime(selectedCustomer.updated)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Verification Status</p>
                      <Badge variant={selectedCustomer.verified ? 'outline' : 'destructive'} className="mt-1">
                        {selectedCustomer.verified ? 'Verified' : 'Not Verified'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Email Visibility</p>
                      <p className="text-base">{selectedCustomer.emailVisibility ? 'Public' : 'Private'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersTable;