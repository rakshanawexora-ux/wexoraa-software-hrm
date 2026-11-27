const clock = new Intl.DateTimeFormat('en-GB', {
  timeZone: process.env.WORK_TIME_ZONE || 'Asia/Kolkata',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
});

function workClock(now = new Date()) {
  const parts = Object.fromEntries(clock.formatToParts(now).map(({ type, value }) => [type, value]));
  return {
    date: [parts.year, parts.month, parts.day].join('-'),
    time: [parts.hour, parts.minute, parts.second].join(':')
  };
}

module.exports = workClock;
