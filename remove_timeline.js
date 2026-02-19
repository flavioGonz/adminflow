const fs = require('fs');

// Remove timeline section from tickets page
const ticketsPath = '/opt/adminflow/client/app/tickets/page.tsx';
let content = fs.readFileSync(ticketsPath, 'utf8');

// Find and remove the timeline section
const timelineStartMarker = '<div className="flex items-center justify-between">';
const timelineEndMarker = '<TicketsTimeline tickets={tickets} period={timelinePeriod} />';

// Find the specific section with "Actividad temporal"
const actividadStart = content.indexOf('<div className="flex items-center justify-between">');
if (actividadStart !== -1) {
  // Find the next occurrence that contains "Actividad temporal"
  const searchArea = content.slice(actividadStart, actividadStart + 1000);
  if (searchArea.includes('Actividad temporal')) {
    // Find the end of the timeline component
    const timelineEnd = content.indexOf('</TicketsTimeline>', actividadStart);
    if (timelineEnd !== -1) {
      // Find the closing div after TicketsTimeline
      const closingDivEnd = content.indexOf('</div>', timelineEnd);
      if (closingDivEnd !== -1) {
        // Remove from actividadStart to the second closing div after timeline
        const beforeSection = content.slice(0, actividadStart);
        const afterSection = content.slice(closingDivEnd + 6);
        content = beforeSection + afterSection;
        console.log('Removed timeline section');
      }
    }
  }
}

// Also remove the timelinePeriod state since it's no longer needed
content = content.replace(/const \[timelinePeriod, setTimelinePeriod\] = useState<"day" \| "week" \| "month">\("day"\);?\r?\n?/g, '');

// Remove the TicketsTimeline import
content = content.replace(/import { TicketsTimeline } from "@\/components\/tickets\/tickets-timeline";\r?\n?/g, '');

// Remove CalendarDays from the icon imports if only used for timeline
// (keeping it since it's also used elsewhere in the file)

fs.writeFileSync(ticketsPath, content);
console.log('Updated tickets page');
