'use client'

import React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowDown, ArrowUp, Wallet } from "lucide-react"
import DriverSidebar from '@/app/components/DriverSidebar'

export default function WalletPage() {
  const transactions = [
    {
      id: 1,
      type: "Ride Payment",
      amount: 1200,
      date: "2025-08-02",
      status: "Completed",
    },
    {
      id: 2,
      type: "Withdrawal",
      amount: -800,
      date: "2025-07-29",
      status: "Pending",
    },
    {
      id: 3,
      type: "Ride Payment",
      amount: 900,
      date: "2025-07-27",
      status: "Completed",
    },
  ]

  return (
    <>
    <div className="space-y-8 bg-blue-50">
      
      <Card className='bg-[#005792]'>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-6 h-6 text-blue-50" />
            <CardTitle className='text-white'>Wallet Balance</CardTitle>
          </div>
          <Button variant="outline" className='bg-white text-[#00204a] hg-hover-'>Withdraw Funds</Button>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-white">KES 2,300</p>
          <p className="text-sm mt-1 text-white">Last updated: August 4, 2025</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount (KES)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{tx.date}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    {tx.amount > 0 ? <ArrowDown className="text-green-600 w-4 h-4" /> : <ArrowUp className="text-red-600 w-4 h-4" />}
                    {tx.type}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        tx.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">{tx.amount > 0 ? `+${tx.amount}` : `${tx.amount}`}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </>
  )
}
