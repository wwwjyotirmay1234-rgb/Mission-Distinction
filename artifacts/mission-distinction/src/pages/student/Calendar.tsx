import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useListCalendarEvents, getListCalendarEventsQueryKey } from "@workspace/api-client-react";
import { Calendar as CalendarIcon, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

export default function StudentCalendar() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  
  const { data: events, isLoading } = useListCalendarEvents(
    { query: { queryKey: getListCalendarEventsQueryKey() } }
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">Schedule study sessions and exams.</p>
          </div>
          <Button><Plus className="mr-2 h-4 w-4" /> Add Event</Button>
        </div>

        <Card className="bg-card/40 border-border/40 flex-1 flex flex-col">
          <CardContent className="p-6 flex-1 overflow-auto">
             <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="w-full rounded-md border"
                classNames={{
                  months: "flex flex-col w-full space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4 w-full",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex w-full justify-between",
                  head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                  row: "flex w-full mt-2 justify-between",
                  cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20 w-full",
                  day: "h-14 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-muted rounded-md",
                }}
              />
          </CardContent>
        </Card>
      </div>

      <div className="w-full lg:w-80 shrink-0 space-y-6">
        <Card className="bg-card/40 border-border/40">
          <CardHeader className="p-4 pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-semibold">Today's Focus</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
               {(!events || events.length === 0) ? (
                 <div className="p-4 text-sm text-muted-foreground text-center">No events today.</div>
               ) : (
                 events.slice(0,3).map(event => (
                   <div key={event.id} className="p-4 flex items-start gap-3 border-l-4" style={{ borderLeftColor: event.color || 'hsl(var(--primary))'}}>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.title}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock size={12} />
                          <span>{new Date(event.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
