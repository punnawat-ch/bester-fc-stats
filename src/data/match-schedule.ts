export type ScheduleMatch = {
  month: string;
  week: string;
  date: string;
  opponent: string;
  venue: string;
  field?: string;
  time: string;
  notes?: string;
};

export const matchSchedule: ScheduleMatch[] = [
  {
    month: "Jan 2026",
    week: "Week 2",
    date: "10/01/26",
    opponent: "No Doubt",
    venue: "Playmaker",
    field: "Field 3",
    time: "18:00–20:00",
  },
  {
    month: "Jan 2026",
    week: "Week 3",
    date: "17/01/26",
    opponent: "Azura FC",
    venue: "Playmaker",
    field: "Field 1",
    time: "18:00–20:00",
  },
  {
    month: "Jan 2026",
    week: "Week 4",
    date: "24/01/26",
    opponent: "Backup",
    venue: "Playmaker",
    field: "Field 3",
    time: "18:00–20:00",
  },
  {
    month: "Jan 2026",
    week: "Week 5",
    date: "31/01/26",
    opponent: "MID",
    venue: "Playmaker",
    field: "Field 2",
    time: "18:00–20:00",
  },
  {
    month: "Feb 2026",
    week: "Week 1",
    date: "07/02/26",
    opponent: "ONCE A WEEK FC",
    venue: "Playmaker",
    field: "Field 3",
    time: "18:00–20:00",
  },
//   {
//     month: "Feb 2026",
//     week: "Week 2",
//     date: "14/02/26",
//     opponent: "-",
//     venue: "-",
//     time: "-",
//   },
  {
    month: "Feb 2026",
    week: "Week 3",
    date: "21/02/26",
    opponent: "Uncle",
    venue: "สนามบุญจินดา",
    time: "18:00–20:00",
  },
  {
    month: "Feb 2026",
    week: "Week 4",
    date: "28/02/26",
    opponent: "เตี๋ยวกระเพรา",
    venue: "สนามESP",
    time: "18:00–20:00",
  },
  {
    month: "Mar 2026",
    week: "Week 1",
    date: "07/03/26",
    opponent: "มั่งมี ศรีสุข",
    venue: "Playmaker",
    field: "Field 3",
    time: "18:00–20:00",
  },
  {
    month: "Mar 2026",
    week: "Week 3",
    date: "21/03/26",
    opponent: "Can do FC",
    venue: "Playmaker",
    field: "Field 3",
    time: "18:00–20:00",
  },
  {
    month: "Mar 2026",
    week: "Week 4",
    date: "28/03/26",
    opponent: "No Doubt",
    venue: "Playmaker",
    field: "Field 3",
    time: "18:00–20:00",
  },
  {
    month: "May 2026",
    week: "Week 2",
    date: "09/05/26",
    opponent: "มั่งมี ศรีสุข",
    venue: "Playmaker",
    field: "Field 3",
    time: "18:00–20:00",
  },
];

