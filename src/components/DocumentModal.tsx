import React from 'react';
import { X, FileText, Calendar, Globe, Building2, Layers } from 'lucide-react';
import { IngestedDocument } from '../utils/ragPipeline';

interface DocumentModalProps {
  document: IngestedDocument | null;
  onClose: () => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({ document, onClose }) => {
  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-[#FAFBFB]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{document.medicineName}</h3>
              <p className="text-[11px] text-gray-500 font-mono">{document.fileName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Strip */}
        <div className="bg-teal-50/70 border-b border-teal-100 px-4 py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-gray-500 block uppercase font-semibold">Type:</span>
            <span className="font-semibold text-teal-900 capitalize">{document.documentType}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 block uppercase font-semibold">Reviewed:</span>
            <span className="font-medium text-gray-800">{document.pageLastReviewed}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 block uppercase font-semibold">Country:</span>
            <span className="font-medium text-gray-800">{document.country}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 block uppercase font-semibold">Chunks:</span>
            <span className="font-bold text-teal-800">{document.chunksCount} generated</span>
          </div>
        </div>

        {/* Content View */}
        <div className="flex-1 overflow-y-auto p-4 text-xs font-mono text-gray-800 bg-gray-50/50 leading-relaxed whitespace-pre-wrap">
          {document.rawContent}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
