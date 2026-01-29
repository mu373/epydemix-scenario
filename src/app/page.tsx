import { SetupPanel } from "@/components/setup/SetupPanel";
import { VizPanel } from "@/components/viz/VizPanel";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container flex h-14 items-center px-4">
          <h1 className="text-lg font-semibold">Epidemic Scenario Dashboard</h1>
          {/* <span className="ml-2 text-sm text-muted-foreground">
            Epidemic Scenario Dashboard
          </span> */}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Setup Panel - Left Column */}
        <aside className="w-[400px] border-r bg-muted/30 overflow-y-auto">
          <SetupPanel />
        </aside>

        {/* Visualization Panel - Right Column */}
        <main className="flex-1 overflow-y-auto">
          <VizPanel />
        </main>
      </div>
    </div>
  );
}
