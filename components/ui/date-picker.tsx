"use client"

import * as React from "react"

import { format } from "date-fns"

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DatePickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
  placeholder?: string
  disabled: boolean
  disabledUntil?: (date: Date) => boolean
}

export function DatePicker({ date, onSelect, className, placeholder, disabled, disabledUntil }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    date || new Date()
  )
  const [open, setOpen] = React.useState(false)

  // Sync currentMonth ONLY when a date is selected externally and doesn't match current month
  React.useEffect(() => {
    if (date && (date.getMonth() !== currentMonth.getMonth() || date.getFullYear() !== currentMonth.getFullYear())) {
      setCurrentMonth(date)
    }
  }, [date])

  // Generate months array
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  // Generate years array (from 1900 to current year + 10)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1900 + 10 }, (_, i) => 1900 + i)

  const handleMonthChange = (monthIndex: string) => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(parseInt(monthIndex))
    setCurrentMonth(newDate)
  }

  const handleYearChange = (year: string) => {
    const newDate = new Date(currentMonth)
    newDate.setFullYear(parseInt(year))
    setCurrentMonth(newDate)
  }

  const handlePreviousMonth = () => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentMonth(newDate)
  }

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentMonth(newDate)
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onSelect?.(selectedDate)
    if (selectedDate) {
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className=" h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-[200px] border-input p-0" align="start">
        <div className="p-2 border-b border-input">
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Select
              value={currentMonth.getMonth().toString()}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="w-[110px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-input max-h-[200px] overflow-y-auto">
                {months.map((month, index) => (
                  <SelectItem key={month} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={currentMonth.getFullYear().toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="w-[86px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-input max-h-[200px] overflow-y-auto" >
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          disabled={disabledUntil}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          classNames={{
            month_caption: "hidden",
            nav: "hidden",
            months: "p-2",
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}