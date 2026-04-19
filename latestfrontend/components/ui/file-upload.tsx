"use client";
 
import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";
import {
  UploadCloud,
  File as FileIcon,
  Trash2,
  Loader,
  CheckCircle,
} from "lucide-react";
 
interface FileWithPreview {
  id: string;
  preview: string;
  progress: number;
  name: string;
  size: number;
  type: string;
  lastModified?: number;
  file?: File;
}
 
export default function FileUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
 
  // Process dropped or selected files
  const handleFiles = (fileList: FileList) => {
    const newFiles = Array.from(fileList).map((file) => ({
      id: `${URL.createObjectURL(file)}-${Date.now()}`,
      preview: URL.createObjectURL(file),
      progress: 0,
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      file,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((f) => simulateUpload(f.id));
  };
 
  // Simulate upload progress
  const simulateUpload = (id: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, progress: Math.min(progress, 100) } : f,
        ),
      );
      if (progress >= 100) {
        clearInterval(interval);
        if (navigator.vibrate) navigator.vibrate(100);
        
        // Notify parent that upload is complete after a brief delay to show 100% state
        if (onUploadComplete) {
            setTimeout(() => onUploadComplete(), 1000);
        }
      }
    }, 300);
  };
 
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };
 
  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
 
  const onDragLeave = () => setIsDragging(false);
 
  const onSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
  };
 
  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };
 
  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-6">
      {/* Drop zone */}
      <motion.div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        initial={false}
        animate={{
          borderColor: isDragging ? "#e11d48" : "#ffffff10", // Using a red matching theme instead of blue
          scale: isDragging ? 1.02 : 1,
        }}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className={clsx(
          "relative rounded-2xl p-8 md:p-12 text-center cursor-pointer bg-secondary/50 border border-primary/10 shadow-sm hover:shadow-md backdrop-blur group",
          isDragging && "ring-4 ring-rose-500/30 border-rose-500",
        )}
      >
        <div className="flex flex-col items-center gap-5">
          <motion.div
            animate={{ y: isDragging ? [-5, 0, -5] : 0 }}
            transition={{
              duration: 1.5,
              repeat: isDragging ? Infinity : 0,
              ease: "easeInOut",
            }}
            className="relative"
          >
            <motion.div
              animate={{
                opacity: isDragging ? [0.5, 1, 0.5] : 1,
                scale: isDragging ? [0.95, 1.05, 0.95] : 1,
              }}
              transition={{
                duration: 2,
                repeat: isDragging ? Infinity : 0,
                ease: "easeInOut",
              }}
              className="absolute -inset-4 bg-rose-500/10 rounded-full blur-md"
              style={{ display: isDragging ? "block" : "none" }}
            />
            <UploadCloud
              className={clsx(
                "w-16 h-16 md:w-20 md:h-20 drop-shadow-sm",
                isDragging
                  ? "text-rose-500"
                  : "text-muted-foreground group-hover:text-rose-500 transition-colors duration-300",
              )}
            />
          </motion.div>
 
          <div className="space-y-2">
            <h3 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wider text-foreground">
              {isDragging
                ? "Drop files here"
                : files.length
                  ? "Add more files"
                  : "Upload your files"}
            </h3>
            <p className="text-muted-foreground md:text-lg max-w-md mx-auto">
              {isDragging ? (
                <span className="font-medium text-rose-500">
                  Release to upload
                </span>
              ) : (
                <>
                  Drag & drop files here, or{" "}
                  <span className="text-rose-500 font-medium">browse</span>
                </>
              )}
            </p>
            <p className="text-sm text-muted-foreground/70">
              Supports images, documents, videos, and more
            </p>
          </div>
 
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={onSelect}
            accept="image/*,application/pdf,video/*,audio/*,text/*,application/zip"
          />
        </div>
      </motion.div>
 
      {/* Uploaded files list */}
      <div className="mt-8">
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-between items-center mb-3 px-2"
            >
              <h3 className="font-display font-semibold text-lg md:text-xl uppercase tracking-wider text-foreground">
                Uploaded files ({files.length})
              </h3>
              {files.length > 1 && (
                <button
                  onClick={() => setFiles([])}
                  className="text-sm font-medium px-3 py-1 bg-secondary hover:bg-secondary/80 rounded-md text-foreground hover:text-destructive transition-colors duration-200"
                >
                  Clear all
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
 
        <div
          className={clsx(
            "flex flex-col gap-3 overflow-y-auto pr-2",
            files.length > 3 &&
              "max-h-96 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600 scrollbar-track-transparent",
          )}
        >
          <AnimatePresence>
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="px-4 py-4 flex items-start gap-4 rounded-xl bg-card border border-border shadow hover:shadow-md transition-all duration-200"
              >
                {/* Thumbnail */}
                <div className="relative flex-shrink-0">
                  {file.type.startsWith("image/") ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover border border-border shadow-sm"
                    />
                  ) : file.type.startsWith("video/") ? (
                    <video
                      src={file.preview}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover border border-border shadow-sm"
                      controls={false}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      poster=""
                    />
                  ) : (
                    <FileIcon className="w-16 h-16 md:w-20 md:h-20 text-muted-foreground" />
                  )}
                  {file.progress === 100 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute -right-2 -bottom-2 bg-white dark:bg-zinc-800 rounded-full shadow-sm"
                    >
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </motion.div>
                  )}
                </div>
 
                {/* File info & progress */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-1 w-full">
                    {/* Filename */}
                    <div className="flex items-center gap-2 min-w-0">
                      <FileIcon className="w-5 h-5 flex-shrink-0 text-rose-500" />
                      <h4
                        className="font-medium text-base md:text-lg truncate text-foreground"
                        title={file.name}
                      >
                        {file.name}
                      </h4>
                    </div>
 
                    {/* Details & remove/loading */}
                    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                      <span className="text-xs md:text-sm">
                        {formatFileSize(file.size)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="font-medium">
                          {Math.round(file.progress)}%
                        </span>
                        {file.progress < 100 ? (
                          <Loader className="w-4 h-4 animate-spin text-rose-500" />
                        ) : (
                          <Trash2
                            className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-destructive transition-colors duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFiles((prev) =>
                                prev.filter((f) => f.id !== file.id),
                              );
                            }}
                            aria-label="Remove file"
                          />
                        )}
                      </span>
                    </div>
                  </div>
 
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mt-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${file.progress}%` }}
                      transition={{
                        duration: 0.4,
                        type: "spring",
                        stiffness: 100,
                        ease: "easeOut",
                      }}
                      className={clsx(
                        "h-full rounded-full shadow-inner",
                        file.progress < 100 ? "bg-rose-500" : "bg-emerald-500",
                      )}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
