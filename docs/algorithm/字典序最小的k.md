和二个有序数组中找第k大类似

都是 k == 1时候，直接返回



```cpp
typedef long long ll;
class Solution {
public:
    int findKthNumber(int n, int k) {
        int cur = 1;
        while (k > 1) {
            ll groupSize = 0, first = cur, last = cur + 1;
            while (first <= n) {
                groupSize += min((ll)n + 1, last) - first;
                first *= 10;
                last *= 10;
            }
            printf("%lld %lld\n", cur, groupSize);
            if (groupSize <= k) {
                k -= groupSize;
                cur ++;
            } else {
                k --;
                cur *= 10;
            }
        }
        return cur;
    }
};
```