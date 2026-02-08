//Main public API declarations
#ifndef QUICKALLOC_MANAGER_H
#define QUICKALLOC_MANAGER_H

#include <stddef.h>
#include <stdbool.h>

typedef struct quickalloc_s quickalloc_s;
quickalloc_s* quickalloc_create_default(void);
quickalloc_s* quickalloc_create(
    size_t pool_size, 
    size_t min_block_size, 
    size_t max_block_size, 
    size_t stepping_method, 
    bool full_align
);
void quickalloc_discard(quickalloc_s* o);
void quickalloc_init(void);
void quickalloc_destroy(void);

void* QuickAlloc_malloc(size_t size);
void QuickAlloc_free(void* ptr);
void* QuickAlloc_realloc(void* ptr, size_t size);

// Additional advanced functions similar to tbman_s_alloc renamed accordingly.

#endif // QUICKALLOC_MANAGER_H
