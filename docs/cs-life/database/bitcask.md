# Bitcask代码阅读

## 背景

看过 go夜读 的分享，也读了 bitcask 的paper

![56aU0S.png](https://z3.ax1x.com/2021/10/22/56aU0S.png)

## 代码实现

### db对象

有读写锁，配置文件，文件锁（保证只有一个进程在操作db）

```go
type Bitcask struct {
	mu         sync.RWMutex
	flock      *flock.Flock
	config     *config.Config
	options    []Option
	path       string                // 指代db路径
	curr       data.Datafile         // 当前数据页
	datafiles  map[int]data.Datafile // 数据页的索引 id -> dataFile
	trie       art.Tree              // 存的所有的key -> <fileId, offset, size>， 以radix tree的方式来存
	ttlIndex   art.Tree              // key -> expireTime
	indexer    index.Indexer         // 读写index文件，trie的持久化操作
	ttlIndexer index.Indexer         // 读写ttlindex文件，ttlIndex的持久化操作

	metadata  *metadata.MetaData // 元数据信息
	isMerging bool               // 是否在merge
}
```

### Put操作

```go
// Put stores the key and value in the database.
func (b *Bitcask) Put(key, value []byte) error {
    // 1. 校验
	if len(key) == 0 {
		return ErrEmptyKey
	}
	if b.config.MaxKeySize > 0 && uint32(len(key)) > b.config.MaxKeySize {
		return ErrKeyTooLarge
	}
	if b.config.MaxValueSize > 0 && uint64(len(value)) > b.config.MaxValueSize {
		return ErrValueTooLarge
	}

    // 2. 上锁
	b.mu.Lock()
	defer b.mu.Unlock()
    
    // 3. 写入datafile
	offset, n, err := b.put(key, value)
	if err != nil {
		return err
	}

    // 4. 落盘
	if b.config.Sync {
		if err := b.curr.Sync(); err != nil {
			return err
		}
	}

	// in case of successful `put`, IndexUpToDate will be always be false
	b.metadata.IndexUpToDate = false

    // 5. 更新meta信息
	if oldItem, found := b.trie.Search(key); found {
		b.metadata.ReclaimableSpace += oldItem.(internal.Item).Size
	}

    // 6. 更新 key -> {fileId, offset, size} 索引信息
	item := internal.Item{FileID: b.curr.FileID(), Offset: offset, Size: n}
	b.trie.Insert(key, item)

	return nil
}
```

### Get操作

```go
// Get fetches value for a key
func (b *Bitcask) Get(key []byte) ([]byte, error) {
	b.mu.RLock()
	defer b.mu.RUnlock()
	e, err := b.get(key)
	if err != nil {
		return nil, err
	}
	return e.Value, nil
}


// get retrieves the value of the given key
func (b *Bitcask) get(key []byte) (internal.Entry, error) {
	var df data.Datafile

    // 1. 寻找key对应的index信息
	value, found := b.trie.Search(key)
	if !found {
		return internal.Entry{}, ErrKeyNotFound
	}
    // 2. 判断过期
	if b.isExpired(key) {
		return internal.Entry{}, ErrKeyExpired
	}

    // 3. 找到对应的文件页
	item := value.(internal.Item)
	if item.FileID == b.curr.FileID() {
		df = b.curr
	} else {
		df = b.datafiles[item.FileID]
	}

    // 4. 根据offset和size读取对象
	e, err := df.ReadAt(item.Offset, item.Size)
	if err != nil {
		return internal.Entry{}, err
	}

    // 5. 校验编码是否发生问题
	checksum := crc32.ChecksumIEEE(e.Value)
	if checksum != e.Checksum {
		return internal.Entry{}, ErrChecksumFailed
	}

	return e, nil
}
```

### Merge操作

```go
// 根据内存中的indexr的所有key，重新开一个新的db，然后写进去
// Merge merges all datafiles in the database. Old keys are squashed
// and deleted keys removes. Duplicate key/value pairs are also removed.
// Call this function periodically to reclaim disk space.
func (b *Bitcask) Merge() error {
    // 1. 判断是否在 IsMerging阶段（感觉用atomic更好些）
	b.mu.Lock()
	if b.isMerging {
		b.mu.Unlock()
		return ErrMergeInProgress
	}
	b.isMerging = true
	b.mu.Unlock()
	defer func() {
		b.isMerging = false
	}()
	b.mu.RLock()
	err := b.closeCurrentFile()
	if err != nil {
		b.mu.RUnlock()
		return err
	}
    // 2. 读取所有的dataFileIds，从小到大排序
	filesToMerge := make([]int, 0, len(b.datafiles))
	for k := range b.datafiles {
		filesToMerge = append(filesToMerge, k)
	}
	err = b.openNewWritableFile()
	if err != nil {
		b.mu.RUnlock()
		return err
	}
	b.mu.RUnlock()
	sort.Ints(filesToMerge)

    // 3. 开临时目录 merge，执行完会删除该目录
	// Temporary merged database path
	temp, err := ioutil.TempDir(b.path, "merge")
	if err != nil {
		return err
	}
	defer os.RemoveAll(temp)

    // 4. 新开一个db
	// Create a merged database
	mdb, err := Open(temp, withConfig(b.config))
	if err != nil {
		return err
	}

    // 5. 根据内存中的 trie(也就是索引)，重新将数据从老db读取，并写入到新db中
	// Rewrite all key/value pairs into merged database
	// Doing this automatically strips deleted keys and
	// old key/value pairs
	err = b.Fold(func(key []byte) error {
		item, _ := b.trie.Search(key)
		// if key was updated after start of merge operation, nothing to do
		if item.(internal.Item).FileID > filesToMerge[len(filesToMerge)-1] {
			return nil
		}
		e, err := b.get(key)
		if err != nil {
			return err
		}

		if e.Expiry != nil {
			if err := mdb.PutWithTTL(key, e.Value, time.Until(*e.Expiry)); err != nil {
				return err
			}
		} else {
			if err := mdb.Put(key, e.Value); err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return err
	}
	if err = mdb.Close(); err != nil {
		return err
	}
	// no reads and writes till we reopen
	b.mu.Lock()
	defer b.mu.Unlock()
	if err = b.close(); err != nil {
		return err
	}

    // 6. 删除现有的文件
	// Remove data files
	files, err := ioutil.ReadDir(b.path)
	if err != nil {
		return err
	}
	for _, file := range files {
		if file.IsDir() || file.Name() == lockfile {
			continue
		}
		ids, err := internal.ParseIds([]string{file.Name()})
		if err != nil {
			return err
		}
		// if datafile was created after start of merge, skip
		if len(ids) > 0 && ids[0] > filesToMerge[len(filesToMerge)-1] {
			continue
		}
		err = os.RemoveAll(path.Join(b.path, file.Name()))
		if err != nil {
			return err
		}
	}

    // 7. 将新文件更名
	// Rename all merged data files
	files, err = ioutil.ReadDir(mdb.path)
	if err != nil {
		return err
	}
	for _, file := range files {
		// see #225
		if file.Name() == lockfile {
			continue
		}
		err := os.Rename(
			path.Join([]string{mdb.path, file.Name()}...),
			path.Join([]string{b.path, file.Name()}...),
		)
		if err != nil {
			return err
		}
	}
	b.metadata.ReclaimableSpace = 0

    // 8. 根据文件内容，重新load到内存数据
	// And finally reopen the database
	return b.reopen()
}
```

## 参考

- [Bitcask源码git地址](https://git.mills.io/prologic/bitcask)
- [A Log-Structured Hash Table for Fast Key/Value Data](https://riak.com/assets/bitcask-intro.pdf?source=post_page---------------------------)