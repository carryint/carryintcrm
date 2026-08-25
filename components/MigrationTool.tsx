import React, { useState } from 'react';
import { supabase } from '../supabase';
import { prepareInvoiceForSupabase } from '../utils';

export const MigrationTool: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready to migrate');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleMigrateFromFile = async () => {
    if (!file) {
      setStatus('Please select a JSON backup file first.');
      return;
    }

    setLoading(true);
    setStatus('Reading file...');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        // 1. Company Info
        if (data.companyInfo) {
          setStatus('Migrating company info...');
          const infoWithId = { id: '1', ...data.companyInfo };
          const { error } = await supabase.from('company_info').upsert([infoWithId]);
          if (error) throw error;
        }

        // 2. Customers
        if (data.customers && data.customers.length > 0) {
          setStatus('Migrating customers...');
          const { error } = await supabase.from('customers').upsert(data.customers);
          if (error) throw error;
        }

        // 3. Vendors
        if (data.vendors && data.vendors.length > 0) {
          setStatus('Migrating vendors...');
          const { error } = await supabase.from('vendors').upsert(data.vendors);
          if (error) throw error;
        }
        // 4. Invoices
        if (data.invoices && data.invoices.length > 0) {
          setStatus('Migrating invoices...');
          const preparedInvoices = data.invoices.map(prepareInvoiceForSupabase);
          const { error } = await supabase.from('invoices').upsert(preparedInvoices);
          if (error) throw error;
        }

        // 5. Expenses
        if (data.expenses && data.expenses.length > 0) {
          setStatus('Migrating expenses...');
          const { error } = await supabase.from('expenses').upsert(data.expenses);
          if (error) throw error;
        }

        // 6. Adjustment Notes
        if (data.adjustmentNotes && data.adjustmentNotes.length > 0) {
          setStatus('Migrating adjustment notes...');
          // Map to match the schema if needed, but it should match
          const { error } = await supabase.from('adjustment_notes').upsert(data.adjustmentNotes);
          if (error) throw error;
        }

        setStatus('Migration complete! All data from the backup file is now in Supabase.');
      } catch (error: any) {
        console.error(error);
        setStatus(`Migration failed: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px 0', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Upload Data Backup to Database</h3>
      <p style={{ marginBottom: '15px' }}>
        Since your data is on the live website, please do this:
        <br/>1. Go to the live website and download the <strong>Full System Backup (ZIP)</strong>.
        <br/>2. Unzip the file on your computer. Inside, you will find a <strong>.json</strong> file.
        <br/>3. Select that <strong>.json</strong> file here and click "Run Migration".
      </p>
      
      <div style={{ marginBottom: '15px' }}>
        <input 
          type="file" 
          accept=".json"
          onChange={handleFileChange}
          style={{ marginBottom: '10px' }}
        />
      </div>

      <button 
        onClick={handleMigrateFromFile}
        disabled={loading || !file}
        style={{
          padding: '8px 16px',
          backgroundColor: (loading || !file) ? '#9ca3af' : '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: (loading || !file) ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Migrating...' : 'Run Migration from JSON Backup'}
      </button>
      
      <p style={{ marginTop: '10px', fontSize: '14px', color: '#4b5563' }}>
        Status: <strong>{status}</strong>
      </p>
    </div>
  );
};
