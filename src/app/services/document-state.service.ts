import { Injectable, signal } from '@angular/core';

export interface DocumentUploadStatus {
  documentId: string;
  uploaded: boolean;
  uploadedAt?: string;
  fileName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DocumentStateService {
  // Track uploaded documents
  private uploadedDocuments = signal<Map<string, DocumentUploadStatus>>(new Map());

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
  }

  isDocumentUploaded(documentId: string): boolean {
    return this.uploadedDocuments().has(documentId);
  }

  getDocumentStatus(documentId: string): DocumentUploadStatus | undefined {
    return this.uploadedDocuments().get(documentId);
  }

  resetDocuments(): void {
    this.uploadedDocuments.set(new Map());
  }
}
