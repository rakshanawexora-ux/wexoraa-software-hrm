const timeZone = import.meta.env.VITE_WORK_TIME_ZONE || 'Asia/Kolkata';
const dateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
});
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
});
export const workDate = () => dateFormat.format(new Date());
export const workTime = () => timeFormat.format(new Date());
export const timerKey = (user) => `wexoraa:timer:${user.id}:${workDate()}`;

export function readTimer(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}
