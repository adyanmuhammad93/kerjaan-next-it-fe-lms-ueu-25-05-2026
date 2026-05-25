import * as React from "react"
import { Check, Search, ChevronRight, ChevronDown } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./Button"
import { Input } from "./Input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./Command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./Popover"

export interface TreeNode {
  label: string;
  value: string;
  children?: TreeNode[];
}

interface TreeSelectProps {
  data: TreeNode[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TreeSelect({ data, value, onChange, placeholder = "Select option...", className }: TreeSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({})
  const [search, setSearch] = React.useState("")

  const toggleExpand = (e: React.MouseEvent, nodeValue: string) => {
    e.stopPropagation()
    setExpanded(prev => ({ ...prev, [nodeValue]: !prev[nodeValue] }))
  }

  const findLabel = (nodes: TreeNode[], targetValue: string): string | undefined => {
    for (const node of nodes) {
      if (node.value === targetValue) return node.label
      if (node.children) {
        const found = findLabel(node.children, targetValue)
        if (found) return found
      }
    }
    return undefined
  }

  const renderTree = (nodes: TreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const isExpanded = search.length > 0 ? true : (expanded[node.value] || false);
      const hasChildren = node.children && node.children.length > 0;
      
      // Use label for cmdk value so search works, but we pass node.value to onChange
      // We make it unique by appending value to label for searching
      const searchKey = `${node.label} ${node.value}`;

      return (
        <React.Fragment key={node.value}>
          <CommandItem
            value={searchKey}
            onSelect={() => {
              onChange(node.value)
              setSearch("")
              setOpen(false)
            }}
            style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
            className="flex items-center gap-2 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
          >
            {hasChildren ? (
              <div 
                className="cursor-pointer p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors z-10"
                onClick={(e) => toggleExpand(e, node.value)}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
            ) : (
              <div className="w-6" />
            )}
            
            <Check
              className={cn(
                "h-4 w-4 text-ueu-blue",
                value === node.value ? "opacity-100" : "opacity-0"
              )}
            />
            <span className={cn("text-slate-700", hasChildren && "font-bold text-ueu-navy")}>{node.label}</span>
          </CommandItem>
          {hasChildren && isExpanded && renderTree(node.children!, depth + 1)}
        </React.Fragment>
      )
    })
  }

  const displayPlaceholder = placeholder.includes("...") ? placeholder.replace("...", "") : placeholder;

  const getFlatNodes = (nodes: TreeNode[]): TreeNode[] => {
    let result: TreeNode[] = [];
    nodes.forEach(node => {
      result.push(node);
      if (node.children) {
        result = [...result, ...getFlatNodes(node.children)];
      }
    });
    return result;
  };

  const flatNodes = React.useMemo(() => getFlatNodes(data), [data]);
  const filteredNodes = React.useMemo(() => {
    if (!search) return [];
    return flatNodes.filter(node => 
      node.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [flatNodes, search]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full h-14 justify-between rounded-2xl border-slate-200 px-6 font-medium bg-slate-50/50 hover:bg-white transition-all text-ueu-navy focus:ring-4 focus:ring-ueu-blue/5 focus:border-ueu-blue", className, !value && "text-slate-400")}
        >
          <span className="truncate">{value ? findLabel(data, value) : placeholder}</span>
          <ChevronDown className="ml-2 h-5 w-5 shrink-0 opacity-50 text-slate-300" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden" 
        align="start" 
        sideOffset={8}
      >
        <Command className="bg-white" shouldFilter={false}>
          <div className="flex items-center border-b px-4 bg-slate-50/50">
            <Search className="h-4 w-4 mr-2 text-slate-400" />
            <Input 
              placeholder={`Search ${displayPlaceholder.toLowerCase()}...`} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none focus:ring-0 h-12 bg-transparent p-0 font-medium"
            />
          </div>
          <CommandList className="max-h-[300px] overflow-y-auto p-2">
            {!search && renderTree(data)}
            {search && filteredNodes.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-slate-400 font-medium">No results found for "{search}"</p>
              </div>
            )}
            {search && filteredNodes.map(node => (
              <CommandItem
                key={node.value}
                value={node.label}
                onSelect={() => {
                  onChange(node.value)
                  setSearch("")
                  setOpen(false)
                }}
                className="flex items-center gap-2 py-3 px-4 cursor-pointer hover:bg-slate-50 rounded-xl"
              >
                <Check
                  className={cn(
                    "h-4 w-4 text-ueu-blue",
                    value === node.value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="text-slate-700">{node.label}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
