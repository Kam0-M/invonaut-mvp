/**
 * Calculate the display status for an invoice
 * Automatically marks as 'overdue' if past due date and not paid
 */
export function getInvoiceDisplayStatus(invoice: {
    status: string;
    due_date: string;
  }): string {
    // If already paid or cancelled, return as-is
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      return invoice.status;
    }
    
    // Check if overdue
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today) {
      return 'overdue';
    }
    
    // Otherwise return the stored status
    return invoice.status;
  }
  
  /**
   * Check if a due date is overdue
   */
  export function isOverdue(dueDate: string, status: string): boolean {
    if (status === 'paid' || status === 'cancelled') return false;
    
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    
    return due < today;
  }