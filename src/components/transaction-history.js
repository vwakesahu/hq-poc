"use client";

import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { SelectIcon } from "@radix-ui/react-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";

export const PaymentHistoryTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const payments = [
    {
      id: 1,
      date: "30 Sep 2024",
      recipient: "Testing",
      recipientAddress: "0x1...514",
      amount: "0.001 MATIC",
      sentFrom: "Deep",
      status: "Completed",
    },
    {
      id: 1,
      date: "30 Sep 2024",
      recipient: "Testing",
      recipientAddress: "0x1...514",
      amount: "0.001 MATIC",
      sentFrom: "Deep",
      status: "Pending",
    },
    {
      id: 1,
      date: "30 Sep 2024",
      recipient: "Testing",
      recipientAddress: "0x1...514",
      amount: "0.001 MATIC",
      sentFrom: "Deep",
      status: "Completed",
    },
  ];

  const filteredPayments = payments.filter(
    (payment) =>
      payment.recipient.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === "All" || payment.status === statusFilter)
  );

  const pageCount = Math.ceil(filteredPayments.length / itemsPerPage);

  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Payment History</h2>
        <div className="flex justify-between items-center mb-4">
          <div className="relative flex-grow mr-4">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              placeholder="Search by recipient name"
              className="pl-10 pr-4 py-2 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-shrink-0">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue>Status: {statusFilter}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Sent From</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <div className="font-medium">{payment.recipient}</div>
                  <div className="text-sm text-gray-500">
                    {payment.recipientAddress}
                  </div>
                </TableCell>
                <TableCell>{payment.amount}</TableCell>
                <TableCell>{payment.sentFrom}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      payment.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : payment.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {payment.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-1 items-center">
            <Button
              onClick={() => setCurrentPage(1)}
              variant="outline"
              disabled={currentPage === 1}
            >
              &lt;&lt;
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              &lt;
            </Button>
            <span className="px-2 py-1 text-sm">
              Page {currentPage} of {pageCount}
            </span>
            <Button
              variant="outline"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, pageCount))
              }
              disabled={currentPage === pageCount}
            >
              &gt;
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(pageCount)}
              disabled={currentPage === pageCount}
            >
              &gt;&gt;
            </Button>
          </div>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => setItemsPerPage(Number(value))}
          >
            <SelectTrigger className="w-32">
              <span>Show: {itemsPerPage}</span>
              <SelectIcon>
                <ChevronDown size={16} />
              </SelectIcon>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
