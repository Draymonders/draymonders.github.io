# LRU

需要自己写一个双向链表

```cpp
struct Node {
    int key;
    int val;
    Node* pre;
    Node* next;
    Node(int key, int val) {
        this->key = key;
        this->val = val;
        this->pre = NULL;
        this->next = NULL;
    }
};

class LRUCache {
public:

    Node* vHead; Node* vLast;
    int size, cap;
    unordered_map<int, Node*> mp;

    LRUCache(int capacity) {
        this->size = 0;
        this->cap = capacity;
        this->vHead = new Node(-1, -1);
        this->vLast = new Node(-1, -1);
        vHead->next = vLast;
        vLast->pre = vHead;
        mp.clear();
    }
    
    int get(int key) {
        if (mp.count(key) == 0) {
            return -1;
        } 
        Node* cur = mp[key];
        int val = cur->val;
        moveToHead(cur);
        return val;
    }
    
    void put(int key, int value) {
        if (mp.count(key) == 0) {
            Node* cur = new Node(key, value);
            mp[key] = cur;
            addToHead(cur);
            size ++;
            if (size > cap) {
                int key = removeLast();
                mp.erase(key);
            }
            return ;
        }
        Node* cur = mp[key];
        cur->val = value;
        moveToHead(cur);
        return ;
    }

    void moveToHead(Node* cur) {
        // delete node cur 
        cur->next->pre = cur->pre;
        cur->pre->next = cur->next;
        // add node cur to head
        addToHead(cur);
        return ;
    }

    // add cur to vHead->next
    void addToHead(Node* cur) {
        vHead->next->pre = cur;
        cur->next = vHead->next;

        vHead->next = cur;
        cur->pre = vHead;
    }

    int removeLast() {
        Node* last = vLast->pre;
        int key = last->key;
        last->pre->next = vLast;
        vLast->pre = last->pre;
        delete last;
        return key;
    }
};

/**
 * Your LRUCache object will be instantiated and called as such:
 * LRUCache* obj = new LRUCache(capacity);
 * int param_1 = obj->get(key);
 * obj->put(key,value);
 */
```

# LFU

同LRU, 就是多了一个freq的信息的统计

`freqToList`每个freq都有一个对应的双向链表，然后一个元素被访问，那么将该元素从`freq`的链表升到`freq+1`的链表，并且维护`minFreq`的信息

```cpp
struct Node {
    int key;
    int val;
    int freq;
    Node* pre;
    Node* next;
    Node(int key, int val, int freq) {
        this->key = key;
        this->val = val;
        this->freq = freq;
        this->pre = NULL;
        this->next = NULL;
    }
};

struct LinkedList {
    int size;
    Node* vHead;
    Node* vLast;

    LinkedList() {
        this->size = 0;
        this->vHead = new Node(-1, -1, -1);
        this->vLast = new Node(-1, -1, -1);
        vHead->next = vLast;
        vLast->pre = vHead;
    }

    void addToHead(Node* cur) {
        vHead->next->pre = cur;
        cur->next = vHead->next;
        vHead->next = cur;
        cur->pre = vHead;
        size ++;
    }

    /*
     remove or delete node will cause LinkedList is empty, so need manual remove
     */
    int removeLast() {
        Node* last = vLast->pre;
        int key = last->key;
        last->pre->next = vLast;
        vLast->pre = last->pre;
        size --;
        delete last;
        // printf("removed key %d\n", key);
        return key;
    }

    void deleteNode(Node* cur) {
        cur->next->pre = cur->pre;
        cur->pre->next = cur->next;
        size --;
        return ;
    }
};

class LFUCache {
public:
    int size;
    int cap;
    unordered_map<int, Node*> keyToNode;
    unordered_map<int, LinkedList*> freqToList;
    int minFreq;

    LFUCache(int capacity) {
        size = 0;
        cap = capacity;
        minFreq = 0;
        keyToNode.clear();
        freqToList.clear();
    }
    
    int get(int key) {
        if (cap == 0) {
            return -1;
        }
        if (keyToNode.count(key) == 0) {
            return -1;
        } 
        return getNode(key)->val;
    }
    
    void put(int key, int value) {
        // printf("put %d %d\n", key, value);
        // debug();
        if (cap == 0) {
            return ;
        }
        if (keyToNode.count(key) == 0) {
            // not exist
            size ++;
            if (size > cap) {
                // remove minFreq's linkedlist last
                size --;
                int removedKey = freqToList[minFreq]->removeLast();
                keyToNode.erase(removedKey);
                if (freqToList[minFreq]->size == 0) {
                    freqToList.erase(minFreq);
                }
            }
            int freq = 1;
            minFreq = 1;
            Node* cur = new Node(key, value, freq);
            keyToNode[key] = cur;
            addNode(freq, cur);
            return ;
        }
        // exist
        getNode(key)->val = value;
        return ;
    }

    void debug() {
        printf("debug minFreq list\n");
        LinkedList* list = freqToList[minFreq];
        if (NULL == list) {
            return ;
        }
        Node* vHead = list->vHead;
        while (vHead != NULL) {
            printf("%d ", vHead->val);
            vHead = vHead->next;
        }
        printf("\n");
        return ;
    }

    void addNode(int freq, Node* node) {
        if (freqToList.count(freq) == 0) {
            freqToList[freq] = new LinkedList();
        }
        freqToList[freq]->addToHead(node);
    }

    Node* getNode(int key) {
        Node* cur = keyToNode[key];
        // remove this node in freq
        freqToList[cur->freq]->deleteNode(cur);
        if (freqToList[cur->freq]->size == 0) {
            freqToList.erase(cur->freq);
            if (minFreq == cur->freq) {
                minFreq ++;
            }
        }
        // add freq + 1
        cur->freq ++;
        addNode(cur->freq, cur);
        return cur;
    }
};

/**
 * Your LFUCache object will be instantiated and called as such:
 * LFUCache* obj = new LFUCache(capacity);
 * int param_1 = obj->get(key);
 * obj->put(key,value);
 */
```