'use client';

import { useState } from 'react';
import { Send, Database, Cloud, CheckCircle, Code, Copy, Check, Terminal, FileText, Lock, Globe, Server, Link as LinkIcon, UploadCloud } from 'lucide-react';

export default function GuideSection() {
  const [activeFeature, setActiveFeature] = useState<'upload' | 'shorten'>('upload');
  const [activeLang, setActiveLang] = useState<'javascript' | 'curl' | 'nodejs' | 'python' | 'php'>('javascript');
  const [copied, setCopied] = useState(false);

  const getDomain = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://domain-anda.com';
  };

  const domain = getDomain();

  const codeSnippets = {
    upload: {
      curl: `# Upload File via cURL (Terminal / Command Line)
curl -X POST "${domain}/api/upload" \\
  -F "file=@/path/to/lokal_file.zip" \\
  -F "password=rahasia123"`,

      javascript: `// Upload File dari Local Path (JavaScript / Node.js 18+ Native fetch)
const fs = require('fs');
const path = require('path');

async function uploadFromFilePath(filePath, password = '') {
  try {
    // 1. Cek & baca file dari path lokal
    if (!fs.existsSync(filePath)) {
      throw new Error(\`File tidak ditemukan di path: \${filePath}\`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    // 2. Buat Blob dari Buffer (PENTING: Sertakan fileName di parameter ke-3)
    const fileBlob = new Blob([fileBuffer]);

    const formData = new FormData();
    formData.append('file', fileBlob, fileName);
    if (password) {
      formData.append('password', password);
    }

    // 3. Request ke API Server
    const response = await fetch('${domain}/api/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ File Berhasil Diunggah!');
      console.log('🔗 Link Share:', result.fileUrl);
      console.log('📥 Link Direct Download:', result.downloadUrl);
      return result;
    } else {
      console.error('❌ Gagal Upload:', result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error saat upload file:', error.message);
  }
}

// Contoh Penggunaan dari File Path:
// uploadFromFilePath('/path/to/lokal_file.zip', 'rahasia123');`,

      nodejs: `// Upload File (Node.js + Axios & Form-Data)
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function uploadFileNode(filePath, password = '') {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    if (password) {
      form.append('password', password);
    }

    const response = await axios.post('${domain}/api/upload', form, {
      headers: {
        ...form.getHeaders()
      }
    });

    if (response.data.success) {
      console.log('✅ Upload Berhasil!');
      console.log('🔗 Share URL:', response.data.fileUrl);
      console.log('📥 Direct Download:', response.data.downloadUrl);
      return response.data;
    } else {
      console.error('❌ Error:', response.data.error);
    }
  } catch (err) {
    console.error('Gagal mengunggah file:', err.message);
  }
}`,

      python: `# Upload File (Python 3 + Requests)
import requests

def upload_file_external(file_path, password=""):
    url = "${domain}/api/upload"
    
    with open(file_path, "rb") as file_data:
        files = {"file": file_data}
        data = {"password": password} if password else {}
        
        response = requests.post(url, files=files, data=data)
        result = response.json()
        
        if result.get("success"):
            print("✅ Upload Berhasil!")
            print("Link Halaman:", result["fileUrl"])
            print("Direct Download:", result["downloadUrl"])
            return result
        else:
            print("❌ Gagal:", result.get("error"))
            return None

# Contoh Penggunaan:
# upload_file_external("foto_pemandangan.jpg", "123456")`,

      php: `<?php
// Upload File (PHP cURL)
function uploadFileExternal($filePath, $password = '') {
    $url = "${domain}/api/upload";
    
    $cfile = new CURLFile($filePath, mime_content_type($filePath), basename($filePath));
    $postData = array('file' => $cfile);
    
    if (!empty($password)) {
        $postData['password'] = $password;
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $result = json_decode($response, true);
    if (!empty($result['success'])) {
        echo "✅ Upload Berhasil! Link: " . $result['fileUrl'];
        return $result;
    } else {
        echo "❌ Gagal: " . ($result['error'] ?? 'Unknown Error');
        return null;
    }
}
?>`
    },
    shorten: {
      curl: `# Shorten URL via cURL (Terminal / Command Line)
curl -X POST "${domain}/api/shorten" \\
  -H "Content-Type: application/json" \\
  -d '{
    "targetUrl": "https://example.com/halaman-sangat-panjang",
    "customAlias": "link-keren",
    "title": "Website Utama Saya"
  }'`,

      javascript: `// Shorten URL (Browser / JS Fetch API)
async function createShortUrl(targetUrl, customAlias = '', title = '') {
  try {
    const response = await fetch('${domain}/api/shorten', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        targetUrl,
        customAlias,
        title
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Short URL Berhasil Dibuat!');
      console.log('🔗 Link Pendek:', result.shortUrl);
      console.log('🎯 Target URL:', result.record.targetUrl);
      return result;
    } else {
      console.error('❌ Gagal Pemendekan:', result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error saat request shorten:', error);
  }
}`,

      nodejs: `// Shorten URL (Node.js + Axios)
const axios = require('axios');

async function createShortUrlNode(targetUrl, customAlias = '', title = '') {
  try {
    const response = await axios.post('${domain}/api/shorten', {
      targetUrl,
      customAlias,
      title
    });

    if (response.data.success) {
      console.log('✅ Short URL Berhasil!');
      console.log('🔗 Link Pendek:', response.data.shortUrl);
      return response.data;
    } else {
      console.error('❌ Error:', response.data.error);
    }
  } catch (err) {
    console.error('Gagal shorten URL:', err.message);
  }
}`,

      python: `# Shorten URL (Python 3 + Requests)
import requests

def create_short_url(target_url, custom_alias="", title=""):
    url = "${domain}/api/shorten"
    payload = {
        "targetUrl": target_url,
        "customAlias": custom_alias,
        "title": title
    }
    
    response = requests.post(url, json=payload)
    result = response.json()
    
    if result.get("success"):
        print("✅ Short URL Berhasil!")
        print("Link Pendek:", result["shortUrl"])
        return result
    else:
        print("❌ Gagal:", result.get("error"))
        return None

# Contoh Penggunaan:
# create_short_url("https://github.com/rafael", "github-me", "My GitHub")`,

      php: `<?php
// Shorten URL (PHP cURL)
function createShortUrl($targetUrl, $customAlias = '', $title = '') {
    $url = "${domain}/api/shorten";
    $payload = json_encode(array(
        'targetUrl' => $targetUrl,
        'customAlias' => $customAlias,
        'title' => $title
    ));
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $result = json_decode($response, true);
    if (!empty($result['success'])) {
        echo "✅ Short URL Berhasil! Link: " . $result['shortUrl'];
        return $result;
    } else {
        echo "❌ Gagal: " . ($result['error'] ?? 'Unknown Error');
        return null;
    }
}
?>`
    }
  };

  const currentSnippet = codeSnippets[activeFeature][activeLang];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Intro Banner */}
      <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 rounded-3xl p-6 md:p-8 space-y-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-300 shadow-xs">
            <Code className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-serif-elegant text-zinc-100">Dokumentasi API & Integrasi</h2>
            <p className="text-xs md:text-sm text-zinc-400 font-outfit mt-0.5">
              Panduan integrasi lengkap dan fungsi kode siap pakai untuk fitur File Uploader dan Short URL.
            </p>
          </div>
        </div>
      </div>

      {/* API Endpoint Specification */}
      <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <Globe className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold font-serif-elegant text-zinc-100">Spesifikasi Endpoint API</h3>
        </div>

        <div className="space-y-4 text-xs font-outfit">
          {/* File Uploader API Spec */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 font-mono-code">
            <span className="px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-xs shrink-0">
              POST
            </span>
            <span className="text-zinc-100 font-semibold break-all">{domain}/api/upload</span>
            <span className="text-zinc-500 text-[11px] font-sans sm:ml-auto">(Endpoint File Uploader)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800 space-y-2">
              <h4 className="font-bold text-zinc-100 text-xs font-serif-elegant flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                Parameter Body (multipart/form-data)
              </h4>
              <ul className="space-y-1.5 text-zinc-300 font-mono-code text-[11px]">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">file</span>
                  <span>(Required, File) Binary file yang diunggah.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">password</span>
                  <span>(Optional, String) Kata sandi pelindung file.</span>
                </li>
              </ul>
            </div>

            <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800 space-y-2">
              <h4 className="font-bold text-zinc-100 text-xs font-serif-elegant flex items-center gap-2">
                <Server className="w-4 h-4 text-zinc-400" />
                Respon File Uploader (JSON 200 OK)
              </h4>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                Mengembalikan JSON berisi <code className="text-emerald-400 font-bold">success: true</code>, metadata file, <code className="text-zinc-200 font-bold">fileUrl</code> (share page), dan <code className="text-zinc-200 font-bold">downloadUrl</code> (direct download).
              </p>
            </div>
          </div>

          {/* Short URL API Spec */}
          <div className="pt-4 border-t border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 font-mono-code">
              <span className="px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-xs shrink-0">
                POST
              </span>
              <span className="text-zinc-100 font-semibold break-all">{domain}/api/shorten</span>
              <span className="text-zinc-500 text-[11px] font-sans sm:ml-auto">(Endpoint Short URL)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800 space-y-2">
                <h4 className="font-bold text-zinc-100 text-xs font-serif-elegant flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-400" />
                  Parameter Body (application/json)
                </h4>
                <ul className="space-y-1.5 text-zinc-300 font-mono-code text-[11px]">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">targetUrl</span>
                    <span>(Required, String) URL tujuan yang dipendekkan.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">customAlias</span>
                    <span>(Optional, String) Alias kustom misal: /s/my-alias</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-zinc-200 font-bold">title</span>
                    <span>(Optional, String) Judul / label URL.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800 space-y-2">
                <h4 className="font-bold text-zinc-100 text-xs font-serif-elegant flex items-center gap-2">
                  <Server className="w-4 h-4 text-zinc-400" />
                  Respon Short URL
                </h4>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Mengembalikan <code className="text-zinc-200 font-bold">shortUrl</code> (contoh: <code className="text-emerald-400 font-bold">{domain}/s/x8a2b1</code>) yang otomatis mengalihkan (HTTP 307 Redirect) ke <code className="text-emerald-400 font-bold">targetUrl</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Snippets Section */}
      <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-zinc-300" />
            <h3 className="text-lg font-bold font-serif-elegant text-zinc-100">Contoh Kode Siap Pakai</h3>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl border border-zinc-700 transition-all shrink-0 self-start sm:self-auto shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-zinc-400" />
                <span>Salin Kode</span>
              </>
            )}
          </button>
        </div>

        {/* Feature Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
          <button
            onClick={() => setActiveFeature('upload')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold font-outfit transition-all ${
              activeFeature === 'upload'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-emerald-400" />
            <span>1. File Uploader API</span>
          </button>
          <button
            onClick={() => setActiveFeature('shorten')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold font-outfit transition-all ${
              activeFeature === 'shorten'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LinkIcon className="w-4 h-4 text-emerald-400" />
            <span>2. Short URL API</span>
          </button>
        </div>

        {/* Language Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-zinc-950/80 p-1.5 rounded-2xl border border-zinc-800">
          <button
            onClick={() => setActiveLang('javascript')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-code font-semibold transition-all ${
              activeLang === 'javascript'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            JavaScript (Fetch)
          </button>
          <button
            onClick={() => setActiveLang('curl')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-code font-semibold transition-all ${
              activeLang === 'curl'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            cURL / Terminal
          </button>
          <button
            onClick={() => setActiveLang('nodejs')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-code font-semibold transition-all ${
              activeLang === 'nodejs'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Node.js (Axios)
          </button>
          <button
            onClick={() => setActiveLang('python')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-code font-semibold transition-all ${
              activeLang === 'python'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Python (Requests)
          </button>
          <button
            onClick={() => setActiveLang('php')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-code font-semibold transition-all ${
              activeLang === 'php'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            PHP (cURL)
          </button>
        </div>

        {/* Code Editor Preview Window */}
        <div className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shadow-md">
          <div className="bg-zinc-900 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between text-xs font-mono-code text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-zinc-700 inline-block" />
              <span className="w-3 h-3 rounded-full bg-zinc-600 inline-block" />
              <span className="w-3 h-3 rounded-full bg-zinc-500 inline-block" />
              <span className="ml-2 text-zinc-200 uppercase font-bold">{activeFeature} API &bull; {activeLang}</span>
            </div>
            <span className="text-[10px]">utf-8</span>
          </div>

          <pre className="p-4 md:p-6 overflow-x-auto text-xs font-mono-code text-zinc-100 leading-relaxed selection:bg-zinc-800">
            <code>{currentSnippet}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

