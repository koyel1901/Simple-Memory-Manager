#include "quickalloc_manager.h"
#include <stdio.h>
#include <stdint.h> // For uintptr_t
int main() {
    // Alignment used by your manager (change if needed)
    const size_t alignment = 256;

    // Initialize global manager
    printf("Before quickalloc_init()\n");
    quickalloc_init();
    printf("After quickalloc_init()\n");

    // Allocate some memory
    printf("Before QuickAlloc_malloc(100)\n");
    void* ptr = QuickAlloc_malloc(100);
    printf("After QuickAlloc_malloc(100)\n");

    if (ptr == NULL) {
        printf("Failed to allocate memory.\n");
        return 1;
    }
    // Print alignment proof for the allocated pointer
    printf("Allocated 100 bytes at %p\n", ptr);
    printf("Is address %p %zu-byte aligned? %s (Proof via modulus: %zu %% %zu == %zu)\n",
           ptr, alignment,
           ((uintptr_t)ptr % alignment == 0) ? "YES" : "NO",
           (uintptr_t)ptr, alignment, (uintptr_t)ptr % alignment);

    // Reallocate
    printf("Before QuickAlloc_realloc(ptr, 200)\n");
    void* new_ptr = QuickAlloc_realloc(ptr, 200);
    printf("After QuickAlloc_realloc(ptr, 200)\n");

    if (new_ptr == NULL) {
        printf("Failed to reallocate memory.\n");
        printf("Before QuickAlloc_free(ptr)\n");
        QuickAlloc_free(ptr);
        printf("After QuickAlloc_free(ptr)\n");
        return 1;
    }
    ptr = new_ptr;
    printf("Reallocated to 200 bytes at %p\n", ptr);
    printf("Is address %p %zu-byte aligned? %s (Proof via modulus: %zu %% %zu == %zu)\n",
           ptr, alignment,
           ((uintptr_t)ptr % alignment == 0) ? "YES" : "NO",
           (uintptr_t)ptr, alignment, (uintptr_t)ptr % alignment);

    // Free memory
    printf("Before QuickAlloc_free(ptr)\n");
    QuickAlloc_free(ptr);
    printf("After QuickAlloc_free(ptr)\n");
    printf("Memory freed.\n");

    // Clean up manager
    printf("Before quickalloc_destroy()\n");
    quickalloc_destroy();
    printf("After quickalloc_destroy()\n");
    printf("QuickAlloc destroyed.\n");

    return 0;
}
