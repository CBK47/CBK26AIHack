let reminderInterval: ReturnType<typeof setInterval> | null = null;

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return Promise.resolve("denied" as NotificationPermission);
  }
  return Notification.requestPermission();
}

export function scheduleReminder(time: string, message: string) {
  cancelReminder();

  if (!time || !("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const [targetHour, targetMinute] = time.split(":").map(Number);

  reminderInterval = setInterval(() => {
    const now = new Date();
    const todayKey = now.toDateString();
    const lastFired = localStorage.getItem("jj_reminder_last_fired");
    if (
      now.getHours() === targetHour &&
      now.getMinutes() === targetMinute &&
      lastFired !== todayKey
    ) {
      localStorage.setItem("jj_reminder_last_fired", todayKey);
      new Notification("Just Juggle", {
        body: message || "Time to juggle!",
        icon: "/icon-192.svg",
        tag: "daily-reminder",
      });
    }
  }, 30000);
}

export function cancelReminder() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
}
