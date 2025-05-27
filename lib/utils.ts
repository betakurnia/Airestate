import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getGoogleMapsApiKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
}
