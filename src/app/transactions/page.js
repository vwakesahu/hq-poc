"use client";
import { PaymentHistoryTable } from "@/components/transaction-history";
import BasicPageLayout from "@/layout/basic-page-layout";
import React from "react";

const Page = () => {
  return (
    <BasicPageLayout>
      <PaymentHistoryTable />
    </BasicPageLayout>
  );
};

export default Page;
