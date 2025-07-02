import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import AuthForm from './components/AuthForm';
import ProjectSelector from './components/ProjectSelector';
import GraphSelector from './components/GraphSelector';
import DAGEditor from './components/DAGEditor';
import UserMenu from './components/UserMenu';
import { Project, DAGGraph } from './types/database';

function App() {
  const { user, loading } = useAuth();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedGraph, setSelectedGraph] = useState<DAGGraph | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthForm />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">Visual DAG Editor</h1>
            {selectedProject && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>/</span>
                <span className="font-medium">{selectedProject.name}</span>
                {selectedGraph && (
                  <>
                    <span>/</span>
                    <span className="font-medium text-blue-600">{selectedGraph.name}</span>
                  </>
                )}
              </div>
            )}
          </div>
          <UserMenu />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <ProjectSelector
              userId={user.id}
              onSelectProject={(project) => {
                setSelectedProject(project);
                setSelectedGraph(null);
              }}
              selectedProject={selectedProject}
            />
          </div>
          
          {selectedProject && (
            <div className="p-6 flex-1 overflow-y-auto">
              <GraphSelector
                projectId={selectedProject.id}
                onSelectGraph={setSelectedGraph}
                selectedGraph={selectedGraph}
              />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {selectedProject ? (
            <DAGEditor
              selectedGraph={selectedGraph}
              projectId={selectedProject.id}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Welcome to Visual DAG Editor</h3>
                <p className="text-gray-600 mb-6">Create or select a project to start building your directed acyclic graphs</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

export default App;