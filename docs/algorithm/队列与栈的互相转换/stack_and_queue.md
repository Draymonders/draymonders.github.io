# 队列与栈的互相转换

## 队列实现栈

### 单队列实现方法

```cpp
class MyStack {
public:
    queue<int> que;
    /** Initialize your data structure here. */
    MyStack() { }
    
    /** Push element x onto stack. */
    void push(int x) {
        int sz = que.size();
        que.push(x);
        while (sz > 0) {
            int x = que.front();
            que.pop();
            que.push(x);
            sz --;
        }
    }
    
    /** Removes the element on top of the stack and returns that element. */
    int pop() {
        if (empty())
            return -1;
        
        int x = que.front();
        que.pop();
        return x;
    }
    
    /** Get the top element. */
    int top() {
        if (empty())
            return -1;
        
        return  que.front();
    }
    
    /** Returns whether the stack is empty. */
    bool empty() {
        return que.empty();
    }
};

/**
 * Your MyStack object will be instantiated and called as such:
 * MyStack* obj = new MyStack();
 * obj->push(x);
 * int param_2 = obj->pop();
 * int param_3 = obj->top();
 * bool param_4 = obj->empty();
 */
```

### 双队列实现方法

```cpp
class MyStack {
public:
    queue<int> s1, s2;
    /** Initialize your data structure here. */
    MyStack() {
    }
    
    /** Push element x onto stack. */
    void push(int x) {
        s2.push(x);
        while (!s1.empty()) {
            s2.push(s1.front());
            s1.pop();
        }
        while (!s2.empty()) {
            s1.push(s2.front());
            s2.pop();
        }
    }
    
    /** Removes the element on top of the stack and returns that element. */
    int pop() {
        if (s1.empty())
            return -1;
        int res = s1.front();
        s1.pop();
        return res;
    }
    
    /** Get the top element. */
    int top() {
        if (s1.empty())
            return -1;
        return s1.front();
    }
    
    /** Returns whether the stack is empty. */
    bool empty() {
        return s1.empty();
    }
};

/**
 * Your MyStack object will be instantiated and called as such:
 * MyStack* obj = new MyStack();
 * obj->push(x);
 * int param_2 = obj->pop();
 * int param_3 = obj->top();
 * bool param_4 = obj->empty();
 */
```