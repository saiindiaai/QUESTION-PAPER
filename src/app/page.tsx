"use client";
import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface PdfMap {
  [subject: string]: {
    [topic: string]: string[];
  };
}

export default function Home() {
  const [pdfs, setPdfs] = useState<PdfMap>({});
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetch('/api/list-pdfs')
        .then((res) => res.json())
        .then((data) => {
          setPdfs(data);
          setLoading(false);
          const firstSubject = Object.keys(data)[0];
          if (firstSubject) {
            setExpandedSubjects(new Set([firstSubject]));
          }
        });
    }
  }, [mounted]);

  const toggleSubject = (subject: string) => {
    const newSet = new Set(expandedSubjects);
    if (newSet.has(subject)) {
      newSet.delete(subject);
    } else {
      newSet.add(subject);
    }
    setExpandedSubjects(newSet);
  };

  const toggleTopic = (topic: string) => {
    const newSet = new Set(expandedTopics);
    if (newSet.has(topic)) {
      newSet.delete(topic);
    } else {
      newSet.add(topic);
    }
    setExpandedTopics(newSet);
  };

  const getFileName = (filePath: string) => {
    return filePath.split(/[\\/]/).pop() || 'Unknown';
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedSubject || !selectedTopic) return;

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('file', files[i]);
    }
    formData.append('subject', selectedSubject);
    formData.append('topic', selectedTopic);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setShowUploadModal(false);
        // Reload PDFs
        const pdfRes = await fetch('/api/list-pdfs');
        const data = await pdfRes.json();
        setPdfs(data);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button
          className={styles.hamburger}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className={styles.headerContent}>
          <div className={styles.headerTitleWrapper}>
            <h1>📚 Question Papers</h1>
            <p>Browse and view all your class 9 question papers</p>
          </div>
          <button
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <div className={styles.mainContent}>
        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarHeader}>
            <h2>Subjects</h2>
            <span className={styles.docCount}>
              {Object.keys(pdfs).length} subjects
            </span>
          </div>

          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : Object.keys(pdfs).length === 0 ? (
            <div className={styles.empty}>No PDFs found</div>
          ) : (
            <nav className={styles.navList}>
              {Object.entries(pdfs).map(([subject, topics]) => (
                <div key={subject} className={styles.subjectItem}>
                  <button
                    className={styles.subjectButton}
                    onClick={() => toggleSubject(subject)}
                  >
                    <span className={styles.expandIcon}>
                      {expandedSubjects.has(subject) ? '▼' : '▶'}
                    </span>
                    <span className={styles.subjectName}>
                      {subject.replace('_9', '')}
                    </span>
                    <span className={styles.fileCount}>
                      ({Object.values(topics).reduce((a, b) => a + b.length, 0)})
                    </span>
                  </button>

                  {expandedSubjects.has(subject) && (
                    <div className={styles.topicsContainer}>
                      {Object.entries(topics).map(([topic, files]) => (
                        <div key={topic} className={styles.topicItem}>
                          <button
                            className={styles.topicButton}
                            onClick={() => toggleTopic(topic)}
                          >
                            <span className={styles.expandIcon}>
                              {expandedTopics.has(topic) ? '▼' : '▶'}
                            </span>
                            <span className={styles.topicName}>{topic}</span>
                            <span className={styles.fileCount}>({files.length})</span>
                          </button>

                          {expandedTopics.has(topic) && (
                            <ul className={styles.filesList}>
                              {files.map((file) => (
                                <li key={file}>
                                  <button
                                    className={`${styles.fileButton} ${
                                      selectedPdf === file ? styles.active : ''
                                    }`}
                                    onClick={() => {
                                      setSelectedPdf(file);
                                      setMobileMenuOpen(false);
                                    }}
                                    title={getFileName(file)}
                                  >
                                    📄 {getFileName(file)}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          )}

          <div className={styles.sidebarFooter}>
            <button
              className={styles.uploadButton}
              onClick={() => setShowUploadModal(true)}
            >
              ➕ Upload PDF
            </button>
          </div>
        </aside>

        {/* Viewer */}
        <main className={styles.viewer}>
          {selectedPdf ? (
            <>
              <div className={styles.viewerHeader}>
                <h2>📖 {getFileName(selectedPdf)}</h2>
              </div>
              <iframe
                src={`/api/pdf?file=${encodeURIComponent(selectedPdf)}`}
                className={styles.pdfIframe}
                title="PDF Viewer"
              />
            </>
          ) : (
            <div className={styles.emptyViewer}>
              <div className={styles.emptyContent}>
                <div className={styles.emptyIcon}>📄</div>
                <h2>Select a PDF to view</h2>
                <p>Choose a document from the list on the left to get started</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <button
              className={styles.modalClose}
              onClick={() => setShowUploadModal(false)}
            >
              ✕
            </button>
            <h2>Upload PDF Files</h2>
            <div className={styles.formGroup}>
              <label>Select Subject:</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={uploading}
              >
                <option value="">Choose a subject...</option>
                {Object.keys(pdfs).map((subject) => (
                  <option key={subject} value={subject}>
                    {subject.replace('_9', '')}
                  </option>
                ))}
              </select>
            </div>
            {selectedSubject && (
              <div className={styles.formGroup}>
                <label>Select Topic:</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  disabled={uploading}
                >
                  <option value="">Choose a topic...</option>
                  {Object.keys(pdfs[selectedSubject] || {}).map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {selectedSubject && selectedTopic && (
              <div className={styles.formGroup}>
                <label>Select PDF Files:</label>
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className={styles.fileInput}
                />
              </div>
            )}
            {uploading && <div className={styles.uploading}>Uploading...</div>}
            <button
              className={styles.modalButton}
              onClick={() => setShowUploadModal(false)}
              disabled={uploading}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}