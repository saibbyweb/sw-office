// Test the stability score calculation
const now = new Date();
const currentDay = now.getDate();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

let startDate;
let endDate;

if (currentDay >= 19) {
  startDate = new Date(currentYear, currentMonth, 19, 0, 0, 0, 0);
  endDate = new Date(currentYear, currentMonth + 1, 18, 23, 59, 59, 999);
} else {
  startDate = new Date(currentYear, currentMonth - 1, 19, 0, 0, 0, 0);
  endDate = new Date(currentYear, currentMonth, 18, 23, 59, 59, 999);
}

const startEpoch = Math.floor(startDate.getTime() / 1000);
const endEpoch = Math.floor(endDate.getTime() / 1000);

console.log('Current Date:', now.toISOString());
console.log('Billing Cycle Start:', startDate.toISOString());
console.log('Billing Cycle End:', endDate.toISOString());
console.log('Start Epoch:', startEpoch);
console.log('End Epoch:', endEpoch);
console.log('\nToday is day', currentDay, 'of the month');
console.log('Current cycle covers:', startDate.toLocaleDateString(), 'to', endDate.toLocaleDateString());
