```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* reverseBetween(ListNode* head, int n, int m) {
        ListNode* vHead = new ListNode(-1);
        vHead->next = head;

        ListNode *pre= vHead, *cur = head;
        while (n > 1) {
            pre = cur;
            cur = cur->next;
            n --;
            m --;
        }
        ListNode* last = cur;
        // now cur is at pos(n), so need m -> 1
        while (m > 0) {
            ListNode* next = cur->next;
            cur->next = pre->next;
            pre->next = cur;
            cur = next;
            m--;
        }
        last->next = cur;
        return vHead->next;
    }
};
```