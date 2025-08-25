/**
 * This file contains sample data for various parts of the application.
 * It exports objects with CSV-formatted strings for procurement logs, expenses, and reimbursements.
 * This data is likely used for development, testing, or seeding a demonstration database.
 */
export const sampleLogs = {
    procurement: `itemId,itemName,quantity,cost,date
    p-001,Servo Motor,10,150,2023-01-15
    p-002,ESC 30A,10,200,2023-01-20
    p-003,Propeller 10x4.5,20,50,2023-02-01`,
    expenses: `expenseId,category,description,amount,date
    e-001,parts,Propellers,25,2023-07-10
    e-002,tools,Soldering Iron,45,2023-07-12
    e-003,parts,Connectors,15,2023-07-15`,
    reimbursement: `reimbursementId,member,amount,status,date
    r-001,Alex,35,paid,2023-06-05
    r-002,Jane,50,approved,2023-06-10
    r-003,Alex,25,pending,2023-06-15`
}

