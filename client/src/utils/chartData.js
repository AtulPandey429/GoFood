/** Fill missing days so the chart always shows a consistent window. */
export function fillChartDays(data, days = 7) {
  const map = new Map(
    (data || []).map((d) => {
      const key = (d.date || "").slice(0, 10);
      return [key, Number(d.revenue) || 0];
    })
  );

  const result = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, revenue: map.get(key) || 0 });
  }

  return result;
}

export function formatChartDate(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
