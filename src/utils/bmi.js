export function calculateBMI(heightCm, weightKg) {
  const height = Number(heightCm)
  const weight = Number(weightKg)
  if (!Number.isFinite(height) || !Number.isFinite(weight) || height <= 0 || weight <= 0) return null
  const heightMeters = height / 100
  return weight / (heightMeters * heightMeters)
}

export function getBMICategory(bmi) {
  if (!Number.isFinite(bmi) || bmi <= 0) return null
  if (bmi < 18.5) return { key: 'underweight', label: 'Underweight' }
  if (bmi < 25) return { key: 'normal', label: 'Normal' }
  if (bmi < 30) return { key: 'overweight', label: 'Overweight' }
  return { key: 'obese', label: 'Obese' }
}