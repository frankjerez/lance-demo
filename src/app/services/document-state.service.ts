import { Injectable, signal } from '@angular/core';

export interface DocumentUploadStatus {
  documentId: string;
  uploaded: boolean;
  uploadedAt?: string;
  fileName?: string;
}

const STORAGE_KEY = 'lance-document-uploads';

@Injectable({
  providedIn: 'root',
})
export class DocumentStateService {
  // Track uploaded documents
  private uploadedDocuments = signal<Map<string, DocumentUploadStatus>>(new Map());

  constructor() {
    this.loadFromStorage();
  }

  markDocumentAsUploaded(documentId: string, fileName: string): void {
    const now = new Date();
    const uploadedAt = now.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const currentDocs = new Map(this.uploadedDocuments());
    currentDocs.set(documentId, {
      documentId,
      uploaded: true,
      uploadedAt,
      fileName,
    });

    this.uploadedDocuments.set(currentDocs);
    this.saveToStorage();
  }

  isDocumentUploaded(documentId: string): boolean {
    return this.uploadedDocuments().has(documentId);
  }

  getDocumentStatus(documentId: string): DocumentUploadStatus | undefined {
    return this.uploadedDocuments().get(documentId);
  }

  resetDocuments(): void {
    this.uploadedDocuments.set(new Map());
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      const docsArray = Array.from(this.uploadedDocuments().entries());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docsArray));
    } catch (error) {
      console.error('Failed to save document states to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const docsArray = JSON.parse(stored) as [string, DocumentUploadStatus][];
        const docsMap = new Map(docsArray);
        this.uploadedDocuments.set(docsMap);
        console.log('📦 Loaded document upload states from localStorage:', docsMap.size, 'items');
      }
    } catch (error) {
      console.error('Failed to load document states from localStorage:', error);
    }
  }
}
