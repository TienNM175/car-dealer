"use client";
import React, { useState } from "react";
import LoginPage from "@/components/auth/LoginForm";

export default function Login() {
  const [userRole, setUserRole] = useState<string | null>(null);

  return (
    <>
      {!userRole ? (
        <LoginPage onLogin={setUserRole} />
      ) : (
        <div>Redirect to Dashboard for role: {userRole}</div>
      )}
    </>
  );
}
