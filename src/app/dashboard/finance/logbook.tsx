
"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const logbookData = [
    { date: '23/06/2024', assetGroup: "Owner's Equity", account: "Stockholders' Equity", description: 'Opening Balance', credit: 121517.38, balance: 121517.38 },
    { date: '24/06/2024', assetGroup: 'Current Assets', account: 'Cash', description: 'Bank Interest', debit: 833.00, balance: 122350.38 },
    { date: '10/09/2024', assetGroup: 'Current Assets', account: 'Cash', description: 'Received Cash', debit: 68295.95, balance: 190646.33 },
    { date: '10/09/2024', assetGroup: 'Current Liabilities', account: 'Manoj Soni', description: 'Received Cash', credit: 68295.95, balance: 122350.38 },
    { date: '10/09/2024', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'ESP32/ESP8266/ESP-07', debit: 649.00, balance: 122999.38 },
    { date: '10/09/2024', assetGroup: 'Current Assets', account: 'Cash', description: 'ESP32/ESP8266/ESP-07', credit: 649.00, balance: 122350.38 },
    { date: '10/09/2024', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'Wifi Dongle x2', debit: 1798.00, balance: 124148.38 },
    { date: '10/09/2024', assetGroup: 'Current Assets', account: 'Cash', description: 'Wifi Dongle x2', credit: 1798.00, balance: 122350.38 },
    { date: '10/09/2024', assetGroup: 'Current Assets', account: 'Perishables', description: 'Fibreglass Tape x6', debit: 1550.00, balance: 123900.38 },
    { date: '10/09/2024', assetGroup: 'Current Assets', account: 'Cash', description: 'Fibreglass Tape x6', credit: 1550.00, balance: 122350.38 },
    { date: '10/09/2024', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'ESP32 DevkitC x2', debit: 1217.00, balance: 123567.38 },
    { date: '10/09/2024', assetGroup: 'Current Assets', account: 'Cash', description: 'ESP32 DevkitC x2', credit: 1217.00, balance: 122350.38 },
    { date: '11/09/2024', assetGroup: 'Fixed Assets', account: 'BOSM24 Equipment', description: 'Pixhawk 2.4.8 with GPS', debit: 14231.00, balance: 136581.38 },
    { date: '11/09/2024', assetGroup: 'Current Assets', account: 'Cash', description: 'Pixhawk 2.4.8 with GPS', credit: 14231.00, balance: 122350.38 },
    { date: '11/09/2024', assetGroup: 'Fixed Assets', account: 'BOSM24 Equipment', description: 'Sandisk SD Card 8GB', debit: 319.00, balance: 122669.38 },
    { date: '11/09/2024', assetGroup: 'Current Assets', account: 'Cash', description: 'Sandisk SD Card 8GB', credit: 319.00, balance: 122350.38 },
    { date: '11/09/2024', assetGroup: 'Fixed Assets', account: 'BOSM24 Equipment', description: 'WS2812 neopixel matrix 4*4', debit: 1216.00, balance: 123566.38 },
    { date: '11/09/2024', assetGroup: 'Current Assets', account: 'Cash', description: 'WS2812 neopixel matrix 4*4', credit: 1216.00, balance: 122350.38 },
    { date: '11/09/2024', assetGroup: 'Fixed Assets', account: 'BOSM24 Equipment', description: '40A ESC', debit: 1900.00, balance: 124250.38 },
    { date: '11/09/2024', assetGroup: 'Current Assets', account: 'Cash', description: '40A ESC', credit: 1900.00, balance: 122350.38 },
    { date: '11/09/2024', assetGroup: 'Current Assets', account: 'BOSM24 Equipment', description: 'Shipping for the 4 orders above', debit: 152.60, balance: 122502.98 },
    { date: '11/09/2024', assetGroup: 'Current Assets', account: 'Cash', description: 'Shipping for the 4 orders above', credit: 152.60, balance: 122350.38 },
    { date: '11/09/2024', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'Pixhawk 2.4.8 with GPS', debit: 14231.00, balance: 136581.38 },
    { date: '11/09/2024', assetGroup: 'Current Assets', account: 'Cash', description: 'Pixhawk 2.4.8 with GPS', credit: 14231.00, balance: 122350.38 },
    { date: '11/09/2024', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'Sandisk SD Card 8GB', debit: 319.00, balance: 122669.38 },
    { date: '11/09/2024', assetGroup: 'Current Assets', account: 'Cash', description: 'Sandisk SD Card 8GB', credit: 319.00, balance: 122350.38 },
    { date: '11/09/2024', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: '40A ESC', debit: 3800.00, balance: 126150.38 },
    { date: '11/09/2024', assetGroup: 'Current Assets', account: 'Cash', description: '40A ESC', credit: 3800.00, balance: 122350.38 },
    { date: '11/09/2024', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'USB-UART TTL', debit: 158.00, balance: 122508.38 },
    { date: '11/09/2024', assetGroup: 'Current Assets', account: 'Cash', description: 'USB-UART TTL', credit: 158.00, balance: 122350.38 },
    { date: '11/09/2024', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'EMAX MT2213 BLDC Motor 935kv', debit: 5715.00, balance: 128065.38 },
    { date: '11/09/2024', assetGroup: 'Current Assets', account: 'Cash', description: 'EMAX MT2213 BLDC Motor 935kv', credit: 5715.00, balance: 122350.38 },
    { date: '11/09/2024', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'F450 F550 Frame Landing Gear', debit: 1359.00, balance: 123709.38 },
    { date: '11/09/2024', assetGroup: 'Current Assets', account: 'Cash', description: 'F450 F550 Frame Landing Gear', credit: 1359.00, balance: 122350.38 },
    { date: '11/09/2024', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'HollyBro M9N GPS', debit: 9320.00, balance: 131670.38 },
    { date: '11/09/2024', assetGroup: 'Current Assets', account: 'Cash', description: 'HollyBro M9N GPS', credit: 9320.00, balance: 122350.38 },
    { date: '11/09/2024', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'EasyMech M2.5 x 8mm 12pcs Nuts and Bolts', debit: 398.00, balance: 122748.38 },
    { date: '11/09/2024', assetGroup: 'Current Assets', account: 'Cash', description: 'EasyMech M2.5 x 8mm 12pcs Nuts and Bolts', credit: 398.00, balance: 122350.38 },
    { date: '11/09/2024', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'Shipping for the 8 orders above', debit: 267.40, balance: 122617.78 },
    { date: '11/09/2024', assetGroup: 'Current Assets', account: 'Cash', description: 'Shipping for the 8 orders above', credit: 267.40, balance: 122350.38 },
    { date: '11/09/2024', assetGroup: "Owner's Equity", account: "Stockholders' Equity", description: 'Robofest Money', credit: 50000.00, balance: 72350.38 },
    { date: '11/09/2024', assetGroup: 'Current Assets', account: 'Cash', description: 'Robofest Money', debit: 50000.00, balance: 122350.38 },
];

const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '';
    return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export default function Logbook() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Financial Logbook</CardTitle>
                <CardDescription>A detailed record of all financial transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Asset Group</TableHead>
                            <TableHead>Account</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logbookData.map((entry, index) => (
                            <TableRow key={index}>
                                <TableCell className="whitespace-nowrap">{entry.date}</TableCell>
                                <TableCell>{entry.assetGroup}</TableCell>
                                <TableCell>{entry.account}</TableCell>
                                <TableCell>{entry.description}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(entry.debit)}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(entry.credit)}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(entry.balance)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
