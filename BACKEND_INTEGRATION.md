# Backend Integration Guide

This guide explains how to connect the React frontend to your C memory manager backend.

## Current State

The React app currently uses a **mock/simulation** of the backend in `src/App.jsx`. The `callBackend` function generates fake aligned addresses for demonstration.

## Integration Steps

### Step 1: Modify Your C Executable

Your C executable needs to accept command-line arguments. Here's an example modification to `main.c`:

```c
#include "quickalloc_manager.h"
#include <stdio.h>
#include <stdint.h>
#include <string.h>

int main(int argc, char* argv[]) {
    if (argc < 2) {
        printf("Usage: %s <action> [args...]\n", argv[0]);
        return 1;
    }
    
    quickalloc_init();
    
    if (strcmp(argv[1], "alloc") == 0 && argc >= 3) {
        size_t size = atoi(argv[2]);
        void* ptr = QuickAlloc_malloc(size);
        
        if (ptr == NULL) {
            printf("{\"success\":false,\"error\":\"Allocation failed\"}\n");
            quickalloc_destroy();
            return 1;
        }
        
        uintptr_t ptr_val = (uintptr_t)ptr;
        int aligned = (ptr_val % 256 == 0) ? 1 : 0;
        
        printf("{\"success\":true,\"ptr\":\"0x%llX\",\"size\":%zu,\"aligned\":%d}\n",
               (unsigned long long)ptr_val, size, aligned);
    }
    else if (strcmp(argv[1], "realloc") == 0 && argc >= 4) {
        void* old_ptr = (void*)strtoull(argv[2], NULL, 16);
        size_t size = atoi(argv[3]);
        void* new_ptr = QuickAlloc_realloc(old_ptr, size);
        
        if (new_ptr == NULL) {
            printf("{\"success\":false,\"error\":\"Reallocation failed\"}\n");
            quickalloc_destroy();
            return 1;
        }
        
        uintptr_t ptr_val = (uintptr_t)new_ptr;
        int aligned = (ptr_val % 256 == 0) ? 1 : 0;
        
        printf("{\"success\":true,\"ptr\":\"0x%llX\",\"size\":%zu,\"aligned\":%d,\"oldPtr\":\"%s\"}\n",
               (unsigned long long)ptr_val, size, aligned, argv[2]);
    }
    else if (strcmp(argv[1], "free") == 0 && argc >= 3) {
        void* ptr = (void*)strtoull(argv[2], NULL, 16);
        QuickAlloc_free(ptr);
        printf("{\"success\":true,\"ptr\":null}\n");
    }
    else {
        printf("{\"success\":false,\"error\":\"Invalid command\"}\n");
        quickalloc_destroy();
        return 1;
    }
    
    quickalloc_destroy();
    return 0;
}
```

Compile it:
```bash
gcc -o quickalloc_backend.exe main.c quickalloc_manager.c -pthread
```

### Step 2: Choose a Backend Server

You have three options:

#### Option A: Node.js Express Server (Recommended)

1. Install dependencies:
```bash
npm install express cors
```

2. Use the provided `backend-server-example.js` file

3. Start the server:
```bash
node backend-server-example.js
```

#### Option B: Python Flask Server

1. Install dependencies:
```bash
pip install flask flask-cors
```

2. Use the provided `backend-server-example.py` file

3. Start the server:
```bash
python backend-server-example.py
```

#### Option C: Direct Integration (Advanced)

Modify `src/App.jsx` to call the C executable directly using Node.js `child_process` (only works in Node.js environment, not browser).

### Step 3: Update React App

Replace the `callBackend` function in `src/App.jsx`:

**For Express/Flask backend:**

```javascript
const callBackend = async (action, size = null, ptr = null) => {
  const baseUrl = 'http://localhost:5000/api';
  
  try {
    let response;
    
    if (action === 'alloc') {
      response = await fetch(`${baseUrl}/alloc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size })
      });
    } else if (action === 'realloc') {
      response = await fetch(`${baseUrl}/realloc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ptr, size })
      });
    } else if (action === 'free') {
      response = await fetch(`${baseUrl}/free`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ptr })
      });
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Backend call failed:', error);
    return { success: false, error: error.message };
  }
};
```

**For direct C executable (Node.js only, requires Electron or similar):**

```javascript
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

const callBackend = async (action, size = null, ptr = null) => {
  try {
    let command;
    
    if (action === 'alloc') {
      command = `./quickalloc_backend.exe alloc ${size}`;
    } else if (action === 'realloc') {
      command = `./quickalloc_backend.exe realloc ${ptr} ${size}`;
    } else if (action === 'free') {
      command = `./quickalloc_backend.exe free ${ptr}`;
    }
    
    const { stdout } = await execAsync(command);
    return JSON.parse(stdout);
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

## Testing

1. Start your backend server (Express or Flask)
2. Start the React dev server: `npm run dev`
3. Test allocation, reallocation, and free operations
4. Verify that addresses are correctly displayed and alignment is checked

## Troubleshooting

- **CORS errors**: Make sure your backend server has CORS enabled
- **Executable not found**: Update the path in your backend server file
- **JSON parsing errors**: Ensure your C program outputs valid JSON
- **Pointer format**: Make sure pointers are formatted as `0x...` hex strings

## Notes

- The backend server must output JSON for the frontend to parse
- Pointers should be in hexadecimal format (e.g., `0x10000000`)
- The alignment check (256-byte) is done both in C and verified in JavaScript
- Error handling should return `{"success": false, "error": "message"}` format

