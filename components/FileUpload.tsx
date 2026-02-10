import React, { useCallback } from 'react';

interface FileData {
  file: File;
  base64: string;
}

interface FileUploadProps {
  onFilesSelect: (files: FileData[]) => void;
  accept?: string;
  label?: string;
  isProcessing?: boolean;
  multiple?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFilesSelect, 
  accept = ".pdf,.txt", // Default to safe types
  label = "Upload Resume",
  isProcessing = false,
  multiple = false
}) => {
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList && fileList.length > 0) {
      const files: FileData[] = [];
      const promises: Promise<void>[] = [];

      Array.from(fileList).forEach((file: File) => {
        const promise = new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              const base64String = (e.target.result as string).split(',')[1];
              files.push({ file, base64: base64String });
              resolve();
            } else {
              reject(new Error(`Failed to read file: ${file.name}`));
            }
          };
          reader.onerror = () => reject(new Error(`Error reading file: ${file.name}`));
          reader.readAsDataURL(file);
        });
        promises.push(promise);
      });

      try {
        await Promise.all(promises);
        onFilesSelect(files);
      } catch (error) {
        console.error("File reading error:", error);
        alert("Error reading one or more files. Please try again.");
      }
      
      // Reset value to allow re-uploading same files if needed
      event.target.value = '';
    }
  }, [onFilesSelect]);

  return (
    <div className="w-full">
      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition duration-150 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isProcessing ? (
             <svg className="animate-spin h-8 w-8 text-brand-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : (
            <svg className="w-8 h-8 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
          )}
          <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">{isProcessing ? "Processing..." : label}</span></p>
          <p className="text-xs text-slate-400">{isProcessing ? "Please wait" : (multiple ? "Drag & drop multiple files" : "PDF or TXT")}</p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept={accept} 
          onChange={handleFileChange} 
          disabled={isProcessing}
          multiple={multiple}
        />
      </label>
    </div>
  );
};

export default FileUpload;