/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { UploadCloud, Image as ImageIcon, Loader2, AlertCircle, Share2, ClipboardList, FileText, Copy, Type } from 'lucide-react';
import { parseAccidentScreenshot } from './services/geminiService';

export default function App() {
  const [inputMode, setInputMode] = useState<'file' | 'text'>('text');
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/') || file.type === 'text/plain') {
        handleFileSelected(file);
      } else {
        setError('請上傳圖片或 TXT 格式檔案');
      }
    }
  };

  const handleFileSelected = (file: File) => {
    setError(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleProcess = async () => {
    if (inputMode === 'file' && !selectedFile) return;
    if (inputMode === 'text' && !pastedText.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      let fileToProcess: File;
      if (inputMode === 'text') {
        fileToProcess = new File([pastedText], "pasted.txt", { type: "text/plain" });
      } else {
        fileToProcess = selectedFile!;
      }
      
      const response = await parseAccidentScreenshot(fileToProcess);
      setResult(response);
    } catch (err: any) {
      setError(err.message || '發生錯誤');
    } finally {
      setIsProcessing(false);
    }
  };

  const shareToLine = () => {
    if (!result) return;
    const text = encodeURIComponent(result);
    window.open(`https://line.me/R/msg/text/?${text}`, '_blank');
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result)
      .then(() => alert('已複製結果至剪貼簿'))
      .catch(() => alert('複製失敗'));
  };

  const shareToFacebook = () => {
    // Facebook sharer works better with URLs. For text, it's safer to copy first.
    copyToClipboard();
    window.open('https://www.facebook.com/', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-200">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-red-100 rounded-full mb-4">
            <ClipboardList className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            事故自動統計工具
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            上傳對話截圖或文字檔，自動解析各科室人數與值班、補眠、休假、受訓狀態。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Upload */}
          <div className="flex flex-col space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button
                  className={`flex-1 py-4 text-sm font-medium flex items-center justify-center transition-colors ${
                    inputMode === 'file'
                      ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                      : 'bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setInputMode('file')}
                >
                  <UploadCloud className="w-4 h-4 mr-2" />
                  上傳檔案
                </button>
                <button
                  className={`flex-1 py-4 text-sm font-medium flex items-center justify-center transition-colors ${
                    inputMode === 'text'
                      ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                      : 'bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setInputMode('text')}
                >
                  <Type className="w-4 h-4 mr-2" />
                  貼上文字
                </button>
              </div>
              <div className="p-6">
                {inputMode === 'file' ? (
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                      previewUrl || selectedFile?.type === 'text/plain' ? 'border-gray-300 hover:border-gray-400' : 'border-gray-300 hover:border-blue-400 bg-gray-50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,.txt,text/plain"
                      className="hidden"
                    />
                    
                    {selectedFile?.type === 'text/plain' ? (
                      <div className="flex flex-col items-center justify-center py-6">
                        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                          <FileText className="w-8 h-8 text-blue-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">點擊或拖曳更換</p>
                      </div>
                    ) : previewUrl ? (
                      <div className="relative rounded-lg overflow-hidden border border-gray-200">
                        <img src={previewUrl} alt="Preview" className="w-full h-auto object-contain max-h-[300px]" referrerPolicy="no-referrer" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 flex justify-between items-end">
                          <p className="text-sm text-white truncate max-w-[200px]">{selectedFile?.name}</p>
                          <p className="text-xs text-gray-300 flex-shrink-0">點擊或拖曳更換</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6">
                        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                          <UploadCloud className="w-8 h-8 text-blue-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">點擊上傳或將檔案拖曳至此</p>
                        <p className="text-xs text-gray-500">支援 PNG, JPG 等圖片格式及 TXT 文字檔</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="請在此直接貼上人員名單或對話內容..."
                    className="w-full h-[256px] p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm bg-gray-50 text-gray-900"
                  />
                )}

                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start text-sm">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  onClick={handleProcess}
                  disabled={(inputMode === 'file' && !selectedFile) || (inputMode === 'text' && !pastedText.trim()) || isProcessing}
                  className="mt-6 w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      解析中...
                    </>
                  ) : (
                    '開始解析'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Result */}
          <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center z-10">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                ✨ 解析結果
              </h2>
              {result && (
                <div className="flex space-x-2">
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Copy className="w-4 h-4 mr-1.5" />
                    一鍵複製
                  </button>
                  <button
                    onClick={shareToFacebook}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-lg text-white bg-[#1877F2] hover:bg-[#166FE5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1877F2] transition-colors"
                  >
                    分享至 FB
                  </button>
                  <button
                    onClick={shareToLine}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-lg text-white bg-[#06C755] hover:bg-[#05B54D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#06C755] transition-colors"
                  >
                    <Share2 className="w-4 h-4 mr-1.5" />
                    LINE 傳送
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-6 flex-grow overflow-y-auto min-h-[300px]">
              {isProcessing ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-sm">AI 正在讀取圖片內容並進行統計分析...</p>
                </div>
              ) : result ? (
                <div className="markdown-body prose prose-sm sm:prose max-w-none text-gray-700">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl p-8">
                  <ClipboardList className="w-12 h-12 mb-3 text-gray-200" />
                  <p className="text-sm text-center">上傳圖片後，解析結果將顯示於此。</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
