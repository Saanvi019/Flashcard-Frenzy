"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useOnlineStatus(userId?: string, username?: string) {
  useEffect(() => {
    if (!userId) return;

    const markOnline = async () => {
      await supabase.from("profiles").upsert(
        {
          id: userId,
          username,
          online: true,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    };

    const markOffline = async () => {
      await supabase
        .from("profiles")
        .update({ online: false, last_seen: new Date().toISOString() })
        .eq("id", userId);
    };

   
    markOnline();

    
    const interval = setInterval(markOnline, 30_000);

    
    const handleBeforeUnload = () => {
      navigator.sendBeacon(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
        JSON.stringify({ online: false })
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      markOffline();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [userId, username]);
}
