"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { Trash2, Globe, RefreshCw } from "lucide-react"

const StatusDot = ({ status, timestamp }) => {
  const getColor = () => {
    switch (status) {
      case "up":
        return "#28a745"
      case "down":
        return "#dc3545"
      default:
        return "#6c757d"
    }
  }

  return (
    <div
      title={new Date(timestamp).toLocaleString()}
      style={{
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        backgroundColor: getColor(),
        margin: "0 2px",
        display: "inline-block",
        transition: "background-color 0.3s ease",
      }}
    />
  )
}

function App() {
  const [sites, setSites] = useState([])
  const [newUrl, setNewUrl] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const API_BASE_URL = "http://localhost:5000"

  const fetchSites = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/sites`)
      setSites(response.data)
      setError("")
      setLastRefresh(new Date())
    } catch (err) {
      setError("Failed to fetch sites")
    }
  }, [])

  const addSite = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (!newUrl) {
        setError("Please enter a URL")
        return
      }

      let urlToAdd = newUrl
      if (!urlToAdd.startsWith("http://") && !urlToAdd.startsWith("https://")) {
        urlToAdd = "https://" + urlToAdd
      }

      await axios.post(`${API_BASE_URL}/api/add-site`, { url: urlToAdd })
      setNewUrl("")
      fetchSites()
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add site")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteSite = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/sites/${id}`)
      fetchSites()
    } catch (err) {
      setError("Failed to delete site")
    }
  }

  const onDragEnd = async (result) => {
    if (!result.destination) return

    const items = Array.from(sites)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }))

    setSites(updatedItems)
    try {
      await axios.put(`${API_BASE_URL}/api/sites/order`, {
        siteOrder: updatedItems,
      })
    } catch (err) {
      setError("Failed to save order")
    }
  }

  useEffect(() => {
    fetchSites()
    // Auto-refresh only when status changes
    // This would ideally be implemented with WebSockets or Server-Sent Events
    const interval = setInterval(fetchSites, 30000)
    return () => clearInterval(interval)
  }, [fetchSites])

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "99%",
        margin: "0 auto",
        backgroundColor: "#f8f9fa",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "30px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <Globe size={32} color="#007bff" style={{ marginRight: "15px" }} />
          <h1
            style={{
              color: "#2c3e50",
              margin: 0,
              fontSize: "2rem",
              fontWeight: "600",
            }}
          >
            Keep It Up - Website Monitor
          </h1>
        </div>
        <button
          onClick={fetchSites}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 16px",
            backgroundColor: "#4b5563",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "background-color 0.3s ease",
          }}
        >
          <RefreshCw size={16} style={{ marginRight: "8px" }} />
          Refresh
        </button>
      </div>

      <form
        onSubmit={addSite}
        style={{
          marginBottom: "30px",
          display: "flex",
          gap: "10px",
        }}
      >
        <input
          type="text"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Enter website URL (e.g., google.com)"
          disabled={isLoading}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "8px",
            border: "2px solid #e9ecef",
            fontSize: "16px",
            transition: "border-color 0.3s ease",
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: "12px 24px",
            backgroundColor: isLoading ? "#94a3b8" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "500",
            transition: "background-color 0.3s ease",
          }}
        >
          {isLoading ? "Adding..." : "Add Website"}
        </button>
      </form>

      {error && (
        <div
          style={{
            color: "#dc2626",
            marginBottom: "20px",
            padding: "12px",
            backgroundColor: "#fee2e2",
            borderRadius: "8px",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: "20px", fontSize: "14px", color: "#4b5563" }}>
        Last refreshed: {lastRefresh.toLocaleString()}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sites">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "20px",
              }}
            >
              {sites.map((site, index) => (
                <Draggable key={site.id} draggableId={site.id.toString()} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        ...provided.draggableProps.style,
                        padding: "20px",
                        backgroundColor: "white",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "15px",
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "1.1rem",
                            color: "#1f2937",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {site.url}
                        </h3>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => deleteSite(site.id)}
                            style={{
                              padding: "8px",
                              backgroundColor: "transparent",
                              border: "none",
                              cursor: "pointer",
                              borderRadius: "6px",
                              transition: "background-color 0.2s",
                            }}
                          >
                            <Trash2 size={20} color="#ef4444" />
                          </button>
                        </div>
                      </div>

                      <div style={{ marginBottom: "15px" }}>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "0.875rem",
                            fontWeight: "500",
                            backgroundColor: site.status === "up" ? "#dcfce7" : "#fee2e2",
                            color: site.status === "up" ? "#166534" : "#991b1b",
                          }}
                        >
                          {site.status.toUpperCase()}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "4px",
                          marginBottom: "12px",
                        }}
                      >
                        {(site.statusHistory || Array(10).fill({ status: "unknown", timestamp: new Date() })).map(
                          (record, idx) => (
                            <StatusDot key={idx} status={record.status} timestamp={record.timestamp} />
                          ),
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: "0.875rem",
                          color: "#4b5563",
                        }}
                      >
                        <p style={{ margin: "8px 0" }}>Last Checked: {new Date(site.lastChecked).toLocaleString()}</p>
                        {site.responseTime && <p style={{ margin: "8px 0" }}>Response Time: {site.responseTime}ms</p>}
                        {site.error && (
                          <p
                            style={{
                              margin: "8px 0",
                              color: "#dc2626",
                            }}
                          >
                            Error: {site.error}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}

export default App

