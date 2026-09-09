import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';

const BulkCouponUpload = ({ onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile);
      setResults(null);
    } else {
      toast.error('Please select a valid .xlsx or .csv file');
      setFile(null);
    }
  };

  const processFile = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setProgress(0);
    setResults(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error('The uploaded file is empty');
      }

      let successCount = 0;
      let failCount = 0;
      const errors = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        try {
          // Map Excel columns to database fields
          const couponData = {
            code: String(row['Coupon Code'] || row.code || '').toUpperCase().trim(),
            discount_type: String(row['Discount Type'] || row.discount_type || 'percentage').toLowerCase(),
            discount_value: Number(row['Discount Value'] || row.discount_value || 0),
            expiry_date: row['Expiry Date'] || row.expiry_date ? new Date(row['Expiry Date'] || row.expiry_date).toISOString() : new Date(Date.now() + 30*24*60*60*1000).toISOString(),
            max_usage_limit: row['Max Usage Limit'] ? Number(row['Max Usage Limit']) : null,
            minimum_purchase_amount: row['Minimum Purchase Amount'] ? Number(row['Minimum Purchase Amount']) : null,
            is_active: true,
            current_usage_count: 0
          };

          if (!couponData.code) throw new Error('Missing Coupon Code');
          if (couponData.discount_value <= 0) throw new Error('Invalid Discount Value');
          if (!['percentage', 'fixed_amount'].includes(couponData.discount_type)) {
            couponData.discount_type = 'percentage'; // fallback
          }

          await pb.collection('coupons').create(couponData, { $autoCancel: false });
          successCount++;
        } catch (err) {
          failCount++;
          errors.push(`Row ${i + 2}: ${err.message}`);
        }

        setProgress(Math.round(((i + 1) / jsonData.length) * 100));
      }

      // Log bulk upload result
      try {
        await pb.collection('bulk_coupon_uploads').create({
          total_coupons: jsonData.length,
          successful_count: successCount,
          failed_count: failCount,
          error_details: errors.join(' | ')
        }, { $autoCancel: false });
      } catch (e) {
        console.error('Failed to log bulk upload:', e);
      }

      setResults({ total: jsonData.length, success: successCount, failed: failCount, errors });
      
      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} coupons`);
        if (onUploadComplete) onUploadComplete();
      } else {
        toast.error('Failed to upload any coupons. Check the error log.');
      }

    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error(error.message || 'Failed to process file');
    } finally {
      setIsUploading(false);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center hover:bg-muted/50 transition-colors">
        <input 
          type="file" 
          accept=".xlsx, .csv" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={isUploading}
        />
        
        <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">Upload Excel or CSV</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
          File must contain columns: Coupon Code, Discount Type, Discount Value, Expiry Date
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            Select File
          </Button>
          
          {file && (
            <Button onClick={processFile} disabled={isUploading}>
              {isUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><UploadCloud className="w-4 h-4 mr-2" /> Upload {file.name}</>
              )}
            </Button>
          )}
        </div>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading coupons...</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {results && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <Alert variant={results.failed > 0 ? (results.success === 0 ? "destructive" : "default") : "default"} className={results.failed === 0 ? "border-green-500/50 bg-green-500/10 text-green-700" : ""}>
            {results.failed === 0 ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4" />}
            <AlertTitle>Upload Complete</AlertTitle>
            <AlertDescription>
              Processed {results.total} rows. {results.success} successful, {results.failed} failed.
            </AlertDescription>
          </Alert>

          {results.errors.length > 0 && (
            <div className="bg-muted rounded-lg p-4 text-sm font-mono text-muted-foreground max-h-40 overflow-y-auto">
              {results.errors.map((err, i) => (
                <div key={i} className="mb-1 text-destructive">{err}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkCouponUpload;