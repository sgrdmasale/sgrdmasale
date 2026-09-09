import React from 'react';
import { Helmet } from 'react-helmet';
import CustomersTable from '@/components/CustomersTable.jsx';

const CustomersPage = () => {
  return (
    <div className="space-y-6 pb-12">
      <Helmet>
        <title>Customers - Admin Portal</title>
      </Helmet>

      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Customers</h1>
        <p className="text-muted-foreground">
          Manage and view your customer directory and their order history.
        </p>
      </div>

      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <CustomersTable />
      </div>
    </div>
  );
};

export default CustomersPage;