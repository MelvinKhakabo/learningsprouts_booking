type ScheduleRow = {
  label: string;
  day: string;
  time: string;
};

export default function ScheduleTable({ rows }: { rows: ScheduleRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-navy text-cream">
          <tr>
            <th className="px-5 py-3 font-semibold">Session</th>
            <th className="px-5 py-3 font-semibold">Day</th>
            <th className="px-5 py-3 font-semibold">Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={i % 2 === 0 ? 'bg-white/50' : 'bg-peach/20'}>
              <td className="px-5 py-3 font-semibold">{row.label}</td>
              <td className="px-5 py-3">{row.day}</td>
              <td className="px-5 py-3 font-mono">{row.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}