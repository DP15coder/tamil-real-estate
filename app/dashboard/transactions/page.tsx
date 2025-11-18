"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, RefreshCw } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    buyerName: "",
    sellerName: "",
    surveyNumber: "",
    documentNumber: "",
    district: "",
  });

  async function fetchTransactions() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/transactions?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTransactions(data.transactions);
        console.log(data.transactions,"what is inside transactiosn")
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  function handleFilterChange(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleSearch() {
    fetchTransactions();
  }

  function handleReset() {
    setFilters({
      executant: "",
      claimant: "",
      surveyNumber: "",
      documentNumber: "",
      district: "",
    });
    fetchTransactions();
  }

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Transactions</CardTitle>
          <CardDescription>
            Filter transactions by buyer, seller, survey number, document number, or district
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buyer Name</label>
              <Input
                placeholder="Search buyer name..."
                value={filters.executant}
                onChange={(e) => handleFilterChange("buyerName", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Seller Name</label>
              <Input
                placeholder="Search seller name..."
                value={filters.claimant}
                onChange={(e) => handleFilterChange("sellerName", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Survey Number</label>
              <Input
                placeholder="Search survey number..."
                value={filters.surveyNumber}
                onChange={(e) => handleFilterChange("surveyNumber", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Document Number</label>
              <Input
                placeholder="Search document number..."
                value={filters.documentNumber}
                onChange={(e) => handleFilterChange("documentNumber", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">District</label>
              <Input
                placeholder="Search district..."
                value={filters.district}
                onChange={(e) => handleFilterChange("district", e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </Button>
            <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Card */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({transactions.length})</CardTitle>
          <CardDescription>
            All extracted and translated transactions from uploaded PDFs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions found. Upload a PDF to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doc #</TableHead>
                    <TableHead>Survey #</TableHead>
                    <TableHead>Claimant (Buyer)</TableHead>
                    <TableHead>Executant (Seller)</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>House #</TableHead>
                    <TableHead>Reg. Date</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-xs">
                        {transaction.documentNumber || "N/A"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {transaction.surveyNumber || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="font-medium truncate">
                            {transaction.claimant || "N/A"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="font-medium truncate">
                            {transaction.executant || "N/A"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.transactionType || "N/A"}</TableCell>
                      <TableCell>{transaction.houseNumber || "N/A"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {transaction.registrationDate || "N/A"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {transaction.propertyValue || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

