"use client";

import { useState, useRef, useCallback } from "react";
import { uploadVideo } from "@/lib/api";
import type { VideoUploadResponse } from "@/lib/schemas/video";

type UploadState = "idle" | "file-selected" | "uploading" | "success" | "error";

interface FileInfo {
  name: string;
  size: number;
  type: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
}

export default function UploadForm() {
  const [state, setState] = useState<UploadState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VideoUploadResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("video/")) {
      setError("Please select a video file.");
      setState("error");
      return;
    }
    setFile(f);
    setFileInfo({ name: f.name, size: f.size, type: f.type });
    setState("file-selected");
    setError("");
    setResult(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const simulateProgress = useCallback(() => {
    setProgress(0);
    let current = 0;
    progressIntervalRef.current = setInterval(() => {
      current += Math.random() * 12 + 3;
      if (current >= 90) {
        current = 90;
        clearInterval(progressIntervalRef.current);
      }
      setProgress(Math.min(current, 90));
    }, 200);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setState("uploading");
    setError("");
    simulateProgress();

    try {
      const response = await uploadVideo(file);
      clearInterval(progressIntervalRef.current);
      setProgress(100);
      setResult(response);
      setState("success");
    } catch (err) {
      clearInterval(progressIntervalRef.current);
      setProgress(0);
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setState("error");
    }
  }, [file, simulateProgress]);

  const handleReset = useCallback(() => {
    setState("idle");
    setFile(null);
    setFileInfo(null);
    setProgress(0);
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleRetry = useCallback(() => {
    setError("");
    setState("file-selected");
  }, []);

  return (
    <div className="glass-surface p-6">
      <h3 className="font-display text-xl tracking-wider text-[var(--text-strong)] mb-4">
        UPLOAD VIDEO
      </h3>

      {state === "idle" && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
          aria-label="Drop a video file here or click to browse"
          className={`
            relative flex flex-col items-center justify-center gap-4 p-12
            border-2 border-dashed rounded-xl cursor-pointer
            transition-all duration-300
            ${
              isDragOver
                ? "border-[var(--accent-signal)] bg-[var(--accent-signal)]/5"
                : "border-[var(--border-subtle)] hover:border-[var(--text-dim)]"
            }
          `}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isDragOver ? "var(--accent-signal)" : "var(--text-dim)"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-colors"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div className="text-center">
            <p className="text-[var(--text-strong)] font-medium">
              {isDragOver ? "Drop your video here" : "Drag & drop a video file"}
            </p>
            <p className="text-sm text-[var(--text-dim)] mt-1">
              or click to browse · video/* files only
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileInput}
            className="hidden"
            aria-hidden="true"
          />
        </div>
      )}

      {state === "file-selected" && fileInfo && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-0)] border border-[var(--border-subtle)]">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--surface-1)] flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent-signal)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-strong)] truncate">
                {fileInfo.name}
              </p>
              <p className="text-xs text-[var(--text-dim)]">
                {formatFileSize(fileInfo.size)} · {fileInfo.type}
              </p>
            </div>
            <button
              onClick={handleReset}
              aria-label="Remove file"
              className="text-[var(--text-dim)] hover:text-[var(--accent-live)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <button
            onClick={handleUpload}
            className="w-full py-3 rounded-lg font-semibold text-sm uppercase tracking-wider bg-[var(--accent-signal)] text-[var(--bg-0)] hover:brightness-110 transition-all"
          >
            Upload Video
          </button>
        </div>
      )}

      {state === "uploading" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <svg
              className="animate-spin w-5 h-5 text-[var(--accent-signal)]"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="12" cy="12" r="10" stroke="var(--surface-1)" strokeWidth="3" />
              <path
                d="M12 2a10 10 0 019.95 9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-sm text-[var(--text-muted)]">
              Uploading {fileInfo?.name}…
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--surface-1)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent-signal)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[var(--text-dim)] text-right">
            {Math.round(progress)}%
          </p>
        </div>
      )}

      {state === "success" && result && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-950/30 border border-green-800/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-green-400">Upload Complete</p>
              <p className="text-xs text-[var(--text-dim)] mt-0.5">
                Video ID: <code className="text-[var(--accent-signal)]">{result.video_id}</code>
              </p>
              <p className="text-xs text-[var(--text-dim)]">{result.message}</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="w-full py-3 rounded-lg font-semibold text-sm uppercase tracking-wider border border-[var(--border-subtle)] text-[var(--text-strong)] hover:border-[var(--accent-signal)] transition-all"
          >
            Upload Another
          </button>
        </div>
      )}

      {state === "error" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-950/30 border border-red-800/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-live)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-[var(--accent-live)]">Upload Failed</p>
              <p className="text-xs text-[var(--text-dim)] mt-0.5">{error}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className="flex-1 py-3 rounded-lg font-semibold text-sm uppercase tracking-wider bg-[var(--accent-signal)] text-[var(--bg-0)] hover:brightness-110 transition-all"
            >
              Retry
            </button>
            <button
              onClick={handleReset}
              className="flex-1 py-3 rounded-lg font-semibold text-sm uppercase tracking-wider border border-[var(--border-subtle)] text-[var(--text-strong)] hover:border-[var(--accent-signal)] transition-all"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
