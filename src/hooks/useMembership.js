import { useContext } from 'react'
import MembershipContext from '../context/membershipContext.js'

export function useMembership() {
  const context = useContext(MembershipContext)
  if (!context) throw new Error('useMembership must be used within a MembershipProvider')
  return context
}
