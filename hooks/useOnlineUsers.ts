"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Profile {
  id: string;
  username?: string;
  online: boolean;
  last_seen?: string;
  [key: string]: any;
}

export function useOnlineUsers(currentUserId?: string) {
  const [onlineUsers, setOnlineUsers] = useState<Profile[]>([]);

  useEffect(() => {
    let isMounted = true;

    
    const fetchOnlineUsers = async () => {
      try {
        console.log("Fetching online users...");
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("online", true);

        console.log("Fetch result:", { data, error });

        if (error) {
          console.error("Error fetching online users:", error);
          return;
        }

        if (data && isMounted) {
          console.log("Setting online users:", data);
          setOnlineUsers(data);
        }
      } catch (err) {
        console.error("Error in fetchOnlineUsers:", err);
      }
    };

    fetchOnlineUsers();

    
    const subscription = supabase
      .channel("online-users-channel")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "profiles",
          filter: "online=eq.true" 
        },
        (payload: any) => {
          console.log("Realtime update received:", payload);
          
          if (!isMounted) return;

          setOnlineUsers((prev) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            
            switch (eventType) {
              case "INSERT":
              case "UPDATE":
                if (newRecord?.online) {
                  
                  const filtered = prev.filter(u => u.id !== newRecord.id);
                  return [...filtered, newRecord];
                } else {
                  
                  return prev.filter(u => u.id !== newRecord.id);
                }
              
              case "DELETE":
                return prev.filter(u => u.id !== oldRecord.id);
              
              default:
                return prev;
            }
          });
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("Cleaning up subscription...");
      isMounted = false;
      supabase.removeChannel(subscription);
    };
  }, [currentUserId]);

  return onlineUsers;
}