import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UptimeMonitor = () => {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ name: '', url: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/projects');
      setProjects(response.data);
    } catch (err) {
      setError('Failed to fetch projects');
    }
  };

  const addProject = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/projects', newProject);
      setNewProject({ name: '', url: '' });
      fetchProjects();
    } catch (err) {
      setError('Failed to add project');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Keep It Up - Uptime Monitor</h1>
      
      <form onSubmit={addProject} className="mb-8 space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Project Name"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            className="flex-1 p-2 border rounded"
          />
          <input
            type="url"
            placeholder="URL"
            value={newProject.url}
            onChange={(e) => setNewProject({ ...newProject, url: e.target.value })}
            className="flex-1 p-2 border rounded"
          />
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Add Project
          </button>
        </div>
        {error && <p className="text-red-500">{error}</p>}
      </form>

      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.name} className="border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">{project.name}</h2>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  project.status.isUp ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {project.status.isUp ? 'UP' : 'DOWN'}
              </span>
            </div>
            <div className="text-gray-600">
              <p>URL: {project.url}</p>
              <p>Response Time: {project.status.responseTime ? `${project.status.responseTime}ms` : 'N/A'}</p>
              <p>Last Checked: {new Date(project.status.lastChecked).toLocaleString()}</p>
              {!project.status.isUp && (
                <p className="text-red-500">Error: {project.status.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UptimeMonitor;