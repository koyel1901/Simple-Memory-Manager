/**
 * Example Node.js Express backend server for QuickAlloc
 * 
 * This is an example showing how to integrate the React frontend
 * with your C memory manager executable.
 * 
 * To use:
 * 1. Install dependencies: npm install express cors
 * 2. Update the executable path below to match your compiled C program
 * 3. Run: node backend-server-example.js
 * 4. Update App.jsx to call this API instead of the mock function
 */

const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const cors = require('cors');

const execAsync = promisify(exec);
const app = express();
const PORT = 5000;

// Update this path to your compiled C executable
const EXECUTABLE_PATH = './quickalloc_demo.exe';

app.use(cors());
app.use(express.json());

// Helper function to parse pointer from C output
function parsePointer(output) {
  // Example output: "Allocated 100 bytes at 0x10000000"
  const match = output.match(/0x[0-9A-Fa-f]+/);
  return match ? match[0] : null;
}

// Helper function to check alignment
function checkAlignment(ptrStr) {
  if (!ptrStr) return false;
  const ptrNum = parseInt(ptrStr.replace('0x', ''), 16);
  return ptrNum % 256 === 0;
}

// Allocate memory
app.post('/api/alloc', async (req, res) => {
  try {
    const { size } = req.body;
    
    // Call your C executable with alloc command
    // Your C program should accept: ./executable alloc <size>
    const { stdout, stderr } = await execAsync(
      `${EXECUTABLE_PATH} alloc ${size}`
    );
    
    if (stderr) {
      console.error('C program stderr:', stderr);
    }
    
    const ptr = parsePointer(stdout);
    
    if (!ptr) {
      return res.status(500).json({
        success: false,
        error: 'Failed to parse pointer from C output'
      });
    }
    
    res.json({
      success: true,
      ptr: ptr,
      size: parseInt(size),
      aligned: checkAlignment(ptr)
    });
  } catch (error) {
    console.error('Allocation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reallocate memory
app.post('/api/realloc', async (req, res) => {
  try {
    const { ptr, size } = req.body;
    
    // Call your C executable with realloc command
    // Your C program should accept: ./executable realloc <ptr> <size>
    const { stdout, stderr } = await execAsync(
      `${EXECUTABLE_PATH} realloc ${ptr} ${size}`
    );
    
    if (stderr) {
      console.error('C program stderr:', stderr);
    }
    
    const newPtr = parsePointer(stdout);
    
    if (!newPtr) {
      return res.status(500).json({
        success: false,
        error: 'Failed to parse pointer from C output'
      });
    }
    
    res.json({
      success: true,
      ptr: newPtr,
      size: parseInt(size),
      aligned: checkAlignment(newPtr),
      oldPtr: ptr
    });
  } catch (error) {
    console.error('Reallocation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Free memory
app.post('/api/free', async (req, res) => {
  try {
    const { ptr } = req.body;
    
    // Call your C executable with free command
    // Your C program should accept: ./executable free <ptr>
    const { stdout, stderr } = await execAsync(
      `${EXECUTABLE_PATH} free ${ptr}`
    );
    
    if (stderr) {
      console.error('C program stderr:', stderr);
    }
    
    res.json({
      success: true,
      ptr: null
    });
  } catch (error) {
    console.error('Free error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`QuickAlloc backend server running on http://localhost:${PORT}`);
  console.log(`Make sure your C executable is at: ${EXECUTABLE_PATH}`);
});

