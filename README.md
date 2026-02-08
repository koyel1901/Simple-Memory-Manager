# QuickAlloc Memory Manager - React Frontend

A professional React-based frontend for the QuickAlloc C memory manager, demonstrating 256-byte aligned memory allocation with real-time visualization.

## Features

- **Memory Allocation**: Input size in bytes and allocate memory
- **Memory Reallocation**: Resize existing allocations
- **Memory Free**: Release allocated memory
- **Alignment Verification**: Displays whether addresses are 256-byte aligned with modulus proof
- **Action Log**: Step-by-step log of all memory operations
- **Visualization**: Visual representation of current allocations

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Backend Integration

The frontend currently uses simulated data. To connect to your C backend, you have several options:

### Option 1: Node.js Express Server (Recommended)

Create a `backend-server.js` file:

```javascript
const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

app.post('/api/alloc', async (req, res) => {
  try {
    const { size } = req.body;
    const { stdout } = await execAsync(`./quickalloc_demo.exe alloc ${size}`);
    // Parse stdout and return JSON
    res.json({ success: true, ptr: parsedPtr, size, aligned: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(5000, () => console.log('Backend server running on port 5000'));
```

Then update `src/App.jsx` to call `http://localhost:5000/api/alloc` instead of the mock function.

### Option 2: Python HTTP Server

Create a `backend_server.py` file:

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import re

app = Flask(__name__)
CORS(app)

@app.route('/api/alloc', methods=['POST'])
def alloc():
    size = request.json['size']
    result = subprocess.run(
        ['./quickalloc_demo.exe', 'alloc', str(size)],
        capture_output=True,
        text=True
    )
    # Parse output and extract pointer
    ptr = extract_pointer(result.stdout)
    return jsonify({
        'success': True,
        'ptr': ptr,
        'size': size,
        'aligned': check_alignment(ptr)
    })

if __name__ == '__main__':
    app.run(port=5000)
```

### Option 3: Direct C Executable Integration

Modify your C executable to accept command-line arguments and output JSON:

```c
// In your main.c or a new backend.c
int main(int argc, char* argv[]) {
    if (argc < 2) {
        printf("Usage: %s <action> [args...]\n", argv[0]);
        return 1;
    }
    
    quickalloc_init();
    
    if (strcmp(argv[1], "alloc") == 0) {
        size_t size = atoi(argv[2]);
        void* ptr = QuickAlloc_malloc(size);
        printf("{\"success\":true,\"ptr\":\"%p\",\"size\":%zu}\n", ptr, size);
    }
    // ... handle realloc, free
    
    quickalloc_destroy();
    return 0;
}
```

## Project Structure

```
QuickAlloc/
├── src/
│   ├── App.jsx          # Main React component
│   ├── App.css          # Styling
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles
├── index.html           # HTML entry point
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
└── README.md           # This file
```

## Usage

1. **Allocate Memory**: Enter a size in bytes and click "Allocate"
2. **Reallocate**: Enter a new size and click "Reallocate" (requires an active allocation)
3. **Free Memory**: Click "Free Memory" to release the current allocation
4. **View Results**: Check the results panel for pointer address, alignment status, and modulus proof
5. **Monitor Actions**: View the action log for a history of operations
6. **Visualize**: See current allocations in the visualization section

## Notes

- The UI demonstrates 256-byte alignment using modulus operations
- All addresses are displayed in hexadecimal format
- The action log keeps the last 10 operations
- The visualization shows allocation size relative to 1KB

## License

This frontend is part of the QuickAlloc memory manager project.
