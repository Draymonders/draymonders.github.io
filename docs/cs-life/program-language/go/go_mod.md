# go依赖管理

## go.mod

```shell
$ cat go.mod
module example.com/hello // 表示的是当前的模块名字

go 1.14  // 当前go的版本号

require rsc.io/quote v1.5.2 // 引用的第三方库 require是关键字，rsc.io/quote是模块名字，v1.5.2 表示版本号
```

## go.sum

```shell
$ cat go.sum
// 没有打tag的场景
golang.org/x/text v0.0.0-20170915032832-14c0d48ead0c h1:qgOY6WgZOaTkIIMiVjBQcw93ERBE4m30iBm00nkL0i8=
golang.org/x/text v0.0.0-20170915032832-14c0d48ead0c/go.mod h1:NqM8EUOU14njkJ3fqMW+pc6Ldnwhi/IjpwHt7yyuwOQ=
// 打tag的指定branch的场景
rsc.io/quote v1.5.2 h1:w5fcysjrx7yqtD/aO+QwRjYZOKnaM9Uh2b40tElTs3Y=
rsc.io/sampler v1.3.0 h1:7uVkIFmeBqHfdjD+gZwtXXI+RODJ2Wc4O7MPEh/QiW4=
// 使用了go mod的场景
rsc.io/quote v1.5.2/go.mod h1:LzX7hefJvL54yjefDEDHNONDjII0t9xZLPXsUe+TKr0=
rsc.io/sampler v1.3.0/go.mod h1:T1hPZKmBbMNahiBKFy5HrXp6adAjACjK9JXDnKaTXpA=
```

前面的 `golang.org/x/text` 是正常的git仓库地址 

后面的 `v0.0.0-20170915032832-14c0d48ead0c` 不是git上面的tag，是go mod依据规则生成的

- 项目没有打 tag，会生成一个版本号，格式：`v0.0.0-commit日期-commitID`，引用一个项目的特定分支，比如 develop branch，也会生成类似的版本号：`v当前版本+1-commit日期-commitID`
- 项目有用到 go module，那么就是正常地用 tag 来作为版本号。如果项目打了 tag，但是没有用到 go module，为了跟用了 go module 的项目相区别，需要加个 +incompatible 的标志。比如: `<module>+<version>+incompatible/go.mod+<hash>`
- 对于使用了 v2+ go module 的项目，项目路径会有个版本号的后缀。比如： `<module/v2>+<version> + <hash>`

## 引用

- https://cloud.tencent.com/developer/article/1630929