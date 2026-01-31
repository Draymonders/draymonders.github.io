# c

## gcc

### gcc -E

可以将

```shell
(base) ➜  p1 gcc --help | grep '\-E'
  -E                       Preprocess only; do not compile, assemble or link.
```

```c
#define DEFINE(X) static int X, X##1;

#define PRINT(X) printf("%d\n", X);

int main() {

    DEFINE(x);
    PRINT(x);
    PRINT(x1);
    return 0;
}
```

```c
gcc -E demo.c | less


# 8 "demo.c"
int main() {

 static int x, x1;;
 printf("%d\n", x);;
 printf("%d\n", x1);;
 return 0;
}
```