import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activePage, setActivePage] = useState("Home");
  const [selectedTagFolder, setSelectedTagFolder] = useState(null);

  const fetchScreenshots = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/screenshots/all"
      );

      setScreenshots(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const loadScreenshots = async () => {
      await fetchScreenshots();
    };

    loadScreenshots();
  }, []);

  const categories = [
    "All",
  ];

  const filteredScreenshots =
    activeCategory === "All"
      ? screenshots
      : screenshots.filter((shot) => shot.category === activeCategory);

  const allTags = [
    ...new Set(screenshots.flatMap((shot) => shot.tags || [])),
  ];
  
  const handleSearchInputChange = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim() === "") {
      setActiveCategory("All");
      setShowHistory(false);
      setActivePage("Home");
      await fetchScreenshots();
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setActiveCategory("All");
      setShowHistory(false);
      setActivePage("Home");
      await fetchScreenshots();
      return;
    }

    try {
      setIsSearching(true);
      setShowHistory(true);
      setActivePage("History");

      const response = await axios.get(
        `http://localhost:8000/api/screenshots/search?q=${searchQuery}`
      );

      setScreenshots(response.data.data);
    } catch (error) {
      console.error(error);
      alert("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = async () => {
    setSearchQuery("");
    setActiveCategory("All");
    setShowHistory(false);
    setActivePage("Home");
    await fetchScreenshots();
  };

  const handleSelectedFile = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setActivePage("Home");
  };

  const handleFileChange = (e) => {
    handleSelectedFile(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    handleSelectedFile(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select or drop a screenshot first");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("screenshot", file);

      const response = await axios.post(
        "http://localhost:8000/api/screenshots/upload",
        formData
      );

      setResult(response.data.data);
      await fetchScreenshots();
      setShowHistory(true);
      setActivePage("Home");
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/api/screenshots/${id}`);
      await fetchScreenshots();
    } catch (error) {
      console.error(error);
      alert("Delete failed");
    }
  };
const tagFolders = allTags.map((tag) => ({
  name: tag,
  items: screenshots.filter((shot) => shot.tags?.includes(tag)),
}));


  const scrollToUpload = () => {
    setActivePage("Home");
    setShowHistory(false);

    setTimeout(() => {
      document.getElementById("upload-section")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  };


  const formatFolderName = (name) => {
    if (!name) return "";
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const renderScreenshotCard = (shot, showActions = false) => (
    <div className="screenshot-card" key={shot._id}>
      <div className="image-wrap">
        <img src={shot.imageUrl} alt="uploaded screenshot" />
        <span className="card-category">{shot.category}</span>
      </div>

      <div className="card-content">
        <pre>{shot.extractedText.slice(0, 130)}...</pre>

        <div className="tags">
          {shot.tags.slice(0, 5).map((tag, index) => (
            <span key={index}>{tag}</span>
          ))}
        </div>

        {showActions && (
          <>
            <br />
            <div className="card-actions">
              <button
                className="delete-btn"
                onClick={() => handleDelete(shot._id)}
              >
                🗑
              </button>

              <a
                className="view-btn"
                href={shot.imageUrl}
                target="_blank"
                rel="noreferrer"
              >
                👁
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
  
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">⌕</div>
          <span>SnapSeek</span>
        </div>

        <div className="sidebar-menu">
          <button
            className={activePage === "Home" ? "side-link active" : "side-link"}
            onClick={() => {
              setActivePage("Home");
              setShowHistory(false);
            }}
          >
            <span>⌂</span>
            Home
          </button>

          <button
            className={
              activePage === "Collections" ? "side-link active" : "side-link"
            }
            onClick={() => {
              setActivePage("Collections");
              setShowHistory(false);
            }}
          >
            <span>▣</span>
            Collections
          </button>

          <button
            className={
              activePage === "History" ? "side-link active" : "side-link"
            }
            onClick={() => {
              setActivePage("History");
              setShowHistory(true);
            }}
          >
            <span>▤</span>
            History
            <small className="side-count">{screenshots.length}</small>
          </button>

          <button
            className={activePage === "Tags" ? "side-link active" : "side-link"}
            onClick={() => {
              setActivePage("Tags");
              setShowHistory(false);
            }}
          >
            <span>🏷</span>
            Tags
            <small className="side-count">{allTags.length}</small>
          </button>
        </div>
      </aside>

      <div className="content-area">
        <nav className="navbar">
          <div className="nav-modern-search-bar">
            <input
              className="nav-modern-search-input"
              type="text"
              placeholder="Search screenshots..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />

            {searchQuery && (
              <button
                className="nav-search-clear-btn"
                onClick={handleClearSearch}
              >
                Clear
              </button>
            )}

            <button
              className="nav-search-action-btn"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? "..." : "⌕"}
            </button>
          </div>

          <button className="upload-new-btn" onClick={scrollToUpload}>
            Upload New
          </button>
        </nav>

        <main className="main-layout">
          {activePage === "Home" && (
            <>
              <section
                id="upload-section"
                className={`upload-panel ${dragActive ? "active" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="cloud-icon">☁</div>

                <h2>Drop screenshot here</h2>
                <p>
                  or <span>select manually</span>
                </p>

                <label className="custom-file-btn">
                  Select File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>

                <br />

                {file && (
                  <p className="file-name">
                    Selected file: <strong>{file.name}</strong>
                  </p>
                )}

                {preview && (
                  <div className="preview-area">
                    <img src={preview} alt="preview" className="preview-img" />
                  </div>
                )}

                <button
                  className="upload-btn"
                  onClick={handleUpload}
                  disabled={loading}
                >
                  {loading ? "Extracting text..." : "Upload Screenshot"}
                </button>
              </section>

              {result && (
                <section className="result-panel">
                  <h2>Latest OCR Result</h2>

                  <div className="result-meta">
                    <span className="category-pill">{result.category}</span>
                    <span
                      className={
                        result.isSensitive ? "danger-pill" : "safe-pill"
                      }
                    >
                      {result.isSensitive ? "Sensitive" : "Safe"}
                    </span>
                  </div>

                  <pre>{result.extractedText}</pre>

                  <div className="tags">
                    {result.tags.map((tag, index) => (
                      <span key={index}>{tag}</span>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {activePage === "Collections" && (
  <section className="page-panel">
    {!selectedTagFolder ? (
      <>
        <h1>Collections</h1>
        <br></br>
        <p>Screenshots are grouped automatically into folders using tags.</p>

        {tagFolders.length === 0 ? (
          <p className="empty-text">No collections yet.</p>
        ) : (
          <div className="folder-grid">
            {tagFolders.map((folder) => (
              <button
                className="folder-card"
                key={folder.name}
                onClick={() => setSelectedTagFolder(folder.name)}
              >
                <div className="folder-icon">📁</div>
                <h2>{formatFolderName(folder.name)}</h2>
                <p>{folder.items.length} screenshots</p>
              </button>
            ))}
          </div>
        )}
      </>
    ) : (
      <>
        <button
          className="back-btn"
          onClick={() => setSelectedTagFolder(null)}
        >
          ← Back to Collections
        </button>

        <h1>{formatFolderName(selectedTagFolder)}</h1>
        <br />
        <p>
          {
            screenshots.filter((shot) =>
              shot.tags?.includes(selectedTagFolder)
            ).length
          }{" "}
          screenshots in this folder
        </p>

        <br />

        <div className="screenshot-grid">
          {screenshots
            .filter((shot) => shot.tags?.includes(selectedTagFolder))
            .map((shot) => (
              <div className="screenshot-card" key={shot._id}>
                <div className="image-wrap">
                  <img src={shot.imageUrl} alt="uploaded screenshot" />
                </div>

                <div className="card-content">
                  <pre>{shot.extractedText.slice(0, 130)}...</pre>

                  <div className="tags">
                    {shot.tags.slice(0, 5).map((tag, index) => (
                      <span key={index}>{tag}</span>
                    ))}
                  </div>

                  <br />

                  <div className="card-actions">
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(shot._id)}
                    >
                      🗑
                    </button>

                    <a
                      className="view-btn"
                      href={shot.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      👁
                    </a>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </>
    )}
  </section>
)}

          {activePage === "History" && showHistory && (
            <>
              <div className="history-title-area">
                <h1>{searchQuery ? "Search Results" : "Screenshot History"}</h1>
                <br></br>
                <p>{filteredScreenshots.length} items found</p>
              </div>

              <section className="history-panel">
                <div className="category-filters">
                  {categories.map((category) => (
                    <button
                      key={category}
                      className={
                        activeCategory === category ? "filter active" : "filter"
                      }
                      onClick={() => setActiveCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {filteredScreenshots.length === 0 ? (
                  <p className="empty-text">No screenshots found.</p>
                ) : (
                  <div className="screenshot-grid">
                    {filteredScreenshots.map((shot) =>
                      renderScreenshotCard(shot, true)
                    )}
                  </div>
                )}
              </section>
            </>
          )}

          {activePage === "Tags" && (
            <section className="page-panel">
              <h1>Tags</h1>
              <br></br>
              <p>All tags generated from your uploaded screenshots.</p>

              {allTags.length === 0 ? (
                <p className="empty-text">No tags yet.</p>
              ) : (
                <div className="tag-cloud">
                  {allTags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;