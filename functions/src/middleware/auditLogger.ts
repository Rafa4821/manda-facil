import * as admin from 'firebase-admin';

export interface AuditLogEntry {
  timestamp: admin.firestore.Timestamp;
  userId: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  result: 'success' | 'failure';
  errorMessage?: string;
}

/**
 * Audit logger for admin actions
 * Logs all critical operations for security monitoring
 */
export class AuditLogger {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Log an admin action
   */
  async logAction(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    try {
      await this.db.collection('auditLogs').add({
        ...entry,
        timestamp: admin.firestore.Timestamp.now(),
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw - logging failure shouldn't break the operation
    }
  }

  /**
   * Log successful action
   */
  async logSuccess(
    userId: string,
    action: string,
    resource: string,
    details?: any
  ): Promise<void> {
    await this.logAction({
      userId,
      action,
      resource,
      resourceId: details?.resourceId,
      changes: details?.changes,
      result: 'success',
    });
  }

  /**
   * Log failed action
   */
  async logFailure(
    userId: string,
    action: string,
    resource: string,
    errorMessage: string
  ): Promise<void> {
    await this.logAction({
      userId,
      action,
      resource,
      result: 'failure',
      errorMessage,
    });
  }

  /**
   * Log privilege escalation attempt
   */
  async logSecurityAlert(
    userId: string,
    attemptedAction: string,
    details: string
  ): Promise<void> {
    await this.logAction({
      userId,
      action: 'SECURITY_ALERT',
      resource: 'system',
      changes: { attemptedAction, details },
      result: 'failure',
    });

    // Also log to console for immediate alerting
    console.error('🚨 SECURITY ALERT:', {
      userId,
      attemptedAction,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}

export const auditLogger = new AuditLogger();
