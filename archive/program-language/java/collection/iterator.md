# 迭代器 iterator

`cursor`指向下一个要获取的位置，`lastRet`指向已经获取完的位置

可以看到remove的时候，会先`remove`数组元素，然后`lastRet=-1`, `cursor--`

```java
public E next() {
    checkForComodification();
    try {
        int i = cursor;
        E next = get(i);
        lastRet = i;
        cursor = i + 1;
        return next;
    } catch (IndexOutOfBoundsException e) {
        checkForComodification();
        throw new NoSuchElementException();
    }
}

public void remove() {
    if (lastRet < 0)
        throw new IllegalStateException();
    checkForComodification();

    try {
        AbstractList.this.remove(lastRet);
        if (lastRet < cursor)
            cursor--;
        lastRet = -1;
        expectedModCount = modCount;
    } catch (IndexOutOfBoundsException e) {
        throw new ConcurrentModificationException();
    }
}
```
