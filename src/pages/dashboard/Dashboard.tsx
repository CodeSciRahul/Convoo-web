import { Sidebar } from "@/components/sidebar";
import { Outlet } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import FallbackUI from "@/components/fallbackUI";
import { useEffect } from "react";
import { useAppSelecter } from "@/Redux/Hooks/store";
import { initPresence } from "@/services/socketService";

export default function Dashboard() {
  const userId = useAppSelecter((state) => state.auth.user?._id);

  useEffect(() => {
    if (userId) initPresence(userId);
  }, [userId]);

  return (
    <>
    <ErrorBoundary FallbackComponent={FallbackUI}>
     <div className="h-screen overflow-hidden flex flex-col bg-slate-50">

        <div className="flex flex-1 mb-16">
          <Sidebar className="hidden sm:block h-full w-[30%] shadow-sm" />
          <div className="flex-grow w-full bg-white shadow-sm">
            <Outlet />
          </div>
        </div>
      </div>
    </ErrorBoundary>
    </>
  );
}
