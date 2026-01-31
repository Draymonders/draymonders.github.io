# 队列与栈的互相转换

## 队列实现栈

核心思路：把当前元素放到队列尾部，然后把前面的元素都拿出来再放到队列尾部，这样队列头部就是栈顶元素。

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



## 栈实现队列

核心思路：

1. 把之前元素拿出来，倒序下
2. 当前元素放到栈中
3. 再把之前元素拿出来，放到当前元素上面


eg
```
栈顶 -> 1 

元素2加入队列
    取出之前元素 1    栈顶 -> null
    当前元素方导栈中   栈顶 -> 2
    之前的元素放到栈顶  栈顶 -> 1-> 2

元素3加入队列
    取出之前元素 1->2    栈顶 -> null
    当前元素方导栈中   栈顶 -> 3
    之前的元素倒序      2 -> 1
    依次放入栈顶 ->   栈顶 2 -> 3
                    栈顶 1 ->2 -> 3
```

