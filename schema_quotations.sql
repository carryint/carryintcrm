-- Carryint CRM Quotations Table Schema
CREATE TABLE IF NOT EXISTS public.quotations (
  id TEXT PRIMARY KEY,
  "quotationNumber" TEXT NOT NULL,
  date TEXT NOT NULL,
  "validityDate" TEXT NOT NULL,
  "customerCategory" TEXT NOT NULL DEFAULT 'COMMERCIAL',
  "customerId" TEXT,
  "customerName" TEXT NOT NULL,
  "customerAddress" TEXT,
  "customerContact" TEXT,
  "customerEmail" TEXT,
  "customerVat" TEXT,
  "pickupAddress" TEXT,
  "deliveryAddress" TEXT,
  "originCountry" TEXT,
  "destinationCountry" TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  "vatAmount" NUMERIC NOT NULL DEFAULT 0,
  "totalAmount" NUMERIC NOT NULL DEFAULT 0,
  "notesAndTerms" TEXT,
  "includeSeal" BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  "createdBy" TEXT,
  "createdByName" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT,
  "updatedBy" TEXT,
  "updatedByName" TEXT,
  "auditLogs" JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS and public access
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to quotations" ON public.quotations;
CREATE POLICY "Allow all access to quotations" ON public.quotations FOR ALL USING (true) WITH CHECK (true);
