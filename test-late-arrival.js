// Simulate the late arrival calculation

// Backend logic from users.service.ts
function calculateBackendPenalty(timeDiffMinutes, workingDaysInCycle) {
  const valuePerDay = 100 / workingDaysInCycle;
  
  // Calculate time difference weight
  const halfHourUnits = timeDiffMinutes / 30;
  const exceptionDaysImpact = halfHourUnits * 0.01;
  
  console.log('Backend Calculation:');
  console.log('Time Diff Minutes:', timeDiffMinutes);
  console.log('Half Hour Units:', halfHourUnits);
  console.log('Exception Days Impact:', exceptionDaysImpact);
  console.log('Value Per Day:', valuePerDay);
  
  // First exception, no accumulated penalty
  let currentPenalizedDays = 0;
  const penaltyDays = exceptionDaysImpact + currentPenalizedDays;
  const penaltyScore = penaltyDays * valuePerDay;
  
  console.log('Penalty Days:', penaltyDays);
  console.log('Penalty Score:', penaltyScore);
  
  return penaltyScore;
}

// Test with 40 minutes and 23 working days (typical month)
const workingDays = 23;
const lateMinutes = 40;

const penalty = calculateBackendPenalty(lateMinutes, workingDays);
console.log('\n=== RESULT ===');
console.log('40 minutes late with ' + workingDays + ' working days = -' + penalty.toFixed(2) + ' penalty');
console.log('Expected score: ' + (100 - penalty).toFixed(2) + '/100');
