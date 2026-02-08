#include <pthread.h>
#include <stdio.h>

void* thread_function(void* arg) {
    printf("Hello from thread!\n");
    return NULL;
}

int main() {
    pthread_t tid;
    pthread_create(&tid, NULL, thread_function, NULL);
    pthread_join(tid, NULL);
    printf("Main thread done.\n");
    return 0;
}
