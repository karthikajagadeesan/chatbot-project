"use client"

import React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowDownUp, MoveDown, MoveUp, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { DualRangeSlider } from "@/components/ui/dual-range-slider"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"

// Update the Column interface to be generic
interface Column<T extends Record<string, unknown>> {
  key: (keyof T & string) | "actions" | "checkbox"
  title: string
  render?: (value: unknown, item: T) => React.ReactNode
  type?: "range" | "select" | "ratio"
  align?: "left" | "center" | "right"
  getOptionLabel?: (value: string) => string
}

export type { Column }

interface ResponsiveTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  maxHeightDesktop?: number
  mobileCardRender?: (item: T, index: number) => React.ReactNode
  specialButtons?: React.ReactNode
  loading?: boolean
}

// Update the filterState interface and initial state
interface FilterState {
  [key: string]: Set<string> | { min: number; max: number; current: [number, number] }
}

// Helper to safely render any value as ReactNode
function toStringOrNode(val: unknown): React.ReactNode {
  if (val === null || val === undefined) return ""
  if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") return String(val)
  if (typeof val === "object" && React.isValidElement(val)) return val
  return String(val)
}

export default function ResponsiveTable<T extends Record<string, unknown>>({
  columns,
  data,
  maxHeightDesktop,
  specialButtons,
  mobileCardRender,
  loading,
}: ResponsiveTableProps<T>) {
  const [isMobile, setIsMobile] = useState(false)
  const [sortedData, setSortedData] = useState<T[]>([...data])
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [filterState, setFilterState] = useState<FilterState>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [availableFilters, setAvailableFilters] = useState<{
    [key: string]: Set<string> | { min: number; max: number }
  }>({})

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  // Update the useEffect that initializes available filter options to only check for type
  useEffect(() => {
    // Initialize available filter options
    const filters: { [key: string]: Set<string> | { min: number; max: number } } = {}

    columns.forEach((column) => {
      // Only create filters for columns with a defined type and not actions
      if (!column.type || column.key === "actions" || column.key === "checkbox") {
        return
      }

      if (column.type === "range") {
        // For range type, find min and max values
        let min = Number.POSITIVE_INFINITY
        let max = Number.NEGATIVE_INFINITY

        data.forEach((item) => {
          const value = Number.parseFloat(String(item[column.key as keyof T]))
          if (!isNaN(value)) {
            min = Math.min(min, value)
            max = Math.max(max, value)
          }
        })

        if (min !== Number.POSITIVE_INFINITY && max !== Number.NEGATIVE_INFINITY) {
          filters[column.key] = { min, max }
        }
      } else if (column.type === "select" || column.type === "ratio") {
        // For select or ratio type
        const uniqueValues = new Set<string>()

        data.forEach((item) => {
          const value = item[column.key as keyof T]
          // Convert value to string for storage in the Set
          if (value !== undefined && value !== null) {
            uniqueValues.add(String(value))
          } else if (value === null) {
            uniqueValues.add("null")
          } else if (value === undefined) {
            uniqueValues.add("undefined")
          }
        })

        if (uniqueValues.size > 0) {
          filters[column.key] = uniqueValues
        }
      }
    })

    setAvailableFilters(filters)
  }, [data, columns])

  // Update the useEffect that filters data to handle different filter types
  useEffect(() => {
    let filtered = [...data]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((item) => {
        return columns.some((column) => {
          const value = column.render
            ? column.render(item[column.key as keyof T], item)
            : item[column.key as keyof T]
          return (value ? value.toString() : "").toLowerCase().includes(searchQuery.toLowerCase())
        })
      })
    }

    // Apply filters
    Object.entries(filterState).forEach(([key, values]) => {
      const column = columns.find((col) => col.key === key)

      if (column?.type === "range" && "current" in values) {
        // Handle range filter
        const [min, max] = (values as { current: [number, number] }).current
        filtered = filtered.filter((item) => {
          const itemValue = Number.parseFloat(String(item[key as keyof T]))
          return !isNaN(itemValue) && itemValue >= min && itemValue <= max
        })
      } else if (values instanceof Set && values.size > 0) {
        // Handle set-based filters (select, ratio, default)
        filtered = filtered.filter((item) => {
          const itemValue = item[key as keyof T]

          // Handle special cases for null and undefined
          if (itemValue === null && (values as Set<string>).has("null")) {
            return true
          }
          if (itemValue === undefined && (values as Set<string>).has("undefined")) {
            return true
          }

          return (values as Set<string>).has(String(itemValue))
        })
      }
    })

    // Apply sorting
    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof T]
        const bValue = b[sortConfig.key as keyof T]
        // Type guard for number
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue
        }
        // Type guard for string
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }
        // Fallback to string comparison
        const aStr = String(aValue)
        const bStr = String(bValue)
        return sortConfig.direction === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr)
      })
    }

    setSortedData(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [data, sortConfig, filterState, columns, searchQuery])

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const serializedColumns = columns.map((column) => ({
    ...column,
    render: column.render
      ? (value: unknown, item: T) => {
        try {
          return column.render!(value, item)
        } catch (e) {
          console.error("Error rendering column:", e)
          return String(value)
        }
      }
      : undefined,
  }))

  const handleSearch = (search: string) => {
    setSearchQuery(search)
    setCurrentPage(1) // Reset to first page when search changes
  }

  // Update the handleFilterChange function to handle different filter types
  const handleFilterChange = (columnKey: string, value: string | [number, number], checked?: boolean) => {
    setFilterState((prev) => {
      const newState = { ...prev }
      const column = columns.find((col) => col.key === columnKey)

      if (column?.type === "range" && Array.isArray(value)) {
        // Handle range filter
        const rangeFilter = availableFilters[columnKey] as { min: number; max: number }
        newState[columnKey] = {
          min: rangeFilter.min,
          max: rangeFilter.max,
          current: value as [number, number],
        }
      } else if (column?.type === "select") {
        // Handle select filter with shadcn Select
        newState[columnKey] = new Set([value as string])
      } else if (checked !== undefined) {
        // Handle checkbox filter (for backward compatibility)
        if (!newState[columnKey]) {
          newState[columnKey] = new Set<string>()
        }

        if (checked) {
          ; (newState[columnKey] as Set<string>).add(value as string)
        } else {
          ; (newState[columnKey] as Set<string>).delete(value as string)
          if ((newState[columnKey] as Set<string>).size === 0) {
            delete newState[columnKey]
          }
        }
      }

      return newState
    })
  }

  // Helper function to get display value for boolean status
  const getStatusDisplayValue = (value: string) => {
    if (value === "true") return "Active"
    if (value === "false") return "Inactive"
    if (value === "null" || value === "undefined") return "Pending"
    return value
  }

  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)

  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search"
              className="pl-8"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            />
          </div>
          {Object.keys(filterState).length > 0 && (
            <div className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-1 whitespace-nowrap">
              {Object.keys(filterState).length} {Object.keys(filterState).length === 1 ? "filter" : "filters"} active
            </div>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="text-sm text-muted-foreground border-input">
                Filter
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[300px] sm:w-[400px] pr-4 overflow-y-auto">
              <SheetHeader className="border-b pb-4">
                <SheetTitle>Filter Data</SheetTitle>
                <SheetDescription>Select values to filter the table</SheetDescription>
              </SheetHeader>
              {/* Update the Sheet content to render different filter types */}
              <div className="py-4 space-y-6">
                {Object.entries(availableFilters).map(([columnKey, values]) => {
                  const column = columns.find((col) => col.key === columnKey)
                  if (!column || !column.type) return null

                  if (column.type === "range" && "min" in values) {
                    // Render range filter
                    const rangeValues = values as { min: number; max: number }
                    const currentRange: [number, number] = filterState[columnKey]
                      ? (filterState[columnKey] as { current: [number, number] }).current
                      : [rangeValues.min, rangeValues.max]

                    return (
                      <div key={columnKey} className="space-y-3">
                        <h3 className="font-medium">{column.title}</h3>
                        <DualRangeSlider
                          min={rangeValues.min}
                          max={rangeValues.max}
                          value={currentRange}
                          onChange={(newRange) => handleFilterChange(columnKey, newRange)}
                          step={(rangeValues.max - rangeValues.min) / 100}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{currentRange[0].toFixed(2)}</span>
                          <span>{currentRange[1].toFixed(2)}</span>
                        </div>
                      </div>
                    )
                  } else if (column.type === "ratio") {
                    // Render radio buttons for ratio filter with proper display values
                    return (
                      <div key={columnKey} className="space-y-3">
                        <h3 className="font-medium">{column.title}</h3>
                        <RadioGroup
                          defaultValue={(filterState[columnKey] as Set<string>)?.values().next().value || ""}
                          onValueChange={(value) => {
                            setFilterState((prev) => {
                              const newState = { ...prev }
                              newState[columnKey] = new Set([value])
                              return newState
                            })
                          }}
                          className="space-y-2"
                        >
                          {Array.from(values as Set<string>).map((value) => (
                            <div key={`${columnKey}-${value}`} className="flex items-center space-x-2">
                              <RadioGroupItem
                                value={value}
                                id={`mobile-${columnKey}-${value}`}
                                checked={(filterState[columnKey] as Set<string>)?.has(value) || false}
                              />
                              <Label htmlFor={`mobile-${columnKey}-${value}`} className="text-sm cursor-pointer">
                                {getStatusDisplayValue(value)}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    )
                  } else if (column.type === "select") {
                    // Render shadcn Select for select filter
                    return (
                      <div key={columnKey} className="space-y-3">
                        <h3 className="font-medium">{column.title}</h3>
                        <Select
                          onValueChange={(value) => handleFilterChange(columnKey, value)}
                          value={(filterState[columnKey] as Set<string>)?.values().next().value || ""}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={`Select ${column.title}`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>{column.title}</SelectLabel>
                              {Array.from(values as Set<string>).map((value) => (
                                <SelectItem key={`mobile-${columnKey}-${value}`} value={value}>
                                  {column.getOptionLabel ? column.getOptionLabel(value) : getStatusDisplayValue(value)}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  }
                  return null
                })}

                {Object.keys(filterState).length > 0 && (
                  <Button variant="outline" className="w-full" onClick={() => setFilterState({})}>
                    Clear All Filters
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={`skeleton-card-${index}`}>
              <CardContent className="p-4 space-y-3">
                {serializedColumns.map((column, colIndex) => (
                  <div key={`skeleton-mobile-${index}-${colIndex}`} className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">{column.title}:</span>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        ) : sortedData.length > 0 ? (
          <>
            {paginatedData.map((item, index) => (
              <div key={index}>
                {mobileCardRender ? (
                  (() => {
                    try {
                      return mobileCardRender(item, index)
                    } catch (e) {
                      console.error("Error rendering mobile card:", e)
                      return null
                    }
                  })()
                ) : (
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      {serializedColumns.map((column) => (
                        <div key={column.key} className="flex justify-between items-start">
                          <span className="text-sm font-medium text-muted-foreground">{column.title}:</span>
                          <div className="text-right">
                            {column.render
                              ? column.render(item[column.key as keyof T], item)
                              : toStringOrNode(item[column.key as keyof T])}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
            <MobilePagination
              currentPage={currentPage}
              totalPages={totalPages}
              currentMembers={sortedData.length}
              totalMembers={data.length}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
            />
          </>
        ) : (
          <Card className="py-8">
            <CardContent className="flex flex-col items-center justify-center gap-2 text-center">
              <Search className="h-10 w-10 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium">No filter results found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or search criteria</p>
              {Object.keys(filterState).length > 0 && (
                <Button variant="outline" className="mt-2" onClick={() => setFilterState({})}>
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <div className="relative w-full sm:w-[30%] min-w-[200px]">
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search"
            className="pl-8"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
          />
        </div>
        {Object.keys(filterState).length > 0 && (
          <div className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-1 whitespace-nowrap">
            {Object.keys(filterState).length} {Object.keys(filterState).length === 1 ? "filter" : "filters"} active
          </div>
        )}
        <div className="flex space-x-2">
          {specialButtons && specialButtons}
          {Object.keys(availableFilters).length > 0 && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="text-sm text-gray-500 border-input">
                  Filter
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[300px] sm:w-[400px] overflow-y-auto border-input pr-9">
                <SheetHeader className="border-b border-input pb-4">
                  <SheetTitle className="mb-0">Filter Data</SheetTitle>
                  <SheetDescription>Select values to filter the table</SheetDescription>
                </SheetHeader>
                {/* Update the Sheet content to render different filter types */}
                <div className="py-4 space-y-4">
                  {Object.entries(availableFilters).map(([columnKey, values]) => {
                    const column = columns.find((col) => col.key === columnKey)
                    if (!column || !column.type) return null

                    if (column.type === "range" && "min" in values) {
                      // Render range filter
                      const rangeValues = values as { min: number; max: number }
                      const currentRange: [number, number] = filterState[columnKey]
                        ? (filterState[columnKey] as { current: [number, number] }).current
                        : [rangeValues.min, rangeValues.max]

                      return (
                        <div key={columnKey} className="space-y-3">
                          <h3 className="font-medium">{column.title}</h3>
                          <DualRangeSlider
                            min={rangeValues.min}
                            max={rangeValues.max}
                            value={currentRange}
                            onChange={(newRange) => handleFilterChange(columnKey, newRange)}
                            step={(rangeValues.max - rangeValues.min) / 100}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{currentRange[0].toFixed(2)}</span>
                            <span>{currentRange[1].toFixed(2)}</span>
                          </div>
                        </div>
                      )
                    } else if (column.type === "ratio") {
                      // Render radio buttons for ratio filter with proper display values
                      return (
                        <div key={columnKey} className="space-y-3">
                          <h3 className="font-medium">{column.title}</h3>
                          <RadioGroup
                            defaultValue={(filterState[columnKey] as Set<string>)?.values().next().value || ""}
                            onValueChange={(value) => {
                              setFilterState((prev) => {
                                const newState = { ...prev }
                                newState[columnKey] = new Set([value])
                                return newState
                              })
                            }}
                            className="space-y-2"
                          >
                            {Array.from(values as Set<string>).map((value) => (
                              <div key={`${columnKey}-${value}`} className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value={value}
                                  id={`${columnKey}-${value}`}
                                  checked={(filterState[columnKey] as Set<string>)?.has(value) || false}
                                />
                                <Label htmlFor={`${columnKey}-${value}`} className="text-sm cursor-pointer">
                                  {getStatusDisplayValue(value)}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      )
                    } else if (column.type === "select") {
                      // Render shadcn Select for select filter
                      return (
                        <div key={columnKey} className="space-y-3">
                          <h3 className="font-medium">{column.title}</h3>
                          <Select
                            onValueChange={(value) => handleFilterChange(columnKey, value)}
                            value={(filterState[columnKey] as Set<string>)?.values().next().value || ""}
                          >
                            <SelectTrigger className="w-full border-input cursor-pointer">
                              <SelectValue placeholder={`Select ${column.title}`} />
                            </SelectTrigger>
                            <SelectContent className="border-input">
                              <SelectGroup>
                                <SelectLabel>{column.title}</SelectLabel>
                                {Array.from(values as Set<string>).map((value) => (
                                  <SelectItem key={`${columnKey}-${value}`} value={value} className="cursor-pointer">
                                    {column.getOptionLabel
                                      ? column.getOptionLabel(value)
                                      : getStatusDisplayValue(value)}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                      )
                    }
                    return null
                  })}

                  {Object.keys(filterState).length > 0 && (
                    <Button variant="outline" className="w-full border-input" onClick={() => setFilterState({})}>
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
      {loading ? (
        <div
          className={`rounded-md border min-w-[400px] flex-1 overflow-y-auto`}
        >
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className="cursor-pointer">
                    <div
                      className={`flex items-center gap-2 text-center ${column.key === "actions" && "justify-center"}`}
                    >
                      {column.title} <ArrowDownUp size={16} />
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={`skeleton-row-${rowIndex}`}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={`skeleton-${rowIndex}-${colIndex}`}>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : sortedData.length > 0 ? (
        <div
          className={`rounded-md border border-input max-h-[calc(100vh-269px)] overflow-y-auto`}
          style={maxHeightDesktop ? { maxHeight: `calc(100vh - ${maxHeightDesktop}px)` } : undefined}
        >
          <Table>
            <TableHeader >
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={column.key !== "actions" && column.key !== "checkbox" ? "cursor-pointer" : ""}
                    onClick={() => {
                      if (column.key !== "actions" && column.key !== "checkbox") {
                        handleSort(column.key)
                      }
                    }}
                  >
                    <div
                      className={`flex items-center text-gray-500 select-none gap-2 text-center ${column.align === "center"
                        ? "justify-center"
                        : column.align === "right"
                          ? "justify-end"
                          : "justify-start"
                        } ${column.key === "actions" && "justify-center"}`}
                    >
                      {column.title}{" "}
                      {column.key !== "actions" && column.key !== "checkbox" && (
                        <>
                          {sortConfig?.key === column.key ? (
                            sortConfig.direction === "asc" ? (
                              <MoveUp size={16} />
                            ) : (
                              <MoveDown size={16} />
                            )
                          ) : (
                            <ArrowDownUp size={16} />
                          )}
                        </>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.length > 0 ? (
                    columns.map((column) => (
                      <TableCell key={`${rowIndex}-${column.key}`}>
                        <div
                          className={`flex items-center gap-2 text-center ${column.align === "center"
                            ? "justify-center"
                            : column.align === "right"
                              ? "justify-end"
                              : "justify-start"
                            } ${column.key === "actions" && "justify-center"}`}
                        >
                          {column.render
                            ? column.render(item[column.key as keyof T], item)
                            : toStringOrNode(item[column.key as keyof T])}
                        </div>
                      </TableCell>
                    ))
                  ) : (
                    <TableCell colSpan={columns.length} className="text-center">
                      No data
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-md border border-input max-h-[calc(100vh-269px)] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className="cursor-pointer" onClick={() => handleSort(column.key)}>
                    <div
                      className={`flex items-center gap-2 text-center ${column.key === "actions" && "justify-center"}`}
                    >
                      {column.title}{" "}
                      {column.key !== "actions" && column.key !== "checkbox" && (
                        <>
                          {sortConfig?.key === column.key ? (
                            sortConfig.direction === "asc" ? (
                              <MoveUp size={16} />
                            ) : (
                              <MoveDown size={16} />
                            )
                          ) : (
                            <ArrowDownUp size={16} />
                          )}
                        </>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="h-10 w-10 text-muted-foreground opacity-50" />
                    <p className="text-lg font-medium">No filter results found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your filters or search criteria</p>
                    {Object.keys(filterState).length > 0 && (
                      <Button variant="outline" className="mt-2" onClick={() => setFilterState({})}>
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
      <DesktopPagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        currentMembers={sortedData.length}
        totalMembers={data.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  )
}

function MobilePagination({
  currentPage,
  totalPages,
  setCurrentPage,
  itemsPerPage,
  currentMembers,
  totalMembers,
}: {
  currentPage: number
  totalPages: number
  setCurrentPage: (page: number) => void
  itemsPerPage: number
  currentMembers: number
  totalMembers: number
}) {
  return (
    <div className="flex items-center justify-between space-x-2 flex-wrap gap-2">
      <p className="text-xs text-muted-foreground">
        Showing{" "}
        {currentMembers < itemsPerPage
          ? currentMembers
          : (currentPage - 1) * itemsPerPage + 1}{" "}
        - {Math.min(currentPage * itemsPerPage, currentMembers)} of {totalMembers} results
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          className="text-xs"
        >
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
          className="text-xs"
        >
          Next
        </Button>
      </div>
    </div>
  )
}

function DesktopPagination({
  currentPage,
  totalPages,
  setCurrentPage,
  itemsPerPage,
  currentMembers,
  totalMembers,
}: {
  currentPage: number
  totalPages: number
  setCurrentPage: (page: number) => void
  itemsPerPage: number
  currentMembers: number
  totalMembers: number
}) {
  return (
    <div className="flex items-center justify-between space-x-2 flex-wrap gap-2">
      <p className="text-xs text-muted-foreground">
        Showing{" "}
        {currentMembers < itemsPerPage
          ? currentMembers
          : (currentPage - 1) * itemsPerPage + 1}{" "}
        - {Math.min(currentPage * itemsPerPage, currentMembers)} of {totalMembers} results
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          className="text-xs border-input"
        >
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
          className="text-xs border-input"
        >
          Next
        </Button>
      </div>
    </div>
  )
}

