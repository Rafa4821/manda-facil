import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../app/firebase/firebase'

/**
 * Test helpers to verify Firestore security rules
 * These should be used in development/testing only
 */

export const securityTests = {
  /**
   * Test 1: Try to read another user's document
   * Should fail with permission-denied error
   */
  testReadOtherUsersDocument: async (otherUserId: string): Promise<boolean> => {
    try {
      const userRef = doc(db, 'users', otherUserId)
      await getDoc(userRef)
      console.error('❌ Security FAILED: Was able to read other user document')
      return false
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.log('✅ Security PASSED: Cannot read other user document')
        return true
      }
      console.error('❌ Unexpected error:', error)
      return false
    }
  },

  /**
   * Test 2: Try to read another customer's orders
   * Should fail with permission-denied or return empty results
   */
  testReadOtherUsersOrders: async (otherCustomerId: string): Promise<boolean> => {
    try {
      const ordersRef = collection(db, 'orders')
      const q = query(ordersRef, where('customerId', '==', otherCustomerId))
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        console.log('✅ Security PASSED: Cannot read other customer orders (empty result)')
        return true
      } else {
        console.error('❌ Security FAILED: Was able to read other customer orders')
        return false
      }
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.log('✅ Security PASSED: Cannot read other customer orders')
        return true
      }
      console.error('❌ Unexpected error:', error)
      return false
    }
  },

  /**
   * Test 3: Try to read a specific order by ID that belongs to another user
   * Should fail with permission-denied error
   */
  testReadSpecificOtherOrder: async (orderId: string): Promise<boolean> => {
    try {
      const orderRef = doc(db, 'orders', orderId)
      await getDoc(orderRef)
      console.error('❌ Security FAILED: Was able to read other user order by ID')
      return false
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.log('✅ Security PASSED: Cannot read other user order by ID')
        return true
      }
      console.error('❌ Unexpected error:', error)
      return false
    }
  },

  /**
   * Run all security tests
   * Pass IDs from other users to test
   */
  runAllTests: async (otherUserId: string, otherOrderId: string): Promise<void> => {
    console.log('🔒 Starting Security Tests...\n')
    
    const test1 = await securityTests.testReadOtherUsersDocument(otherUserId)
    const test2 = await securityTests.testReadOtherUsersOrders(otherUserId)
    const test3 = await securityTests.testReadSpecificOtherOrder(otherOrderId)
    
    console.log('\n📊 Test Results:')
    console.log(`Test 1 (Read other user doc): ${test1 ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`Test 2 (Read other orders): ${test2 ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`Test 3 (Read other order by ID): ${test3 ? '✅ PASS' : '❌ FAIL'}`)
    
    const allPassed = test1 && test2 && test3
    console.log(`\n${allPassed ? '✅ All tests PASSED' : '❌ Some tests FAILED'}`)
  }
}

/**
 * Example usage in console:
 * 
 * import { securityTests } from './shared/utils/securityTestHelpers'
 * 
 * // After logging in as User B
 * securityTests.runAllTests('userA_uid', 'userA_orderId')
 */
