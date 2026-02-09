import React, { useState, useCallback } from 'react'
import './App.css'

// Backend integration helpers
// 
// OPTION 1: Using Node.js child_process (requires Node.js backend wrapper)
// import { exec } from 'child_process';
// import { promisify } from 'util';
// const execAsync = promisify(exec);
//
// OPTION 2: Using Python subprocess (requires Python backend wrapper)
// You would need to create a Python script that calls your C executable
// and use fetch() to call a Python HTTP server, or use WebSocket
//
// OPTION 3: Direct C executable call (Node.js backend)
// For now, we'll simulate the backend. To integrate:
// 1. Create a Node.js Express server that spawns your C executable
// 2. The C executable should accept command-line args: "alloc <size>", "realloc <ptr> <size>", "free <ptr>"
// 3. Parse stdout from the C executable and return JSON
// 4. Call the Express API from this React app using fetch()

const ALIGNMENT = 256; // 256-byte alignment as per QuickAlloc

// Simulate backend call - Replace this with actual backend integration
const callBackend = async (action, size = null, ptr = null) => {
  // SIMULATION: Generate a mock aligned address
  // In real implementation, this would call your backend:
  //
  // Example with Node.js child_process:
  // const { stdout } = await execAsync(`./quickalloc_demo.exe alloc ${size}`);
  // const result = JSON.parse(stdout);
  // return result;
  //
  // Example with Python subprocess:
  // const response = await fetch('http://localhost:5000/api/alloc', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ size })
  // });
  // return await response.json();
  
  // Mock implementation for demonstration
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
  
  if (action === 'alloc') {
    // Generate a mock 256-byte aligned address
    const baseAddress = 0x10000000;
    const randomOffset = Math.floor(Math.random() * 1000) * ALIGNMENT;
    const mockPtr = baseAddress + randomOffset;
    return {
      success: true,
      ptr: `0x${mockPtr.toString(16).toUpperCase()}`,
      size: size,
      aligned: (mockPtr % ALIGNMENT === 0)
    };
  } else if (action === 'realloc') {
    // For realloc, return a new (possibly different) aligned address
    const baseAddress = 0x10000000;
    const randomOffset = Math.floor(Math.random() * 1000) * ALIGNMENT;
    const mockPtr = baseAddress + randomOffset;
    return {
      success: true,
      ptr: `0x${mockPtr.toString(16).toUpperCase()}`,
      size: size,
      aligned: (mockPtr % ALIGNMENT === 0),
      oldPtr: ptr
    };
  } else if (action === 'free') {
    return {
      success: true,
      ptr: null
    };
  }
  
  return { success: false, error: 'Unknown action' };
};

