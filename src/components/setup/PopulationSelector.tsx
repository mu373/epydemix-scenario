"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { populationsQueryOptions } from "@/lib/api/queries";
import {
  workspaceAtom,
  setWorkspacePopulationAtom,
} from "@/lib/atoms/workspace";

interface PopulationSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function PopulationSelector({
  value,
  onChange,
}: PopulationSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useQuery(populationsQueryOptions);
  const workspace = useAtomValue(workspaceAtom);
  const setWorkspacePopulation = useSetAtom(setWorkspacePopulationAtom);

  const handleSelect = (name: string) => {
    setWorkspacePopulation(name);
    onChange(name);
    setOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Population</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label>Population</Label>
        <div className="text-sm text-destructive">
          Failed to load populations: {error.message}
        </div>
      </div>
    );
  }

  const selectedPopulation = data?.populations.find((p) => p.name === value);

  return (
    <div className="space-y-2">
      <Label>Population</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={workspace.isLocked}
          >
            {selectedPopulation?.display_name || "Select population..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search populations..." />
            <CommandList>
              <CommandEmpty>No population found.</CommandEmpty>
              <CommandGroup>
                {data?.populations.map((population) => (
                  <CommandItem
                    key={population.name}
                    value={population.display_name}
                    onSelect={() => handleSelect(population.name)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === population.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {population.display_name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
