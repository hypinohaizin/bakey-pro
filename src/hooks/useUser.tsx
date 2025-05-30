"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/libs/SupabaseClient";

export function useUser() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.user) {
        await supabase.auth.signOut();
        router.push("/login/");
        return;
      }

      const { data: authUser, error } = await supabase.auth.getUser();
      if (error || !authUser.user?.id) {
        console.error("Error fetching user:", error?.message);
        await supabase.auth.signOut();
        router.push("/login/");
        return;
      }

      const currentUid = authUser.user.id;
      setUid(currentUid);

      const response = await fetch("/api/user/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          uid: currentUid,
        }),
      });

      if (!response.ok) {
        console.error("An Unexpected Error has occurred:", await response.text());
        await supabase.auth.signOut();
        router.push("/login/");
        return;
      }

      const userData = await response.json();
      setUser(userData.data);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  return { uid, user, loading };
};