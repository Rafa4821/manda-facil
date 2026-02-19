import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface UpdateRateData {
  clpToVes: number;
}

/**
 * Callable function to update exchange rate
 * Only admins can call this function
 * Validates rate is reasonable
 */
export const updateRate = functions.https.onCall(async (data: UpdateRateData, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  // Verify admin claim
  if (!context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can update rates');
  }

  const { clpToVes } = data;

  // Validation
  if (!clpToVes || clpToVes <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid rate value');
  }

  // Reasonable range check (can be adjusted)
  if (clpToVes < 0.0001 || clpToVes > 1000) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Rate value out of reasonable range'
    );
  }

  try {
    const db = admin.firestore();

    // Get admin user data
    const adminDoc = await db.collection('users').doc(context.auth.uid).get();
    const adminData = adminDoc.data()!;

    // Update rate
    await db.collection('rates').doc('current').set({
      clpToVes,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: context.auth.uid,
      updatedByName: adminData.fullName,
    });

    return {
      success: true,
      message: 'Rate updated successfully',
      clpToVes,
    };
  } catch (error: any) {
    console.error('Error updating rate:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to update rate');
  }
});
