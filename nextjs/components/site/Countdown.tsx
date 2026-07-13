'use client'

import { useEffect, useState } from "react";

function diff(target: number) {
  const now = Date.now();
  let d = Math.max(0, target - now);
  const days = Math.floor(d / 86400000); d -= days * 86400000;
  const hours = Math.floor(d / 3600000); d -= hours * 3600000;
  const mins = Math.floor(d / 60000); d -= mins * 60000;
  const secs = Math.floor(d / 1000);
  return { days, hours, mins, secs };
}

export function Countdown({ date, dark = false }: { date: string; dark?: boolean }) {
  const target = new Date(date).getTime();
  const [time, setTime] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setTime(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const units = [
    { label: "Days", value: time.days },
    { label: "Hrs", value: time.hours },
    { label: "Min", value: time.mins },
    { label: "Sec", value: time.secs },
  ];

  return (
    <div className="flex gap-2">
      {units.map((u) => (
        <div
          key={u.label}
          className={`min-w-[54px] rounded-xl px-2 py-2 text-center ${
            dark ? "bg-white/10 text-white" : "bg-secondary text-church-blue"
          }`}
        >
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.25rem" }}>
            {String(u.value).padStart(2, "0")}
          </div>
          <div className="text-[10px] uppercase tracking-wider opacity-70">{u.label}</div>
        </div>
      ))}
    </div>
  );
}
