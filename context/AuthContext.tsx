"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User as SupabaseUser } from "@supabase/supabase-js";


interface AuthContextType {
  user: SupabaseUser | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);

  
  useEffect(() => {
    const init = async () => {
      try {
        console.log("Initializing auth...");
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          return;
        }
        
        const currentUser = data.session?.user || null;
        console.log("Current user from session:", !!currentUser, currentUser?.id);
        setUser(currentUser);

        if (currentUser) {
          console.log("Attempting to upsert profile for current user:", currentUser.id);
          
          const profileData = { 
            id: currentUser.id, 
            online: true,
            username: currentUser.email?.split('@')[0] || `User_${currentUser.id.slice(0, 4)}`,
            last_seen: new Date().toISOString()
          };
          
          const { data: profileResult, error } = await supabase
            .from("profiles")
            .upsert(profileData, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            })
            .select();
          
          if (error) {
            console.error("Error upserting profile on init:", {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            });
          } else {
            console.log("Profile upserted successfully on init:", profileResult);
          }
        }
      } catch (error) {
        console.error("Error during auth initialization:", {
          error,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user || null;
      setUser(newUser);

      if (newUser) {
        try {
          const { error } = await supabase.from("profiles").upsert({ 
            id: newUser.id, 
            online: true,
            username: newUser.email?.split('@')[0] || `User_${newUser.id.slice(0, 4)}`,
            last_seen: new Date().toISOString()
          });
          
          if (error) {
            console.error("Error upserting profile on auth change:", error);
          }
        } catch (error) {
          console.error("Error handling auth state change:", error);
        }
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Sign up
  const signUp = async (email: string, password: string): Promise<void> => {
    email = email.trim();
    password = password.trim();
    
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      if (error.message.includes("duplicate key")) {
        throw new Error("User already exists. Try logging in.");
      }
      throw error;
    }

    if (data.user && data.session) {
      setUser(data.user);

      
      try {
        const { error: profileError } = await supabase.from("profiles").upsert({ 
          id: data.user.id, 
          online: true,
          username: data.user.email?.split('@')[0] || `User_${data.user.id.slice(0, 4)}`,
          last_seen: new Date().toISOString()
        });
        
        if (profileError) {
          console.error("Error creating profile on signup:", profileError);
        }
      } catch (profileError) {
        console.error("Error creating profile on signup:", profileError);
      }
    }
  };

  // Sign in
  const signIn = async (email: string, password: string): Promise<void> => {
    email = email.trim();
    password = password.trim();
    
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("Invalid email or password.");
      }
      throw error;
    }

    if (data.user) {
      setUser(data.user);

      
      try {
        const { error: profileError } = await supabase.from("profiles").upsert({ 
          id: data.user.id, 
          online: true,
          username: data.user.email?.split('@')[0] || `User_${data.user.id.slice(0, 4)}`,
          last_seen: new Date().toISOString()
        });
        
        if (profileError) {
          console.error("Error updating profile on signin:", profileError);
        }
      } catch (profileError) {
        console.error("Error updating profile on signin:", profileError);
      }
    }
  };

  
  const signOut = async (): Promise<void> => {
    if (user) {
      try {
        
        const { error } = await supabase
          .from("profiles")
          .update({ online: false })
          .eq("id", user.id);
          
        if (error) {
          console.error("Error marking user offline:", error);
        }
      } catch (error) {
        console.error("Error during profile update on signout:", error);
      }
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};