function getFormatter(timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function getDateParts(date, timeZone) {
  const formatter = getFormatter(timeZone);
  const parts = formatter.formatToParts(date);
  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(partMap.year),
    month: Number(partMap.month),
    day: Number(partMap.day),
    hour: Number(partMap.hour),
    minute: Number(partMap.minute),
    second: Number(partMap.second)
  };
}

function getTimeZoneOffsetMs(date, timeZone) {
  const parts = getDateParts(date, timeZone);
  const utcTimeFromParts = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return utcTimeFromParts - date.getTime();
}

function zonedTimeToUtc(parts, timeZone) {
  const utcGuess = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  );

  const firstOffset = getTimeZoneOffsetMs(utcGuess, timeZone);
  let resolvedDate = new Date(utcGuess.getTime() - firstOffset);
  const secondOffset = getTimeZoneOffsetMs(resolvedDate, timeZone);

  if (secondOffset !== firstOffset) {
    resolvedDate = new Date(utcGuess.getTime() - secondOffset);
  }

  return resolvedDate;
}

export function assertValidTimeZone(timeZone) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return timeZone;
  } catch {
    throw new Error(`Invalid IANA time zone: ${timeZone}`);
  }
}

export function getTodayRangeInTimeZone(timeZone, now = new Date()) {
  const resolvedTimeZone = assertValidTimeZone(timeZone);
  const zonedNow = getDateParts(now, resolvedTimeZone);

  const start = zonedTimeToUtc(
    {
      year: zonedNow.year,
      month: zonedNow.month,
      day: zonedNow.day,
      hour: 0,
      minute: 0,
      second: 0
    },
    resolvedTimeZone
  );

  const nextDayProbe = new Date(Date.UTC(zonedNow.year, zonedNow.month - 1, zonedNow.day, 12, 0, 0));
  nextDayProbe.setUTCDate(nextDayProbe.getUTCDate() + 1);
  const nextDayParts = getDateParts(nextDayProbe, resolvedTimeZone);

  const end = zonedTimeToUtc(
    {
      year: nextDayParts.year,
      month: nextDayParts.month,
      day: nextDayParts.day,
      hour: 0,
      minute: 0,
      second: 0
    },
    resolvedTimeZone
  );

  return {
    start,
    end
  };
}

export function getRangeInTimeZone(rangeKey, timeZone, now = new Date()) {
  const resolvedTimeZone = assertValidTimeZone(timeZone);
  const zonedNow = getDateParts(now, resolvedTimeZone);

  if (rangeKey === "all") {
    return {
      start: null,
      end: null
    };
  }

  if (rangeKey === "today") {
    return getTodayRangeInTimeZone(resolvedTimeZone, now);
  }

  if (rangeKey === "yesterday") {
    const yesterdayProbe = new Date(now);
    yesterdayProbe.setUTCDate(yesterdayProbe.getUTCDate() - 1);
    return getTodayRangeInTimeZone(resolvedTimeZone, yesterdayProbe);
  }

  if (rangeKey === "week") {
    const weekdayIndex = getWeekdayIndexInTimeZone(now, resolvedTimeZone);
    const startProbe = new Date(now);
    startProbe.setUTCDate(startProbe.getUTCDate() - weekdayIndex);
    const startParts = getDateParts(startProbe, resolvedTimeZone);
    const start = zonedTimeToUtc(
      {
        year: startParts.year,
        month: startParts.month,
        day: startParts.day,
        hour: 0,
        minute: 0,
        second: 0
      },
      resolvedTimeZone
    );

    const endProbe = new Date(startProbe);
    endProbe.setUTCDate(endProbe.getUTCDate() + 7);
    const endParts = getDateParts(endProbe, resolvedTimeZone);
    const end = zonedTimeToUtc(
      {
        year: endParts.year,
        month: endParts.month,
        day: endParts.day,
        hour: 0,
        minute: 0,
        second: 0
      },
      resolvedTimeZone
    );

    return { start, end };
  }

  if (rangeKey === "month") {
    const start = zonedTimeToUtc(
      {
        year: zonedNow.year,
        month: zonedNow.month,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0
      },
      resolvedTimeZone
    );

    const nextMonthYear = zonedNow.month === 12 ? zonedNow.year + 1 : zonedNow.year;
    const nextMonth = zonedNow.month === 12 ? 1 : zonedNow.month + 1;
    const end = zonedTimeToUtc(
      {
        year: nextMonthYear,
        month: nextMonth,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0
      },
      resolvedTimeZone
    );

    return { start, end };
  }

  throw new Error(`Unsupported time range: ${rangeKey}`);
}

function getWeekdayIndexInTimeZone(date, timeZone) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short"
  }).format(date);

  const weekdayIndexMap = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6
  };

  return weekdayIndexMap[weekday] ?? 0;
}
