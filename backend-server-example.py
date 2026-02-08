"""
Example Python Flask backend server for QuickAlloc

This is an example showing how to integrate the React frontend
with your C memory manager executable using Python.

To use:
1. Install dependencies: pip install flask flask-cors
2. Update the executable path below to match your compiled C program
3. Run: python backend-server-example.py
4. Update App.jsx to call this API instead of the mock function
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import re

app = Flask(__name__)
CORS(app)

# Update this path to your compiled C executable
EXECUTABLE_PATH = './quickalloc_demo.exe'

def parse_pointer(output):
    """Parse pointer address from C program output"""
    # Example output: "Allocated 100 bytes at 0x10000000"
    match = re.search(r'0x[0-9A-Fa-f]+', output, re.IGNORECASE)
    return match.group(0) if match else None

def check_alignment(ptr_str):
    """Check if pointer is 256-byte aligned"""
    if not ptr_str:
        return False
    ptr_num = int(ptr_str.replace('0x', ''), 16)
    return ptr_num % 256 == 0

@app.route('/api/alloc', methods=['POST'])
def alloc():
    """Allocate memory"""
    try:
        data = request.json
        size = data.get('size')
        
        # Call your C executable with alloc command
        # Your C program should accept: ./executable alloc <size>
        result = subprocess.run(
            [EXECUTABLE_PATH, 'alloc', str(size)],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode != 0:
            return jsonify({
                'success': False,
                'error': f'C program returned error: {result.stderr}'
            }), 500
        
        ptr = parse_pointer(result.stdout)
        
        if not ptr:
            return jsonify({
                'success': False,
                'error': 'Failed to parse pointer from C output'
            }), 500
        
        return jsonify({
            'success': True,
            'ptr': ptr,
            'size': int(size),
            'aligned': check_alignment(ptr)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/realloc', methods=['POST'])
def realloc():
    """Reallocate memory"""
    try:
        data = request.json
        ptr = data.get('ptr')
        size = data.get('size')
        
        # Call your C executable with realloc command
        # Your C program should accept: ./executable realloc <ptr> <size>
        result = subprocess.run(
            [EXECUTABLE_PATH, 'realloc', ptr, str(size)],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode != 0:
            return jsonify({
                'success': False,
                'error': f'C program returned error: {result.stderr}'
            }), 500
        
        new_ptr = parse_pointer(result.stdout)
        
        if not new_ptr:
            return jsonify({
                'success': False,
                'error': 'Failed to parse pointer from C output'
            }), 500
        
        return jsonify({
            'success': True,
            'ptr': new_ptr,
            'size': int(size),
            'aligned': check_alignment(new_ptr),
            'oldPtr': ptr
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/free', methods=['POST'])
def free():
    """Free memory"""
    try:
        data = request.json
        ptr = data.get('ptr')
        
        # Call your C executable with free command
        # Your C program should accept: ./executable free <ptr>
        result = subprocess.run(
            [EXECUTABLE_PATH, 'free', ptr],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode != 0:
            return jsonify({
                'success': False,
                'error': f'C program returned error: {result.stderr}'
            }), 500
        
        return jsonify({
            'success': True,
            'ptr': None
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print(f'QuickAlloc backend server running on http://localhost:5000')
    print(f'Make sure your C executable is at: {EXECUTABLE_PATH}')
    app.run(port=5000, debug=True)

