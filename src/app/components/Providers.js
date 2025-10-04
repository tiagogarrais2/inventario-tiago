"use client";
import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "./Notifications";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </SessionProvider>
  );
}
