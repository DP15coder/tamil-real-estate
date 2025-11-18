"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, XCircle } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setResult(null);
      }
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          success: false,
          message: data.error || "Upload failed",
        });
        return;
      }

      setResult({
        success: true,
        message: data.message,
        count: data.count,
      });

      // Reset file after successful upload
      setFile(null);
    } catch (err) {
      setResult({
        success: false,
        message: "An error occurred during upload",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Upload Tamil Transaction PDF</CardTitle>
          <CardDescription>
            Upload a PDF containing Tamil real estate transactions. The system will extract,
            translate, and store the transaction data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
          >
            {file ? (
              <div className="space-y-4">
                <FileText className="w-16 h-16 mx-auto text-primary" />
                <div>
                  <p className="text-lg font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                >
                  Remove File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-16 h-16 mx-auto text-gray-400" />
                <div>
                  <p className="text-lg font-medium">Drop PDF file here</p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <Button variant="outline" size="sm" asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Browse Files
                  </label>
                </Button>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {file && (
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full"
              size="lg"
            >
              {uploading ? "Processing..." : "Upload & Process"}
            </Button>
          )}

          {/* Result Message */}
          {result && (
            <div
              className={`p-4 rounded-lg flex items-start space-x-3 ${
                result.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    result.success ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {result.success ? "Success!" : "Error"}
                </p>
                <p
                  className={`text-sm ${
                    result.success ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {result.message}
                </p>
                {result.success && result.count && (
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-green-700 hover:text-green-900"
                    onClick={() => router.push("/dashboard/transactions")}
                  >
                    View Transactions →
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Processing Information</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• PDF will be parsed to extract transaction details</li>
              <li>• Tamil text will be automatically translated to English</li>
              <li>• Transactions will be stored in the database</li>
              <li>• Processing may take a few moments for large files</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

