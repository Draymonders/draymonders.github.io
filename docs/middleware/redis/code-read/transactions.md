# 事务

- 命令有`multi / exec / watch / discard`
- 只能保证`隔离性`（就是一堆命令，串行执行），不能保证原子性（要么都执行，要么都不执行，具体看下面的实现）

## 实验

### 实验一: 事务没有原子性

执行结果如下

```shell
# redis-cli
127.0.0.1:6379> multi
OK
127.0.0.1:6379> set a aa
QUEUED
127.0.0.1:6379> incr a
QUEUED
127.0.0.1:6379> set b bb
QUEUED
127.0.0.1:6379> exec
1) OK
2) (error) ERR value is not an integer or out of range
3) OK
127.0.0.1:6379> get a
"aa"
127.0.0.1:6379> get b
"bb"
```

### 实验二: 监听key，如果key改变，则不执行事务

场景:
- 两个client A和B，然后A去watch一个key `a`，A`multi`开启事务，B修改key`a`的value，接着A也修改key`a`的value，然后获取key`a`的value，然后`exec`执行
    * 最终返回结果是`nil`

客户端A操作

```shell
127.0.0.1:6379> set a 111
OK
127.0.0.1:6379> watch a
OK
127.0.0.1:6379> multi
OK
```

客户端B操作
```shell
127.0.0.1:6379> set a 2333
OK
```

客户端A接着操作
```shell
127.0.0.1:6379> set a 123
QUEUED
127.0.0.1:6379> get a
QUEUED
127.0.0.1:6379> exec
(nil)
```

## 数据结构和方法

- flag表示当前client的状态，是否在执行事务
- commands是一个数组，每次新来一个命令，就会扩容数组+1

```cpp
typedef struct client {
    ...
    int flags;              /* Client flags: CLIENT_* macros. */
    multiState mstate;      /* MULTI/EXEC state */
    ...
} client;

typedef struct multiState {
    multiCmd *commands;     /* Array of MULTI commands */
    int count;              /* Total number of MULTI commands */
    int minreplicas;        /* MINREPLICAS for synchronous replication */
    time_t minreplicas_timeout; /* MINREPLICAS timeout as unixtime. */
} multiState;

/* Client MULTI/EXEC state */
typedef struct multiCmd {
    robj **argv;
    int argc;
    struct redisCommand *cmd;
} multiCmd;

/* MULTI/EXEC/WATCH... */
void unwatchAllKeys(client *c);
void initClientMultiState(client *c);
void freeClientMultiState(client *c);
void queueMultiCommand(client *c);
void touchWatchedKey(redisDb *db, robj *key);
void touchWatchedKeysOnFlush(int dbid);
void discardTransaction(client *c);
void flagTransaction(client *c);
void execCommandPropagateMulti(client *c);
```

## 实现原理

- redis事务**不是**来一个命令就执行，然后最后回滚
    * 来一个命令，会加入到客户端的命令队列里
        * 收到`discard`命令，会将命令队列清空
        * 收到`exec`命令，会将命令队列里面的命令执行，并且塞到client的响应缓冲区，再清空命令队列
- `watch`是实现了 `key -> clients` 和 `client -> watched_keys` 的双向引用 （clients是双向链表）
    * 当key发生改变，会遍历 `clients` 设置 client 的 `flag` 状态为 `CLIENT_DIRTY_CAS`
    * 再执行的时候，会判断是否flag是否含有`CLIENT_DIRTY_CAS`， 不为才能执行命令


```cpp
/* Watch for the specified key */
void watchForKey(client *c, robj *key) {
    list *clients = NULL;
    listIter li;
    listNode *ln;
    watchedKey *wk;

    /* Check if we are already watching for this key */
    listRewind(c->watched_keys,&li);
    while((ln = listNext(&li))) {
        wk = listNodeValue(ln);
        if (wk->db == c->db && equalStringObjects(key,wk->key))
            return; /* Key already watched */
    }
    /* This key is not already watched in this DB. Let's add it */
    clients = dictFetchValue(c->db->watched_keys,key);
    if (!clients) {
        clients = listCreate();
        dictAdd(c->db->watched_keys,key,clients);
        incrRefCount(key);
    }
    // 将当前client加入到key的监听clients
    listAddNodeTail(clients,c);

    /* Add the new key to the list of keys watched by this client */
    wk = zmalloc(sizeof(*wk));
    wk->key = key;
    wk->db = c->db;
    incrRefCount(key);

    // 将当前key加入到client的watched_keys里面
    listAddNodeTail(c->watched_keys,wk);
}

/* "Touch" a key, so that if this key is being WATCHed by some client the
 * next EXEC will fail. */
void touchWatchedKey(redisDb *db, robj *key) {
    list *clients;
    listIter li;
    listNode *ln;

    if (dictSize(db->watched_keys) == 0) return;
    clients = dictFetchValue(db->watched_keys, key);
    if (!clients) return;

    /* Mark all the clients watching this key as CLIENT_DIRTY_CAS */
    /* Check if we are already watching for this key */
    listRewind(clients,&li);
    while((ln = listNext(&li))) {
        client *c = listNodeValue(ln);

        c->flags |= CLIENT_DIRTY_CAS;
    }
}
```
