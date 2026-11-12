import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateBMI, getBMICategory } from './bmi.js'

test('calculates BMI from centimetres and kilograms', () => {
  assert.equal(calculateBMI(172, 70), 70 / (1.72 * 1.72))
})

test('classifies BMI category boundaries correctly', () => {
  assert.equal(getBMICategory(calculateBMI(100, 18.49)).key, 'underweight')
  assert.equal(getBMICategory(calculateBMI(100, 18.5)).key, 'normal')
  assert.equal(getBMICategory(calculateBMI(100, 24.9)).key, 'normal')
  assert.equal(getBMICategory(calculateBMI(100, 25)).key, 'overweight')
  assert.equal(getBMICategory(calculateBMI(100, 29.9)).key, 'overweight')
  assert.equal(getBMICategory(calculateBMI(100, 30)).key, 'obese')
})

test('rejects empty, non-finite, zero, and negative measurements', () => {
  assert.equal(calculateBMI('', 70), null)
  assert.equal(calculateBMI('not a number', 70), null)
  assert.equal(calculateBMI(0, 70), null)
  assert.equal(calculateBMI(170, -1), null)
  assert.equal(calculateBMI(Infinity, 70), null)
  assert.equal(getBMICategory(NaN), null)
})