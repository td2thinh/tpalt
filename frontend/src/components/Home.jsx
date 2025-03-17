import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Board from './Board';
import CreateCanvas from './CreateCanvas';
import CanvasList from './CanvasList';

const Home = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'create', 'view'
  const [selectedCanvas, setSelectedCanvas] = useState(null);

  const handleCanvasCreated = (canvas) => {
    setSelectedCanvas(canvas);
    setActiveTab('view');
  };

  const handleSelectCanvas = (canvas) => {
    setSelectedCanvas(canvas);
    setActiveTab('view');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'browse':
        return <CanvasList onSelectCanvas={handleSelectCanvas} />;
      case 'create':
        return <CreateCanvas onCanvasCreated={handleCanvasCreated} />;
      case 'view':
        return selectedCanvas ? (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">{selectedCanvas.name}</h2>
              <div className="text-sm text-gray-500">
                {selectedCanvas.width}×{selectedCanvas.height} pixels
              </div>
            </div>
            {selectedCanvas.description && (
              <p className="mb-4 text-gray-700">{selectedCanvas.description}</p>
            )}
            <Board
              canvasId={selectedCanvas.id}
              width={selectedCanvas.width}
              height={selectedCanvas.height}
              isEditable={true}
            />
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">No canvas selected. Browse or create a canvas to get started.</p>
            <button
              onClick={() => setActiveTab('browse')}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Browse Canvases
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">r/place Clone</h1>
          <div className="flex items-center">
            <span className="mr-4">Welcome, {currentUser?.username}</span>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                className={`${
                  activeTab === 'browse'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab('browse')}
              >
                Browse Canvases
              </button>
              <button
                className={`${
                  activeTab === 'create'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab('create')}
              >
                Create Canvas
              </button>
              {selectedCanvas && (
                <button
                  className={`${
                    activeTab === 'view'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  onClick={() => setActiveTab('view')}
                >
                  View Canvas
                </button>
              )}
            </nav>
          </div>
          
          {/* Tab content */}
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default Home;