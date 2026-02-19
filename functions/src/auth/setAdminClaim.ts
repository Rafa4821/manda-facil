import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface SetAdminClaimData {
  userId: string;
  isAdmin: boolean;
}

/**
 * Callable function to set admin custom claim
 * Only callable by existing admins or manually via Firebase CLI
 */
export const setAdminClaim = functions.https.onCall(async (data: SetAdminClaimData, context) => {
  // Verify caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to call this function'
    );
  }

  // Verify caller has admin claim
  const callerToken = await admin.auth().getUser(context.auth.uid);
  const callerClaims = callerToken.customClaims || {};
  
  if (!callerClaims.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can set admin claims'
    );
  }

  const { userId, isAdmin } = data;

  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'userId is required');
  }

  try {
    // Set custom claim
    await admin.auth().setCustomUserClaims(userId, { admin: isAdmin });

    // Update user document in Firestore
    await admin.firestore().collection('users').doc(userId).update({
      role: isAdmin ? 'admin' : 'customer',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: `Admin claim ${isAdmin ? 'granted' : 'revoked'} for user ${userId}`,
    };
  } catch (error) {
    console.error('Error setting admin claim:', error);
    throw new functions.https.HttpsError('internal', 'Failed to set admin claim');
  }
});
