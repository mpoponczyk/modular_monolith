import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

function getInvoiceDocument(data: any) {
    const doc = new jsPDF()
    const seller = data.trip?.seller || {
        name: "FerryPortal Polska Sp. z o.o.",
        address: "ul. Portowa 1",
        city: "Krynica Morska",
        postal_code: "82-120",
        nip: "123-456-78-90",
        bank_account_number: "PL 00 1234 5678 9012 3456 7890 1234"
    }

    // Graphical Header
    doc.setFillColor(30, 58, 138) // Deep Blue
    doc.rect(0, 0, 210, 40, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(28)
    doc.setFont("helvetica", "bold")
    doc.text("INVOICE", 140, 25)

    doc.setFontSize(14)
    doc.text(seller.name.toUpperCase(), 15, 20)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`${seller.address}, ${seller.postal_code} ${seller.city}`, 15, 28)
    doc.text(`NIP: ${seller.nip}`, 15, 33)

    // Reset Color
    doc.setTextColor(0, 0, 0)

    // Invoice Meta
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("INVOICE DETAILS", 140, 55)
    doc.setFont("helvetica", "normal")
    const invId = data.id?.slice(0, 8).toUpperCase() || "DRAFT"
    doc.text(`Invoice No:  INV-${invId}`, 140, 62)
    doc.text(`Date:         ${new Date().toLocaleDateString()}`, 140, 67)
    doc.text(`Currency:     ${data.currency || 'PLN'}`, 140, 72)

    // Customer / Bill To
    doc.setFont("helvetica", "bold")
    doc.text("BILL TO", 15, 55)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)
    doc.text(data.customer_first_name || "Guest", 15, 62)
    doc.text(data.customer_email || "No email", 15, 67)

    // Divider
    doc.setDrawColor(200, 200, 200)
    doc.line(15, 80, 195, 80)

    // Trip Info Section
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("TRAVEL INFORMATION", 15, 90)
    doc.setFont("helvetica", "normal")

    const route = data.trip?.route || {};
    const origin = route.origin?.name || "Departure"
    const destination = route.destination?.name || "Arrival"
    const departure = data.trip?.departure_time ? new Date(data.trip.departure_time).toLocaleString() : "TBD"

    doc.text(`Route:      ${origin} to ${destination}`, 15, 97)
    doc.text(`Departure:  ${departure}`, 15, 102)
    doc.text(`Ferry:      ${data.trip?.ferry?.name || 'Standard Ferry'}`, 15, 107)

    // Items Table
    const tableData = [
        ['Ferry Passage - Base Fare', (data.count_passengers || 1).toString(), 'Standard', data.total_amount || '0.00'],
        ['Bicycle Supplement', (data.count_bikes || 0).toString(), 'Extra', '0.00'],
        ['Pet Supplement', (data.count_pets || 0).toString(), 'Extra', '0.00'],
    ]

    autoTable(doc, {
        startY: 115,
        head: [['Description', 'Qty', 'Category', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
            3: { halign: 'right' }
        },
        didDrawPage: (dataObj) => {
            // Summary at bottom of table
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const finalY = (dataObj as any).cursor.y + 10
            doc.setFontSize(14)
            doc.setFont("helvetica", "bold")
            doc.text(`TOTAL AMOUNT: ${data.total_amount || 0} ${data.currency || 'PLN'}`, 195, finalY, { align: 'right' })
        }
    })

    // Payment Info & Footer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastY = (doc as any).lastAutoTable?.finalY || 180
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("PAYMENT INFORMATION", 15, lastY + 25)
    doc.setFont("helvetica", "normal")
    doc.text(`Bank Account: ${seller.bank_account_number || 'N/A'}`, 15, lastY + 32)
    doc.text("Status:        PAID IN FULL (PRZELEWY24)", 15, lastY + 37)

    // Graphical "PAID" Stamp
    doc.setDrawColor(34, 197, 94) // Green
    doc.setLineWidth(1)
    doc.roundedRect(140, lastY + 20, 40, 20, 2, 2)
    doc.setTextColor(34, 197, 94)
    doc.setFontSize(14)
    doc.text("PAID", 160, lastY + 33, { align: "center", angle: 5 })

    doc.setTextColor(150, 150, 150)
    doc.setFontSize(8)
    doc.text("Thank you for choosing FerryPortal. Have a safe journey!", 105, 285, { align: 'center' })

    return doc
}

export function generateInvoicePDF(data: any) {
    const doc = getInvoiceDocument(data)
    doc.save(`Invoice_${data.id?.slice(0, 8) || 'Draft'}.pdf`)
}

export async function generateInvoicePDFBuffer(data: any): Promise<Buffer> {
    const doc = getInvoiceDocument(data)
    const arrayBuffer = doc.output('arraybuffer')
    return Buffer.from(arrayBuffer)
}
