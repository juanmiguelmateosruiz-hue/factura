import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "./firebase";

export interface InvoiceRecord {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  periodStart?: string;
  periodEnd?: string;
  cubicMeters: number;
  serviceType: "water" | "gas" | "electricity" | "maintenance" | "cleaning" | "other" | string;
  totalAmount: number;
  taxAmount?: number;
  currency: string;
  status: "processed" | "processing" | "error" | "pending";
  rawSnippet?: string;
  hotelDepartment?: string;
  meterReading?: string;
  batchId: string;
  ownerId: string;
  createdAt: string;
}

export interface BatchRecord {
  id: string;
  name: string;
  totalFiles: number;
  processedFiles: number;
  totalCubicMeters: number;
  totalAmount: number;
  ownerId: string;
  status: "processing" | "ready" | "completed";
  createdAt: string;
}

export interface QueryRecord {
  id: string;
  question: string;
  answer: string;
  matchedInvoicesCount: number;
  ownerId: string;
  batchId: string;
  createdAt: string;
}

const INVOICES_COLLECTION = "invoices";
const BATCHES_COLLECTION = "batches";
const QUERIES_COLLECTION = "queries";

export async function saveInvoiceToFirestore(invoice: InvoiceRecord): Promise<void> {
  const path = `${INVOICES_COLLECTION}/${invoice.id}`;
  try {
    const docRef = doc(db, INVOICES_COLLECTION, invoice.id);
    await setDoc(docRef, invoice);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveBatchToFirestore(batch: BatchRecord): Promise<void> {
  const path = `${BATCHES_COLLECTION}/${batch.id}`;
  try {
    const docRef = doc(db, BATCHES_COLLECTION, batch.id);
    await setDoc(docRef, batch);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateBatchInFirestore(
  batchId: string,
  partial: Partial<BatchRecord>
): Promise<void> {
  const path = `${BATCHES_COLLECTION}/${batchId}`;
  try {
    const docRef = doc(db, BATCHES_COLLECTION, batchId);
    await updateDoc(docRef, partial);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function getInvoicesByBatch(
  batchId: string,
  ownerId: string
): Promise<InvoiceRecord[]> {
  const path = INVOICES_COLLECTION;
  try {
    const q = query(
      collection(db, INVOICES_COLLECTION),
      where("ownerId", "==", ownerId),
      where("batchId", "==", batchId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as InvoiceRecord);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function getAllUserInvoices(ownerId: string): Promise<InvoiceRecord[]> {
  const path = INVOICES_COLLECTION;
  try {
    const q = query(collection(db, INVOICES_COLLECTION), where("ownerId", "==", ownerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as InvoiceRecord);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function getUserBatches(ownerId: string): Promise<BatchRecord[]> {
  const path = BATCHES_COLLECTION;
  try {
    const q = query(collection(db, BATCHES_COLLECTION), where("ownerId", "==", ownerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as BatchRecord);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function saveQueryRecord(queryData: QueryRecord): Promise<void> {
  const path = `${QUERIES_COLLECTION}/${queryData.id}`;
  try {
    const docRef = doc(db, QUERIES_COLLECTION, queryData.id);
    await setDoc(docRef, queryData);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getUserQueries(ownerId: string): Promise<QueryRecord[]> {
  const path = QUERIES_COLLECTION;
  try {
    const q = query(collection(db, QUERIES_COLLECTION), where("ownerId", "==", ownerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as QueryRecord);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function deleteInvoiceFromFirestore(invoiceId: string): Promise<void> {
  const path = `${INVOICES_COLLECTION}/${invoiceId}`;
  try {
    await deleteDoc(doc(db, INVOICES_COLLECTION, invoiceId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
