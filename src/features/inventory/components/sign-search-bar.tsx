"use client"

import { useState, useEffect } from 'react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Search, X } from 'lucide-react'

interface SignSearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  suggestions?: string[]
  onSuggestionClick?: (suggestion: string) => void
}

export function SignSearchBar({ 
  value, 
  onChange, 
  placeholder = "Search by name, category, theme, or keywords...",
  suggestions = [],
  onSuggestionClick
}: SignSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('yce-inventory-recent-searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load recent searches:', error)
      }
    }
  }, [])

  const handleSearch = (searchValue: string) => {
    onChange(searchValue)
    
    if (searchValue.trim()) {
      // Add to recent searches
      const updated = [searchValue, ...recentSearches.filter(s => s !== searchValue)].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem('yce-inventory-recent-searches', JSON.stringify(updated))
    }
    
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange('')
    setIsOpen(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion)
    if (onSuggestionClick) {
      onSuggestionClick(suggestion)
    }
  }

  const displaySuggestions = suggestions.length > 0 ? suggestions : recentSearches

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-neutral-400" />
        </div>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          className="pl-10 pr-10 h-12 text-base"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-neutral-600"
          >
            <X className="h-5 w-5 text-neutral-400" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && displaySuggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          <div className="py-1">
            {suggestions.length > 0 && (
              <div className="px-3 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Suggestions
              </div>
            )}
            {suggestions.length === 0 && recentSearches.length > 0 && (
              <div className="px-3 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                Recent Searches
                <button
                  onClick={() => {
                    setRecentSearches([])
                    localStorage.removeItem('yce-inventory-recent-searches')
                  }}
                  className="text-xs text-neutral-400 hover:text-neutral-600"
                >
                  Clear
                </button>
              </div>
            )}
            {displaySuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none"
              >
                <div className="flex items-center">
                  <Search className="h-4 w-4 text-neutral-400 mr-2" />
                  {suggestion}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}