function App() {
  const [allocSize, setAllocSize] = useState('');
  const [reallocSize, setReallocSize] = useState('');
  const [currentPtr, setCurrentPtr] = useState(null);
  const [currentSize, setCurrentSize] = useState(null);
  const [isAligned, setIsAligned] = useState(null);
  const [actionLog, setActionLog] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add entry to action log
  const addLogEntry = useCallback((action, details) => {
    const timestamp = new Date().toLocaleTimeString();
    const entry = {
      id: Date.now(),
      timestamp,
      action,
      details
    };
    setActionLog(prev => [entry, ...prev].slice(0, 10)); // Keep last 10 entries
  }, []);

  // Check if address is 256-byte aligned
  const checkAlignment = useCallback((ptrStr) => {
    if (!ptrStr) return false;
    // Remove '0x' prefix and convert to number
    const ptrNum = parseInt(ptrStr.replace('0x', ''), 16);
    return ptrNum % ALIGNMENT === 0;
  }, []);

  // Handle memory allocation
  const handleAllocate = async () => {
    const size = parseInt(allocSize);
    if (isNaN(size) || size <= 0) {
      alert('Please enter a valid allocation size (bytes)');
      return;
    }

    setLoading(true);
    try {
      const result = await callBackend('alloc', size);
      
      if (result.success) {
        const aligned = checkAlignment(result.ptr);
        setCurrentPtr(result.ptr);
        setCurrentSize(result.size);
        setIsAligned(aligned);
        
        // Add to allocations list
        const newAlloc = {
          id: Date.now(),
          ptr: result.ptr,
          size: result.size,
          aligned: aligned
        };
        setAllocations([newAlloc]);
        
        addLogEntry('ALLOCATE', {
          size: `${size} bytes`,
          ptr: result.ptr,
          aligned: aligned ? 'YES' : 'NO'
        });
      } else {
        alert(`Allocation failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
      addLogEntry('ERROR', { message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle memory reallocation
  const handleReallocate = async () => {
    if (!currentPtr) {
      alert('No memory allocated. Please allocate first.');
      return;
    }

    const size = parseInt(reallocSize);
    if (isNaN(size) || size <= 0) {
      alert('Please enter a valid reallocation size (bytes)');
      return;
    }

    setLoading(true);
    try {
      const result = await callBackend('realloc', size, currentPtr);
      
      if (result.success) {
        const aligned = checkAlignment(result.ptr);
        const oldPtr = currentPtr;
        setCurrentPtr(result.ptr);
        setCurrentSize(result.size);
        setIsAligned(aligned);
        
        // Update allocations list
        setAllocations(prev => prev.map(alloc => 
          alloc.ptr === oldPtr 
            ? { ...alloc, ptr: result.ptr, size: result.size, aligned: aligned }
            : alloc
        ));
        
        addLogEntry('REALLOCATE', {
          oldPtr: oldPtr,
          newPtr: result.ptr,
          size: `${size} bytes`,
          aligned: aligned ? 'YES' : 'NO'
        });
      } else {
        alert(`Reallocation failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
      addLogEntry('ERROR', { message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle memory free
  const handleFree = async () => {
    if (!currentPtr) {
      alert('No memory allocated. Nothing to free.');
      return;
    }

    setLoading(true);
    try {
      const result = await callBackend('free', null, currentPtr);
      
      if (result.success) {
        const freedPtr = currentPtr;
        setCurrentPtr(null);
        setCurrentSize(null);
        setIsAligned(null);
        
        // Remove from allocations list
        setAllocations(prev => prev.filter(alloc => alloc.ptr !== freedPtr));
        
        addLogEntry('FREE', {
          ptr: freedPtr
        });
      } else {
        alert(`Free failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
      addLogEntry('ERROR', { message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Calculate modulus for display
  const getModulus = () => {
    if (!currentPtr) return null;
    const ptrNum = parseInt(currentPtr.replace('0x', ''), 16);
    return ptrNum % ALIGNMENT;
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>QuickAlloc Memory Manager</h1>
        <p className="subtitle">256-byte Aligned Memory Allocation Demo</p>
      </div>

      <div className="app-content">
        {/* Control Panel */}
        <div className="control-panel">
          <div className="control-section">
            <h2>Allocate Memory</h2>
            <div className="input-group">
              <input
                type="number"
                placeholder="Size in bytes"
                value={allocSize}
                onChange={(e) => setAllocSize(e.target.value)}
                disabled={loading}
                min="1"
              />
              <button 
                onClick={handleAllocate} 
                disabled={loading || !allocSize}
                className="btn btn-primary"
              >
                {loading ? 'Allocating...' : 'Allocate'}
              </button>
            </div>
          </div>

          <div className="control-section">
            <h2>Reallocate Memory</h2>
            <div className="input-group">
              <input
                type="number"
                placeholder="New size in bytes"
                value={reallocSize}
                onChange={(e) => setReallocSize(e.target.value)}
                disabled={loading || !currentPtr}
                min="1"
              />
              <button 
                onClick={handleReallocate} 
                disabled={loading || !currentPtr || !reallocSize}
                className="btn btn-secondary"
              >
                {loading ? 'Reallocating...' : 'Reallocate'}
              </button>
            </div>
          </div>

          <div className="control-section">
            <h2>Free Memory</h2>
            <button 
              onClick={handleFree} 
              disabled={loading || !currentPtr}
              className="btn btn-danger"
            >
              {loading ? 'Freeing...' : 'Free Memory'}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="results-panel">
          <h2>Allocation Results</h2>
          
          <div className="result-card">
            <div className="result-row">
              <span className="result-label">Pointer Address:</span>
              <span className="result-value">
                {currentPtr || 'No allocation'}
              </span>
            </div>
            
            <div className="result-row">
              <span className="result-label">256-byte Aligned:</span>
              <span className={`result-value ${isAligned ? 'aligned-yes' : 'aligned-no'}`}>
                {currentPtr ? (isAligned ? 'YES' : 'NO') : 'N/A'}
              </span>
            </div>
            
            {currentPtr && (
              <div className="result-row">
                <span className="result-label">Modulus Proof:</span>
                <span className="result-value code">
                  {currentPtr.replace('0x', '')} (hex) % {ALIGNMENT} = {getModulus()}
                </span>
              </div>
            )}
            
            {currentSize && (
              <div className="result-row">
                <span className="result-label">Allocated Size:</span>
                <span className="result-value">{currentSize} bytes</span>
              </div>
            )}
          </div>

          {/* Action Log */}
          <div className="log-section">
            <h3>Action Log</h3>
            <div className="log-container">
              {actionLog.length === 0 ? (
                <p className="log-empty">No actions yet. Perform an allocation to see the log.</p>
              ) : (
                actionLog.map(entry => (
                  <div key={entry.id} className="log-entry">
                    <span className="log-time">{entry.timestamp}</span>
                    <span className={`log-action log-${entry.action.toLowerCase()}`}>
                      {entry.action}
                    </span>
                    <span className="log-details">
                      {entry.action === 'ALLOCATE' && (
                        <>Size: {entry.details.size}, Ptr: {entry.details.ptr}, Aligned: {entry.details.aligned}</>
                      )}
                      {entry.action === 'REALLOCATE' && (
                        <>Old: {entry.details.oldPtr} → New: {entry.details.newPtr}, Size: {entry.details.size}, Aligned: {entry.details.aligned}</>
                      )}
                      {entry.action === 'FREE' && (
                        <>Ptr: {entry.details.ptr}</>
                      )}
                      {entry.action === 'ERROR' && (
                        <>Error: {entry.details.message}</>
                      )}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Allocation Visualization */}
          <div className="visualization-section">
            <h3>Current Allocations</h3>
            <div className="alloc-visualization">
              {allocations.length === 0 ? (
                <p className="visual-empty">No active allocations</p>
              ) : (
                allocations.map(alloc => (
                  <div key={alloc.id} className="alloc-block">
                    <div className="alloc-header">
                      <span className="alloc-ptr">{alloc.ptr}</span>
                      <span className={`alloc-badge ${alloc.aligned ? 'badge-aligned' : 'badge-unaligned'}`}>
                        {alloc.aligned ? '✓ Aligned' : '✗ Not Aligned'}
                      </span>
                    </div>
                    <div className="alloc-size">
                      {alloc.size} bytes
                    </div>
                    <div className="alloc-bar">
                      <div 
                        className="alloc-bar-fill" 
                        style={{ 
                          width: `${Math.min((alloc.size / 1024) * 100, 100)}%`,
                          backgroundColor: alloc.aligned ? '#4caf50' : '#f44336'
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Backend Integration Info */}
      <div className="info-panel">
        <h3>Backend Integration Notes</h3>
        <p>
          This UI currently uses simulated data. To connect to your C backend:
        </p>
        <ul>
          <li>Create a Node.js Express server that spawns your C executable</li>
          <li>Or create a Python HTTP server using subprocess to call your C executable</li>
          <li>Replace the <code>callBackend</code> function in App.jsx with actual API calls</li>
          <li>Your C executable should accept: <code>alloc &lt;size&gt;</code>, <code>realloc &lt;ptr&gt; &lt;size&gt;</code>, <code>free &lt;ptr&gt;</code></li>
        </ul>
      </div>
    </div>
  );
}

export default App;

