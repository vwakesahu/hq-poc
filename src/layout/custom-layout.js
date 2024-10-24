"use client";
import React from "react";
import { usePrivy } from "@privy-io/react-auth";
import Sidebar from "./sidebar";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/navbar";

const CustomLayout = ({ children, linkset = "default" }) => {
  const { ready, login, authenticated } = usePrivy();

  const LoginUI = () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-50">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Hey!, Welcome to HQ POC,</CardTitle>
          <CardDescription>Connect your wallet to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={login}
            className="w-full"
          >
            Connect Wallet
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  if (!ready) {
    return (
      <div className="h-screen w-full grid place-items-center">
        <Loader />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="h-screen w-full grid place-items-center">
        <LoginUI />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex h-full overflow-hidden">
        <Sidebar linkSet={linkset} />
        <main className="flex-grow">
          <div className="h-full pb-6 pr-5">
            <div className="bg-white border overflow-auto h-full rounded-lg shadow-sm">
              {!ready ? (
                <div className="h-full w-full flex items-center justify-center">
                  <Loader />
                </div>
              ) : (
                children
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomLayout;
