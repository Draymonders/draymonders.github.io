# zskiplist

## 数据结构

forward指向 右边元素的地址（比当前大）, backward指向 左边元素的地址（比当前小）

```cpp
/* Should be enough for 2^64 elements */
#define ZSKIPLIST_MAXLEVEL 64 
/* Skiplist P = 1/4 */
#define ZSKIPLIST_P 0.25      

typedef struct zskiplistNode {
    // 用于存储字符串类型的数据
    sds ele;
    // 用于存储排序的分值
    double score;
    // 后退指针，只能指向当前节点最底层的前一个节点，从后向前遍历跳跃表时使用
    struct zskiplistNode *backward;
    // 为柔性数组。每个节点的数组长度不一样，在生成跳跃表节点时，随机生成一个1～64的值，值越大出现的概率越低
    struct zskiplistLevel {
        // 指向本层下一个节点
        struct zskiplistNode *forward;
        // 指向的节点与本节点之间的元素个数
        unsigned long span;
    } level[];
} zskiplistNode;

typedef struct zskiplist {
    // 指向跳跃表头节点。头节点是跳跃表的一个特殊节点，它的level数组元素个数为64。头节点在有序集合中不存储任何member和score值，ele值为NULL, score值为0；也不计入跳跃表的总长度。头节点在初始化时，64个元素的forward都指向NULL, span值都为0
    struct zskiplistNode *header, *tail;
    // 长度
    unsigned long length;
    // 高度
    int level;
} zskiplist;
```

## 方法释义

- `zslCreate` 创建跳表，创建64层的链表

### 插入元素

1. 从高层到低层，依次有序遍历 `< curNode.score`的指针，并且记录每层的最后一个 `< curNode.score`的指针`update[i]`
2. 随机`curNode`的层高，并更新跳表的`maxLevel`信息
3. 每层往`update[i]`后面插入`curNode`
4. 更新`backward`指针

```cpp
/* Returns a random level for the new skiplist node we are going to create.
 * The return value of this function is between 1 and ZSKIPLIST_MAXLEVEL
 * (both inclusive), with a powerlaw-alike distribution where higher
 * levels are less likely to be returned. */
int zslRandomLevel(void) {
    int level = 1;
    while ((random()&0xFFFF) < (ZSKIPLIST_P * 0xFFFF))
        level += 1;
    return (level<ZSKIPLIST_MAXLEVEL) ? level : ZSKIPLIST_MAXLEVEL;
}

/* Insert a new node in the skiplist. Assumes the element does not already
 * exist (up to the caller to enforce that). The skiplist takes ownership
 * of the passed SDS string 'ele'. */
 
zskiplistNode *zslInsert(zskiplist *zsl, double score, sds ele) {
    // update记录每层 < curNode的node
    zskiplistNode *update[ZSKIPLIST_MAXLEVEL], *x;
    // rank 记录每层 < curNode的数量
    unsigned int rank[ZSKIPLIST_MAXLEVEL];
    int i, level;

    serverAssert(!isnan(score));
    x = zsl->header;
    for (i = zsl->level-1; i >= 0; i--) {
        /* store rank that is crossed to reach the insert position */
        rank[i] = i == (zsl->level-1) ? 0 : rank[i+1];
        while (x->level[i].forward &&
                (x->level[i].forward->score < score ||
                    (x->level[i].forward->score == score &&
                    sdscmp(x->level[i].forward->ele,ele) < 0)))
        {
            rank[i] += x->level[i].span;
            x = x->level[i].forward;
        }
        update[i] = x;
    }
    /* we assume the element is not already inside, since we allow duplicated
     * scores, reinserting the same element should never happen since the
     * caller of zslInsert() should test in the hash table if the element is
     * already inside or not. */
    level = zslRandomLevel();
    if (level > zsl->level) {
        for (i = zsl->level; i < level; i++) {
            rank[i] = 0;
            update[i] = zsl->header;
            update[i]->level[i].span = zsl->length;
        }
        zsl->level = level;
    }
    x = zslCreateNode(level,score,ele);
    for (i = 0; i < level; i++) {
        x->level[i].forward = update[i]->level[i].forward;
        update[i]->level[i].forward = x;

        /* update span covered by update[i] as x is inserted here */
        x->level[i].span = update[i]->level[i].span - (rank[0] - rank[i]);
        update[i]->level[i].span = (rank[0] - rank[i]) + 1;
    }

    /* increment span for untouched levels */
    for (i = level; i < zsl->level; i++) {
        update[i]->level[i].span++;
    }

    x->backward = (update[0] == zsl->header) ? NULL : update[0];
    if (x->level[0].forward)
        x->level[0].forward->backward = x;
    else
        zsl->tail = x;
    zsl->length++;
    return x;
}
```