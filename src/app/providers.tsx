"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { Provider as JotaiProvider } from "jotai";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";

const CACHE_TIME = 1000 * 60 * 60 * 24; // 24 hours

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            gcTime: CACHE_TIME,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
          },
        },
      })
  );

  const [persister, setPersister] = useState<ReturnType<
    typeof createSyncStoragePersister
  > | null>(null);

  useEffect(() => {
    // Create persister only on client side
    setPersister(
      createSyncStoragePersister({
        storage: window.localStorage,
        key: "epyscenario-query-cache",
      })
    );
  }, []);

  // Show nothing or a loader until persister is ready
  if (!persister) {
    return null;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: CACHE_TIME,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Only persist successful queries for static data
            const queryKey = query.queryKey;
            const isStaticData =
              queryKey[0] === "models" ||
              queryKey[0] === "populations";
            return query.state.status === "success" && isStaticData;
          },
        },
      }}
    >
      <JotaiProvider>
        {children}
        <Toaster position="bottom-right" richColors />
      </JotaiProvider>
    </PersistQueryClientProvider>
  );
}
