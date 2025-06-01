import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  showFilter?: boolean;
  onFilter?: () => void;
}

export default function SearchBar({ 
  placeholder = "Rechercher...", 
  onSearch, 
  showFilter = false,
  onFilter 
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-10 bg-transparent border-0 text-white placeholder:text-gray-400 focus:ring-0 focus-visible:ring-0"
        />
      </div>
      {showFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onFilter}
          className="text-gray-400 hover:text-white hover:bg-white/10"
        >
          <Filter className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}