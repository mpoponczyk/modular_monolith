
export interface Invoice {
    id: string;
    invoice_number: string;
    customer_name: string;
    total_amount: number;
    currency: string;
    status: 'issued' | 'paid' | 'cancelled';
    issue_date: string;
    due_date?: string;
}

export interface InvoiceRepository {
    getInvoices(tenantId: string): Promise<Invoice[]>;
    generateInvoice(tenantId: string, invoiceId: string): Promise<string>; // Returns HTML string
}
