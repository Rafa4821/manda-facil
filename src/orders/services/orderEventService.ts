import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../../app/firebase/firebase'
import { OrderEvent, CreateOrderEventData } from '../types/order'

export const orderEventService = {
  // Create order event
  createEvent: async (
    orderId: string,
    eventData: CreateOrderEventData
  ): Promise<string> => {
    try {
      const eventsRef = collection(db, 'orders', orderId, 'events')
      const eventDoc = await addDoc(eventsRef, {
        fromStatus: eventData.fromStatus,
        toStatus: eventData.toStatus,
        changedBy: eventData.changedBy,
        changedByName: eventData.changedByName,
        note: eventData.note || null,
        createdAt: Timestamp.now(),
      })
      
      return eventDoc.id
    } catch (error) {
      console.error('Error creating order event:', error)
      throw error
    }
  },

  // Get all events for an order
  getOrderEvents: async (orderId: string): Promise<OrderEvent[]> => {
    try {
      const eventsRef = collection(db, 'orders', orderId, 'events')
      const q = query(eventsRef, orderBy('createdAt', 'asc'))
      
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          orderId,
          fromStatus: data.fromStatus,
          toStatus: data.toStatus,
          changedBy: data.changedBy,
          changedByName: data.changedByName,
          note: data.note,
          createdAt: data.createdAt?.toDate() || new Date(),
        }
      })
    } catch (error) {
      console.error('Error fetching order events:', error)
      throw error
    }
  },
}
