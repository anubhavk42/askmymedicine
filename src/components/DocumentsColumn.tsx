import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  FolderOpen,
  Calendar,
  Layers,
  Info,
  Download,
  FileArchive
} from 'lucide-react';
import { IngestedDocument } from '../utils/ragPipeline';
import { SAMPLE_DOCUMENTS } from '../data/sampleDocuments';

interface DocumentsColumnProps {
  documents: IngestedDocument[];
  totalChunks: number;
  onFileUpload: (files: File[]) => void;
  onSelectDoc: (doc: IngestedDocument) => void;
  onClearDocs?: () => void;
  isEmbedding: boolean;
  embeddingProgress?: { current: number; total: number; currentDoc?: string };
}

export const DocumentsColumn: React.FC<DocumentsColumnProps> = ({
  documents,
  totalChunks,
  onFileUpload,
  onSelectDoc,
  onClearDocs,
  isEmbedding,
  embeddingProgress,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUnzipping, setIsUnzipping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processIncomingFiles = async (files: File[]) => {
    const mdFiles: File[] = [];

    for (const file of files) {
      if (file.name.endsWith('.zip')) {
        try {
          setIsUnzipping(true);
          const zip = await JSZip.loadAsync(file);
          const zipEntries = Object.keys(zip.files);
          for (const entryName of zipEntries) {
            const entry = zip.files[entryName];
            if (!entry.dir && (entryName.endsWith('.md') || entryName.endsWith('.txt'))) {
              const textContent = await entry.async('string');
              const baseName = entryName.split('/').pop() || entryName;
              const extractedFile = new File([textContent], baseName, { type: 'text/markdown' });
              mdFiles.push(extractedFile);
            }
          }
        } catch (err) {
          console.error('Failed to unpack zip file:', err);
        } finally {
          setIsUnzipping(false);
        }
      } else if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        mdFiles.push(file);
      }
    }

    if (mdFiles.length > 0) {
      onFileUpload(mdFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      processIncomingFiles(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      processIncomingFiles(files);
      e.target.value = '';
    }
  };

  const handleDownloadZip = async () => {
    try {
      const zip = new JSZip();
      SAMPLE_DOCUMENTS.forEach((doc) => {
        zip.file(doc.fileName, doc.content);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AskMyMedicine_18_Clinical_Docs.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate sample docs zip:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFBFB] border-r border-gray-200">
      {/* Header */}
      <div className="p-3.5 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">Documents Ingestion</h2>
          </div>
          <div className="flex items-center gap-1.5">
            {documents.length > 0 && onClearDocs && (
              <button
                onClick={onClearDocs}
                className="text-[11px] font-medium text-rose-600 hover:text-rose-800 hover:underline px-1 py-0.5"
                title="Remove all uploaded documents and clear vector store"
              >
                Clear all
              </button>
            )}
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              18 Expected
            </span>
          </div>
        </div>

        {/* Summary Line */}
        <div className="flex items-center justify-between text-xs text-gray-600 bg-teal-50/70 border border-teal-100 px-2.5 py-1.5 rounded-lg font-medium">
          <span>
            <strong className="text-teal-900">{documents.length}</strong> documents
          </span>
          <span className="text-gray-300">•</span>
          <span>
            <strong className="text-teal-900">{totalChunks}</strong> chunks
          </span>
          <span className="text-gray-300">•</span>
          <span className="text-[11px] text-teal-800">
            {documents.filter((d) => d.status === 'embedded').length} embedded
          </span>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-teal-600 bg-teal-50/80 scale-[0.99]'
              : 'border-gray-200 hover:border-teal-400 bg-gray-50/50 hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".md,.txt,.zip"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <UploadCloud className="w-5 h-5 mx-auto text-teal-700 mb-1" />
          <p className="text-xs font-semibold text-gray-800">
            Drag & drop <span className="text-teal-700">.md files or .zip</span>
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            16 medicine leaflets + 2 care sheets (.md)
          </p>
        </div>

        {/* Optional Download Template Zip Action */}
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleDownloadZip}
            className="py-1 px-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 border border-gray-200"
            title="Download the 18 clinical markdown documents as a ZIP archive to your computer"
          >
            <Download className="w-3 h-3 text-gray-500" />
            <span>Download 18 docs (.zip)</span>
          </button>
        </div>
      </div>

      {/* Progress / Loading Skeleton */}
      {isUnzipping && (
        <div className="p-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center gap-2">
          <FileArchive className="w-4 h-4 animate-spin text-amber-700" />
          <span>Unpacking ZIP archive and extracting .md files...</span>
        </div>
      )}

      {isEmbedding && embeddingProgress && (
        <div className="p-3 bg-teal-50 border-b border-teal-200 text-xs text-teal-900">
          <div className="flex justify-between font-semibold mb-1">
            <span>Embedding documents with Gemini...</span>
            <span>
              {embeddingProgress.current} / {embeddingProgress.total}
            </span>
          </div>
          <div className="w-full bg-teal-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-teal-700 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${(embeddingProgress.current / Math.max(1, embeddingProgress.total)) * 100}%`,
              }}
            ></div>
          </div>
          {embeddingProgress.currentDoc && (
            <p className="text-[10px] text-teal-700 mt-1 truncate font-mono">
              Processing: {embeddingProgress.currentDoc}
            </p>
          )}
        </div>
      )}

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-gray-100">
        {documents.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-xs font-semibold text-gray-600">No documents uploaded yet</p>
            <p className="text-[11px] text-gray-400 mt-1">
              Drag &amp; drop your .md files or .zip archive to ingest and start.
            </p>
          </div>
        ) : (
          documents.map((doc) => {
            const isCareSheet = doc.documentType === 'care sheet';
            return (
              <div
                key={doc.id}
                onClick={() => onSelectDoc(doc)}
                className="pt-1.5 first:pt-0 group hover:bg-white p-2 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-200 hover:shadow-2xs"
              >
                <div className="flex items-start justify-between gap-1.5">
                  {/* Status dot & Medicine Name */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        doc.status === 'embedded'
                          ? 'bg-emerald-600'
                          : doc.status === 'failed'
                          ? 'bg-rose-600'
                          : 'bg-amber-500 animate-pulse'
                      }`}
                      title={`Status: ${doc.status}`}
                    />
                    <h3 className="text-xs font-semibold text-gray-900 truncate group-hover:text-teal-800">
                      {doc.medicineName}
                    </h3>
                  </div>

                  {/* Document Type Badge */}
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                      isCareSheet
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-teal-50 text-teal-800 border border-teal-200'
                    }`}
                  >
                    {isCareSheet ? 'Care Sheet' : 'Leaflet'}
                  </span>
                </div>

                {/* Sub info */}
                <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                  <span className="flex items-center gap-1 truncate text-gray-400">
                    <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                    {doc.pageLastReviewed}
                  </span>
                  <span className="flex items-center gap-1 font-mono font-medium text-gray-600 bg-gray-100 px-1.5 py-0.2 rounded">
                    <Layers className="w-3 h-3 text-gray-500" />
                    {doc.chunksCount} chunks
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-gray-50 border-t border-gray-200 text-[11px] text-gray-500 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span>Vector store persisted in memory &amp; localStorage</span>
      </div>
    </div>
  );
};
