const fs = require('fs');

const ticketsPath = '/opt/adminflow/client/app/tickets/page.tsx';
let content = fs.readFileSync(ticketsPath, 'utf8');

// Remove the entire timeline section (lines 499-518 approximately)
const timelineSection = `
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Actividad temporal</div>
          <div className="flex items-center gap-2">
            {[{ key: "day", label: "1" }, { key: "week", label: "7" }, { key: "month", label: "30" }].map((option) => (
              <Button
                key={option.key}
                variant={timelinePeriod === option.key ? "default" : "outline"}
                size="sm"
                className="h-8 w-12 px-2 justify-center gap-1"
                onClick={() => setTimelinePeriod(option.key as "day" | "week" | "month")}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>
        <div className="-mt-2">
          <TicketsTimeline tickets={tickets} period={timelinePeriod} />
        </div>`;

// Try with LF
if (content.includes(timelineSection)) {
  content = content.replace(timelineSection, '');
  console.log('Removed timeline section (LF)');
} else {
  // Try with CRLF
  const timelineSectionCRLF = timelineSection.replace(/\n/g, '\r\n');
  if (content.includes(timelineSectionCRLF)) {
    content = content.replace(timelineSectionCRLF, '');
    console.log('Removed timeline section (CRLF)');
  } else {
    console.log('Timeline section not found exactly, trying regex approach...');
    // Use regex to remove it
    const pattern = /<div className="flex items-center justify-between">\s*<div className="text-sm text-muted-foreground">Actividad temporal<\/div>[\s\S]*?<TicketsTimeline[^>]*\/>\s*<\/div>/;
    if (pattern.test(content)) {
      content = content.replace(pattern, '');
      console.log('Removed timeline section via regex');
    } else {
      console.log('Could not find timeline section');
    }
  }
}

// Remove timelinePeriod state
const statePattern = /const \[timelinePeriod, setTimelinePeriod\] = useState<"day" \| "week" \| "month">\("day"\);\r?\n?/;
if (statePattern.test(content)) {
  content = content.replace(statePattern, '');
  console.log('Removed timelinePeriod state');
}

// Remove TicketsTimeline import
const importPattern = /import { TicketsTimeline } from "@\/components\/tickets\/tickets-timeline";\r?\n?/;
if (importPattern.test(content)) {
  content = content.replace(importPattern, '');
  console.log('Removed TicketsTimeline import');
}

fs.writeFileSync(ticketsPath, content);
console.log('Done');
