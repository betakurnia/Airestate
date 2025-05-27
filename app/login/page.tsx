"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/utils";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await getSupabaseClient().auth.getSession();
      if (data.session) {
        router.replace("/");
      }
    };
    checkSession();
  }, [router]);

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <LoginForm />
      </div>
    </div>
  );
}
