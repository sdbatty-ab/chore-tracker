import { FullCalendar } from "@/components/ui/FullCalendar";
import { getEvents } from "../actions";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const events = await getEvents();
  
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <header className="mb-10 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-full mb-2">
          <span className="text-4xl">📅</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
          Family Calendar
        </h1>
        <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
          Keep track of soccer practices, dentist appointments, and family movie nights.
        </p>
      </header>
      
      <FullCalendar initialEvents={events as any[]} />
    </div>
  );
}
