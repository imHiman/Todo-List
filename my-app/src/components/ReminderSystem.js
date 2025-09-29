import React, { useEffect } from 'react';

export default function ReminderSystem() {
  useEffect(() => {
    // Request notification permission when component mounts
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  const scheduleNotification = (task, reminderTime) => {
    const now = new Date().getTime();
    const reminderDate = new Date(reminderTime).getTime();
    const timeUntilReminder = reminderDate - now;

    if (timeUntilReminder > 0) {
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('Task Reminder', {
            body: `Don't forget: ${task.text}`,
            icon: '/favicon.ico'
          });
        }
      }, timeUntilReminder);
    }
  };

  const setReminder = (task) => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      const reminderTime = prompt('Enter reminder time (YYYY-MM-DD HH:MM):');
      if (reminderTime) {
        scheduleNotification(task, reminderTime);
      }
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          const reminderTime = prompt('Enter reminder time (YYYY-MM-DD HH:MM):');
          if (reminderTime) {
            scheduleNotification(task, reminderTime);
          }
        }
      });
    }
  };

  return { setReminder };
}