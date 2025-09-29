import { useState, useEffect } from 'react';
import { Paperclip, X, FileText, AlertCircle } from 'lucide-react';
import mammoth from 'mammoth';

const FileUpload = ({ onFileProcessed, onRemoveFile, currentFile, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false);

  // Load PDF.js from CDN on component mount
  useEffect(() => {
    if (window.pdfjsLib) {
      setPdfJsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        setPdfJsLoaded(true);
        console.log('PDF.js loaded successfully');
      }
    };
    script.onerror = () => {
      console.error('Failed to load PDF.js from CDN');
      setError('Failed to load PDF processing library');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  const extractTextFromPDF = async (file) => {
    try {
      console.log('Starting PDF extraction...');
      
      if (!window.pdfjsLib) {
        throw new Error('PDF.js library not loaded');
      }

      const arrayBuffer = await file.arrayBuffer();
      console.log('ArrayBuffer loaded, size:', arrayBuffer.byteLength);
      
      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      console.log('PDF loaded, pages:', pdf.numPages);
      
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`Processing page ${i}/${pdf.numPages}`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }

      console.log('PDF extraction complete, text length:', fullText.length);
      
      if (!fullText.trim()) {
        throw new Error('No text could be extracted from this PDF. It may be image-based or empty.');
      }
      
      return fullText;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`Failed to read PDF: ${error.message}`);
    }
  };

  const extractTextFromDOC = async (file) => {
    try {
      console.log('Starting DOC extraction...');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      console.log('DOC extraction complete, text length:', result.value.length);
      
      if (!result.value.trim()) {
        throw new Error('No text could be extracted from this document.');
      }
      
      return result.value;
    } catch (error) {
      console.error('DOC extraction error:', error);
      throw new Error(`Failed to read DOC file: ${error.message}`);
    }
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    setError(null);
    setIsLoading(true);
    const fileType = file.type;
    const fileName = file.name;
    const fileSize = (file.size / 1024 / 1024).toFixed(2);

    console.log('File selected:', { fileName, fileType, fileSize: fileSize + 'MB' });

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const fileExtension = fileName.toLowerCase().split('.').pop();
    const allowedExtensions = ['pdf', 'doc', 'docx'];

    if (!allowedTypes.includes(fileType) && !allowedExtensions.includes(fileExtension)) {
      const errorMsg = 'Please upload only PDF or DOC files';
      setError(errorMsg);
      setIsLoading(false);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      const errorMsg = 'File size must be less than 10MB';
      setError(errorMsg);
      setIsLoading(false);
      return;
    }

    // Check if PDF.js is loaded for PDF files
    if ((fileType === 'application/pdf' || fileExtension === 'pdf') && !pdfJsLoaded) {
      setError('PDF library is still loading, please try again in a moment');
      setIsLoading(false);
      return;
    }

    try {
      let extractedText = '';

      if (fileType === 'application/pdf' || fileExtension === 'pdf') {
        extractedText = await extractTextFromPDF(file);
      } else {
        extractedText = await extractTextFromDOC(file);
      }

      onFileProcessed({
        name: fileName,
        size: fileSize,
        type: fileType,
        content: extractedText
      });
      
      setError(null);
    } catch (error) {
      console.error('File processing error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  if (currentFile) {
    return (
      <div className="space-y-2">
        <div className="bg-gray-700 rounded-lg p-3 flex items-center justify-between border border-gray-600">
          <div className="flex items-center space-x-3 flex-1 overflow-hidden">
            <FileText className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <div className="flex-1 overflow-hidden">
              <p className="text-white text-sm truncate">{currentFile.name}</p>
              <p className="text-gray-400 text-xs">{currentFile.size} MB</p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onRemoveFile}
              className="text-gray-400 hover:text-white ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isDragging
            ? 'border-purple-500 bg-purple-500/10'
            : 'border-gray-600 hover:border-gray-500'
        } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={handleFileInput}
          disabled={isLoading}
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <Paperclip className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-gray-300 text-sm mb-1">
            {isLoading ? 'Processing file...' : 'Drop your PDF or DOC file here'}
          </p>
          <p className="text-gray-500 text-xs">
            {isLoading ? 'Please wait' : !pdfJsLoaded ? 'Loading PDF support...' : 'or click to browse (max 10MB)'}
          </p>
        </label>
      </div>
      
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-300 text-sm">{error}</p>
            <p className="text-red-400 text-xs mt-1">Check the browser console (F12) for more details.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;